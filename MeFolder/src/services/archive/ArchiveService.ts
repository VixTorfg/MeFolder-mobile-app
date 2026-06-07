import JSZip from "jszip";
import { ROOT_FOLDER_ID } from "@/database/seeds/systemFolders";
import { FileModel, FolderModel } from "@/models";
import type {
  ArchiveConflict,
  ArchiveCreatedRecord,
  ArchiveCreationSummary,
  ArchiveEntryDescriptor,
  ArchiveExtractMode,
  ArchiveExtractionSummary,
  ArchiveFormat,
  ArchiveInspection,
  ArchiveOperationError,
  ArchiveOperationResult,
  ArchiveSourceFile,
  ArchiveVirtualEntry,
  CreateArchiveFromFilesParams,
  CreateArchiveFromFolderParams,
  CreateFileInput,
  ExtractArchiveParams,
  FileMetadata,
  FileVisibility,
  FolderVisibility,
  InspectArchiveParams,
  SupportedArchiveFormat,
  UUID,
} from "@/types";
import {
  EXTENSION_MIME_MAP,
  FILE_CATEGORY_MAP,
  type FileExtension,
} from "@/types/common/file-extensions";
import { sanitizeFileName, sanitizeFolderName } from "@/utils/format/name";
import { FileService } from "../FileService";
import { FolderService } from "../FolderService";
import { FileSystemService } from "../filesystem/FileSystemService";
import { MediaImportService } from "../media/MediaImportService";
import {
  buildArchiveEntries,
  getParentArchivePath,
  indexZipFiles,
  joinArchivePath,
  loadZipFromUri,
  normalizeArchivePath,
  validateArchiveFutureOptions,
} from "./archiveUtils";

const SUPPORTED_FORMATS: readonly SupportedArchiveFormat[] = ["zip"];

/**
 * Límites defensivos frente a "ZIP bombs" (archivos maliciosos que se expanden
 * hasta agotar memoria/almacenamiento) y rutas de tipo "Zip Slip" (entradas que
 * intentan escribir fuera del destino). Se aplican tanto en la inspección como
 * en la extracción. Ajusta los valores a las necesidades reales de la app.
 */
const ARCHIVE_EXTRACTION_LIMITS = {
  /** Número máximo de entradas (archivos + carpetas) admitidas en el ZIP. */
  maxEntries: 10_000,
  /** Tamaño total descomprimido máximo permitido para todo el ZIP. */
  maxTotalUncompressedBytes: 2 * 1024 * 1024 * 1024, // 2 GB
  /** Tamaño descomprimido máximo por archivo individual. */
  maxFileUncompressedBytes: 512 * 1024 * 1024, // 512 MB
  /**
   * Ratio de compresión por entrada (descomprimido / comprimido) a partir del
   * cual se sospecha de una bomba. Un .txt repetido puede pasar de 1000:1.
   */
  maxCompressionRatio: 120,
  /**
   * El ratio solo se evalúa cuando el tamaño descomprimido supera este umbral,
   * para no penalizar archivos pequeños que son legítimamente muy comprimibles.
   */
  compressionRatioFloorBytes: 1 * 1024 * 1024, // 1 MB
  /** Profundidad máxima de anidamiento de rutas dentro del ZIP. */
  maxPathDepth: 64,
} as const;

interface PreparedArchiveFileEntry {
  zipPath: string;
  sourceFile: ArchiveSourceFile;
}

interface CollectedArchiveFiles {
  directories: string[];
  files: PreparedArchiveFileEntry[];
}

interface CreatedFolderContext {
  record: ArchiveCreatedRecord;
  parentArchivePath?: string | undefined;
}

export class ArchiveService {
  private readonly fs = new FileSystemService();

  constructor(
    private readonly fileService: FileService = new FileService(),
    private readonly folderService: FolderService = new FolderService(),
    private readonly mediaImportService: MediaImportService = new MediaImportService(),
  ) {}

  /** Crea un ZIP a partir de una carpeta completa y lo registra en la BD. */
  async createArchiveFromFolder(
    params: CreateArchiveFromFolderParams,
  ): Promise<ArchiveOperationResult<ArchiveCreationSummary>> {
    try {
      const optionError = validateArchiveFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const format = this.resolveRequestedFormat(params.format);
      if (!this.isSupportedFormat(format)) {
        return this.failUnsupportedFormat(format);
      }

      const sourceFolder = await this.folderService.getFolder(
        params.sourceFolderId,
      );
      const destinationFolderId =
        params.destinationFolderId ?? sourceFolder.parentId ?? ROOT_FOLDER_ID;

      const collected = await this.collectFolderFiles(
        sourceFolder.id,
        sourceFolder.name,
      );

      return this.createArchiveFromPreparedEntries({
        format,
        outputName: params.outputName ?? sourceFolder.name,
        destinationFolderId,
        visibility: params.visibility ?? "private",
        compressionLevel: params.compressionLevel,
        ...(params.onProgress ? { onProgress: params.onProgress } : {}),
        directories: collected.directories,
        files: collected.files,
      });
    } catch (error) {
      return this.fail(this.toOperationError(error, "No se pudo crear el ZIP"));
    }
  }

