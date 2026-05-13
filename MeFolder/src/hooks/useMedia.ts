import { useCallback, useRef, useState } from "react";
import { MediaService } from "@/services";
import type {
  MediaVideoMetadata,
  MediaAudioMetadata,
  MediaImageMetadata,
} from "@/types/media";

interface UseMediaReturn {
  /** True mientras se extraen metadatos */
  loading: boolean;
  /** Error de la última operación (null si fue exitosa) */
  error: string | null;
  /** Limpia el error actual */
  clearError: () => void;

  /** Extrae metadatos de un video (duración, resolución) */
  getVideoMetadata: (uri: string) => Promise<MediaVideoMetadata | null>;
  /** Extrae metadatos de un audio (duración) */
  getAudioMetadata: (uri: string) => Promise<MediaAudioMetadata | null>;
  /** Extrae metadatos de una imagen (ancho, alto) */
  getImageMetadata: (uri: string) => Promise<MediaImageMetadata | null>;
}

/**
 * Hook que expone las operaciones de MediaService con manejo de estado.
 */
export function useMedia(): UseMediaReturn {
  const serviceRef = useRef(new MediaService());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getVideoMetadata = useCallback(
    async (uri: string): Promise<MediaVideoMetadata | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await serviceRef.current.getVideoMetadata(uri);
        if (!result.success) {
          setError(result.error ?? "Error al obtener metadatos de video");
          return null;
        }
        return result.data ?? null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getAudioMetadata = useCallback(
    async (uri: string): Promise<MediaAudioMetadata | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await serviceRef.current.getAudioMetadata(uri);
        if (!result.success) {
          setError(result.error ?? "Error al obtener metadatos de audio");
          return null;
        }
        return result.data ?? null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getImageMetadata = useCallback(
    async (uri: string): Promise<MediaImageMetadata | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await serviceRef.current.getImageMetadata(uri);
        if (!result.success) {
          setError(result.error ?? "Error al obtener metadatos de imagen");
          return null;
        }
        return result.data ?? null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    clearError,
    getVideoMetadata,
    getAudioMetadata,
    getImageMetadata,
  };
}
