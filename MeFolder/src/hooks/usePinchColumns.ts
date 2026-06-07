import { useCallback, useEffect, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const PINCH_THRESHOLD = 0.15;

interface UsePinchColumnsConfig {
  initialColumns: number;
  minColumns?: number;
  maxColumns?: number;
  onColumnsChange?: (columns: number) => void;
}

export const usePinchColumns = ({
  initialColumns,
  minColumns = 2,
  maxColumns = 6,
  onColumnsChange,
}: UsePinchColumnsConfig) => {
  const [columns, setColumns] = useState(initialColumns);

  const currentColumns = useSharedValue(initialColumns);
  const hasTriggered = useSharedValue(false);

  useEffect(() => {
    setColumns(initialColumns);
    currentColumns.value = initialColumns;
  }, [initialColumns]);

  const commitColumns = useCallback(
    (newCols: number) => {
      const safe = Math.min(maxColumns, Math.max(minColumns, newCols));
      setColumns(safe);
      onColumnsChange?.(safe);
    },
    [onColumnsChange, minColumns, maxColumns],
  );

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      "worklet";
      hasTriggered.value = false;
    })
    .onUpdate((e) => {
      "worklet";
      if (hasTriggered.value) return;

      const cols = currentColumns.value;

      if (e.scale > 1 + PINCH_THRESHOLD && cols > minColumns) {
        hasTriggered.value = true;
        const newCols = cols - 1;
        currentColumns.value = newCols;
        scheduleOnRN(commitColumns, newCols);
      } else if (e.scale < 1 - PINCH_THRESHOLD && cols < maxColumns) {
        hasTriggered.value = true;
        const newCols = cols + 1;
        currentColumns.value = newCols;
        scheduleOnRN(commitColumns, newCols);
      }
    });

  return {
    columns,
    pinchGesture,
  };
};
