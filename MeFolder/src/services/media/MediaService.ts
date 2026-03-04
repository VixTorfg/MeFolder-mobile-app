import { createAudioPlayer } from 'expo-audio';
import { createVideoPlayer } from 'expo-video';
import { Image } from 'react-native';
import type {
  MediaOperationResult,
  MediaVideoMetadata,
  MediaAudioMetadata,
  MediaImageMetadata,
} from '@/types/media';

/**
 * MediaService — Servicio para obtener metadatos de archivos multimedia.
 *
 * Encapsula expo-audio, expo-video y React Native Image para extraer
 * metadatos de video, audio e imagen de forma uniforme.
 *
 * Proporciona:
 * - Extracción de metadatos (duración, resolución) para video, audio e imagen
 * - API consistente con resultados tipados (MediaOperationResult)
 * - Manejo de errores unificado (nunca lanza, siempre retorna { success, error })
 *
 * Preparado para ampliar en el futuro con:
 * - Reproducción de video/audio
 * - Control de playback (play, pause, seek, volume)
 * - Generación de thumbnails
 */
export class MediaService {
  /**
   * Extrae metadatos de un archivo de video (duración, resolución).
   *
   * Crea un VideoPlayer temporal, espera a que esté listo, lee duración
   * y dimensiones del track de video, y luego libera el recurso.
   */
  async getVideoMetadata(uri: string): Promise<MediaOperationResult<MediaVideoMetadata>> {
    try {
      const player = createVideoPlayer(uri);

      // Esperar a que el player esté listo o falle
      await this.waitForVideoReady(player);

      if (player.status === 'error') {
        player.release();
        return this.failResult(uri, 'No se pudo cargar el video');
      }

      const duration = player.duration;
      const track = player.videoTrack;

      const data: MediaVideoMetadata = {
        duration: Math.round(duration),
        width: track?.size.width ?? 0,
        height: track?.size.height ?? 0,
      };

      player.release();
      return { success: true, uri, data };
    } catch (error) {
      return this.failResult(uri, error, 'obtener metadatos de video');
    }
  }

  /**
   * Extrae metadatos de un archivo de audio (duración).
   *
   * Crea un AudioPlayer temporal, espera a que cargue,
   * lee la duración y luego libera el recurso.
   */
  async getAudioMetadata(uri: string): Promise<MediaOperationResult<MediaAudioMetadata>> {
    try {
      const player = createAudioPlayer(uri);

      // Esperar a que cargue
      await this.waitForAudioReady(player);

      if (!player.isLoaded) {
        player.remove();
        return this.failResult(uri, 'No se pudo cargar el audio');
      }

      const duration = player.duration;

      player.remove();
      return {
        success: true,
        uri,
        data: { duration: Math.round(duration) },
      };
    } catch (error) {
      return this.failResult(uri, error, 'obtener metadatos de audio');
    }
  }

  /**
   * Extrae metadatos de una imagen (ancho, alto).
   *
   * Usa `Image.getSize` de React Native.
   */
  getImageMetadata(uri: string): Promise<MediaOperationResult<MediaImageMetadata>> {
    return new Promise((resolve) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({
            success: true,
            uri,
            data: { width, height },
          });
        },
        (error) => {
          resolve({
            success: false,
            uri,
            error: `Error al obtener metadatos de imagen: ${error}`,
          });
        },
      );
    });
  }

  /** Timeout máximo para esperar la carga de un recurso (ms) */
  private static readonly LOAD_TIMEOUT_MS = 10_000;

  /**
   * Espera a que un VideoPlayer alcance el estado `readyToPlay` o `error`.
   * Resuelve cuando el status cambia o se alcanza el timeout.
   */
  private waitForVideoReady(
    player: ReturnType<typeof createVideoPlayer>,
  ): Promise<void> {
    // Si ya está listo, resolver inmediatamente
    if (player.status === 'readyToPlay' || player.status === 'error') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        subscription.remove();
        resolve();
      }, MediaService.LOAD_TIMEOUT_MS);

      const subscription = player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay' || status === 'error') {
          clearTimeout(timeout);
          subscription.remove();
          resolve();
        }
      });
    });
  }

  /**
   * Espera a que un AudioPlayer esté cargado.
   * Resuelve cuando isLoaded sea true o se alcance el timeout.
   */
  private waitForAudioReady(
    player: ReturnType<typeof createAudioPlayer>,
  ): Promise<void> {
    if (player.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        subscription.remove();
        resolve();
      }, MediaService.LOAD_TIMEOUT_MS);

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded) {
          clearTimeout(timeout);
          subscription.remove();
          resolve();
        }
      });
    });
  }

  /** Crea un resultado de error estandarizado */
  private failResult<T = void>(
    uri: string,
    error: unknown,
    operation?: string,
  ): MediaOperationResult<T> {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? `Error al ${operation}: ${error.message}`
          : `Error desconocido al ${operation}`;

    return { success: false, uri, error: message };
  }
}
