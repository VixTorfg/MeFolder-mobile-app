import { Database } from '../sqlite/Database';

/**
 * Crea la tabla files con todas las columnas para metadatos de archivos e índices para optimizar búsquedas
 */
export const createFilesTable = async (): Promise<void> => {
  const db = Database.getInstance();
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS files (
      
      id TEXT PRIMARY KEY NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      
      name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      extension TEXT NOT NULL,
      category TEXT NOT NULL
      CHECK (category in ('document', 'image', 'video', 'audio', 'code', 'archive', 'spreadsheet', 'other')),
      description TEXT,
      
      folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
      path TEXT NOT NULL UNIQUE,
      
      status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'deleted')),
      visibility TEXT NOT NULL DEFAULT 'private' 
        CHECK (visibility IN ('private', 'shared', 'public')),

      metadata_size INTEGER NOT NULL,
      metadata_mime_type TEXT,
      metadata_checksum TEXT,

      metadata_image_width INTEGER,
      metadata_image_height INTEGER,
      metadata_image_orientation INTEGER,

      metadata_video_duration INTEGER,
      metadata_video_width INTEGER,
      metadata_video_height INTEGER,
      metadata_video_framerate REAL,

      metadata_audio_duration INTEGER,
      metadata_audio_bitrate INTEGER,
      metadata_audio_sample_rate INTEGER,
      
      color_hex TEXT,
      color_rgb_r INTEGER CHECK (color_rgb_r >= 0 AND color_rgb_r <= 255),
      color_rgb_g INTEGER CHECK (color_rgb_g >= 0 AND color_rgb_g <= 255),
      color_rgb_b INTEGER CHECK (color_rgb_b >= 0 AND color_rgb_b <= 255),
      
      last_accessed_at DATETIME,
      archived_at DATETIME,
      
      storage_url TEXT,
      thumbnail_url TEXT,
      
      CONSTRAINT color_complete 
        CHECK (
          (color_hex IS NULL AND color_rgb_r IS NULL AND color_rgb_g IS NULL AND color_rgb_b IS NULL) OR
          (color_hex IS NOT NULL AND color_rgb_r IS NOT NULL AND color_rgb_g IS NOT NULL AND color_rgb_b IS NOT NULL)
        )
    );
  `;

  const createIndexesSQL = [
    'CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);',
    'CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);',
    'CREATE INDEX IF NOT EXISTS idx_files_visibility ON files(visibility);',
    'CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);',
    'CREATE INDEX IF NOT EXISTS idx_files_original_name ON files(original_name);',
    'CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_files_updated_at ON files(updated_at);',
    'CREATE INDEX IF NOT EXISTS idx_files_metadata_size ON files(metadata_size);',
    'CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);',
    'CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);'
  ];

  try {
    console.log('Creando tabla files...');
    
    await db.execute(createTableSQL);
    
    for (const indexSQL of createIndexesSQL) {
      await db.execute(indexSQL);
    }
    
    console.log('Tabla files creada exitosamente');
    
  } catch (error) {
    console.error('Error al crear tabla files:', error);
    throw error;
  }
};

/**
 * Elimina completamente la tabla files
 */ 
export const dropFilesTable = async (): Promise<void> => {
  const db = Database.getInstance();
  
  try {
    console.log('Eliminando tabla files...');
    await db.execute('DROP TABLE IF EXISTS files;');
    console.log('Tabla files eliminada');
  } catch (error) {
    console.error('Error al eliminar tabla files:', error);
    throw error;
  }
};