import { UUID } from '../common/base';
import { ColorInfo } from '../common/colors';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;      
  progress?: number;      
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: any;
}

export interface ViewConfig {
  mode: 'list' | 'grid' | 'details';
  itemsPerRow?: number;    
  showThumbnails: boolean;
  showFileSize: boolean;
  showLastModified: boolean;
  showTags: boolean;
}

export interface SelectionConfig {
  enabled: boolean;
  selectedIds: Set<UUID>;
  selectAll: boolean;
  maxSelection?: number;  
}

export interface ModalConfig {
  isVisible: boolean;
  type: 'confirm' | 'alert' | 'input' | 'custom';
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
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;       // ms, undefined = no auto-dismiss
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface UIThemeConfig {
  colorScheme: 'light' | 'dark' | 'auto';
  accentColor: ColorInfo;
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface SyncState {
  isOnline: boolean;
  isSync: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
  errors: string[];
}