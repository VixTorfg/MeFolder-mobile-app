import JSZip from "jszip";
import { Database } from "@/database/sqlite/Database";
import { FileSystemService } from "../filesystem/FileSystemService";

interface FolderLookupRow {
  id: string;
  name: string;
  path: string;
  status: string;
}

interface FileLookupRow {
  id: string;
  name: string;
  originalName: string;
  storageUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
}

interface FilesystemSnapshot {
  normalRootUris: string[];
  thumbnailsRootUri: string;
  folderById: Map<string, FolderLookupRow>;
  folderByPath: Map<string, FolderLookupRow>;
  storageFileByUri: Map<string, FileLookupRow>;
  thumbnailFileByUri: Map<string, FileLookupRow>;
}

export interface DatabaseDebugExportResult {
  zipUri: string;
  zipFileName: string;
  reportUri: string;
  reportFileName: string;
  exportDirectoryUri: string;
  databasePath: string;
}

/**
 * DEV-ONLY TEST: exporta un snapshot completo de SQLite para depuración manual.
 * Incluye la base de datos serializada y un documento de árbol del filesystem real.
 */
export class DatabaseDebugExportService {
  private readonly database = Database.getInstance();
  private readonly fs = new FileSystemService();
  private readonly exportDirectoryName = ".debug-exports";
  private readonly databaseFileName = "mefolder.db";

