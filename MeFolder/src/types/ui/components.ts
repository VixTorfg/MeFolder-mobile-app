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
  backgroundColor?: ColorInfo | string;            
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

export const OptionsIds = {
  SELECT_ALL: 'select_all',
  NO_SELECT: 'no_select',
  INVERT_SELECT: 'invert_select',
  PROPERTIES: 'properties',
  SETTINGS: 'settings',
} as const;

export type OptionsIds = (typeof OptionsIds)[keyof typeof OptionsIds];

export interface OptionsType {
  id: OptionsIds;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface OptionDropDownProps {
  disabled?: boolean;
  size?: number;
  onSelect?: (options: OptionsType) => void;
}

export interface SearchResultItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export type SearchHandler = (query: string) => Promise<SearchResultItem[]>;

export interface SearchBoxProps {
  placeholder?: string;
  onSearch?: SearchHandler;
  onClear?: () => void;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  iconSize?: number;
}


export interface CommunCardProps {
  onPress: () => Promise<void> | void;
  onLongPress?: () => Promise<void> | void;
  disabled?: boolean;
  data: FileModel | FolderModel;
  showCard?: boolean;
  selected?: boolean;
}

export interface ViewCardsProps extends CommunCardProps {
  viewConfig?: modeView; //Futuro ViewConfig;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: any;
}

export type modeView = 'list' | 'grid' | 'big_icon' | 'medium_icon' | 'small_icon' | 'content';

export interface ViewConfig {
  mode: modeView;
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