import { UUID } from '../common/base';


//TODO: Revisar y ajustar tipos de navegacion

// Rutas de navegación de la app
export type RouteName = 
  | '/'
  | '/library'
  | '/tags'
  | '/trash';

// Parámetros por ruta
export interface RouteParams {
  '/': undefined;
  '/library': { folderId?: UUID; path?: string };
  '/tags': undefined;
  '/trash': undefined;
  Settings: undefined;
  Profile: undefined;
  Favorites: undefined;
  Trash: undefined;
  Upload: { folderId?: UUID };
}

// Stack de navegación
export interface NavigationState {
  currentRoute: RouteName;
  params?: RouteParams[RouteName];
  history: Array<{
    route: RouteName;
    params?: any;
    timestamp: Date;
  }>;
  canGoBack: boolean;
}

// Breadcrumb para navegación de carpetas
export interface BreadcrumbItem {
  id: UUID;
  name: string;
  path: string;
  isActive: boolean;
}

// Tab de navegación inferior
export interface TabItem {
  name: RouteName;
  label: string;
  icon: string;
  badge?: number;          // Número para mostrar badge
  isActive: boolean;
}