import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type { ImageViewerProps } from "@/types/media/viewers";
import { useImageViewerStyles } from "./styles";
import { scheduleOnRN } from "react-native-worklets";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SWIPE_THRESHOLD = 180;
const SWIPE_VERTICAL_TOLERANCE = 80;

export default function ImageViewer({
  source,
  visible,
  onClose,
  onSwipeNext,
  onSwipePrevious,
}: ImageViewerProps) {
  const styles = useImageViewerStyles();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = useCallback(() => {
    "worklet";
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const clampTranslation = useCallback(
    (tx: number, ty: number, s: number) => {
      "worklet";
      const maxX = ((s - 1) * screenW) / 2;
      const maxY = ((s - 1) * screenH) / 2;
      return {
        x: Math.min(Math.max(tx, -maxX), maxX),
        y: Math.min(Math.max(ty, -maxY), maxY),
      };
    },
    [screenW, screenH],
  );

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      } else {
        savedScale.value = scale.value;
      }
      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = withTiming(clamped.x);
      translateY.value = withTiming(clamped.y);
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const clamped = clampTranslation(
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
        scale.value,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        resetTransform();
      } else {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    });

  const swipeGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onEnd((e) => {
      if (scale.value > MIN_SCALE + 0.05) return;
      if (Math.abs(e.translationY) > SWIPE_VERTICAL_TOLERANCE) return;

      if (e.translationX <= -SWIPE_THRESHOLD && onSwipeNext) {
        scheduleOnRN(onSwipeNext);
        return;
      }

      if (e.translationX >= SWIPE_THRESHOLD && onSwipePrevious) {
        scheduleOnRN(onSwipePrevious);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
    swipeGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    resetTransform();
    onClose();
  }, [onClose, resetTransform]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {source.displayName ?? "Imagen"}
          </Text>

          {/* Placeholder derecho para centrar el título */}
          <View style={styles.headerButton} />
        </View>

        {/* Imagen con zoom */}
        <View style={styles.imageContainer}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={64} color="#666" />
              <Text style={styles.errorText}>No se pudo cargar la imagen</Text>
            </View>
          ) : (
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.image, animatedImageStyle]}>
                <Image
                  source={{ uri: source.uri }}
                  style={styles.image}
                  contentFit="contain"
                  onLoad={handleLoad}
                  onError={handleError}
                  transition={200}
                />
              </Animated.View>
            </GestureDetector>
          )}
          {isLoading && !hasError && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
