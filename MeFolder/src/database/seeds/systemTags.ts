import { Database } from "../sqlite/Database";
import { SYSTEM_COLORS } from "@/constants/themes/colors";

/**
 * Etiquetas del sistema predeterminadas.
 */
const SYSTEM_TAGS = [
  {
    id: "sys_album",
    name: "Álbum del sistema",
    priority: "low",
    isFavourite: false,
    type: "album",
    color: SYSTEM_COLORS.green,
  },
  {
    id: "sys_important",
    name: "Importante",
    priority: "high",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.red,
  },
  {
    id: "sys_todos",
    name: "Tareas",
    priority: "normal",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.blue,
  },
  {
    id: "sys_photo",
    name: "Imágenes",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.green,
  },
  {
    id: "sys_music",
    name: "Música",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.purple,
  },
  {
    id: "sys_audio",
    name: "Audio",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.orange,
  },
  {
    id: "sys_video",
    name: "Videos",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.cyan,
  },
  {
    id: "sys_work",
    name: "Trabajo",
    priority: "normal",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.gray,
  },
  {
    id: "sys_personal",
    name: "Personal",
    priority: "normal",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.pink,
  },
  {
    id: "sys_urgent",
    name: "Urgente",
    priority: "high",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.red,
  },
  {
    id: "sys_later",
    name: "Para después",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.orange,
  },
  {
    id: "sys_document",
    name: "Documentos",
    priority: "low",
    isFavourite: false,
    type: "system",
    color: SYSTEM_COLORS.blue,
  },
  {
    id: "sys_favorite",
    name: "Favoritos",
    priority: "normal",
    isFavourite: true,
    type: "system",
    color: SYSTEM_COLORS.yellow,
  },
] as const;

export const seedSystemTags = async (): Promise<void> => {
  const db = Database.getInstance();
  const now = new Date().getTime();

  const tagsQueries = SYSTEM_TAGS.map((tag) => ({
    sql: `INSERT OR IGNORE INTO tags (
      id, created_at, updated_at,
      name, description, priority, is_active, is_favourite, type,
      color_hex, color_rgb_r, color_rgb_g, color_rgb_b, parent_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    params: [
      tag.id,
      now,
      now,
      tag.name,
      null,
      tag.priority,
      true,
      tag.isFavourite,
      tag.type,
      tag.color.hex,
      tag.color.rgb.r,
      tag.color.rgb.g,
      tag.color.rgb.b,
      null,
    ],
  }));

  try {
    console.log("Insertando etiquetas del sistema...");
    await db.transaction(tagsQueries);
    console.log("Etiquetas del sistema listas");
  } catch (error) {
    console.error("Error al insertar etiquetas del sistema:", error);
    throw error;
  }
};

/** ID del tag padre de álbumes del sistema */
export const SYSTEM_ALBUM_TAG_ID = "sys_album" as const;

/** Diccionario de IDs de etiquetas del sistema accesibles por nombre semántico */
export const SYSTEM_TAG_IDS = {
  album: "sys_album",
  important: "sys_important",
  todos: "sys_todos",
  photo: "sys_photo",
  music: "sys_music",
  audio: "sys_audio",
  video: "sys_video",
  work: "sys_work",
  personal: "sys_personal",
  urgent: "sys_urgent",
  later: "sys_later",
  document: "sys_document",
  favorite: "sys_favorite",
} as const;

/** Tipo unión de IDs de etiquetas del sistema */
export type SystemTagId = (typeof SYSTEM_TAGS)[number]["id"];
