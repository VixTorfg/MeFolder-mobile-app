import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
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
const SWIPE_SCALE_TOLERANCE = 0.05;

export default function ImageViewer({
  source,
  onClose,
  onSwipeAvailabilityChange,
  onInitialRenderSettled,
  isDragging,
}: ImageViewerProps) {
  const styles = useImageViewerStyles();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Controla si el pan interno está activo: solo cuando hay zoom
  const [isPanEnabled, setIsPanEnabled] = useState(false);

  const notifySwipeAvailability = useCallback(
    (enabled: boolean) => {
      // swipeEnabled=true → zoom=1 → pan interno deshabilitado (carrusel gestiona el swipe)
      setIsPanEnabled(!enabled);
      onSwipeAvailabilityChange?.(enabled);
    },
    [onSwipeAvailabilityChange],
  );

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
    scheduleOnRN(notifySwipeAvailability, true);
  }, [
    notifySwipeAvailability,
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
      scheduleOnRN(
        notifySwipeAvailability,
        scale.value <= MIN_SCALE + SWIPE_SCALE_TOLERANCE,
      );
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    // Deshabilitado a zoom=1 para que el carrusel reciba el gesto horizontal
    .enabled(isPanEnabled)
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
        scheduleOnRN(notifySwipeAvailability, false);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Oculta el header durante el swipe entre items del carrusel
  const headerDragStyle = useAnimatedStyle(() => ({
    opacity: isDragging !== undefined ? (isDragging.value ? 0 : 1) : 1,
  }));

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onInitialRenderSettled?.();
  }, [onInitialRenderSettled]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onInitialRenderSettled?.();
  }, [onInitialRenderSettled]);

  const handleClose = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    resetTransform();
    onClose();
  }, [onClose, resetTransform]);

  useEffect(() => {
    notifySwipeAvailability(true);
    return () => notifySwipeAvailability(true);
  }, [notifySwipeAvailability, source.uri]);

  return (
    <View style={styles.overlay}>
      {/* Header: oculto mientras el usuario arrastra entre items */}
      <Animated.View style={[styles.header, headerDragStyle]}>
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
      </Animated.View>

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
                transition={0}
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
    </View>
  );
}
