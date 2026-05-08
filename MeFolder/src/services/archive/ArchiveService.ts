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
  ArchiveFutureOptions,
  ArchiveInspection,
  ArchiveOperationError,
  ArchiveOperationResult,
  ArchiveSourceFile,
  ArchiveUnsupportedFeature,
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
} from "@/types/common/file-extensions";
import { FileService } from "../FileService";
import { FolderService } from "../FolderService";
import { FileSystemService } from "../filesystem/FileSystemService";
import { MediaService } from "../media/MediaService";

const SUPPORTED_FORMATS: readonly SupportedArchiveFormat[] = ["zip"];

interface CollectedArchiveFiles {
  directories: string[];
  files: Array<{
    zipPath: string;
    sourceFile: ArchiveSourceFile;
  }>;
}

interface CreatedFolderContext {
  record: ArchiveCreatedRecord;
  parentArchivePath?: string | undefined;
}

export class ArchiveService {
  private readonly fs = new FileSystemService();
  private readonly media = new MediaService();

  constructor(
    private readonly fileService: FileService = new FileService(),
    private readonly folderService: FolderService = new FolderService(),
  ) {}

  /** Crea un ZIP a partir de una carpeta completa y lo registra en la BD. */
  async createArchiveFromFolder(
    params: CreateArchiveFromFolderParams,
  ): Promise<ArchiveOperationResult<ArchiveCreationSummary>> {
    try {
      const optionError = this.validateFutureOptions(params.futureOptions);
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
      const destinationPath =
        await this.fileService.resolveStoragePath(destinationFolderId);
      const outputName = this.ensureArchiveFileName(
        params.outputName ?? sourceFolder.name,
        format,
      );

      const conflict = await this.checkOutputArchiveConflict(
        destinationFolderId,
        outputName,
      );
      if (conflict) {
        return this.fail({ code: conflict.type, message: conflict.message });
      }

      const collected = await this.collectFolderFiles(
        sourceFolder.id,
        sourceFolder.name,
      );
      const zip = new JSZip();

      for (const directory of collected.directories) {
        zip.file(this.ensureDirectoryEntryPath(directory), "", { dir: true });
      }

      const totalEntries = collected.files.length;
      for (const [index, entry] of collected.files.entries()) {
        params.onProgress?.({
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
      }

      const zipBase64 = await zip.generateAsync(
        this.buildZipGenerationOptions(params.compressionLevel),
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
        extension: format as CreateFileInput["extension"],
        folderId: destinationFolderId,
        visibility: params.visibility ?? "private",
        metadata: this.buildExtractedFileMetadata(fileInfo.data.size, format),
        storageUrl: archiveUri,
      });

      params.onProgress?.({
        phase: "compress",
        processedEntries: totalEntries,
        totalEntries,
        currentEntryName: outputName,
      });

      return {
        success: true,
        data: {
          archiveFile: this.toRecord(archiveFile),
          entryCount: collected.files.length,
          format,
        },
      };
    } catch (error) {
      return this.fail(this.toOperationError(error, "No se pudo crear el ZIP"));
    }
  }

  /** Crea un ZIP a partir de un listado explícito de archivos. */
  async createArchiveFromFiles(
    params: CreateArchiveFromFilesParams,
  ): Promise<ArchiveOperationResult<ArchiveCreationSummary>> {
    try {
      const optionError = this.validateFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const format = this.resolveRequestedFormat(params.format);
      if (!this.isSupportedFormat(format)) {
        return this.failUnsupportedFormat(format);
      }

      if (params.files.length === 0) {
        return this.fail({
          code: "invalid_archive",
          message: "Debes indicar al menos un archivo para comprimir",
        });
      }

      const destinationFolderId = params.destinationFolderId ?? ROOT_FOLDER_ID;
      const destinationPath =
        await this.fileService.resolveStoragePath(destinationFolderId);
      const outputName = this.ensureArchiveFileName(params.outputName, format);

      const conflict = await this.checkOutputArchiveConflict(
        destinationFolderId,
        outputName,
      );
      if (conflict) {
        return this.fail({ code: conflict.type, message: conflict.message });
      }

      const zip = new JSZip();
      const totalEntries = params.files.length;
      const usedZipPaths = new Set<string>();

      if (params.rootFolderName) {
        zip.file(this.ensureDirectoryEntryPath(params.rootFolderName), "", {
          dir: true,
        });
      }

      for (const [index, sourceFile] of params.files.entries()) {
        const zipPath = params.rootFolderName
          ? this.joinArchivePath(params.rootFolderName, sourceFile.name)
          : sourceFile.name;

        if (usedZipPaths.has(zipPath)) {
          return this.fail({
            code: "invalid_archive",
            message: `Hay rutas duplicadas dentro del ZIP: ${zipPath}`,
          });
        }
        usedZipPaths.add(zipPath);

        params.onProgress?.({
          phase: "compress",
          processedEntries: index,
          totalEntries,
          currentEntryName: sourceFile.name,
        });

        const fileContent = await this.readSourceFileAsBase64(sourceFile);
        if (!fileContent.success || !fileContent.data) {
          return this.fail(
            fileContent.error ?? {
              code: "unknown",
              message: `No se pudo leer ${sourceFile.name}`,
            },
          );
        }

        zip.file(zipPath, fileContent.data, { base64: true });
      }

      const zipBase64 = await zip.generateAsync(
        this.buildZipGenerationOptions(params.compressionLevel),
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
        extension: format as CreateFileInput["extension"],
        folderId: destinationFolderId,
        visibility: params.visibility ?? "private",
        metadata: this.buildExtractedFileMetadata(fileInfo.data.size, format),
        storageUrl: archiveUri,
      });

      params.onProgress?.({
        phase: "compress",
        processedEntries: totalEntries,
        totalEntries,
        currentEntryName: outputName,
      });

      return {
        success: true,
        data: {
          archiveFile: this.toRecord(archiveFile),
          entryCount: params.files.length,
          format,
        },
      };
    } catch (error) {
      return this.fail(this.toOperationError(error, "No se pudo crear el ZIP"));
    }
  }

