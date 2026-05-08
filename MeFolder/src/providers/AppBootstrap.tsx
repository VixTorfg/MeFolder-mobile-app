import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useDatabase } from "./DatabaseProvider";
import {
  ArchiveService,
  FileService,
  FolderService,
  TagService,
  UserColorService,
  FileSystemService,
  MediaImportService,
} from "@/services";

interface Services {
  archiveService: ArchiveService;
  fileService: FileService;
  folderService: FolderService;
  tagService: TagService;
  userColorService: UserColorService;
  mediaImportService: MediaImportService;
}

interface AppBootstrapContextType {
  /** Servicios de la aplicación listos para usar */
  services: Services;
  /** Indica si todos los servicios están inicializados */
  isReady: boolean;
  /** Error ocurrido durante la inicialización de servicios */
  error: Error | null;
}

type AppBootstrapStatus = "idle" | "initializing" | "ready" | "error";

interface AppBootstrapProps {
  children: ReactNode;
  /** Componente a mostrar durante la carga (splash screen) */
  loadingFallback?: ReactNode;
  /** Componente a mostrar en caso de error. Recibe el error y una función retry */
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
}

const AppBootstrapContext = createContext<AppBootstrapContextType | null>(null);

/**
 * Hook para acceder a los servicios de la aplicación.
 * Debe usarse dentro de un AppBootstrap.
 *
 * @example
 * ```tsx
 * const { services } = useServices();
 * const files = await services.fileService.getFilesInFolder(folderId);
 * ```
 */
export const useServices = (): AppBootstrapContextType => {
  const context = useContext(AppBootstrapContext);
  if (!context) {
    throw new Error("useServices debe usarse dentro de un <AppBootstrap>");
  }
  return context;
};

/**
 * Crea e inicializa todas las instancias de servicios.
 * Los servicios se crean una sola vez y se reutilizan durante toda la vida de la app.
 */
const createServices = (): Services => {
  console.log("AppBootstrap: Creando servicios...");

  const fileService = new FileService();
  const folderService = new FolderService();
  const tagService = new TagService();
  const userColorService = new UserColorService();
  const archiveService = new ArchiveService(fileService, folderService);
  const mediaImportService = new MediaImportService(fileService, tagService);

  console.log("AppBootstrap: Servicios creados");

  return {
    archiveService,
    fileService,
    folderService,
    tagService,
    userColorService,
    mediaImportService,
  };
};

/**
 * Asegura que el directorio raíz de la app exista.
 * Se ejecuta durante el arranque antes de exponer los servicios.
 */
const ensureRootDirectory = (): void => {
  const fs = new FileSystemService();
  const rootUri = fs.resolveUri("root");
  const result = fs.ensureDirectory(rootUri);

  if (result.success) {
    console.log("AppBootstrap: Directorio root asegurado →", rootUri);
  } else {
    throw new Error(`No se pudo crear el directorio root: ${result.error}`);
  }
};

/**
 * Componente de arranque de la aplicación.
 *
 * Orquesta la secuencia de inicialización:
 * 1. Espera a que la base de datos esté lista (DatabaseProvider)
 * 2. Instancia los servicios (FileService, FolderService, TagService)
 * 3. Expone los servicios via contexto a toda la app
 * 4. Muestra loading/error fallbacks según el estado
 *
 * DEBE estar dentro de un DatabaseProvider.
 *
 * @example
 * ```tsx
 * <DatabaseProvider>
 *   <AppBootstrap
 *     loadingFallback={<SplashScreen />}
 *     errorFallback={(error, retry) => <ErrorScreen error={error} onRetry={retry} />}
 *   >
 *     <App />
 *   </AppBootstrap>
 * </DatabaseProvider>
 * ```
 */
export const AppBootstrap: React.FC<AppBootstrapProps> = ({
  children,
  loadingFallback,
  errorFallback,
}) => {
  const { isReady: isDbReady, error: dbError, retry: retryDb } = useDatabase();

  const [status, setStatus] = useState<AppBootstrapStatus>("idle");
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (dbError) {
      setStatus("error");
      setError(dbError);
      return;
    }

    if (!isDbReady) {
      setStatus("initializing");
      return;
    }

    try {
      setStatus("initializing");
      console.log(
        "AppBootstrap: Base de datos lista, inicializando servicios...",
      );

      ensureRootDirectory();

      const appServices = createServices();
      setServices(appServices);
      setStatus("ready");

      console.log("AppBootstrap: Aplicación lista");
    } catch (err) {
      const serviceError =
        err instanceof Error
          ? err
          : new Error("Error desconocido al inicializar servicios");

      console.error(
        "AppBootstrap: Error al inicializar servicios:",
        serviceError,
      );
      setError(serviceError);
      setStatus("error");
    }
  }, [isDbReady, dbError]);

  if (status === "error" && error) {
    if (errorFallback) {
      return <>{errorFallback(error, retryDb)}</>;
    }

    console.error("AppBootstrap: Error fatal sin fallback UI:", error);
    return null;
  }

  if (status !== "ready" || !services) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return null;
  }

  return (
    <AppBootstrapContext.Provider
      value={{ services, isReady: true, error: null }}
    >
      {children}
    </AppBootstrapContext.Provider>
  );
};
