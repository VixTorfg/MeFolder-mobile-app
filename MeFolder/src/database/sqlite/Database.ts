import * as SQLite from 'expo-sqlite';

export class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'mefolder.db';

  private constructor() {}

  /**
   * Obtiene la instancia única de Database (patrón Singleton).
   * Garantiza que solo exista una conexión a la base de datos en toda la aplicación.
   * @returns La instancia única de Database
   */
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Inicializa la base de datos SQLite y configura las optimizaciones necesarias.
   * Solo se ejecuta una vez. Si ya está inicializada, no hace nada.
   * Configura claves foráneas, modo WAL y sincronización completa.
   * @throws Error si falla la inicialización
   */
  async initialize(): Promise<void> {
    if (this.db) {
      console.log('Base de datos ya inicializada');
      return;
    }

    try {
      console.log('Inicializando base de datos...');
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      
      await this.setupDatabase();
      
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    }
  }

  /**
   * Obtiene la conexión activa a la base de datos.
   * Valida que la base de datos esté inicializada antes de devolver la conexión.
   * @returns La conexión SQLite activa
   * @throws Error si la base de datos no está inicializada
   */
  getConnection(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a initialize() primero.');
    }
    return this.db;
  }

  /**
   * Configura la base de datos con optimizaciones para rendimiento y integridad.
   * Habilita claves foráneas, modo WAL para mejor concurrencia y sincronización completa.
   */
  private async setupDatabase(): Promise<void> {
    if (!this.db) return;
    // Habilitar claves foráneas
    await this.db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Configurar modo WAL para mejor concurrencia
    await this.db.execAsync('PRAGMA journal_mode = WAL;');
    
    // Configurar sincronización completa para integridad
    await this.db.execAsync('PRAGMA synchronous = FULL;');
  }

 /**
   * Ejecuta una consulta SELECT y retorna los resultados.
   * Maneja automáticamente los parámetros para evitar inyección SQL.
   * @param sql - Consulta SQL a ejecutar
   * @param params - Parámetros para la consulta (opcional)
   * @returns Array de objetos con los resultados
   * @throws Error si falla la consulta
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = this.getConnection();
    try {
      const result = await db.getAllAsync(sql, params);
      return result as T[];
    } catch (error) {
      console.error('Error en query:', { sql, params, error });
      throw error;
    }
  }


  /**
   * Ejecuta comandos SQL de modificación (INSERT, UPDATE, DELETE).
   * Retorna información sobre las filas afectadas y el último ID insertado.
   * @param sql - Comando SQL a ejecutar
   * @param params - Parámetros para el comando (opcional)
   * @returns Resultado con información de la ejecución
   * @throws Error si falla el comando
   */
  async execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    const db = this.getConnection();
    try {
      const result = await db.runAsync(sql, params);
      return result;
    } catch (error) {
      console.error('Error en execute:', { sql, params, error });
      throw error;
    }
  }


  /**
   * Ejecuta múltiples consultas dentro de una transacción atómica.
   * Si alguna consulta falla, se revierten todos los cambios automáticamente.
   * @param queries - Array de objetos con sql y parámetros
   * @throws Error si falla alguna consulta de la transacción
   */
  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
    const db = this.getConnection();
    
    await db.withTransactionAsync(async () => {
      for (const query of queries) {
        await db.runAsync(query.sql, query.params || []);
      }
    });
  }

  /**
   * Cierra la conexión a la base de datos y limpia los recursos.
   * Debe llamarse al cerrar la aplicación para evitar memory leaks.
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Conexión de base de datos cerrada');
    }
  }

  /**
   * Verifica si la base de datos está inicializada y lista para usar.
   * @returns true si está inicializada, false en caso contrario
   */
  isInitialized(): boolean {
    return this.db !== null;
  }
}