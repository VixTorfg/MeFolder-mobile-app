import { Database } from "../sqlite/Database";
import { SYSTEM_COLORS } from "@/constants/themes/colors";
import { Paths } from "expo-file-system";

const SYSTEM_FOLDERS_SEED_LOG_PREFIX = "[Database]";

/** ID fijo de la carpeta raíz del sistema */
export const ROOT_FOLDER_ID = "sys_root" as const;
export const SYSTEM_GALLERY_FOLDER_ID = "sys_gallery" as const;

const joinUri = (...segments: string[]): string =>
  segments
    .map((segment, index) => {
      let normalized = segment;
      if (index < segments.length - 1) {
        normalized = normalized.replace(/\/+$/, "");
      }
      if (index > 0) {
        normalized = normalized.replace(/^\/+/, "");
      }
      return normalized;
    })
    .join("/");

export const ROOT_FOLDER_PATH = joinUri(Paths.document.uri, ROOT_FOLDER_ID);

/**
 * Carpetas del sistema predeterminadas (hijas de root).
 */
const SYSTEM_FOLDERS = [
  { id: "sys_downloads", name: "Descargas", icon: "folder" },
  { id: "sys_documents", name: "Documentos", icon: "folder" },
  { id: "sys_gallery", name: "Galería", icon: "folder" },
  { id: "sys_music", name: "Música", icon: "folder" },
  { id: "sys_library", name: "Biblioteca", icon: "folder" },
] as const;

/**
 * Inserta las carpetas del sistema si no existen.
 */
export const seedSystemFolders = async (): Promise<void> => {
  const db = Database.getInstance();
  const now = new Date().getTime();
  const color = SYSTEM_COLORS.yellow;

  // Carpeta raíz del sistema (sin padre)
  const rootQuery = {
    sql: `INSERT OR IGNORE INTO folders (
      id, created_at, updated_at,
      name, description, parent_id, path, level,
      status, type, visibility,
      color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
      icon, is_favorite, is_protected, is_system_folder,
      view_settings_sort_by, view_settings_sort_order,
      view_settings_view_mode, view_settings_show_hidden_files
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      ROOT_FOLDER_ID,
      now,
      now,
      "Inicio",
      null,
      null,
      ROOT_FOLDER_PATH,
      0,
      "active",
      "system",
      "private",
      color.hex,
      color.rgb.r,
      color.rgb.g,
      color.rgb.b,
      "folder",
      false,
      true,
      true,
      "name",
      "asc",
      "list",
      false,
    ],
  };

  // Carpetas hijas del root
  const childQueries = SYSTEM_FOLDERS.map((folder) => ({
    sql: `INSERT OR IGNORE INTO folders (
      id, created_at, updated_at,
      name, description, parent_id, path, level,
      status, type, visibility,
      color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
      icon, is_favorite, is_protected, is_system_folder,
      view_settings_sort_by, view_settings_sort_order,
      view_settings_view_mode, view_settings_show_hidden_files
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      folder.id,
      now,
      now,
      folder.name,
      null,
      ROOT_FOLDER_ID,
      `${ROOT_FOLDER_PATH}/${folder.id}`,
      1,
      "active",
      "system",
      "public",
      color.hex,
      color.rgb.r,
      color.rgb.g,
      color.rgb.b,
      folder.icon,
      false,
      true,
      true,
      "name",
      "asc",
      "list",
      false,
    ],
  }));

  try {
    console.log(
      `${SYSTEM_FOLDERS_SEED_LOG_PREFIX} Insertando carpetas del sistema...`,
    );
    await db.transaction([rootQuery, ...childQueries]);
    console.log(
      `${SYSTEM_FOLDERS_SEED_LOG_PREFIX} Carpetas del sistema listas`,
    );
  } catch (error) {
    console.error(
      `${SYSTEM_FOLDERS_SEED_LOG_PREFIX} Error al insertar carpetas del sistema:`,
      error,
    );
    throw error;
  }
};

/** IDs de las carpetas del sistema, útil para validaciones */
export const SYSTEM_FOLDER_IDS = [
  ROOT_FOLDER_ID,
  ...SYSTEM_FOLDERS.map((f) => f.id),
];

/** Tipo unión de IDs de carpetas del sistema */
export type SystemFolderId =
  | typeof ROOT_FOLDER_ID
  | (typeof SYSTEM_FOLDERS)[number]["id"];
