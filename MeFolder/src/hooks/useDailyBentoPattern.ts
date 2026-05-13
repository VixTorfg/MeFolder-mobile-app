import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BentoLayoutConfig,
  BentoPattern,
  getHomeBentoLayoutConfig,
} from "@/constants/homeBentoPatterns";
import { useEffect, useMemo, useState } from "react";

const DAILY_BENTO_PATTERN_STORAGE_KEY = "mefolder:daily-bento-pattern";
const DAILY_BENTO_PATTERN_STORAGE_VERSION = 1;

type PersistedDailyBentoPattern = {
  version: number;
  dateKey: string;
  mobilePatternId?: string | null;
  tabletPatternId?: string | null;
};

const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const readPersistedPattern =
  async (): Promise<PersistedDailyBentoPattern | null> => {
    try {
      const rawValue = await AsyncStorage.getItem(
        DAILY_BENTO_PATTERN_STORAGE_KEY,
      );
      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue) as PersistedDailyBentoPattern;
      if (!parsedValue || typeof parsedValue !== "object") {
        return null;
      }

      return {
        version:
          typeof parsedValue.version === "number" ? parsedValue.version : 1,
        dateKey: parsedValue.dateKey,
        mobilePatternId: parsedValue.mobilePatternId ?? null,
        tabletPatternId: parsedValue.tabletPatternId ?? null,
      };
    } catch (error) {
      console.warn("No se pudo leer el patrón diario del bento", error);
      return null;
    }
  };

const writePersistedPattern = async (
  payload: PersistedDailyBentoPattern,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      DAILY_BENTO_PATTERN_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch (error) {
    console.warn("No se pudo guardar el patrón diario del bento", error);
  }
};

const pickRandomPatternId = (patterns: BentoPattern[]): string => {
  const firstPattern = patterns[0];

  if (!firstPattern) {
    throw new Error("No hay patrones de bento configurados");
  }

  const randomIndex = Math.floor(Math.random() * patterns.length);
  return patterns[randomIndex]?.id ?? firstPattern.id;
};

const resolvePattern = (
  config: BentoLayoutConfig,
  patternId: string | null,
): BentoPattern => {
  const firstPattern = config.patterns[0];
  if (!firstPattern) {
    throw new Error("No hay patrones de bento configurados");
  }

  return (
    config.patterns.find((pattern) => pattern.id === patternId) ?? firstPattern
  );
};

export const useDailyBentoPattern = (isTablet: boolean) => {
  const config = useMemo(() => getHomeBentoLayoutConfig(isTablet), [isTablet]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    config.patterns[0]?.id ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const todayKey = useMemo(() => getTodayKey(), []);
  const deviceKey = isTablet ? "tabletPatternId" : "mobilePatternId";

  useEffect(() => {
    let isCancelled = false;

    const hydratePattern = async () => {
      setIsLoading(true);

      try {
        const persistedValue = await readPersistedPattern();
        const hasValidDay =
          persistedValue?.version === DAILY_BENTO_PATTERN_STORAGE_VERSION &&
          persistedValue.dateKey === todayKey;

        const persistedPatternId = hasValidDay
          ? (persistedValue?.[deviceKey] ?? null)
          : null;
        const nextPatternId =
          persistedPatternId &&
          config.patterns.some((pattern) => pattern.id === persistedPatternId)
            ? persistedPatternId
            : pickRandomPatternId(config.patterns);

        if (isCancelled) {
          return;
        }

        setSelectedPatternId(nextPatternId);
        await writePersistedPattern({
          version: DAILY_BENTO_PATTERN_STORAGE_VERSION,
          dateKey: todayKey,
          mobilePatternId:
            deviceKey === "mobilePatternId"
              ? nextPatternId
              : (persistedValue?.mobilePatternId ?? null),
          tabletPatternId:
            deviceKey === "tabletPatternId"
              ? nextPatternId
              : (persistedValue?.tabletPatternId ?? null),
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydratePattern();

    return () => {
      isCancelled = true;
    };
  }, [config.patterns, deviceKey, todayKey]);

  const selectedPattern = useMemo(
    () => resolvePattern(config, selectedPatternId),
    [config, selectedPatternId],
  );

  return {
    config,
    pattern: selectedPattern,
    isLoading,
  };
};
