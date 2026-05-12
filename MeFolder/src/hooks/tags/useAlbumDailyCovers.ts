import AsyncStorage from "@react-native-async-storage/async-storage";
import { TagModel } from "@/models/tag";
import { useDatabase, useServices } from "@/providers";
import { useEffect, useMemo, useState } from "react";
import { AlbumDailyCover, useTagsStore } from "@/stores/useTagsStore";

const ALBUM_DAILY_COVERS_STORAGE_KEY = "mefolder:album-daily-covers";
const ALBUM_DAILY_COVERS_STORAGE_VERSION = 3;

type PersistedAlbumDailyCovers = {
  version: number;
  dateKey: string;
  covers: Record<string, AlbumDailyCover>;
};

const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const hasAllAlbumIds = (
  albumIds: string[],
  covers: Record<string, AlbumDailyCover>,
): boolean => albumIds.every((albumId) => albumId in covers);

const readPersistedCovers =
  async (): Promise<PersistedAlbumDailyCovers | null> => {
    try {
      const rawValue = await AsyncStorage.getItem(
        ALBUM_DAILY_COVERS_STORAGE_KEY,
      );
      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue) as PersistedAlbumDailyCovers;
      if (!parsedValue || typeof parsedValue !== "object") {
        return null;
      }

      return {
        version:
          typeof parsedValue.version === "number" ? parsedValue.version : 1,
        dateKey: parsedValue.dateKey,
        covers: parsedValue.covers ?? {},
      };
    } catch (error) {
      console.warn("No se pudieron leer las portadas diarias de álbum", error);
      return null;
    }
  };

const writePersistedCovers = async (
  payload: PersistedAlbumDailyCovers,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      ALBUM_DAILY_COVERS_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch (error) {
    console.warn("No se pudieron guardar las portadas diarias de álbum", error);
  }
};

export const useAlbumDailyCovers = (albums: TagModel[]) => {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const albumDailyCovers = useTagsStore((state) => state.albumDailyCovers);
  const albumDailyCoversDateKey = useTagsStore(
    (state) => state.albumDailyCoversDateKey,
  );
  const setAlbumDailyCovers = useTagsStore(
    (state) => state.setAlbumDailyCovers,
  );
  const [isLoading, setIsLoading] = useState(false);

  const todayKey = useMemo(() => getTodayKey(), []);
  const albumIds = useMemo(() => albums.map((album) => album.id), [albums]);

  useEffect(() => {
    if (!isReady || albums.length === 0) {
      return;
    }

    if (
      albumDailyCoversDateKey === todayKey &&
      hasAllAlbumIds(albumIds, albumDailyCovers)
    ) {
      return;
    }

    let isCancelled = false;

    const hydrateDailyCovers = async () => {
      setIsLoading(true);

      try {
        const persistedValue = await readPersistedCovers();
        const persistedCovers =
          persistedValue?.dateKey === todayKey &&
          persistedValue.version === ALBUM_DAILY_COVERS_STORAGE_VERSION
            ? persistedValue.covers
            : {};

        const missingAlbums = albums.filter(
          (album) => !(album.id in persistedCovers),
        );

        const generatedEntries = await Promise.all(
          missingAlbums.map(async (album) => {
            const candidate = await services.tagService.getRandomAlbumCover(
              album.id,
            );

            return [
              album.id,
              {
                albumId: album.id,
                coverUri: candidate?.coverUri ?? null,
                fileId: candidate?.fileId ?? null,
                dateKey: todayKey,
              } satisfies AlbumDailyCover,
            ] as const;
          }),
        );

        const nextCovers = {
          ...persistedCovers,
          ...Object.fromEntries(generatedEntries),
        };

        if (isCancelled) {
          return;
        }

        setAlbumDailyCovers(nextCovers, todayKey);
        await writePersistedCovers({
          version: ALBUM_DAILY_COVERS_STORAGE_VERSION,
          dateKey: todayKey,
          covers: nextCovers,
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydrateDailyCovers();

    return () => {
      isCancelled = true;
    };
  }, [
    albumDailyCovers,
    albumDailyCoversDateKey,
    albumIds,
    albums,
    isReady,
    services.tagService,
    setAlbumDailyCovers,
    todayKey,
  ]);

  return {
    albumDailyCovers,
    isLoading,
  };
};
