import { Database } from '../sqlite/Database';

/**
 * Crea la tabla folders para organización jerárquica con columnas para nombre, ruta, nivel, estado, tipo, visibilidad, color personalizado y configuración de vista
 */
export const createFoldersTable = async (): Promise<void> => {
  const db = Database.getInstance();
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS folders (
      
      id TEXT PRIMARY KEY NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      
      name TEXT NOT NULL,
      description TEXT,
      
      parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
      path TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL DEFAULT 0,
      
      status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'deleted')),
      type TEXT NOT NULL DEFAULT 'regular' 
        CHECK (type IN ('regular', 'system', 'shared', 'favorite')),
      visibility TEXT NOT NULL DEFAULT 'private' 
        CHECK (visibility IN ('private', 'shared', 'public')),
      
      color_hex TEXT,
      color_rgb_r INTEGER CHECK (color_rgb_r >= 0 AND color_rgb_r <= 255),
      color_rgb_g INTEGER CHECK (color_rgb_g >= 0 AND color_rgb_g <= 255),
      color_rgb_b INTEGER CHECK (color_rgb_b >= 0 AND color_rgb_b <= 255),
      icon TEXT,
      
      view_settings_sort_by TEXT NOT NULL DEFAULT 'name'
        CHECK (view_settings_sort_by IN ('name', 'date', 'size', 'type')),
      view_settings_sort_order TEXT NOT NULL DEFAULT 'asc'
        CHECK (view_settings_sort_order IN ('asc', 'desc')),
      view_settings_view_mode TEXT NOT NULL DEFAULT 'list'
        CHECK (view_settings_view_mode IN ('grid', 'list', 'details')),
      view_settings_show_hidden_files BOOLEAN NOT NULL DEFAULT FALSE,
      
      last_accessed_at DATETIME,
      archived_at DATETIME,
      
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      is_protected BOOLEAN NOT NULL DEFAULT FALSE,
      is_system_folder BOOLEAN NOT NULL DEFAULT FALSE,
      
      CONSTRAINT color_complete 
        CHECK (
          (color_hex IS NULL AND color_rgb_r IS NULL AND color_rgb_g IS NULL AND color_rgb_b IS NULL) OR
          (color_hex IS NOT NULL AND color_rgb_r IS NOT NULL AND color_rgb_g IS NOT NULL AND color_rgb_b IS NOT NULL)
        )
    );
  `;

  const createIndexesSQL = [
    'CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);',
    'CREATE INDEX IF NOT EXISTS idx_folders_status ON folders(status);',
    'CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);',
    'CREATE INDEX IF NOT EXISTS idx_folders_level ON folders(level);',
    'CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);',
    'CREATE INDEX IF NOT EXISTS idx_folders_is_favorite ON folders(is_favorite);',
    'CREATE INDEX IF NOT EXISTS idx_folders_created_at ON folders(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_folders_updated_at ON folders(updated_at);',
  ];

  try {
    console.log('Creando tabla folders...');
    
    await db.execute(createTableSQL);
    
    for (const indexSQL of createIndexesSQL) {
      await db.execute(indexSQL);
    }
    
    console.log('Tabla folders creada exitosamente');
    
  } catch (error) {
    console.error('Error al crear tabla folders:', error);
    throw error;
  }
};

/**
 * Elimina completamente la tabla folders
 */
export const dropFoldersTable = async (): Promise<void> => {
  const db = Database.getInstance();
  
  try {
    console.log('Eliminando tabla folders...');
    await db.execute('DROP TABLE IF EXISTS folders;');
    console.log('Tabla folders eliminada');
  } catch (error) {
    console.error('Error al eliminar tabla folders:', error);
    throw error;
  }
};