import { createAudioPlayer } from "expo-audio";
import { createVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";
import {
  File as FSFile,
  Directory as FSDirectory,
  Paths,
} from "expo-file-system";
import type {
  MediaOperationResult,
  MediaVideoMetadata,
  MediaAudioMetadata,
  MediaImageMetadata,
} from "@/types/media";

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
  async getVideoMetadata(
    uri: string,
  ): Promise<MediaOperationResult<MediaVideoMetadata>> {
    try {
      const player = createVideoPlayer(uri);

      // Esperar a que el player esté listo o falle
      await this.waitForVideoReady(player);

      if (player.status === "error") {
        player.release();
        return this.failResult(uri, "No se pudo cargar el video");
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
      return this.failResult(uri, error, "obtener metadatos de video");
    }
  }

  /**
   * Extrae metadatos de un archivo de audio (duración).
   *
   * Crea un AudioPlayer temporal, espera a que cargue,
   * lee la duración y luego libera el recurso.
   */
  async getAudioMetadata(
    uri: string,
  ): Promise<MediaOperationResult<MediaAudioMetadata>> {
    try {
      const player = createAudioPlayer(uri);

      // Esperar a que cargue
      await this.waitForAudioReady(player);

      if (!player.isLoaded) {
        player.remove();
        return this.failResult(uri, "No se pudo cargar el audio");
      }

      const duration = player.duration;

      player.remove();
      return {
        success: true,
        uri,
        data: { duration: Math.round(duration) },
      };
    } catch (error) {
      return this.failResult(uri, error, "obtener metadatos de audio");
    }
  }

  /**
   * Extrae metadatos de una imagen (ancho, alto).
   *
   * Usa `Image.getSize` de React Native.
   */
  getImageMetadata(
    uri: string,
  ): Promise<MediaOperationResult<MediaImageMetadata>> {
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

  /** Directorio dedicado para thumbnails */
  private static readonly THUMBNAILS_DIR = ".thumbnails";
  private static readonly THUMBNAIL_SIZE = 300;

  /**
   * Genera un thumbnail para una imagen redimensionándola.
   * @param sourceUri URI de la imagen original
   * @param fileId ID del archivo para nombrar el thumbnail
   * @returns URI del thumbnail generado o null si falla
   */
  async generateImageThumbnail(
    sourceUri: string,
    fileId: string,
  ): Promise<MediaOperationResult<string>> {
    try {
      this.ensureThumbnailsDir();

      const image = ImageManipulator.manipulate(sourceUri);
      const resized = image.resize({ width: MediaService.THUMBNAIL_SIZE });
      const result = await resized.renderAsync();
      const saved = await result.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.7,
      });

      const destUri = this.getThumbnailUri(fileId);
      const destFile = new FSFile(destUri);
      const sourceFile = new FSFile(saved.uri);

      if (destFile.exists) destFile.delete();
      sourceFile.move(destFile);

      return { success: true, uri: destUri, data: destUri };
    } catch (error) {
      return this.failResult(sourceUri, error, "generar thumbnail de imagen");
    }
  }

  /**
   * Genera un thumbnail extrayendo un frame de un video.
   * @param sourceUri URI del video original
   * @param fileId ID del archivo para nombrar el thumbnail
   * @param timeMs Posición del frame en ms (default: 1000)
   * @returns URI del thumbnail generado o null si falla
   */
  async generateVideoThumbnail(
    sourceUri: string,
    fileId: string,
    timeMs: number = 1000,
  ): Promise<MediaOperationResult<string>> {
    try {
      this.ensureThumbnailsDir();

      const { uri: frameUri } = await VideoThumbnails.getThumbnailAsync(
        sourceUri,
        {
          time: timeMs,
        },
      );

      // Redimensionar el frame extraído
      const image = ImageManipulator.manipulate(frameUri);
      const resized = image.resize({ width: MediaService.THUMBNAIL_SIZE });
      const result = await resized.renderAsync();
      const saved = await result.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.7,
      });

      const destUri = this.getThumbnailUri(fileId);
      const destFile = new FSFile(destUri);
      const sourceFile = new FSFile(saved.uri);

      if (destFile.exists) destFile.delete();
      sourceFile.move(destFile);

      return { success: true, uri: destUri, data: destUri };
    } catch (error) {
      return this.failResult(sourceUri, error, "generar thumbnail de video");
    }
  }

  /**
   * Genera un thumbnail según la categoría del archivo.
   * Solo soporta 'image' y 'video'.
   */
  async generateThumbnail(
    sourceUri: string,
    fileId: string,
    category: "image" | "video",
  ): Promise<string | null> {
    const result =
      category === "image"
        ? await this.generateImageThumbnail(sourceUri, fileId)
        : await this.generateVideoThumbnail(sourceUri, fileId);

    return result.success && result.data ? result.data : null;
  }

  /**
   * Obtiene la URI de un thumbnail dado un fileId.
   */
  getThumbnailUri(fileId: string): string {
    const thumbDir = `${Paths.document.uri}/${MediaService.THUMBNAILS_DIR}`;
    return `${thumbDir}/${fileId}.jpg`;
  }

  /**
   * Asegura que el directorio de thumbnails exista.
   */
  private ensureThumbnailsDir(): void {
    const dir = new FSDirectory(
      `${Paths.document.uri}/${MediaService.THUMBNAILS_DIR}`,
    );
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
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
    if (player.status === "readyToPlay" || player.status === "error") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        subscription.remove();
        resolve();
      }, MediaService.LOAD_TIMEOUT_MS);

      const subscription = player.addListener("statusChange", ({ status }) => {
        if (status === "readyToPlay" || status === "error") {
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

      const subscription = player.addListener(
        "playbackStatusUpdate",
        (status) => {
          if (status.isLoaded) {
            clearTimeout(timeout);
            subscription.remove();
            resolve();
          }
        },
      );
    });
  }

  /** Crea un resultado de error estandarizado */
  private failResult<T = void>(
    uri: string,
    error: unknown,
    operation?: string,
  ): MediaOperationResult<T> {
    const message =
      typeof error === "string"
        ? error
        : error instanceof Error
          ? `Error al ${operation}: ${error.message}`
          : `Error desconocido al ${operation}`;

    return { success: false, uri, error: message };
  }
}
