import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Database } from '@/database/sqlite/Database';
import { createFilesTable } from '@/database/migrations/files';
import { createFoldersTable } from '@/database/migrations/folders';
import { createTagsTable } from '@/database/migrations/tags';
import { createUserColorsTable } from '@/database/migrations/userColors';
import { seedSystemFolders } from '@/database/seeds/systemFolders';
import { seedSystemTags } from '@/database/seeds/systemTags';

interface DatabaseContextType {
  /** Instancia singleton de la base de datos */
  database: Database;
  /** Indica si la base de datos está completamente inicializada y lista */
  isReady: boolean;
  /** Error ocurrido durante la inicialización (null si todo fue bien) */
  error: Error | null;
  /** Reintentar la inicialización tras un error */
  retry: () => void;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

/**
 * Hook para acceder al contexto de la base de datos.
 * Debe usarse dentro de un DatabaseProvider.
 * 
 * @example
 * ```tsx
 * const { database, isReady } = useDatabase();
 * ```
 */
export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase debe usarse dentro de un <DatabaseProvider>');
  }
  return context;
};


/**
 * Ejecuta todas las migraciones de base de datos en orden.
 */
const runMigrations = async (): Promise<void> => {
  console.log('Ejecutando migraciones...');

  await createFoldersTable();
  await createFilesTable();
  await createTagsTable();
  await createUserColorsTable();

  // Seeds: carpetas del sistema (idempotente, segura en cada arranque)
  await seedSystemTags();
  await seedSystemFolders();

  console.log('Migraciones completadas exitosamente');
};

/**
 * Provider que gestiona el ciclo de vida de la base de datos SQLite.
 * 
 * Responsabilidades:
 * - Inicializa la conexión a la base de datos al montar el componente
 * - Ejecuta las migraciones (creación de tablas)
 * - Expone el estado de inicialización (isReady, error)
 * - Proporciona un mecanismo de reintento en caso de fallo
 * 
 * @example
 * ```tsx
 * <DatabaseProvider>
 *   <App />
 * </DatabaseProvider>
 * ```
 */
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const database = Database.getInstance();

  const initializeDatabase = useCallback(async () => {
    try {
      setIsReady(false);
      setError(null);

      console.log('DatabaseProvider: Iniciando inicialización...');

      await database.initialize();
      await runMigrations();

      setIsReady(true);
      console.log('DatabaseProvider: Base de datos lista');
    } catch (err) {
      const initError = err instanceof Error
        ? err
        : new Error('Error desconocido al inicializar la base de datos');

      console.error('DatabaseProvider: Error de inicialización:', initError);
      setError(initError);
    }
  }, [database]);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase, retryCount]);

  const retry = useCallback(() => {
    console.log('DatabaseProvider: Reintentando inicialización...');
    setRetryCount(prev => prev + 1);
  }, []);

  return (
    <DatabaseContext.Provider value={{ database, isReady, error, retry }}>
      {children}
    </DatabaseContext.Provider>
  );
};
