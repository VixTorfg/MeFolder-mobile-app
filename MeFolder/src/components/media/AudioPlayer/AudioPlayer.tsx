import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import type { AudioPlayerProps } from "@/types/media/viewers";
import { useAudioPlayerStyles } from "./styles";
import { formatAudioDuration } from "@/utils/format/date";

export default function AudioPlayer({
  source,
  onClose,
  autoPlay = false,
}: AudioPlayerProps) {
  const styles = useAudioPlayerStyles();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const trackWidthRef = useRef(1);

  const player = useAudioPlayer({ uri: source.uri });
  const status = useAudioPlayerStatus(player);

  const isLoaded = status.isLoaded ?? false;
  const isPlaying = status.playing ?? false;
  const positionSec = status.currentTime ?? 0;
  const durationSec = status.duration ?? 0;
  const playbackRatio = durationSec > 0 ? positionSec / durationSec : 0;

  const displayedRatio = isScrubbing ? scrubRatio : playbackRatio;
  const displayedPosition = displayedRatio * durationSec;

  const getRatioFromX = useCallback((locationX: number) => {
    return Math.min(Math.max(locationX / trackWidthRef.current, 0), 1);
  }, []);

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
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // Ignora acciones lanzadas después de que el player nativo se haya liberado.
    }
  }, [isPlaying, player]);

  const handleSkipBack = useCallback(() => {
    try {
      player.seekTo(Math.max(0, positionSec - 10));
    } catch {
      // Ignora seeks sobre players ya liberados.
    }
  }, [positionSec, player]);

  const handleSkipForward = useCallback(() => {
    try {
      player.seekTo(Math.min(durationSec, positionSec + 10));
    } catch {
      // Ignora seeks sobre players ya liberados.
    }
  }, [positionSec, durationSec, player]);

  const handleClose = useCallback(() => {
    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // Ignora players ya liberados por el desmontaje nativo.
    }
    setIsScrubbing(false);
    onClose();
  }, [player, onClose]);

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
        {!isLoaded ? (
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
        <View
          style={styles.progressTouchArea}
          onLayout={(e) => {
            trackWidthRef.current = e.nativeEvent.layout.width;
          }}
          onStartShouldSetResponder={() => isLoaded}
          onResponderGrant={(e) => {
            const ratio = getRatioFromX(e.nativeEvent.locationX);
            setIsScrubbing(true);
            setScrubRatio(ratio);
          }}
          onResponderMove={(e) => {
            setScrubRatio(getRatioFromX(e.nativeEvent.locationX));
          }}
          onResponderRelease={(e) => {
            const ratio = getRatioFromX(e.nativeEvent.locationX);
            try {
              player.seekTo(ratio * durationSec);
            } catch {
              return;
            }
            setIsScrubbing(false);
          }}
          onResponderTerminate={() => setIsScrubbing(false)}
        >
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(displayedRatio * 100, 100)}%` as any },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                isScrubbing && styles.progressThumbDragging,
                { left: `${Math.min(displayedRatio * 100, 100)}%` as any },
              ]}
            />
          </View>
        </View>

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
              name={isPlaying ? "pause" : "play"}
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
