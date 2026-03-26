import { Database } from '../sqlite/Database';
import { SYSTEM_COLORS } from '@/constants/themes/colors';

/**
 * Etiquetas del sistema predeterminadas.
 */
const SYSTEM_TAGS = [
    { id: 'sys_album',      name: 'Álbumes', priority: 'low', color: SYSTEM_COLORS.green },
    { id: 'sys_important',  name: 'Importante', priority: 'high', color: SYSTEM_COLORS.red },
    { id: 'sys_todos',      name: 'Tareas', priority: 'normal', color: SYSTEM_COLORS.blue },
    { id: 'sys_photo',      name: 'Imágenes', priority: 'low', color: SYSTEM_COLORS.green },
    { id: 'sys_music',      name: 'Música', priority: 'low', color: SYSTEM_COLORS.purple },
    { id: 'sys_audio',      name: 'Audio', priority: 'low', color: SYSTEM_COLORS.orange },
    { id: 'sys_video',      name: 'Videos', priority: 'low', color: SYSTEM_COLORS.cyan },
    { id: 'sys_work',       name: 'Trabajo', priority: 'normal', color: SYSTEM_COLORS.gray },
    { id: 'sys_personal',   name: 'Personal', priority: 'normal', color: SYSTEM_COLORS.pink },
    { id: 'sys_urgent',     name: 'Urgente', priority: 'high', color: SYSTEM_COLORS.red },
    { id: 'sys_later',      name: 'Para después', priority: 'low', color: SYSTEM_COLORS.orange },
    { id: 'sys_document',   name: 'Documentos', priority: 'low', color: SYSTEM_COLORS.blue },
    { id: 'sys_favorite',   name: 'Favoritos', priority: 'normal', color: SYSTEM_COLORS.yellow },
] as const;

export const seedSystemTags = async (): Promise<void> => {
  const db = Database.getInstance();
  const now = new Date().toISOString();

  const tagsQueries = SYSTEM_TAGS.map((tag) => ({
    sql: `INSERT OR IGNORE INTO tags (
      id, created_at, updated_at,
      name, description, type, priority, is_active,
      color_hex, color_rgb_r, color_rgb_g, color_rgb_b, parent_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      tag.id, now, now,
      tag.name, null, 'system', tag.priority, true,
      tag.color.hex, tag.color.rgb.r, tag.color.rgb.g, tag.color.rgb.b, null,
    ],
  }));

  try {
    console.log('Insertando etiquetas del sistema...');
    await db.transaction(tagsQueries);
    console.log('Etiquetas del sistema listas');
  } catch (error) {
    console.error('Error al insertar etiquetas del sistema:', error);
    throw error;
  }
}

/** ID del tag padre de álbumes del sistema */
export const SYSTEM_ALBUM_TAG_ID = 'sys_album' as const;

/** IDs de las etiquetas del sistema, útil para validaciones */
export const SYSTEM_TAG_IDS = [...SYSTEM_TAGS.map((f) => f.id)];

/** Tipo unión de IDs de etiquetas del sistema */
export type SystemTagId = typeof SYSTEM_TAGS[number]['id'];
