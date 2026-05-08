import {
  Folder,
  CreateFolderInput,
  FolderStatus,
  FolderType,
  FolderVisibility,
  FolderViewSettings,
} from "../types/entities/folder";
import { UUID } from "../types/common/base";
import { ColorInfo } from "../types/common/colors";
import { BaseModel, ValidationResult, ValidationUtils } from "./base";
import {
  ROOT_FOLDER_ID,
  ROOT_FOLDER_PATH,
} from "../database/seeds/systemFolders";
import { SYSTEM_COLORS } from "@/constants/themes/colors";

export class FolderModel extends BaseModel<Folder> {
  constructor(data: Folder) {
    super(data);
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get parentId(): UUID | undefined {
    return this.data.parentId;
  }

  get path(): string {
    return this.data.path;
  }

  get level(): number {
    return this.data.level;
  }

  get status(): FolderStatus {
    return this.data.status;
  }

  get type(): FolderType {
    return this.data.type;
  }

  get visibility(): FolderVisibility {
    return this.data.visibility;
  }

  get color(): ColorInfo | undefined {
    return this.data.color;
  }

  get icon(): string | undefined {
    return this.data.icon;
  }

  get viewSettings(): FolderViewSettings {
    return { ...this.data.viewSettings };
  }

  get isFavorite(): boolean {
    return this.data.isFavorite;
  }

  get isProtected(): boolean {
    return this.data.isProtected;
  }

  get isSystemFolder(): boolean {
    return this.data.isSystemFolder;
  }

  /** Establece nuevo nombre de carpeta (no afecta al path interno basado en IDs) */
  setName(name: string): void {
    if (this.isSystemFolder) {
      throw new Error("No se puede renombrar una carpeta del sistema");
    }
    const cleanName = name.trim();
    if (!cleanName) throw new Error("El nombre no puede estar vacío");

    this.data.name = cleanName;
    this.data.updatedAt = new Date();
  }

  /** Establece descripción de la carpeta */
  setDescription(description: string | undefined): void {
    if (description) {
      this.data.description = description.trim();
    } else {
      delete this.data.description;
    }
    this.data.updatedAt = new Date();
  }

  /** Establece carpeta padre, recalculando path (basado en IDs) y level */
  setParent(
    parentId: UUID | undefined,
    parentPath?: string,
    parentLevel?: number,
  ): void {
    if (parentId === this.data.id) {
      throw new Error("Una carpeta no puede ser su propia carpeta padre");
    }

    if (parentId) {
      this.data.parentId = parentId;
      this.data.level = (parentLevel ?? 0) + 1;
      this.data.path = parentPath
        ? `${parentPath}/${this.data.id}`
        : `${parentId}/${this.data.id}`;
    } else {
      delete this.data.parentId;
      this.data.level = 0;
      this.data.path = this.data.id;
    }
    this.data.updatedAt = new Date();
  }

  /** Cambia estado de la carpeta */
  setStatus(status: FolderStatus): void {
    if (this.data.isProtected && status === "deleted") {
      throw new Error("No se puede eliminar una carpeta protegida");
    }

    this.data.status = status;
    this.data.updatedAt = new Date();

    if (status === "archived") {
      this.data.archivedAt = new Date();
    }
  }

  /** Establece visibilidad de la carpeta */
  setVisibility(visibility: FolderVisibility): void {
    this.data.visibility = visibility;
    this.data.updatedAt = new Date();
  }

  /** Establece color personalizado */
  setColor(color: ColorInfo | undefined): void {
    if (color) {
      this.data.color = color;
    } else {
      delete this.data.color;
    }
    this.data.updatedAt = new Date();
  }

  /** Establece icono personalizado */
  setIcon(icon: string | undefined): void {
    if (icon) {
      this.data.icon = icon.trim();
    } else {
      delete this.data.icon;
    }
    this.data.updatedAt = new Date();
  }

  toggleFavorite(): void {
    this.data.isFavorite = !this.data.isFavorite;
    this.data.updatedAt = new Date();
  }

  updateViewSettings(settings: Partial<FolderViewSettings>): void {
    this.data.viewSettings = {
      ...this.data.viewSettings,
      ...settings,
    };
    this.data.updatedAt = new Date();
  }

  markAsAccessed(): void {
    this.data.lastAccessedAt = new Date();
  }

  protect(): void {
    this.data.isProtected = true;
    this.data.updatedAt = new Date();
  }

  unprotect(): void {
    if (this.data.isSystemFolder) {
      throw new Error("No se puede desproteger una carpeta del sistema");
    }
    this.data.isProtected = false;
    this.data.updatedAt = new Date();
  }

  /** Valida datos de la carpeta */
  validate(): ValidationResult {
    const errors = [];

    const nameError = ValidationUtils.required(this.data.name, "name");
    if (nameError) errors.push(nameError);

    const nameLengthError = ValidationUtils.minLength(
      this.data.name,
      1,
      "name",
    );
    if (nameLengthError) errors.push(nameLengthError);

    const nameMaxLengthError = ValidationUtils.maxLength(
      this.data.name,
      100,
      "name",
    );
    if (nameMaxLengthError) errors.push(nameMaxLengthError);

    if (this.data.description) {
      const descMaxLengthError = ValidationUtils.maxLength(
        this.data.description,
        500,
        "description",
      );
      if (descMaxLengthError) errors.push(descMaxLengthError);
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (this.data.name && invalidChars.test(this.data.name)) {
      errors.push({
        field: "name",
        message: "El nombre contiene caracteres no válidos",
        code: "INVALID_CHARACTERS",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /** Crea copia del modelo */
  clone(): FolderModel {
    return new FolderModel({ ...this.data });
  }

  /** Verifica si es carpeta raíz */
  isRoot(): boolean {
    return this.data.id === ROOT_FOLDER_ID;
  }

  /** Verifica si es carpeta del sistema */
  isSystemType(): boolean {
    return this.data.type === "system";
  }

  /** Verifica si está compartida */
  isShared(): boolean {
    return this.data.type === "shared" || this.data.visibility !== "private";
  }

  /** Verifica si puede eliminarse */
  canBeDeleted(): boolean {
    return (
      !this.data.isProtected &&
      !this.data.isSystemFolder &&
      this.data.status !== "deleted"
    );
  }

  /** Verifica si puede renombrarse */
  canBeRenamed(): boolean {
    return !this.data.isSystemFolder;
  }

  /** Verifica si puede moverse */
  canBeMoved(): boolean {
    return !this.data.isSystemFolder && !this.data.isProtected;
  }

  /** Obtiene nivel de profundidad */
  getDepthLevel(): number {
    return this.data.path.split("/").length - 1;
  }
}

export class FolderFactory {
  /**
   * Crea nueva carpeta con configuración por defecto.
   * @param input - Datos de entrada para la carpeta
   * @param parentInfo - Info del padre para calcular path (IDs) y level. Si no se provee, se crea como raíz.
   */
  static create(
    input: CreateFolderInput,
    parentInfo?: { path: string; level: number },
  ): FolderModel {
    const now = new Date();
    const id = this.generateId();

    const folder: Folder = {
      id,
      name: input.name.trim(),
      path: parentInfo ? `${parentInfo.path}/${id}` : id,
      level: parentInfo ? parentInfo.level + 1 : 0,
      status: "active",
      type: input.type || "regular",
      visibility: input.visibility || "private",
      viewSettings: {
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "list",
        options: {
          showHiddenFiles: false,
          showExtension: true,
        },
        ...input.viewSettings,
      },
      isFavorite: false,
      isProtected: false,
      isSystemFolder: input.type === "system",
      createdAt: now,
      updatedAt: now,
      icon: input.icon ?? "folder",
      color: input.color ?? SYSTEM_COLORS.yellow,

      ...(input.parentId && { parentId: input.parentId }),
      ...(input.description?.trim() && {
        description: input.description.trim(),
      }),
    };

    return new FolderModel(folder);
  }

  /** Crea carpeta raíz del sistema */
  static createRoot(): FolderModel {
    const now = new Date();
    const folder: Folder = {
      id: ROOT_FOLDER_ID,
      name: "Inicio",
      path: ROOT_FOLDER_PATH,
      level: 0,
      status: "active",
      type: "system",
      visibility: "private",
      viewSettings: {
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "list",
        options: {
          showHiddenFiles: false,
          showExtension: true,
        },
      },
      isFavorite: false,
      isProtected: true,
      isSystemFolder: true,
      createdAt: now,
      updatedAt: now,
    };
    return new FolderModel(folder);
  }

  /** Crea carpeta del sistema protegida */
  static createSystemFolder(name: string, icon?: string): FolderModel {
    const folder = this.create({
      name,
      type: "system",
      icon: icon ?? "folder",
    });

    folder.protect();

    return folder;
  }

  /** Crea modelo desde datos JSON */
  static fromJSON(data: Folder): FolderModel {
    return new FolderModel(data);
  }

  /** Genera ID único para carpeta */
  private static generateId(): UUID {
    return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
