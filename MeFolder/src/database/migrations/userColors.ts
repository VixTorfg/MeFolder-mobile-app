import { Database } from "../sqlite/Database";

/**
 * Crea la tabla user_colors para almacenar colores personalizados del usuario
 */
export const createUserColorsTable = async (): Promise<void> => {
  const db = Database.getInstance();

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS user_colors (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,

      name TEXT,
      
      color_hex TEXT NOT NULL,
      color_rgb_r INTEGER NOT NULL CHECK (color_rgb_r >= 0 AND color_rgb_r <= 255),
      color_rgb_g INTEGER NOT NULL CHECK (color_rgb_g >= 0 AND color_rgb_g <= 255),
      color_rgb_b INTEGER NOT NULL CHECK (color_rgb_b >= 0 AND color_rgb_b <= 255),

      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,

      CONSTRAINT unique_color_hex UNIQUE (color_hex)
    );
  `;

  const createIndexesSQL = [
    "CREATE INDEX IF NOT EXISTS idx_user_colors_hex ON user_colors(color_hex);",
    "CREATE INDEX IF NOT EXISTS idx_user_colors_favorite ON user_colors(is_favorite);",
    "CREATE INDEX IF NOT EXISTS idx_user_colors_created_at ON user_colors(created_at);",
  ];

  try {
    console.log("Creando tabla user_colors...");

    await db.execute(createTableSQL);
    console.log("Tabla user_colors creada");

    for (const indexSQL of createIndexesSQL) {
      await db.execute(indexSQL);
    }
    console.log("Índices de user_colors creados");

    console.log("Sistema de colores personalizados creado exitosamente");
  } catch (error) {
    console.error("Error al crear tabla user_colors:", error);
    throw error;
  }
};

/**
 * Elimina completamente la tabla user_colors
 */
export const dropUserColorsTable = async (): Promise<void> => {
  const db = Database.getInstance();

  try {
    console.log("Eliminando tabla user_colors...");
    await db.execute("DROP TABLE IF EXISTS user_colors;");
    console.log("Tabla user_colors eliminada");
  } catch (error) {
    console.error("Error al eliminar tabla user_colors:", error);
    throw error;
  }
};
