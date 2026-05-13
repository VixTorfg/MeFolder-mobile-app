import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formatted: string;
}

export const useTimer = (): UseTimerReturn => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setSeconds(0);
    setIsRunning(true);
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [isPaused]);

  const reset = useCallback(() => {
    clearTimer();
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(mins).padStart(mins > 9 ? 2 : 1, "0")}:${String(secs).padStart(2, "0")}`;

  return {
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formatted,
  };
};