  /** Crea un ZIP a partir de un listado explícito de archivos. */
  async createArchiveFromFiles(
    params: CreateArchiveFromFilesParams,
  ): Promise<ArchiveOperationResult<ArchiveCreationSummary>> {
    try {
      const optionError = validateArchiveFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const format = this.resolveRequestedFormat(params.format);
      if (!this.isSupportedFormat(format)) {
        return this.failUnsupportedFormat(format);
      }

      const virtualEntries = params.virtualEntries ?? [];
      const destinationFolderId = params.destinationFolderId ?? ROOT_FOLDER_ID;

      return this.createArchiveFromPreparedEntries({
        format,
        outputName: params.outputName,
        destinationFolderId,
        visibility: params.visibility ?? "private",
        compressionLevel: params.compressionLevel,
        ...(params.onProgress ? { onProgress: params.onProgress } : {}),
        directories: params.rootFolderName ? [params.rootFolderName] : [],
        files: this.prepareArchiveFileEntries(
          params.files,
          params.rootFolderName,
        ),
        virtualEntries,
      });
    } catch (error) {
      return this.fail(this.toOperationError(error, "No se pudo crear el ZIP"));
    }
  }

  /** Inspecciona el ZIP y calcula estructura, conflictos y capacidad de extracción. */
  async inspectArchive(
    params: InspectArchiveParams,
  ): Promise<ArchiveOperationResult<ArchiveInspection>> {
    try {
      const optionError = validateArchiveFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const format = this.resolveArchiveFormat(params.archiveFile);
      if (!this.isSupportedFormat(format)) {
        return this.failUnsupportedFormat(format);
      }

      const parentFolder = await this.folderService.getFolder(
        params.parentFolderId,
      );
      const zip = await this.loadArchiveZip(params.archiveFile);
      if (!zip.success || !zip.data) {
        return this.fail(
          zip.error ?? {
            code: "invalid_archive",
            message: "No se pudo abrir el archivo comprimido",
          },
        );
      }

      // Rechazamos archivos peligrosos antes de exponer su estructura.
      const safetyError = this.detectArchiveSafetyError(zip.data);
      if (safetyError) {
        return this.fail(safetyError);
      }

      const inspection = await this.buildInspection({
        zip: zip.data,
        format,
        parentFolder,
        mode: params.mode,
        createFolderName: params.createFolderName,
        archiveFile: params.archiveFile,
      });

      return { success: true, data: inspection };
    } catch (error) {
      return this.fail(
        this.toOperationError(error, "No se pudo inspeccionar el archivo ZIP"),
      );
    }
  }

