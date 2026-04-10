import { Ionicons } from "@expo/vector-icons";
import { UUID } from "../common/base";
import { ColorInfo } from "../common/colors";
import { FileModel } from "@/models/file";
import { FolderModel } from "@/models/folder";
import { ViewOptions } from "../entities/folder";

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export const OptionsIds = {
  SELECT_ALL: "select_all",
  NO_SELECT: "no_select",
  INVERT_SELECT: "invert_select",
  PROPERTIES: "properties",
  SETTINGS: "settings",
} as const;

export const PRIORITY_CONFIG = {
  critical: { label: "Crítica", bg: "#EB575720", color: "#EB5757" },
  high: { label: "Alta", bg: "#F2994A20", color: "#F2994A" },
  normal: { label: "Normal", bg: "#5DA9C720", color: "#5DA9C7" },
  low: { label: "Baja", bg: "#9A9A9020", color: "#9A9A90" },
};

export type OptionsIds = (typeof OptionsIds)[keyof typeof OptionsIds];

export interface OptionsType {
  id: OptionsIds;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface CommunCardProps {
  onPress: () => Promise<void> | void;
  onDoublePress?: () => Promise<void> | void;
  onLongPress?: () => Promise<void> | void;
  onRename?: (newName: string) => void;
  onRenameCancel?: () => void;
  viewOptions?: ViewOptions;
  isRenaming?: boolean;
  disabled?: boolean;
  data: FileModel | FolderModel;
  showCard?: boolean;
  selected?: boolean;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: any;
}

export interface SelectionConfig {
  enabled: boolean;
  selectedIds: Set<UUID>;
  selectAll: boolean;
  maxSelection?: number;
}

export interface ModalConfig {
  isVisible: boolean;
  type: "confirm" | "alert" | "input" | "custom";
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  data?: any;
}

export interface ToastConfig {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number; // ms, undefined = no auto-dismiss
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface UIThemeConfig {
  colorScheme: "light" | "dark" | "auto";
  accentColor: ColorInfo;
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable" | "spacious";
}

export interface SyncState {
  isOnline: boolean;
  isSync: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
  errors: string[];
}
