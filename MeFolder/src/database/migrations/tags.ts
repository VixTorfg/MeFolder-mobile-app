import { Database } from '../sqlite/Database';

/**
 * Crea las tablas tags y file_tags para el sistema de etiquetado con soporte para jerarquías, colores y contadores de uso
 */
export const createTagsTable = async (): Promise<void> => {
  const db = Database.getInstance();
  
  const createTagsTableSQL = `
    CREATE TABLE IF NOT EXISTS tags (

      id TEXT PRIMARY KEY NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      
      type TEXT NOT NULL DEFAULT 'user' 
        CHECK (type IN ('system', 'user', 'automatic')),
      priority TEXT NOT NULL DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'critical')),
      
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      
      color_hex TEXT NOT NULL,
      color_rgb_r INTEGER NOT NULL CHECK (color_rgb_r >= 0 AND color_rgb_r <= 255),
      color_rgb_g INTEGER NOT NULL CHECK (color_rgb_g >= 0 AND color_rgb_g <= 255),
      color_rgb_b INTEGER NOT NULL CHECK (color_rgb_b >= 0 AND color_rgb_b <= 255),
      
      usage_count INTEGER NOT NULL DEFAULT 0,
      last_used_at DATETIME,
      
      parent_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
      
      CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
    );
  `;

  const createFileTagsTableSQL = `
    CREATE TABLE IF NOT EXISTS file_tags (
      file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at DATETIME NOT NULL DEFAULT (DATETIME('now')),
      
      PRIMARY KEY (file_id, tag_id)
    );
  `;

  const createFolderTagsTableSQL = `
    CREATE TABLE IF NOT EXISTS folder_tags (
      folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at DATETIME NOT NULL DEFAULT (DATETIME('now')),
      
      PRIMARY KEY (folder_id, tag_id)
    );
  `;

  const createIndexesSQL = [
    'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);',
    'CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);',
    'CREATE INDEX IF NOT EXISTS idx_tags_priority ON tags(priority);',
    'CREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count);',
    'CREATE INDEX IF NOT EXISTS idx_tags_parent_id ON tags(parent_id);',
    'CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at);',
    
    'CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON file_tags(file_id);',
    'CREATE INDEX IF NOT EXISTS idx_file_tags_tag_id ON file_tags(tag_id);',
    'CREATE INDEX IF NOT EXISTS idx_file_tags_created_at ON file_tags(created_at);',
    
    'CREATE INDEX IF NOT EXISTS idx_folder_tags_folder_id ON folder_tags(folder_id);',
    'CREATE INDEX IF NOT EXISTS idx_folder_tags_tag_id ON folder_tags(tag_id);',
    'CREATE INDEX IF NOT EXISTS idx_folder_tags_created_at ON folder_tags(created_at);',
  ];

  try {
    console.log('Creando tablas de tags...');
    
    await db.execute(createTagsTableSQL);
    console.log('Tabla tags creada');
    
    await db.execute(createFileTagsTableSQL);
    console.log('Tabla file_tags creada');
    
    await db.execute(createFolderTagsTableSQL);
    console.log('Tabla folder_tags creada');
    
    // Crear índices
    for (const indexSQL of createIndexesSQL) {
      await db.execute(indexSQL);
    }
    console.log('Índices creados');
    
    console.log('Sistema de tags creado exitosamente');
    
  } catch (error) {
    console.error('Error al crear sistema de tags:', error);
    throw error;
  }
};

/**
 * Crea triggers automáticos para actualizar contadores de uso y fecha de último uso cuando se asignan o eliminan etiquetas
 */
export const createTagTriggers = async (): Promise<void> => {
  const db = Database.getInstance();
  
  const triggers = [
  
    `CREATE TRIGGER IF NOT EXISTS trg_file_tag_insert
     AFTER INSERT ON file_tags
     FOR EACH ROW
     BEGIN
       UPDATE tags 
       SET usage_count = usage_count + 1, 
           last_used_at = DATETIME('now'),
           updated_at = DATETIME('now')
       WHERE id = NEW.tag_id;
     END;`,
     
    `CREATE TRIGGER IF NOT EXISTS trg_file_tag_delete
     AFTER DELETE ON file_tags
     FOR EACH ROW
     BEGIN
       UPDATE tags 
       SET usage_count = MAX(usage_count - 1, 0),
           updated_at = DATETIME('now')
       WHERE id = OLD.tag_id;
     END;`,
     
    `CREATE TRIGGER IF NOT EXISTS trg_folder_tag_insert
     AFTER INSERT ON folder_tags
     FOR EACH ROW
     BEGIN
       UPDATE tags 
       SET usage_count = usage_count + 1,
           last_used_at = DATETIME('now'),
           updated_at = DATETIME('now')
       WHERE id = NEW.tag_id;
     END;`,
     
    `CREATE TRIGGER IF NOT EXISTS trg_folder_tag_delete
     AFTER DELETE ON folder_tags
     FOR EACH ROW
     BEGIN
       UPDATE tags 
       SET usage_count = MAX(usage_count - 1, 0),
           updated_at = DATETIME('now')
       WHERE id = OLD.tag_id;
     END;`,
  ];

  try {
    console.log('Creando triggers para tags...');
    
    for (const trigger of triggers) {
      await db.execute(trigger);
    }
    
    console.log('Triggers de tags creados exitosamente');
    
  } catch (error) {
    console.error('Error al crear triggers de tags:', error);
    throw error;
  }
};

/**
 * Elimina completamente el sistema de etiquetas (tablas, triggers y relaciones)
 */
export const dropTagsSystem = async (): Promise<void> => {
  const db = Database.getInstance();
  
  try {
    console.log('Eliminando sistema de tags...');
    
    const dropTriggers = [
      'DROP TRIGGER IF EXISTS trg_file_tag_insert;',
      'DROP TRIGGER IF EXISTS trg_file_tag_delete;',
      'DROP TRIGGER IF EXISTS trg_folder_tag_insert;',
      'DROP TRIGGER IF EXISTS trg_folder_tag_delete;',
    ];
    
    for (const dropTrigger of dropTriggers) {
      try {
        await db.execute(dropTrigger);
      } catch (e) {
        console.warn(`No se pudo eliminar trigger: ${dropTrigger}`, e);
      }
    }
    
    await db.execute('DROP TABLE IF EXISTS file_tags;');
    await db.execute('DROP TABLE IF EXISTS folder_tags;');
    await db.execute('DROP TABLE IF EXISTS tags;');
    
    console.log('Sistema de tags eliminado');
    
  } catch (error) {
    console.error('Error al eliminar sistema de tags:', error);
    throw error;
  }
};
