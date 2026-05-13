import { useCallback, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";

interface UsePressScaleAnimationOptions {
  pressedScale?: number;
  pressInDuration?: number;
  pressOutDuration?: number;
}

export const usePressScaleAnimation = ({
  pressedScale = 0.96,
  pressInDuration = 90,
  pressOutDuration = 140,
}: UsePressScaleAnimationOptions = {}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number, duration: number) => {
      scale.stopAnimation();
      Animated.timing(scale, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  const handlePressIn = useCallback(() => {
    animateTo(pressedScale, pressInDuration);
  }, [animateTo, pressInDuration, pressedScale]);

  const handlePressOut = useCallback(() => {
    animateTo(1, pressOutDuration);
  }, [animateTo, pressOutDuration]);

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale }],
    }),
    [scale],
  );

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
};
