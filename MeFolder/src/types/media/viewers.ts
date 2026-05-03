import { UUID } from "../common/base";
import type { FileCategory } from "../common/file-extensions";
import type { SharedValue } from "react-native-reanimated";

/** Estado base compartido por todos los reproductores */
export interface ViewerBaseState {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Fuente de un medio: puede venir de un archivo del sistema o de una URI directa */
export interface MediaSource {
  /** URI local o remota del archivo */
  uri: string;
  /** ID del archivo en la base de datos (si existe) */
  fileId?: UUID;
  /** Tipo MIME del archivo */
  mimeType?: string;
  /** Nombre para mostrar */
  displayName?: string;
}

export type MediaHostCategory = Extract<
  FileCategory,
  "image" | "video" | "audio"
>;

export interface MediaHostItem extends MediaSource {
  /** Categoría del archivo usada para resolver el viewer apropiado */
  category: MediaHostCategory;
  /** Miniatura ligera para previews inactivos, especialmente útil en video */
  thumbnailUrl?: string;
  /** Ancho intrínseco del media cuando se conoce */
  mediaWidth?: number;
  /** Alto intrínseco del media cuando se conoce */
  mediaHeight?: number;
}

export interface CarouselGestureProps {
  /** Notifica al host si el carrusel horizontal debe estar habilitado */
  onSwipeAvailabilityChange?: (enabled: boolean) => void;
  /** SharedValue del carrusel: true mientras el usuario arrastra entre items */
  isDragging?: SharedValue<boolean>;
}

export interface MediaHostProps {
  /** Lista de medios activa; cuando es null o está vacía no se renderiza ningún viewer */
  items: MediaHostItem[] | null;
  /** ID del archivo que debe abrirse primero dentro del carrusel */
  initialFileId?: UUID;
  /** Callback al cerrar el viewer activo */
  onClose: () => void;
  /** Iniciar reproducción automáticamente cuando aplique */
  autoPlay?: boolean;
  /** Ancho original de la imagen */
  imageWidth?: number;
  /** Alto original de la imagen */
  imageHeight?: number;
}

export interface ImageViewerProps extends CarouselGestureProps {
  /** Fuente de la imagen a mostrar */
  source: MediaSource;
  /** Callback al cerrar el visor */
  onClose: () => void;
  /** Notifica cuando el viewer ya puede reemplazar el preview superpuesto */
  onInitialRenderSettled?: () => void;
  /** Ancho original de la imagen (optimiza el renderizado inicial) */
  imageWidth?: number;
  /** Alto original de la imagen */
  imageHeight?: number;
}

export interface ImageViewerState extends ViewerBaseState {
  /** Nivel de zoom actual (1 = sin zoom) */
  zoomScale: number;
}

export type VideoPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface VideoPlayerProps extends CarouselGestureProps {
  /** Fuente del vídeo */
  source: MediaSource;
  /** Callback al cerrar el reproductor */
  onClose: () => void;
  /** Notifica cuando el viewer ya puede reemplazar el preview superpuesto */
  onInitialRenderSettled?: () => void;
  /** Iniciar reproducción automáticamente */
  autoPlay?: boolean;
}

export interface VideoPlayerState extends ViewerBaseState {
  status: VideoPlaybackStatus;
  /** Posición actual en milisegundos */
  positionMs: number;
  /** Duración total en milisegundos */
  durationMs: number;
  /** Volumen (0‒1) */
  volume: number;
  /** Silenciado */
  isMuted: boolean;
}

export type AudioPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface AudioPlayerProps {
  /** Fuente del audio */
  source: MediaSource;
  /** Callback al cerrar el reproductor */
  onClose: () => void;
  /** Iniciar reproducción automáticamente */
  autoPlay?: boolean;
}

export interface AudioPlayerState extends ViewerBaseState {
  status: AudioPlaybackStatus;
  /** Posición actual en milisegundos */
  positionMs: number;
  /** Duración total en milisegundos */
  durationMs: number;
  /** Volumen (0‒1) */
  volume: number;
  /** Silenciado */
  isMuted: boolean;
}
