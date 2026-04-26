import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type { VideoPlayerProps } from "@/types/media/viewers";
import { useVideoPlayerStyles } from "./styles";
import { formatAudioDuration } from "@/utils/format/date";
import { scheduleOnRN } from "react-native-worklets";

const CONTROLS_HIDE_DELAY = 3000;
const SKIP_SECONDS = 10;
const DOUBLE_TAP_DELAY = 300;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SWIPE_THRESHOLD = 180;
const SWIPE_VERTICAL_TOLERANCE = 80;
const SWIPE_BOTTOM_GUARD = 160;

export default function VideoPlayer({
  source,
  visible,
  onClose,
  autoPlay = false,
  onSwipeNext,
  onSwipePrevious,
}: VideoPlayerProps) {
  const styles = useVideoPlayerStyles();
  const { width: screenW, height: screenH } = useWindowDimensions();

  /* ── Player ───────────────────────────────────────────────── */
  const player = useVideoPlayer(source.uri, (p) => {
    p.loop = false;
    p.muted = false;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  const isLoaded = status === "readyToPlay";

  /* ── State ────────────────────────────────────────────────── */
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [skipSide, setSkipSide] = useState<"left" | "right" | null>(null);

  /* ── Refs ──────────────────────────────────────────────────── */
  const trackWidthRef = useRef(1);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef({ time: 0, x: 0 });
  const pendingTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Shared values ────────────────────────────────────────── */
  const controlsOpacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  /* ── Derived ──────────────────────────────────────────────── */
  const playbackRatio = duration > 0 ? position / duration : 0;
  const displayedRatio = isScrubbing ? scrubRatio : playbackRatio;
  const displayedPosition = displayedRatio * duration;

  const getRatioFromX = useCallback(
    (lx: number) => Math.min(Math.max(lx / trackWidthRef.current, 0), 1),
    [],
  );

  /* ── Controls visibility ──────────────────────────────────── */
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideControls = useCallback(() => {
    controlsOpacity.value = withTiming(0, { duration: 250 });
    setControlsVisible(false);
  }, [controlsOpacity]);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(hideControls, CONTROLS_HIDE_DELAY);
    }
  }, [isPlaying, clearHideTimeout, hideControls]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    scheduleHide();
  }, [controlsOpacity, scheduleHide]);

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      clearHideTimeout();
      hideControls();
    } else {
      showControls();
    }
  }, [controlsVisible, showControls, clearHideTimeout, hideControls]);

  /* ── Skip indicator ───────────────────────────────────────── */
  const flashSkip = useCallback((side: "left" | "right") => {
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    setSkipSide(side);
    skipTimerRef.current = setTimeout(() => setSkipSide(null), 600);
  }, []);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleSkipBack = useCallback(() => {
    const t = Math.max(0, player.currentTime - SKIP_SECONDS);
    player.currentTime = t;
    setPosition(t);
    flashSkip("left");
  }, [player, flashSkip]);

  const handleSkipForward = useCallback(() => {
    const t = Math.min(duration, player.currentTime + SKIP_SECONDS);
    player.currentTime = t;
    setPosition(t);
    flashSkip("right");
  }, [player, duration, flashSkip]);

  const toggleMute = useCallback(() => {
    const next = !player.muted;
    player.muted = next;
    setIsMuted(next);
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else if (duration > 0 && player.currentTime >= duration - 0.5) {
      player.replay();
    } else {
      player.play();
    }
    showControls();
  }, [isPlaying, player, duration, showControls]);

  const handleClose = useCallback(() => {
    player.pause();
    setIsScrubbing(false);
    clearHideTimeout();
    onClose();
  }, [player, onClose, clearHideTimeout]);

  /* ── Double-tap detection ─────────────────────────────────── */
  const handleTapArea = useCallback(
    (x: number) => {
      const now = Date.now();
      const right = x > screenW / 2;
      const wasRight = lastTapRef.current.x > screenW / 2;
      const isDouble =
        now - lastTapRef.current.time < DOUBLE_TAP_DELAY && right === wasRight;

      if (isDouble) {
        if (pendingTapRef.current) {
          clearTimeout(pendingTapRef.current);
          pendingTapRef.current = null;
        }
        if (right) handleSkipForward();
        else handleSkipBack();
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x };
        const snap = now;
        pendingTapRef.current = setTimeout(() => {
          if (lastTapRef.current.time === snap) {
            toggleControls();
            lastTapRef.current = { time: 0, x: 0 };
          }
          pendingTapRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }
    },
    [screenW, handleSkipBack, handleSkipForward, toggleControls],
  );

  /* ── Effects ──────────────────────────────────────────────── */

  // Poll position while playing
  useEffect(() => {
    if (!isPlaying || isScrubbing) return;
    const id = setInterval(() => {
      setPosition(player.currentTime);
      if (player.duration > 0 && isFinite(player.duration)) {
        setDuration(player.duration);
      }
    }, 250);
    return () => clearInterval(id);
  }, [isPlaying, isScrubbing, player]);

  // Grab duration once loaded
  useEffect(() => {
    if (isLoaded && player.duration > 0 && isFinite(player.duration)) {
      setDuration(player.duration);
    }
  }, [isLoaded]);

  // Show/hide controls on play state changes
  useEffect(() => {
    if (isPlaying && controlsVisible) {
      scheduleHide();
    }
    if (!isPlaying) {
      clearHideTimeout();
      setControlsVisible(true);
      controlsOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isPlaying]);

  // AutoPlay
  useEffect(() => {
    if (visible && isLoaded && autoPlay) player.play();
  }, [visible, isLoaded, autoPlay]);

  // Pause when modal hides
  useEffect(() => {
    if (!visible && isPlaying) player.pause();
  }, [visible]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearHideTimeout();
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      if (pendingTapRef.current) clearTimeout(pendingTapRef.current);
    };
  }, []);

  /* ── Pinch-to-zoom ────────────────────────────────────────── */
  const clampXY = useCallback(
    (x: number, y: number, s: number) => {
      "worklet";
      const mx = ((s - 1) * screenW) / 2;
      const my = ((s - 1) * screenH) / 2;
      return {
        x: Math.min(Math.max(x, -mx), mx),
        y: Math.min(Math.max(y, -my), my),
      };
    },
    [screenW, screenH],
  );

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(
        Math.max(savedScale.value * e.scale, MIN_SCALE),
        MAX_SCALE,
      );
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      } else {
        savedScale.value = scale.value;
      }
      const c = clampXY(translateX.value, translateY.value, scale.value);
      translateX.value = withTiming(c.x);
      translateY.value = withTiming(c.y);
      savedTX.value = c.x;
      savedTY.value = c.y;
    });

  const panZoom = Gesture.Pan()
    .minPointers(2)
    .onStart(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    })
    .onUpdate((e) => {
      const c = clampXY(
        savedTX.value + e.translationX,
        savedTY.value + e.translationY,
        scale.value,
      );
      translateX.value = c.x;
      translateY.value = c.y;
    })
    .onEnd(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    });

  const zoomGesture = Gesture.Simultaneous(pinch, panZoom);

  const swipeGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .activeOffsetX([-16, 16])
    .onEnd((e) => {
      if (scale.value > MIN_SCALE + 0.05) return;
      if (Math.abs(e.translationY) > SWIPE_VERTICAL_TOLERANCE) return;
      if (screenH - e.y < SWIPE_BOTTOM_GUARD) return;

      if (e.translationX <= -SWIPE_THRESHOLD && onSwipeNext) {
        scheduleOnRN(onSwipeNext);
        return;
      }

      if (e.translationX >= SWIPE_THRESHOLD && onSwipePrevious) {
        scheduleOnRN(onSwipePrevious);
      }
    });

  const composedGesture = Gesture.Simultaneous(zoomGesture, swipeGesture);

  /* ── Animated styles ──────────────────────────────────────── */
  const animatedVideo = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedControls = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <GestureDetector gesture={composedGesture}>
          <View style={styles.gestureRoot} collapsable={false}>
            {/* Video surface with zoom */}
            <Animated.View style={[styles.videoWrapper, animatedVideo]}>
              <VideoView
                player={player}
                style={styles.video}
                nativeControls={false}
                contentFit="contain"
              />
            </Animated.View>

            {/* Tap detection layer (single tap ↔ controls / double tap ↔ skip) */}
            <Pressable
              style={styles.tapLayer}
              onPress={(e) => handleTapArea(e.nativeEvent.locationX)}
            />

            {/* Skip indicator */}
            {skipSide !== null && (
              <View
                style={[
                  styles.skipIndicator,
                  skipSide === "left" ? styles.skipLeft : styles.skipRight,
                ]}
                pointerEvents="none"
              >
                <Ionicons
                  name={skipSide === "left" ? "play-back" : "play-forward"}
                  size={28}
                  color="#FFFFFF"
                />
                <Text style={styles.skipText}>10s</Text>
              </View>
            )}

            {/* Loading */}
            {!isLoaded && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}

            {/* Controls overlay */}
            <Animated.View
              style={[styles.controlsOverlay, animatedControls]}
              pointerEvents={controlsVisible ? "box-none" : "none"}
            >
              {/* Header */}
              <View style={styles.header} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                  {source.displayName ?? "Video"}
                </Text>

                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={toggleMute}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isMuted ? "volume-mute" : "volume-high"}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Center play / pause */}
              <View style={styles.centerRow} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.centerPlay}
                  onPress={handlePlayPause}
                  activeOpacity={0.8}
                  disabled={!isLoaded}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={44}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom: progress bar + time */}
              <View style={styles.bottom}>
                <View
                  style={styles.progressTouchArea}
                  onLayout={(e) => {
                    trackWidthRef.current = e.nativeEvent.layout.width;
                  }}
                  onStartShouldSetResponder={() => isLoaded}
                  onResponderGrant={(e) => {
                    clearHideTimeout();
                    const ratio = getRatioFromX(e.nativeEvent.locationX);
                    setIsScrubbing(true);
                    setScrubRatio(ratio);
                  }}
                  onResponderMove={(e) => {
                    setScrubRatio(getRatioFromX(e.nativeEvent.locationX));
                  }}
                  onResponderRelease={(e) => {
                    const ratio = getRatioFromX(e.nativeEvent.locationX);
                    const target = ratio * duration;
                    player.currentTime = target;
                    setPosition(target);
                    setIsScrubbing(false);
                    scheduleHide();
                  }}
                  onResponderTerminate={() => {
                    setIsScrubbing(false);
                    scheduleHide();
                  }}
                >
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${Math.min(displayedRatio * 100, 100)}%` as any,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.progressThumb,
                        isScrubbing && styles.progressThumbActive,
                        {
                          left: `${Math.min(displayedRatio * 100, 100)}%` as any,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Text
                    style={[
                      styles.timeText,
                      isScrubbing && styles.timeTextActive,
                    ]}
                  >
                    {formatAudioDuration(displayedPosition)}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatAudioDuration(duration)}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
