import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const TUTORIAL_SEEN_KEY = "mefolder:tutorial-seen";

interface UseTutorialOptions {
  /** Si es true, abre el tutorial automáticamente la primera vez (no visto aún). */
  autoShowIfUnseen?: boolean;
}

export const useTutorial = ({
  autoShowIfUnseen = false,
}: UseTutorialOptions = {}) => {
  const [visible, setVisible] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!autoShowIfUnseen || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    let isCancelled = false;
    void (async () => {
      try {
        const seen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
        if (!isCancelled && seen == null) setVisible(true);
      } catch {}
    })();

    return () => {
      isCancelled = true;
    };
  }, [autoShowIfUnseen]);

  const open = useCallback(() => setVisible(true), []);

  const close = useCallback(() => {
    setVisible(false);
    void AsyncStorage.setItem(TUTORIAL_SEEN_KEY, "1").catch(() => {});
  }, []);

  const reset = useCallback(
    () => AsyncStorage.removeItem(TUTORIAL_SEEN_KEY),
    [],
  );

  return { visible, open, close, reset };
};
