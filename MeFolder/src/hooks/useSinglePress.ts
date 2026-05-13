import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LOCK_MS = 900;

export const useSinglePress = (lockMs: number = DEFAULT_LOCK_MS) => {
  const [isLocked, setIsLocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLockTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const release = useCallback(() => {
    clearLockTimeout();
    setIsLocked(false);
  }, [clearLockTimeout]);

  const lock = useCallback(() => {
    setIsLocked(true);
    clearLockTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsLocked(false);
      timeoutRef.current = null;
    }, lockMs);
  }, [clearLockTimeout, lockMs]);

  const run = useCallback(
    async (action: () => void | Promise<void>) => {
      if (isLocked) {
        return;
      }

      lock();
      await action();
    },
    [isLocked, lock],
  );

  useEffect(() => clearLockTimeout, [clearLockTimeout]);

  return {
    isLocked,
    run,
    release,
  };
};