  /** Inspecciona el ZIP y calcula estructura, conflictos y capacidad de extracción. */
  async inspectArchive(
    params: InspectArchiveParams,
  ): Promise<ArchiveOperationResult<ArchiveInspection>> {
    try {
      const optionError = this.validateFutureOptions(params.futureOptions);
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
      const inspectionResult = await this.inspectArchive(params);
      if (!inspectionResult.success || !inspectionResult.data) {
        return this.fail(
          inspectionResult.error ?? {
            code: "invalid_archive",
            message: "No se pudo inspeccionar el ZIP antes de extraerlo",
          },
        );
      }

      const inspection = inspectionResult.data;
      if (!inspection.canExtract) {
        const firstConflict = inspection.conflicts[0];
        return this.fail({
          code: firstConflict?.type ?? "invalid_archive",
          message:
            firstConflict?.message ??
            "No se puede extraer el ZIP por conflictos en destino",
        });
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

      for (const directoryEntry of directoryEntries) {
        const parentArchivePath = this.getParentArchivePath(
          directoryEntry.path,
        );
        const folderParentId = parentArchivePath
          ? folderMap.get(parentArchivePath)?.record.id
          : destinationFolderId;

        if (!folderParentId) {
          throw new Error(
            `No se pudo resolver la carpeta padre para ${directoryEntry.path}`,
          );
        }

        const createdFolder = await this.folderService.createFolder({
          name: directoryEntry.name,
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
        const parentArchivePath = this.getParentArchivePath(fileEntry.path);
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

        const targetUri = this.fs.resolveUri(
          this.joinArchivePath(fileFolderPath, fileEntry.name),
        );
        const base64Content = await zipFile.async("base64");
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
          FILE_CATEGORY_MAP[
            resolvedExtension as keyof typeof FILE_CATEGORY_MAP
          ];
        const thumbnailUrl =
          fileCategory === "image" || fileCategory === "video"
            ? ((await this.media.generateThumbnail(
                targetUri,
                `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                fileCategory,
              )) ?? undefined)
            : undefined;

        const extractedFile = await this.fileService.createFile({
          name: fileEntry.name,
          originalName: fileEntry.name,
          extension: resolvedExtension as CreateFileInput["extension"],
          folderId: fileFolderId,
          visibility: (params.archiveFile.visibility ??
            "private") as FileVisibility,
          metadata: this.buildFileMetadataFromInfo(fileInfo.data),
          storageUrl: targetUri,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        });

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
    const entries = this.buildArchiveEntries(args.zip);
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

  /** Convierte las entradas del ZIP en una vista plana de carpetas y archivos. */
  private buildArchiveEntries(zip: JSZip): ArchiveEntryDescriptor[] {
    const directories = new Map<string, ArchiveEntryDescriptor>();
    const files: ArchiveEntryDescriptor[] = [];

    for (const zipEntry of Object.values(zip.files)) {
      const normalizedPath = this.normalizeArchivePath(zipEntry.name);
      if (!normalizedPath) {
        continue;
      }

      const segments = normalizedPath.split("/");
      for (let index = 0; index < segments.length - 1; index += 1) {
        const dirPath = segments.slice(0, index + 1).join("/");
        if (!directories.has(dirPath)) {
          directories.set(dirPath, {
            path: dirPath,
            name: segments[index] ?? dirPath,
            type: "directory",
            depth: index + 1,
          });
        }
      }

      if (zipEntry.dir) {
        if (!directories.has(normalizedPath)) {
          directories.set(normalizedPath, {
            path: normalizedPath,
            name: segments[segments.length - 1] ?? normalizedPath,
            type: "directory",
            depth: segments.length,
          });
        }
        continue;
      }

      files.push({
        path: normalizedPath,
        name: segments[segments.length - 1] ?? normalizedPath,
        type: "file",
        depth: segments.length,
      });
    }

    return [...directories.values(), ...files].sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth;
      }
      return left.path.localeCompare(right.path);
    });
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
        zipPath: this.joinArchivePath(archiveRootPath, folderFile.name),
        sourceFile: this.toArchiveSourceFile(folderFile),
      });
    }

    for (const subfolder of subfolders) {
      const subfolderPath = this.joinArchivePath(
        archiveRootPath,
        subfolder.name,
      );
      const nested = await this.collectFolderFiles(subfolder.id, subfolderPath);
      directories.push(...nested.directories);
      files.push(...nested.files);
    }

    return { directories, files };
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

  /** Abre un archivo comprimido y lo carga como instancia de JSZip. */
  private async loadArchiveZip(
    archiveFile: ArchiveSourceFile,
  ): Promise<ArchiveOperationResult<JSZip>> {
    const archiveUri = this.resolveSourceFileUri(archiveFile);
    const archiveBase64 = await this.fs.readAsBase64(archiveUri);
    if (!archiveBase64.success || !archiveBase64.data) {
      return this.fail({
        code: "invalid_archive",
        message: archiveBase64.error ?? "No se pudo leer el ZIP",
      });
    }

    try {
      const zip = await JSZip.loadAsync(archiveBase64.data, { base64: true });
      return { success: true, data: zip };
    } catch {
      return this.fail({
        code: "invalid_archive",
        message: "El archivo ZIP no es valido o esta corrupto",
      });
    }
  }

  /** Indexa solo los archivos del ZIP por su ruta normalizada. */
  private indexZipFiles(zip: JSZip): Map<string, JSZip.JSZipObject> {
    const indexedEntries = new Map<string, JSZip.JSZipObject>();

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) {
        continue;
      }

      indexedEntries.set(this.normalizeArchivePath(entry.name), entry);
    }

    return indexedEntries;
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

  /** Rechaza opciones reservadas para futuras iteraciones que aún no están soportadas. */
  private validateFutureOptions(
    options?: ArchiveFutureOptions,
  ): ArchiveOperationError | null {
    if (!options) {
      return null;
    }

    const unsupported: ArchiveUnsupportedFeature[] = [];

    if (options.password) {
      unsupported.push("password");
    }
    if (options.encryption) {
      unsupported.push("encryption");
    }
    if (options.partialEntries && options.partialEntries.length > 0) {
      unsupported.push("partial_extraction");
    }
    if (options.overwriteMode) {
      unsupported.push("advanced_overwrite_mode");
    }

    if (unsupported.length === 0) {
      return null;
    }

    return {
      code: "unsupported_option",
      message:
        "Se han indicado opciones reservadas para futuras iteraciones y aun no estan soportadas",
      unsupportedFeatures: unsupported,
    };
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
      default:
        return {
          type: "base64",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
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

  /** Convierte la info del filesystem en metadata persistible del archivo extraído. */
  private buildFileMetadataFromInfo(fileInfo: {
    size: number;
    mimeType: string;
    md5: string | null;
  }): FileMetadata {
    return {
      size: fileInfo.size,
      ...(fileInfo.mimeType ? { mimeType: fileInfo.mimeType } : {}),
      ...(fileInfo.md5 ? { checksum: fileInfo.md5 } : {}),
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
    const normalized = this.normalizeArchivePath(path);
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }

  /** Normaliza rutas internas del ZIP usando separador POSIX y sin bordes sobrantes. */
  private normalizeArchivePath(path: string): string {
    return path
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim();
  }

  /** Une segmentos de ruta para construir rutas internas coherentes del ZIP. */
  private joinArchivePath(...segments: string[]): string {
    return segments
      .map((segment) => this.normalizeArchivePath(segment))
      .filter(Boolean)
      .join("/");
  }

  /** Obtiene la ruta padre de una entrada dentro del archivo comprimido. */
  private getParentArchivePath(path: string): string | undefined {
    const segments = this.normalizeArchivePath(path).split("/");
    if (segments.length <= 1) {
      return undefined;
    }

    return segments.slice(0, -1).join("/");
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
    const trimmedName = name.trim();
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
      ...(file.folderId ? { folderId: file.folderId } : {}),
      ...(file.visibility ? { visibility: file.visibility } : {}),
      ...(file.storageUrl ? { storageUrl: file.storageUrl } : {}),
    };
  }
}
