import { Database } from '@/database/sqlite/Database';
import { 
  FileRepository,
  FolderRepository, 
  TagRepository,
  TagAssignmentRepository,
  UserColorRepository
} from '@/database/repositories';

/**
 * Clase base para servicios con configuración común y validaciones
 */
export abstract class BaseService {
  protected fileRepo: FileRepository;
  protected folderRepo: FolderRepository;
  protected tagRepo: TagRepository;
  protected tagAssignmentRepo: TagAssignmentRepository;
  protected userColorRepo: UserColorRepository;
  protected db: Database;

  constructor() {
    this.db = Database.getInstance();
    this.fileRepo = new FileRepository();
    this.folderRepo = new FolderRepository();
    this.tagRepo = new TagRepository();
    this.tagAssignmentRepo = new TagAssignmentRepository();
    this.userColorRepo = new UserColorRepository();
  }

  /** Valida que la base de datos esté inicializada */
  protected ensureDbInitialized(): void {
    if (!this.db.isInitialized()) {
      throw new Error('Base de datos no inicializada. Llama a Database.initialize() primero.');
    }
  }

  /** Manejo de errores común para servicios */
  protected handleError(error: any, operation: string): never {
    // Solo log si no es un error ya procesado (que viene del repository)
    if (!error.message?.startsWith('Error al')) {
      console.error(`Error en ${operation}:`, error);
    }
    
    if (error.message) {
      throw new Error(`${operation}: ${error.message}`);
    }
    
    throw new Error(`Error inesperado en ${operation}`);
  }

  /** Valida permisos básicos para operaciones */
  protected validatePermissions(action: string, resource?: any): void {
    // Por ahora placeholder - se puede expandir con lógica de permisos real
    if (resource?.isProtected && action === 'delete') {
      throw new Error('No se puede eliminar un recurso protegido');
    }
  }
}