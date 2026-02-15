import { Ionicons }  from '@expo/vector-icons';
import { UUID } from '../common/base';
import { ColorInfo } from '../common/colors';
import { FileModel } from '@/models/file';
import { FolderModel } from '@/models/folder';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;      
  progress?: number;      
}

export interface FloatingTabBarProps {
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  borderRadius?: number;
  borderColor?: string;
}

export interface MultiActionButtonProps {
  onPress: () => Promise<void> | void;
  icon?: keyof typeof Ionicons.glyphMap; 
  backgroundColor?: ColorInfo;            
  label?: string;          
  disabled?: boolean;  
  borderRadius?: number;
  size?: number;
  iconColor?: string;       
}

export interface ViewDropDownProps {
  disabled?: boolean;
  size?: number;
  onChange?: (selectedMode: { id: string; name: string; icon: keyof typeof Ionicons.glyphMap }) => void;
  defaultValue?: string;
}

export interface ContentCardProps {
  onPress: () => Promise<void> | void;
  disabled?: boolean;
  data: FileModel | FolderModel;
  showCard?: boolean;
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