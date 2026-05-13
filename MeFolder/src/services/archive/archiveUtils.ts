import JSZip from "jszip";
import type {
  ArchiveEntryDescriptor,
  ArchiveFutureOptions,
  ArchiveOperationError,
  ArchiveOperationResult,
  ArchiveUnsupportedFeature,
} from "@/types";
import { FileSystemService } from "../filesystem/FileSystemService";

export function normalizeArchivePath(path: string): string {
  const segments: string[] = [];

  for (const rawSegment of path.replace(/\\/g, "/").split("/")) {
    const segment = rawSegment.trim();
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      return "";
    }

    segments.push(segment);
  }

  return segments.join("/");
}

export function joinArchivePath(...segments: string[]): string {
  return segments
    .map((segment) => normalizeArchivePath(segment))
    .filter(Boolean)
    .join("/");
}

export function getParentArchivePath(path: string): string | undefined {
  const normalizedPath = normalizeArchivePath(path);
  if (!normalizedPath || !normalizedPath.includes("/")) {
    return undefined;
  }

  return normalizedPath.split("/").slice(0, -1).join("/");
}

export function buildArchiveEntries(
  zip: JSZip,
  shouldSkipEntry?: (path: string) => boolean,
): ArchiveEntryDescriptor[] {
  const directories = new Map<string, ArchiveEntryDescriptor>();
  const files: ArchiveEntryDescriptor[] = [];

  for (const zipEntry of Object.values(zip.files)) {
    const normalizedPath = normalizeArchivePath(zipEntry.name);
    if (!normalizedPath || shouldSkipEntry?.(normalizedPath)) {
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

export function indexZipFiles(
  zip: JSZip,
  shouldSkipEntry?: (path: string) => boolean,
): Map<string, JSZip.JSZipObject> {
  const indexedEntries = new Map<string, JSZip.JSZipObject>();

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }

    const normalizedPath = normalizeArchivePath(entry.name);
    if (!normalizedPath || shouldSkipEntry?.(normalizedPath)) {
      continue;
    }

    indexedEntries.set(normalizedPath, entry);
  }

  return indexedEntries;
}

export function validateArchiveFutureOptions(
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

export async function loadZipFromUri(
  fs: FileSystemService,
  archiveUri: string,
): Promise<ArchiveOperationResult<JSZip>> {
  const archiveBase64 = await fs.readAsBase64(archiveUri);
  if (!archiveBase64.success || !archiveBase64.data) {
    return {
      success: false,
      error: {
        code: "invalid_archive",
        message: archiveBase64.error ?? "No se pudo leer el ZIP",
      },
    };
  }

  try {
    const zip = await JSZip.loadAsync(archiveBase64.data, { base64: true });
    return { success: true, data: zip };
  } catch {
    return {
      success: false,
      error: {
        code: "invalid_archive",
        message: "El archivo ZIP no es valido o esta corrupto",
      },
    };
  }
}
