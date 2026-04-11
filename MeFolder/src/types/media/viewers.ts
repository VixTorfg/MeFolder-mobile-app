import { UUID } from "../common/base";

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

// ─── Image Viewer ────────────────────────────────────────────

export interface ImageViewerProps {
  /** Fuente de la imagen a mostrar */
  source: MediaSource;
  /** Visible o no */
  visible: boolean;
  /** Callback al cerrar el visor */
  onClose: () => void;
  /** Ancho original de la imagen (optimiza el renderizado inicial) */
  imageWidth?: number;
  /** Alto original de la imagen */
  imageHeight?: number;
}

export interface ImageViewerState extends ViewerBaseState {
  /** Nivel de zoom actual (1 = sin zoom) */
  zoomScale: number;
}

// ─── Video Player ────────────────────────────────────────────

export type VideoPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface VideoPlayerProps {
  /** Fuente del vídeo */
  source: MediaSource;
  /** Visible o no */
  visible: boolean;
  /** Callback al cerrar el reproductor */
  onClose: () => void;
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

// ─── Audio Player ────────────────────────────────────────────

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
  /** Visible o no */
  visible: boolean;
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
