import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import type { AudioPlayerProps } from "@/types/media/viewers";
import { useAudioPlayerStyles } from "./styles";
import { formatAudioDuration } from "@/utils/format/date";

type SeekPreviewState = {
  positionSec: number;
  isPlaying: boolean;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export default function AudioPlayer({
  source,
  onClose,
  autoPlay = false,
}: AudioPlayerProps) {
  const styles = useAudioPlayerStyles();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [seekPreview, setSeekPreview] = useState<SeekPreviewState | null>(null);
  const trackWidthRef = useRef(1);
  const lastScrubRatioRef = useRef(0);
  const hasPendingScrubRef = useRef(false);

  const player = useAudioPlayer({ uri: source.uri });
  const status = useAudioPlayerStatus(player);

  const isLoaded = status.isLoaded ?? false;
  const isPlaying = status.playing ?? false;
  const positionSec = status.currentTime ?? 0;
  const durationSec = status.duration ?? 0;
  const displayedIsPlaying = seekPreview?.isPlaying ?? isPlaying;
  const resolvedPositionSec = seekPreview?.positionSec ?? positionSec;
  const playbackRatio = durationSec > 0 ? resolvedPositionSec / durationSec : 0;
  const showArtwork = hasLoadedOnce || isLoaded;

  const displayedRatio = isScrubbing ? scrubRatio : playbackRatio;
  const displayedPosition = displayedRatio * durationSec;
  const progressPercentage = `${clamp(displayedRatio * 100, 0, 100)}%` as any;

  const getRatioFromX = useCallback((locationX: number) => {
    return clamp(locationX / trackWidthRef.current, 0, 1);
  }, []);

  const handleTrackLayout = useCallback((width: number) => {
    trackWidthRef.current = width;
  }, []);

  const updateScrubRatio = useCallback((ratio: number) => {
    const nextRatio = clamp(ratio, 0, 1);
    lastScrubRatioRef.current = nextRatio;
    setScrubRatio(nextRatio);
  }, []);

  const setScrubFromLocation = useCallback(
    (locationX: number) => {
      updateScrubRatio(getRatioFromX(locationX));
    },
    [getRatioFromX, updateScrubRatio],
  );

  const resetInteractionState = useCallback((resetLoadedState = false) => {
    setIsScrubbing(false);
    setScrubRatio(0);
    setSeekPreview(null);
    lastScrubRatioRef.current = 0;
    hasPendingScrubRef.current = false;

    if (resetLoadedState) {
      setHasLoadedOnce(false);
    }
  }, []);

  const seekToPosition = useCallback(
    (targetPositionSec: number) => {
      if (durationSec <= 0) {
        return;
      }

      const clampedPositionSec = clamp(targetPositionSec, 0, durationSec);

      setSeekPreview({
        positionSec: clampedPositionSec,
        isPlaying: displayedIsPlaying,
      });

      try {
        player.seekTo(clampedPositionSec);
      } catch {
        setSeekPreview(null);
      }
    },
    [displayedIsPlaying, durationSec, player],
  );

  const beginScrub = useCallback(
    (locationX: number) => {
      if (!isLoaded) return;

      hasPendingScrubRef.current = true;
      setIsScrubbing(true);
      setSeekPreview(null);
      setScrubFromLocation(locationX);
    },
    [isLoaded, setScrubFromLocation],
  );

  const moveScrub = useCallback(
    (locationX: number) => {
      if (!isLoaded) return;

      setScrubFromLocation(locationX);
    },
    [isLoaded, setScrubFromLocation],
  );

  const commitScrub = useCallback(
    (ratio: number) => {
      if (!hasPendingScrubRef.current) {
        return;
      }

      hasPendingScrubRef.current = false;

      if (durationSec <= 0) {
        setIsScrubbing(false);
        return;
      }

      const nextRatio = clamp(ratio, 0, 1);
      const targetPositionSec = nextRatio * durationSec;

      updateScrubRatio(nextRatio);
      setIsScrubbing(false);

      seekToPosition(targetPositionSec);
    },
    [durationSec, seekToPosition, updateScrubRatio],
  );

  const commitScrubFromLocation = useCallback(
    (locationX: number) => {
      commitScrub(getRatioFromX(locationX));
    },
    [commitScrub, getRatioFromX],
  );

  const cancelScrub = useCallback(() => {
    commitScrub(lastScrubRatioRef.current);
  }, [commitScrub]);

  const progressGesture = Gesture.Pan()
    .enabled(isLoaded)
    .shouldCancelWhenOutside(false)
    .onBegin((event) => {
      scheduleOnRN(beginScrub, event.x);
    })
    .onUpdate((event) => {
      scheduleOnRN(moveScrub, event.x);
    })
    .onEnd((event) => {
      scheduleOnRN(commitScrubFromLocation, event.x);
    })
    .onFinalize(() => {
      scheduleOnRN(cancelScrub);
    });

  useEffect(() => {
    resetInteractionState(true);
  }, [resetInteractionState, source.uri]);

  useEffect(() => {
    if (isLoaded) {
      setHasLoadedOnce(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (seekPreview === null) return;

    if (Math.abs(positionSec - seekPreview.positionSec) <= 0.35) {
      setSeekPreview(null);
    }
  }, [positionSec, seekPreview]);

  useEffect(() => {
    if (!isLoaded || !autoPlay) return;

    try {
      player.play();
    } catch {
      // Ignora el autoplay si la instancia ya fue liberada.
    }
  }, [isLoaded, autoPlay, player]);

  const handlePlayPause = useCallback(() => {
    try {
      setSeekPreview(null);

      if (displayedIsPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // Ignora acciones lanzadas después de que el player nativo se haya liberado.
    }
  }, [displayedIsPlaying, player]);

  const handleSkipBack = useCallback(() => {
    seekToPosition(resolvedPositionSec - 10);
  }, [resolvedPositionSec, seekToPosition]);

  const handleSkipForward = useCallback(() => {
    seekToPosition(resolvedPositionSec + 10);
  }, [resolvedPositionSec, seekToPosition]);

  const handleClose = useCallback(() => {
    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // Ignora players ya liberados por el desmontaje nativo.
    }
    resetInteractionState();
    onClose();
  }, [onClose, player, resetInteractionState]);

  return (
    <View style={styles.overlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={2}>
          {source.displayName ?? "Audio"}
        </Text>

        <View style={styles.headerButton} />
      </View>

      {/* Icono central */}
      <View style={styles.artworkContainer}>
        {!showArtwork ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name="musical-notes" size={72} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controlsContainer}>
        {/* Barra de progreso con scrubbing */}
        <GestureDetector gesture={progressGesture}>
          <View
            style={styles.progressTouchArea}
            onLayout={(e) => {
              handleTrackLayout(e.nativeEvent.layout.width);
            }}
          >
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: progressPercentage }]}
              />
              <View
                style={[
                  styles.progressThumb,
                  isScrubbing && styles.progressThumbDragging,
                  { left: progressPercentage },
                ]}
              />
            </View>
          </View>
        </GestureDetector>

        {/* Tiempos */}
        <View style={styles.timeRow}>
          <Text
            style={[styles.timeText, isScrubbing && styles.timeTextScrubbing]}
          >
            {formatAudioDuration(displayedPosition)}
          </Text>
          <Text style={styles.timeText}>
            {formatAudioDuration(durationSec)}
          </Text>
        </View>

        {/* Botones de control */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkipBack}
            activeOpacity={0.7}
            disabled={!isLoaded}
          >
            <Ionicons name="play-back" size={30} color="#FFFFFF" />
            <Text style={styles.skipLabel}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, !isLoaded && styles.playButtonDisabled]}
            onPress={handlePlayPause}
            activeOpacity={0.8}
            disabled={!isLoaded}
          >
            <Ionicons
              name={displayedIsPlaying ? "pause" : "play"}
              size={38}
              color="#121212"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkipForward}
            activeOpacity={0.7}
            disabled={!isLoaded}
          >
            <Ionicons name="play-forward" size={30} color="#FFFFFF" />
            <Text style={styles.skipLabel}>10s</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