  async exportSnapshot(): Promise<DatabaseDebugExportResult> {
    if (!this.database.isInitialized()) {
      throw new Error("La base de datos no está inicializada todavía.");
    }

    const connection = this.database.getConnection();
    const exportedAt = new Date();
    const exportStamp = this.buildExportStamp(exportedAt);
    const exportDirectoryUri = this.fs.resolveUri(this.exportDirectoryName);
    const ensured = this.fs.ensureDirectory(exportDirectoryUri);

    if (!ensured.success) {
      throw new Error(
        ensured.error ?? "No se pudo preparar el directorio de exportación",
      );
    }

    const databasePath = this.readDatabasePath(connection);
    const serializedDatabase = await connection.serializeAsync();
    const filesystemSnapshot = await this.buildFilesystemSnapshot();
    const reportContent = this.renderFilesystemTreeDocument({
      exportedAt,
      databasePath,
      databaseBytes: serializedDatabase.byteLength,
      filesystemSnapshot,
    });

    const reportFileName = `${exportStamp}-filesystem-tree.txt`;
    const reportUri = `${exportDirectoryUri}/${reportFileName}`;
    const reportWrite = this.fs.writeFile({
      uri: reportUri,
      content: reportContent,
    });

    if (!reportWrite.success) {
      throw new Error(
        reportWrite.error ?? "No se pudo escribir el documento de árbol",
      );
    }

    const zip = new JSZip();
    zip.file(this.databaseFileName, serializedDatabase, { binary: true });
    zip.file(reportFileName, reportContent);

    const zipFileName = `${exportStamp}-database-export.zip`;
    const zipUri = `${exportDirectoryUri}/${zipFileName}`;
    const zipBase64 = await zip.generateAsync({
      type: "base64",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    const zipWrite = this.fs.writeFile({
      uri: zipUri,
      content: zipBase64,
      encoding: "base64",
    });

    if (!zipWrite.success) {
      throw new Error(zipWrite.error ?? "No se pudo escribir el ZIP exportado");
    }

    return {
      zipUri,
      zipFileName,
      reportUri,
      reportFileName,
      exportDirectoryUri,
      databasePath,
    };
  }

  private async buildFilesystemSnapshot(): Promise<FilesystemSnapshot> {
    const folders = await this.database.query<FolderLookupRow>(`
      SELECT id, name, path, status
      FROM folders
      ORDER BY LENGTH(path) ASC, path ASC
    `);
    const files = await this.database.query<FileLookupRow>(`
      SELECT
        id,
        name,
        original_name AS originalName,
        storage_url AS storageUrl,
        thumbnail_url AS thumbnailUrl,
        status
      FROM files
      ORDER BY name ASC
    `);

    const folderById = new Map<string, FolderLookupRow>();
    const folderByPath = new Map<string, FolderLookupRow>();
    const storageFileByUri = new Map<string, FileLookupRow>();
    const thumbnailFileByUri = new Map<string, FileLookupRow>();

    folders.forEach((folder) => {
      folderById.set(folder.id, folder);
      folderByPath.set(folder.path, folder);
    });

    files.forEach((file) => {
      if (file.storageUrl) {
        storageFileByUri.set(file.storageUrl, file);
      }
      if (file.thumbnailUrl) {
        thumbnailFileByUri.set(file.thumbnailUrl, file);
      }
    });

    return {
      normalRootUris: this.resolveNormalRootUris(folders, files),
      thumbnailsRootUri: this.fs.resolveUri(".thumbnails"),
      folderById,
      folderByPath,
      storageFileByUri,
      thumbnailFileByUri,
    };
  }

  private renderFilesystemTreeDocument(args: {
    exportedAt: Date;
    databasePath: string;
    databaseBytes: number;
    filesystemSnapshot: FilesystemSnapshot;
  }): string {
    const lines: string[] = [];

    const pushLine = (level: number, text: string) => {
      lines.push(`${"  ".repeat(level)}${text}`);
    };

    pushLine(0, "MeFolder filesystem snapshot");
    pushLine(1, "metadata");
    pushLine(2, `exportedAt: ${args.exportedAt.toISOString()}`);
    pushLine(2, `databasePath: ${args.databasePath}`);
    pushLine(2, `databaseBytes: ${args.databaseBytes}`);
    pushLine(
      2,
      `normalRootsDetected: ${args.filesystemSnapshot.normalRootUris.length}`,
    );
    pushLine(2, `thumbnailsRoot: ${args.filesystemSnapshot.thumbnailsRootUri}`);
    pushLine(0, "");

    pushLine(1, "normalStorage");
    if (args.filesystemSnapshot.normalRootUris.length === 0) {
      pushLine(2, "(sin raíces físicas detectadas)");
    }

    args.filesystemSnapshot.normalRootUris.forEach((rootUri, index) => {
      pushLine(2, `root#${index + 1}`);
      pushLine(3, `uri: ${rootUri}`);
      pushLine(3, "tree");
      this.appendDirectoryTree(
        lines,
        rootUri,
        4,
        args.filesystemSnapshot,
        "storage-root",
      );
    });

    pushLine(0, "");
    pushLine(1, "thumbnailsStorage");
    pushLine(2, `uri: ${args.filesystemSnapshot.thumbnailsRootUri}`);
    pushLine(2, "tree");
    this.appendDirectoryTree(
      lines,
      args.filesystemSnapshot.thumbnailsRootUri,
      3,
      args.filesystemSnapshot,
      "thumbnails-root",
    );

    return lines.join("\n");
  }

  private appendDirectoryTree(
    lines: string[],
    directoryUri: string,
    level: number,
    snapshot: FilesystemSnapshot,
    role: "storage-root" | "thumbnails-root" | "directory",
  ): void {
    const pushLine = (indentLevel: number, text: string) => {
      lines.push(`${"  ".repeat(indentLevel)}${text}`);
    };

    const directoryInfo = this.fs.getDirectoryInfo(directoryUri);
    const directoryLabel = this.describeDirectory(directoryUri, snapshot, role);

    if (!directoryInfo.success || !directoryInfo.data?.exists) {
      pushLine(level, `${directoryLabel} [missing]`);
      return;
    }

    pushLine(level, directoryLabel);

    const listing = this.fs.listDirectory(directoryUri);
    if (!listing.success || !listing.data) {
      pushLine(
        level + 1,
        `(error al listar: ${listing.error ?? "desconocido"})`,
      );
      return;
    }

    const directories = listing.data
      .filter((entry) => entry.isDirectory)
      .sort((left, right) => left.name.localeCompare(right.name));
    const files = listing.data
      .filter((entry) => !entry.isDirectory)
      .sort((left, right) => left.name.localeCompare(right.name));

    if (directories.length === 0 && files.length === 0) {
      pushLine(level + 1, "(vacío)");
      return;
    }

    directories.forEach((entry) => {
      this.appendDirectoryTree(
        lines,
        entry.uri,
        level + 1,
        snapshot,
        "directory",
      );
    });

    files.forEach((entry) => {
      pushLine(level + 1, this.describeFile(entry, snapshot));
    });
  }

  private describeDirectory(
    directoryUri: string,
    snapshot: FilesystemSnapshot,
    role: "storage-root" | "thumbnails-root" | "directory",
  ): string {
    const baseName = this.fs.getFileName(directoryUri) || directoryUri;
    const folder =
      snapshot.folderByPath.get(directoryUri) ??
      snapshot.folderById.get(baseName);
    const metadata: string[] = [];

    if (role === "storage-root") {
      metadata.push("storage-root");
    }
    if (role === "thumbnails-root") {
      metadata.push("thumbnails-root");
    }
    if (folder) {
      metadata.push(`Folder=${folder.name}`);
      metadata.push(`id=${folder.id}`);
      metadata.push(`status=${folder.status}`);
    }

    return metadata.length > 0
      ? `${baseName} [${metadata.join(" | ")}]`
      : baseName;
  }

  private describeFile(
    fileEntry: { name: string; uri: string; size?: number | undefined },
    snapshot: FilesystemSnapshot,
  ): string {
    const storageFile = snapshot.storageFileByUri.get(fileEntry.uri);
    const thumbnailFile = snapshot.thumbnailFileByUri.get(fileEntry.uri);
    const metadata: string[] = [];

    if (storageFile) {
      metadata.push(`File=${storageFile.name}`);
      metadata.push(`id=${storageFile.id}`);
      metadata.push(`status=${storageFile.status}`);
      if (storageFile.originalName !== storageFile.name) {
        metadata.push(`originalName=${storageFile.originalName}`);
      }
    }

    if (thumbnailFile) {
      metadata.push(`ThumbnailOf=${thumbnailFile.name}`);
      metadata.push(`fileId=${thumbnailFile.id}`);
      metadata.push(`status=${thumbnailFile.status}`);
    }

    if (fileEntry.size != null) {
      metadata.push(`bytes=${fileEntry.size}`);
    }

    return metadata.length > 0
      ? `${fileEntry.name} [${metadata.join(" | ")}]`
      : fileEntry.name;
  }

  private resolveNormalRootUris(
    folders: FolderLookupRow[],
    files: FileLookupRow[],
  ): string[] {
    const candidates = new Set<string>();

    folders.forEach((folder) => {
      candidates.add(folder.path);
    });

    files.forEach((file) => {
      if (file.storageUrl) {
        candidates.add(this.fs.getParentUri(file.storageUrl));
      }
    });

    candidates.add(this.fs.resolveUri("root"));
    candidates.add(this.fs.resolveUri("sys_root"));

    const sortedCandidates = Array.from(candidates).sort(
      (left, right) => left.length - right.length || left.localeCompare(right),
    );
    const existingCandidates = sortedCandidates.filter((uri) =>
      this.fs.directoryExists(uri),
    );
    const preferredCandidates =
      existingCandidates.length > 0 ? existingCandidates : sortedCandidates;
    const roots: string[] = [];

    preferredCandidates.forEach((uri) => {
      const alreadyCovered = roots.some((rootUri) =>
        this.isNestedUri(uri, rootUri),
      );
      if (!alreadyCovered) {
        roots.push(uri);
      }
    });

    return roots;
  }

  private buildExportStamp(date: Date): string {
    const pad = (value: number): string => String(value).padStart(2, "0");

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join("");
  }

  private isNestedUri(candidateUri: string, parentUri: string): boolean {
    const normalizedCandidate = candidateUri.replace(/\/+$/, "");
    const normalizedParent = parentUri.replace(/\/+$/, "");

    return (
      normalizedCandidate === normalizedParent ||
      normalizedCandidate.startsWith(`${normalizedParent}/`)
    );
  }

  private readDatabasePath(connection: { databasePath?: string }): string {
    return connection.databasePath ?? "Ruta no disponible";
  }
}
