import { useEffect, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";

const thumbnailCache = new Map<string, string | null>();

interface ThumbnailState {
  assetId: string;
  uri: string | null;
}

export function useMediaLibraryVideoThumbnail(
  asset: MediaLibrary.Asset,
): string | null {
  const cachedThumbnail = thumbnailCache.get(asset.id);
  const [state, setState] = useState<ThumbnailState>({
    assetId: asset.id,
    uri: cachedThumbnail ?? null,
  });

  const thumbnailUri =
    state.assetId === asset.id ? state.uri : (cachedThumbnail ?? null);

  useEffect(() => {
    if (asset.mediaType !== MediaLibrary.MediaType.video) {
      setState({ assetId: asset.id, uri: null });
      return;
    }

    if (cachedThumbnail !== undefined) {
      setState({ assetId: asset.id, uri: cachedThumbnail });
      return;
    }

    setState({ assetId: asset.id, uri: null });

    let isActive = true;

    const loadThumbnail = async () => {
      try {
        const result = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 1000,
        });

        if (!isActive) {
          return;
        }

        thumbnailCache.set(asset.id, result.uri);
        setState({ assetId: asset.id, uri: result.uri });
      } catch {
        if (!isActive) {
          return;
        }

        thumbnailCache.set(asset.id, null);
        setState({ assetId: asset.id, uri: null });
      }
    };

    void loadThumbnail();

    return () => {
      isActive = false;
    };
  }, [asset.id, asset.mediaType, asset.uri, cachedThumbnail]);

  return thumbnailUri;
}