  /** Extrae un ZIP coordinando filesystem y persistencia en base de datos. */
  async extractArchive(
    params: ExtractArchiveParams,
  ): Promise<ArchiveOperationResult<ArchiveExtractionSummary>> {
    const rootCreatedFolderIds: UUID[] = [];
    const rootCreatedFileIds: UUID[] = [];
    const createdFolders: ArchiveCreatedRecord[] = [];
    const createdFiles: ArchiveCreatedRecord[] = [];

    try {
      const optionError = validateArchiveFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const format = this.resolveArchiveFormat(params.archiveFile);
      if (!this.isSupportedFormat(format)) {
        return this.failUnsupportedFormat(format);
      }

      const parentFolder = await this.folderService.getFolder(
        params.parentFolderId,
      );
      const zipResult = await this.loadArchiveZip(params.archiveFile);
      if (!zipResult.success || !zipResult.data) {
        return this.fail(
          zipResult.error ?? {
            code: "invalid_archive",
            message: "No se pudo abrir el ZIP para extraerlo",
          },
        );
      }

      const zip = zipResult.data;

      // Primera barrera anti ZIP bomb / Zip Slip: validamos los tamaños y rutas
      // declarados en las cabeceras del ZIP antes de descomprimir nada.
      const safetyError = this.detectArchiveSafetyError(zip);
      if (safetyError) {
        return this.fail(safetyError);
      }

      const inspection = await this.buildInspection({
        zip,
        format,
        parentFolder,
        mode: params.mode,
        createFolderName: params.createFolderName,
        archiveFile: params.archiveFile,
      });

      if (!inspection.canExtract) {
        const firstConflict = inspection.conflicts[0];
        return this.fail({
          code: firstConflict?.type ?? "invalid_archive",
          message:
            firstConflict?.message ??
            "No se puede extraer el ZIP por conflictos en destino",
        });
      }

      const folderMap = new Map<string, CreatedFolderContext>();
      let destinationFolder = this.toRecord(parentFolder);
      let destinationFolderId = parentFolder.id;
      let destinationFolderPath = parentFolder.path;

      if (params.mode === "create_folder") {
        const containerFolder = await this.folderService.createFolder({
          name: inspection.suggestedContainerName,
          parentId: parentFolder.id,
          visibility: parentFolder.visibility as FolderVisibility,
        });

        const destinationUri = this.fs.resolveUri(containerFolder.path);
        const dirResult = this.fs.ensureDirectory(destinationUri);
        if (!dirResult.success) {
          await this.folderService.permanentDeleteFolder(containerFolder.id);
          return this.fail({
            code: "unknown",
            message:
              dirResult.error ??
              "No se pudo preparar la carpeta contenedora para extraer",
          });
        }

        destinationFolder = this.toRecord(containerFolder);
        destinationFolderId = containerFolder.id;
        destinationFolderPath = containerFolder.path;
        rootCreatedFolderIds.push(containerFolder.id);
        createdFolders.push(destinationFolder);
      }

      const directoryEntries = inspection.entries.filter(
        (entry) => entry.type === "directory",
      );
      const fileEntries = inspection.entries.filter(
        (entry) => entry.type === "file",
      );
      const zipEntries = this.indexZipFiles(zip);
      const totalEntries = directoryEntries.length + fileEntries.length;
      let processedEntries = 0;
      // Segunda barrera anti ZIP bomb: contabiliza los bytes REALMENTE escritos.
      // Cubre el caso en que las cabeceras del ZIP mientan sobre el tamaño.
      let extractedBytes = 0;

      for (const directoryEntry of directoryEntries) {
        const parentArchivePath = getParentArchivePath(directoryEntry.path);
        const folderParentId = parentArchivePath
          ? folderMap.get(parentArchivePath)?.record.id
          : destinationFolderId;

        if (!folderParentId) {
          throw new Error(
            `No se pudo resolver la carpeta padre para ${directoryEntry.path}`,
          );
        }

        const createdFolder = await this.folderService.createFolder({
          name: this.normalizeFolderName(directoryEntry.name),
          parentId: folderParentId,
          visibility: parentFolder.visibility as FolderVisibility,
        });

        const createdFolderUri = this.fs.resolveUri(createdFolder.path);
        const ensureResult = this.fs.ensureDirectory(createdFolderUri);
        if (!ensureResult.success) {
          throw new Error(
            ensureResult.error ??
              `No se pudo crear el directorio ${directoryEntry.name}`,
          );
        }

        const record = this.toRecord(createdFolder);
        folderMap.set(directoryEntry.path, {
          record,
          ...(parentArchivePath ? { parentArchivePath } : {}),
        });
        createdFolders.push(record);
        if (!parentArchivePath) {
          rootCreatedFolderIds.push(createdFolder.id);
        }

        processedEntries += 1;
        params.onProgress?.({
          phase: "extract",
          processedEntries,
          totalEntries,
          currentEntryName: directoryEntry.path,
        });
      }

      for (const fileEntry of fileEntries) {
        const parentArchivePath = getParentArchivePath(fileEntry.path);
        const parentContext = parentArchivePath
          ? folderMap.get(parentArchivePath)
          : undefined;
        const fileFolderId = parentContext?.record.id ?? destinationFolderId;
        const fileFolderPath =
          parentContext?.record.path ?? destinationFolderPath;
        const zipFile = zipEntries.get(fileEntry.path);

        if (!zipFile) {
          throw new Error(
            `No se encontro la entrada ${fileEntry.path} en el ZIP`,
          );
        }

        const safeFileName = sanitizeFileName(fileEntry.name);
        const targetUri = this.fs.resolveUri(
          joinArchivePath(fileFolderPath, safeFileName),
        );
        const base64Content = await zipFile.async("base64");

        // Tope acumulado por el tamaño real ya descomprimido. Si lo superamos,
        // abortamos: el catch dispara el rollback de lo escrito hasta ahora.
        extractedBytes += this.approximateBase64Bytes(base64Content);
        if (
          extractedBytes > ARCHIVE_EXTRACTION_LIMITS.maxTotalUncompressedBytes
        ) {
          throw new Error(
            "La extracción supera el tamaño máximo permitido; se aborta por posible ZIP bomb",
          );
        }

        const writeResult = this.fs.writeFile({
          uri: targetUri,
          content: base64Content,
          encoding: "base64",
        });

        if (!writeResult.success) {
          throw new Error(
            writeResult.error ?? `No se pudo escribir ${fileEntry.name}`,
          );
        }

        const fileInfo = this.fs.getFileInfo(targetUri);
        if (!fileInfo.success || !fileInfo.data) {
          throw new Error(
            fileInfo.error ??
              `No se pudo obtener metadata del archivo ${fileEntry.name}`,
          );
        }

        const resolvedExtension = this.resolveFileExtension(
          fileEntry.name,
          fileInfo.data.extension,
        );
        const fileCategory =
          FILE_CATEGORY_MAP[resolvedExtension as FileExtension] ?? "other";
        const fileMimeType =
          EXTENSION_MIME_MAP[resolvedExtension as FileExtension] ||
          fileInfo.data.mimeType ||
          undefined;

        const { importedFiles: registered, failed: registerFailed } =
          await this.mediaImportService.registerExistingFiles({
            files: [
              {
                id: `extract_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                name: safeFileName,
                originalName: fileEntry.name,
                uri: targetUri,
                type: fileCategory,
                ...(fileMimeType ? { mimeType: fileMimeType } : {}),
                folderId: fileFolderId,
                visibility: (params.archiveFile.visibility ??
                  "private") as CreateFileInput["visibility"],
              },
            ],
          });

        if (registerFailed.length > 0 || !registered[0]) {
          throw new Error(
            registerFailed[0]?.error ??
              `No se pudo registrar el archivo ${fileEntry.name}`,
          );
        }

        const extractedFile = registered[0];

        const record = this.toRecord(extractedFile);
        createdFiles.push(record);
        if (!parentArchivePath) {
          rootCreatedFileIds.push(extractedFile.id);
        }

        processedEntries += 1;
        params.onProgress?.({
          phase: "extract",
          processedEntries,
          totalEntries,
          currentEntryName: fileEntry.path,
        });
      }

      return {
        success: true,
        data: {
          destinationFolder,
          createdFolders,
          createdFiles,
          inspection,
        },
      };
    } catch (error) {
      await this.rollbackExtraction(rootCreatedFolderIds, rootCreatedFileIds);
      return this.fail(
        this.toOperationError(error, "No se pudo extraer el archivo ZIP"),
      );
    }
  }

  /** Construye el resultado de inspección a partir del ZIP y el destino solicitado. */
  private async buildInspection(args: {
    zip: JSZip;
    format: ArchiveFormat;
    parentFolder: FolderModel;
    mode: ArchiveExtractMode;
    createFolderName?: string | undefined;
    archiveFile: ArchiveSourceFile;
  }): Promise<ArchiveInspection> {
    const entries = buildArchiveEntries(args.zip);
    const rootEntries = entries.filter((entry) => entry.depth === 1);
    const hasSingleRootDirectory =
      rootEntries.length === 1 && rootEntries[0]?.type === "directory";
    const rootDirectoryName = hasSingleRootDirectory
      ? rootEntries[0]?.name
      : undefined;
    const suggestedContainerName =
      args.mode === "create_folder"
        ? this.normalizeFolderName(
            args.createFolderName ??
              this.removeExtension(args.archiveFile.name),
          )
        : this.normalizeFolderName(
            rootDirectoryName ?? this.removeExtension(args.archiveFile.name),
          );

    const conflicts = await this.detectExtractionConflicts({
      parentFolderId: args.parentFolder.id,
      mode: args.mode,
      rootEntries,
      suggestedContainerName,
    });

    return {
      format: args.format,
      supported: this.isSupportedFormat(args.format),
      hasSingleRootDirectory,
      suggestedContainerName,
      ...(rootDirectoryName ? { rootDirectoryName } : {}),
      rootEntries,
      entries,
      conflicts,
      unsupportedFeatures: [],
      canExtract: conflicts.length === 0,
    };
  }

  /** Detecta colisiones en destino antes de crear carpetas o archivos extraídos. */
  private async detectExtractionConflicts(args: {
    parentFolderId: UUID;
    mode: ArchiveExtractMode;
    rootEntries: ArchiveEntryDescriptor[];
    suggestedContainerName: string;
  }): Promise<ArchiveConflict[]> {
    const [existingFolders, existingFiles] = await Promise.all([
      this.folderService.getSubfolders(args.parentFolderId),
      this.fileService.getFilesInFolder(args.parentFolderId),
    ]);

    const folderNames = new Set(existingFolders.map((folder) => folder.name));
    const fileNames = new Set(existingFiles.map((file) => file.name));
    const conflicts: ArchiveConflict[] = [];

    if (args.mode === "create_folder") {
      if (folderNames.has(args.suggestedContainerName)) {
        conflicts.push({
          type: "destination_folder_exists",
          message: `No se puede extraer porque ya existe la carpeta ${args.suggestedContainerName}`,
          path: args.suggestedContainerName,
          name: args.suggestedContainerName,
        });
      }

      if (fileNames.has(args.suggestedContainerName)) {
        conflicts.push({
          type: "destination_folder_exists",
          message: `No se puede crear la carpeta ${args.suggestedContainerName} porque ya existe un archivo con ese nombre`,
          path: args.suggestedContainerName,
          name: args.suggestedContainerName,
        });
      }

      return conflicts;
    }

    for (const entry of args.rootEntries) {
      if (entry.type === "directory") {
        if (folderNames.has(entry.name) || fileNames.has(entry.name)) {
          conflicts.push({
            type: "root_folder_exists",
            message: `No se puede extraer aqui porque ya existe la carpeta ${entry.name}`,
            path: entry.path,
            name: entry.name,
          });
        }
        continue;
      }

      if (fileNames.has(entry.name) || folderNames.has(entry.name)) {
        conflicts.push({
          type: "root_file_exists",
          message: `No se puede extraer aqui porque ya existe el archivo ${entry.name}`,
          path: entry.path,
          name: entry.name,
        });
      }
    }

    return conflicts;
  }

  /** Recorre una carpeta recursivamente y prepara sus rutas para el ZIP. */
  private async collectFolderFiles(
    folderId: UUID,
    archiveRootPath: string,
  ): Promise<CollectedArchiveFiles> {
    const directories = [archiveRootPath];
    const files: CollectedArchiveFiles["files"] = [];
    const [subfolders, folderFiles] = await Promise.all([
      this.folderService.getSubfolders(folderId),
      this.fileService.getFilesInFolder(folderId),
    ]);

    for (const folderFile of folderFiles) {
      files.push({
        zipPath: joinArchivePath(archiveRootPath, folderFile.name),
        sourceFile: this.toArchiveSourceFile(folderFile),
      });
    }

    for (const subfolder of subfolders) {
      const subfolderPath = joinArchivePath(archiveRootPath, subfolder.name);
      const nested = await this.collectFolderFiles(subfolder.id, subfolderPath);
      directories.push(...nested.directories);
      files.push(...nested.files);
    }

    return { directories, files };
  }

  /** Prepara rutas definitivas del ZIP para una colección explícita de archivos. */
  private prepareArchiveFileEntries(
    files: ArchiveSourceFile[],
    rootFolderName?: string,
  ): PreparedArchiveFileEntry[] {
    return files.map((sourceFile) => ({
      zipPath: this.resolveArchiveEntryPath(
        sourceFile.archivePath ?? sourceFile.name,
        rootFolderName,
      ),
      sourceFile,
    }));
  }

  /** Genera y persiste un ZIP a partir de entradas ya normalizadas. */
  private async createArchiveFromPreparedEntries(args: {
    format: SupportedArchiveFormat;
    outputName: string;
    destinationFolderId: UUID;
    visibility: FileVisibility;
    compressionLevel?: CreateArchiveFromFilesParams["compressionLevel"];
    onProgress?: CreateArchiveFromFilesParams["onProgress"];
    directories?: string[];
    files: PreparedArchiveFileEntry[];
    virtualEntries?: ArchiveVirtualEntry[];
  }): Promise<ArchiveOperationResult<ArchiveCreationSummary>> {
    const virtualEntries = args.virtualEntries ?? [];

    if (args.files.length === 0 && virtualEntries.length === 0) {
      return this.fail({
        code: "invalid_archive",
        message: "Debes indicar al menos un archivo para comprimir",
      });
    }

    const outputName = this.ensureArchiveFileName(args.outputName, args.format);
    const conflict = await this.checkOutputArchiveConflict(
      args.destinationFolderId,
      outputName,
    );
    if (conflict) {
      return this.fail({ code: conflict.type, message: conflict.message });
    }

    const destinationPath = await this.fileService.resolveStoragePath(
      args.destinationFolderId,
    );
    const zip = new JSZip();
    const usedZipPaths = new Set<string>();

    for (const directory of args.directories ?? []) {
      zip.file(this.ensureDirectoryEntryPath(directory), "", { dir: true });
    }

    const totalEntries = args.files.length + virtualEntries.length;

    for (const [index, entry] of args.files.entries()) {
      const duplicatePathError = this.ensureUniqueArchiveEntryPath(
        usedZipPaths,
        entry.zipPath,
      );
      if (duplicatePathError) {
        return this.fail(duplicatePathError);
      }

      args.onProgress?.({
        phase: "compress",
        processedEntries: index,
        totalEntries,
        currentEntryName: entry.sourceFile.name,
      });

      const fileContent = await this.readSourceFileAsBase64(entry.sourceFile);
      if (!fileContent.success || !fileContent.data) {
        return this.fail(
          fileContent.error ?? {
            code: "unknown",
            message: `No se pudo leer ${entry.sourceFile.name}`,
          },
        );
      }

      zip.file(entry.zipPath, fileContent.data, { base64: true });

      args.onProgress?.({
        phase: "compress",
        processedEntries: index + 1,
        totalEntries,
        currentEntryName: entry.sourceFile.name,
      });
    }

    for (const [index, virtualEntry] of virtualEntries.entries()) {
      const zipPath = normalizeArchivePath(virtualEntry.path);
      const duplicatePathError = this.ensureUniqueArchiveEntryPath(
        usedZipPaths,
        zipPath,
      );
      if (duplicatePathError) {
        return this.fail(duplicatePathError);
      }

      args.onProgress?.({
        phase: "compress",
        processedEntries: args.files.length + index,
        totalEntries,
        currentEntryName: virtualEntry.path,
      });

      zip.file(zipPath, virtualEntry.content, {
        base64: virtualEntry.encoding === "base64",
      });

      args.onProgress?.({
        phase: "compress",
        processedEntries: args.files.length + index + 1,
        totalEntries,
        currentEntryName: virtualEntry.path,
      });
    }

    const zipBase64 = await zip.generateAsync(
      this.buildZipGenerationOptions(args.compressionLevel),
    );

    const archiveUri = this.fs.resolveUri(`${destinationPath}/${outputName}`);
    const writeResult = this.fs.writeFile({
      uri: archiveUri,
      content: zipBase64,
      encoding: "base64",
    });

    if (!writeResult.success) {
      return this.fail({
        code: "unknown",
        message: writeResult.error ?? "No se pudo escribir el ZIP generado",
      });
    }

    const fileInfo = this.fs.getFileInfo(archiveUri);
    if (!fileInfo.success || !fileInfo.data) {
      return this.fail({
        code: "unknown",
        message:
          fileInfo.error ?? "No se pudo obtener metadata del ZIP generado",
      });
    }

    const archiveFile = await this.fileService.createFile({
      name: outputName,
      originalName: outputName,
      extension: args.format as CreateFileInput["extension"],
      folderId: args.destinationFolderId,
      visibility: args.visibility,
      metadata: this.buildExtractedFileMetadata(
        fileInfo.data.size,
        args.format,
      ),
      storageUrl: archiveUri,
    });

    args.onProgress?.({
      phase: "compress",
      processedEntries: totalEntries,
      totalEntries,
      currentEntryName: outputName,
    });

    return {
      success: true,
      data: {
        archiveFile: this.toRecord(archiveFile),
        entryCount: totalEntries,
        format: args.format,
      },
    };
  }

  /** Lee un archivo de origen y lo devuelve codificado en base64. */
  private async readSourceFileAsBase64(
    file: ArchiveSourceFile,
  ): Promise<ArchiveOperationResult<string>> {
    const fileUri = this.resolveSourceFileUri(file);
    const readResult = await this.fs.readAsBase64(fileUri);
    if (!readResult.success || !readResult.data) {
      return this.fail({
        code: "unknown",
        message: readResult.error ?? `No se pudo leer ${file.name}`,
      });
    }

    return { success: true, data: readResult.data };
  }

  /** Resuelve la ruta final de una entrada dentro del ZIP, aplicando la carpeta raíz si existe. */
  private resolveArchiveEntryPath(
    path: string,
    rootFolderName?: string,
  ): string {
    return rootFolderName
      ? joinArchivePath(rootFolderName, path)
      : normalizeArchivePath(path);
  }

  /** Rechaza rutas duplicadas dentro del ZIP para mantener un layout determinista. */
  private ensureUniqueArchiveEntryPath(
    usedZipPaths: Set<string>,
    zipPath: string,
  ): ArchiveOperationError | null {
    if (usedZipPaths.has(zipPath)) {
      return {
        code: "invalid_archive",
        message: `Hay rutas duplicadas dentro del ZIP: ${zipPath}`,
      };
    }

    usedZipPaths.add(zipPath);
    return null;
  }

  /**
   * Aplica los límites anti "ZIP bomb" y anti "Zip Slip" sobre el contenido
   * declarado en las cabeceras del ZIP, sin descomprimir nada todavía.
   * Devuelve el primer error encontrado o `null` si el archivo es seguro.
   */
  private detectArchiveSafetyError(zip: JSZip): ArchiveOperationError | null {
    let entryCount = 0;
    let totalUncompressedBytes = 0;

    for (const entryName of Object.keys(zip.files)) {
      const entry = zip.files[entryName];
      if (!entry) {
        continue;
      }

      entryCount += 1;
      if (entryCount > ARCHIVE_EXTRACTION_LIMITS.maxEntries) {
        return {
          code: "invalid_archive",
          message: `El ZIP supera el máximo de ${ARCHIVE_EXTRACTION_LIMITS.maxEntries} entradas permitidas`,
        };
      }

      if (this.isUnsafeArchivePath(entry.name)) {
        return {
          code: "invalid_archive",
          message: `El ZIP contiene una ruta no segura y no se extraerá: ${entry.name}`,
        };
      }

      if (
        this.archivePathDepth(entry.name) >
        ARCHIVE_EXTRACTION_LIMITS.maxPathDepth
      ) {
        return {
          code: "invalid_archive",
          message: `El ZIP contiene rutas demasiado anidadas: ${entry.name}`,
        };
      }

      if (entry.dir) {
        continue;
      }

      const sizes = this.readEntryDeclaredSizes(entry);
      if (!sizes) {
        continue;
      }

      if (
        sizes.uncompressedSize >
        ARCHIVE_EXTRACTION_LIMITS.maxFileUncompressedBytes
      ) {
        return {
          code: "invalid_archive",
          message: `La entrada ${entry.name} supera el tamaño máximo permitido por archivo`,
        };
      }

      if (
        sizes.compressedSize > 0 &&
        sizes.uncompressedSize >
          ARCHIVE_EXTRACTION_LIMITS.compressionRatioFloorBytes &&
        sizes.uncompressedSize / sizes.compressedSize >
          ARCHIVE_EXTRACTION_LIMITS.maxCompressionRatio
      ) {
        return {
          code: "invalid_archive",
          message: `La entrada ${entry.name} tiene un ratio de compresión sospechoso (posible ZIP bomb)`,
        };
      }

      totalUncompressedBytes += sizes.uncompressedSize;
      if (
        totalUncompressedBytes >
        ARCHIVE_EXTRACTION_LIMITS.maxTotalUncompressedBytes
      ) {
        return {
          code: "invalid_archive",
          message:
            "El contenido descomprimido del ZIP supera el tamaño total permitido (posible ZIP bomb)",
        };
      }
    }

    return null;
  }

  /**
   * Lee los tamaños declarados (comprimido/descomprimido) de una entrada JSZip.
   * Esta información vive en el campo interno `_data`, no expuesto en los tipos
   * públicos, por eso accedemos a él de forma defensiva.
   */
  private readEntryDeclaredSizes(
    entry: JSZip.JSZipObject,
  ): { compressedSize: number; uncompressedSize: number } | null {
    const data = (
      entry as unknown as {
        _data?: { compressedSize?: number; uncompressedSize?: number };
      }
    )._data;

    if (!data || typeof data.uncompressedSize !== "number") {
      return null;
    }

    return {
      compressedSize:
        typeof data.compressedSize === "number" ? data.compressedSize : 0,
      uncompressedSize: data.uncompressedSize,
    };
  }

  /** Detecta rutas absolutas, con unidad de Windows o con segmentos "..". */
  private isUnsafeArchivePath(name: string): boolean {
    if (!name) {
      return false;
    }

    const normalized = name.replace(/\\/g, "/");

    if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
      return true;
    }

    return normalized.split("/").some((segment) => segment === "..");
  }

  /** Calcula la profundidad de anidamiento de una ruta del ZIP. */
  private archivePathDepth(name: string): number {
    return name
      .replace(/\\/g, "/")
      .split("/")
      .filter((segment) => segment.length > 0).length;
  }

  /** Aproxima los bytes reales representados por una cadena base64. */
  private approximateBase64Bytes(base64: string): number {
    if (!base64) {
      return 0;
    }

    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  }

  /** Abre un archivo comprimido y lo carga como instancia de JSZip. */
  private async loadArchiveZip(
    archiveFile: ArchiveSourceFile,
  ): Promise<ArchiveOperationResult<JSZip>> {
    const archiveUri = this.resolveSourceFileUri(archiveFile);
    return loadZipFromUri(this.fs, archiveUri);
  }

  /** Indexa solo los archivos del ZIP por su ruta normalizada. */
  private indexZipFiles(zip: JSZip): Map<string, JSZip.JSZipObject> {
    return indexZipFiles(zip);
  }

  /** Comprueba si ya existe el archivo ZIP de salida en la carpeta destino. */
  private async checkOutputArchiveConflict(
    destinationFolderId: UUID,
    outputName: string,
  ): Promise<ArchiveConflict | null> {
    const files = await this.fileService.getFilesInFolder(destinationFolderId);
    const existing = files.find((file) => file.name === outputName);
    if (!existing) {
      return null;
    }

    return {
      type: "output_archive_exists",
      message: `Ya existe un archivo ${outputName} en la carpeta destino`,
      path: existing.path,
      name: existing.name,
    };
  }

  /** Intenta deshacer archivos y carpetas raíz creados durante una extracción fallida. */
  private async rollbackExtraction(
    rootCreatedFolderIds: UUID[],
    rootCreatedFileIds: UUID[],
  ): Promise<void> {
    for (const fileId of [...rootCreatedFileIds].reverse()) {
      try {
        await this.fileService.permanentDeleteFile(fileId);
      } catch {
        // Ignorado: el rollback es best-effort.
      }
    }

    for (const folderId of [...rootCreatedFolderIds].reverse()) {
      try {
        await this.folderService.permanentDeleteFolder(folderId);
      } catch {
        // Ignorado: el rollback es best-effort.
      }
    }
  }

  /** Resuelve el formato pedido o usa ZIP por defecto. */
  private resolveRequestedFormat(format?: ArchiveFormat): ArchiveFormat {
    return format ?? "zip";
  }

  /** Intenta deducir el formato del comprimido desde el nombre o la extensión persistida. */
  private resolveArchiveFormat(archiveFile: ArchiveSourceFile): ArchiveFormat {
    const inferredExtension = this.getExtensionFromName(archiveFile.name);

    if (this.isArchiveFormat(inferredExtension)) {
      return inferredExtension;
    }

    if (this.isArchiveFormat(archiveFile.extension)) {
      return archiveFile.extension;
    }

    return "zip";
  }

  /** Indica si una extensión pertenece al conjunto de formatos de archivo comprimido. */
  private isArchiveFormat(value: string): value is ArchiveFormat {
    return ["zip", "rar", "7z", "tar", "gz"].includes(value);
  }

  /** Limita la implementación real a los formatos soportados por el servicio. */
  private isSupportedFormat(
    format: ArchiveFormat,
  ): format is SupportedArchiveFormat {
    return SUPPORTED_FORMATS.includes(format as SupportedArchiveFormat);
  }

  /** Devuelve un error uniforme cuando el formato existe en tipos pero no en implementación. */
  private failUnsupportedFormat(
    format: ArchiveFormat,
  ): ArchiveOperationResult<never> {
    return this.fail({
      code: "unsupported_format",
      message: `El formato ${format} esta preparado en la API, pero todavia no esta soportado`,
    });
  }

  /** Envuelve un error de dominio en el resultado estándar del servicio. */
  private fail<T>(error: ArchiveOperationError): ArchiveOperationResult<T> {
    return { success: false, error };
  }

  /** Normaliza errores desconocidos al contrato de error del servicio. */
  private toOperationError(
    error: unknown,
    fallbackMessage: string,
  ): ArchiveOperationError {
    if (error instanceof Error) {
      return { code: "unknown", message: error.message };
    }

    return { code: "unknown", message: fallbackMessage };
  }

  /** Traduce el nivel de compresión lógico a opciones concretas de JSZip. */
  private buildZipGenerationOptions(
    compressionLevel?: CreateArchiveFromFilesParams["compressionLevel"],
  ): JSZip.JSZipGeneratorOptions<"base64"> {
    if (!compressionLevel) {
      return {
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: { level: 3 },
      };
    }

    switch (compressionLevel) {
      case "none":
        return { type: "base64", compression: "STORE" };
      case "fast":
        return {
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: { level: 3 },
        };
      case "best":
        return {
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
        };
      case "normal":
        return {
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        };
      default:
        return {
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: { level: 3 },
        };
    }
  }

  /** Resuelve la URI física de un archivo a partir de storageUrl o path persistido. */
  private resolveSourceFileUri(file: ArchiveSourceFile): string {
    if (file.storageUrl) {
      if (
        file.storageUrl.startsWith("file://") ||
        file.storageUrl.startsWith("content://")
      ) {
        return file.storageUrl;
      }

      return this.fs.resolveUri(file.storageUrl);
    }

    return this.fs.resolveUri(file.path);
  }

  /** Genera metadata mínima para el ZIP creado. */
  private buildExtractedFileMetadata(
    size: number,
    extension: ArchiveFormat,
  ): FileMetadata {
    return {
      size,
      mimeType: EXTENSION_MIME_MAP[extension],
    };
  }

  /** Asegura que el nombre de salida del comprimido tenga extensión válida. */
  private ensureArchiveFileName(name: string, format: ArchiveFormat): string {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("El nombre del archivo ZIP no puede estar vacio");
    }

    const expectedSuffix = `.${format}`;
    return trimmedName.toLowerCase().endsWith(expectedSuffix)
      ? trimmedName
      : `${trimmedName}${expectedSuffix}`;
  }

  /** Fuerza el formato de carpeta que espera JSZip para entradas de directorio. */
  private ensureDirectoryEntryPath(path: string): string {
    const normalized = normalizeArchivePath(path);
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }

  /** Extrae la extensión de un nombre de archivo en minúsculas. */
  private getExtensionFromName(name: string): string {
    const trimmedName = name.trim();
    const dotIndex = trimmedName.lastIndexOf(".");
    if (dotIndex <= 0) {
      return "";
    }

    return trimmedName.slice(dotIndex + 1).toLowerCase();
  }

  /** Elimina la extensión final de un nombre para reutilizarlo como carpeta base. */
  private removeExtension(name: string): string {
    const trimmedName = name.trim();
    const dotIndex = trimmedName.lastIndexOf(".");
    if (dotIndex <= 0) {
      return trimmedName;
    }

    return trimmedName.slice(0, dotIndex);
  }

  /** Valida y limpia nombres de carpeta generados o introducidos por el usuario. */
  private normalizeFolderName(name: string): string {
    const trimmedName = sanitizeFolderName(name, "Nueva carpeta");
    if (!trimmedName) {
      throw new Error("El nombre de carpeta no puede estar vacio");
    }

    return trimmedName;
  }

  /** Resuelve la extensión persistida del archivo extraído con un fallback seguro. */
  private resolveFileExtension(name: string, fallback: string): string {
    const extension = this.getExtensionFromName(name);
    return extension || fallback || "bin";
  }

  /** Reduce modelos de archivo o carpeta al shape público usado por el servicio. */
  private toRecord(model: FileModel | FolderModel): ArchiveCreatedRecord {
    return {
      id: model.id,
      name: model.name,
      path: model.path,
    };
  }

  /** Adapta un FileModel persistido al contrato de entrada que consume el servicio. */
  private toArchiveSourceFile(file: FileModel): ArchiveSourceFile {
    return {
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      extension: file.extension,
      path: file.path,
      metadata: file.metadata,
      archivePath: file.name,
      ...(file.folderId ? { folderId: file.folderId } : {}),
      ...(file.visibility ? { visibility: file.visibility } : {}),
      ...(file.storageUrl ? { storageUrl: file.storageUrl } : {}),
    };
  }
}
