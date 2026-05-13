import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 120;

const OPEN_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};
const CLOSE_CONFIG = {
  duration: 250,
  easing: Easing.in(Easing.cubic),
};
const SNAP_BACK_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
};

interface UseBottomSheetOptions {
  onClose: () => void;
  onBeforeClose?: () => void;
}

export function useBottomSheet({ onClose, onBeforeClose }: UseBottomSheetOptions) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayProgress = useSharedValue(0);

  const closeModal = useCallback(() => {
    onBeforeClose?.();
    onClose();
  }, [onClose, onBeforeClose]);

  const onModalShow = useCallback(() => {
    translateY.value = withTiming(0, OPEN_CONFIG);
    overlayProgress.value = withTiming(1, OPEN_CONFIG);
  }, []);

  const animateClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_CONFIG, (finished) => {
      if (finished) scheduleOnRN(closeModal);
    });
    overlayProgress.value = withTiming(0, CLOSE_CONFIG);
  }, [closeModal]);

  const handleClose = useCallback(() => {
    animateClose();
  }, [animateClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        overlayProgress.value = interpolate(
          e.translationY,
          [0, SCREEN_HEIGHT],
          [1, 0],
          Extrapolation.CLAMP,
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD || e.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_CONFIG, (finished) => {
          if (finished) scheduleOnRN(closeModal);
        });
        overlayProgress.value = withTiming(0, CLOSE_CONFIG);
      } else {
        translateY.value = withTiming(0, SNAP_BACK_CONFIG);
        overlayProgress.value = withTiming(1, SNAP_BACK_CONFIG);
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayProgress.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return {
    onModalShow,
    handleClose,
    panGesture,
    overlayStyle,
    containerStyle,
  };
}
