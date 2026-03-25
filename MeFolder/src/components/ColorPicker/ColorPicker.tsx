import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Switch,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useColorPickerStyles } from './styles';
import { ColorInfo } from '@/types/common/colors';

/* ─── Constants ─── */

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 120;

const OPEN_CONFIG = { duration: 400, easing: Easing.out(Easing.cubic) };
const CLOSE_CONFIG = { duration: 250, easing: Easing.in(Easing.cubic) };
const SNAP_BACK_CONFIG = { duration: 200, easing: Easing.out(Easing.cubic) };

const GRAYSCALE_STEPS = [
  '#FFFFFF', '#E0E0E0', '#C0C0C0', '#A0A0A0',
  '#808080', '#606060', '#404040', '#202020', '#000000',
];

const HUE_STEPS = 36; // one step every 10°

/* ─── Color helpers ─── */

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60)       { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else              { r1 = c; g1 = 0; b1 = x; }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ─── Color map grid (rendered via JS cells) ─── */

const COLOR_MAP_COLS = 12;
const COLOR_MAP_ROWS = 10;

function buildColorMapGrid(hue: number): string[][] {
  const grid: string[][] = [];
  for (let row = 0; row < COLOR_MAP_ROWS; row++) {
    const rowColors: string[] = [];
    const lightness = 1 - row / (COLOR_MAP_ROWS - 1); // top = light, bottom = dark
    for (let col = 0; col < COLOR_MAP_COLS; col++) {
      const saturation = col / (COLOR_MAP_COLS - 1); // left = gray, right = saturated
      const rgb = hslToRgb(hue, saturation, lightness * 0.85 + 0.075);
      rowColors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    grid.push(rowColors);
  }
  return grid;
}

/* ─── Props ─── */

export interface ColorPickerProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: { color: ColorInfo; name?: string; isFavorite: boolean }) => void;
  initialColor?: ColorInfo;
}

/* ─── Component ─── */

export default function ColorPicker({
  visible,
  onClose,
  onSave,
  initialColor,
}: ColorPickerProps) {
  const { theme } = useTheme();
  const styles = useColorPickerStyles();

  /* ── Animated bottom-sheet ── */
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayProgress = useSharedValue(0);

  const onModalShow = useCallback(() => {
    translateY.value = withTiming(0, OPEN_CONFIG);
    overlayProgress.value = withTiming(1, OPEN_CONFIG);
  }, []);

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_CONFIG, (finished) => {
      if (finished) scheduleOnRN(closeModal);
    });
    overlayProgress.value = withTiming(0, CLOSE_CONFIG);
  }, [closeModal]);

  const handleClose = useCallback(() => animateClose(), [animateClose]);

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

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayProgress.value }));
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  /* ── Color state ── */
  const initRgb = initialColor?.rgb ?? { r: 242, g: 201, b: 76 };
  const initHsl = rgbToHsl(initRgb.r, initRgb.g, initRgb.b);

  const [hue, setHue] = useState(initHsl.h);
  const [selectedR, setSelectedR] = useState(initRgb.r);
  const [selectedG, setSelectedG] = useState(initRgb.g);
  const [selectedB, setSelectedB] = useState(initRgb.b);
  const [hexText, setHexText] = useState(rgbToHex(initRgb.r, initRgb.g, initRgb.b));
  const [colorName, setColorName] = useState(initialColor?.name ?? '');
  const [isFavorite, setIsFavorite] = useState(false);

  const [hexFocused, setHexFocused] = useState(false);
  const [rFocused, setRFocused] = useState(false);
  const [gFocused, setGFocused] = useState(false);
  const [bFocused, setBFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const currentHex = rgbToHex(selectedR, selectedG, selectedB);

  /* ── Color map grid (recalculated when hue changes) ── */
  const colorGrid = useMemo(() => buildColorMapGrid(hue), [hue]);

  /* ── Hue bar colors ── */
  const hueBarColors = useMemo(() => {
    const colors: string[] = [];
    for (let i = 0; i <= HUE_STEPS; i++) {
      const h = (i / HUE_STEPS) * 360;
      const rgb = hslToRgb(h, 1, 0.5);
      colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors;
  }, []);

  /* ── Handlers ── */

  const applyRgb = useCallback((r: number, g: number, b: number) => {
    setSelectedR(r);
    setSelectedG(g);
    setSelectedB(b);
    setHexText(rgbToHex(r, g, b));
    const hsl = rgbToHsl(r, g, b);
    setHue(hsl.h);
  }, []);

  const handleColorCellPress = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) applyRgb(rgb.r, rgb.g, rgb.b);
  }, [applyRgb]);

  const handleGrayscalePress = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) applyRgb(rgb.r, rgb.g, rgb.b);
  }, [applyRgb]);

  const handleHueCellPress = useCallback((index: number) => {
    const newHue = (index / HUE_STEPS) * 360;
    setHue(newHue);
    const rgb = hslToRgb(newHue, 1, 0.5);
    setSelectedR(rgb.r);
    setSelectedG(rgb.g);
    setSelectedB(rgb.b);
    setHexText(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, []);

  const handleHexSubmit = useCallback(() => {
    const clean = hexText.startsWith('#') ? hexText : `#${hexText}`;
    const rgb = hexToRgb(clean);
    if (rgb) {
      applyRgb(rgb.r, rgb.g, rgb.b);
    } else {
      setHexText(currentHex);
    }
  }, [hexText, currentHex, applyRgb]);

  const handleRgbChange = useCallback((channel: 'r' | 'g' | 'b', value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    const clamped = clamp(num, 0, 255);
    const r = channel === 'r' ? clamped : selectedR;
    const g = channel === 'g' ? clamped : selectedG;
    const b = channel === 'b' ? clamped : selectedB;
    applyRgb(r, g, b);
  }, [selectedR, selectedG, selectedB, applyRgb]);

  const handleSave = useCallback(() => {
    const colorInfo: ColorInfo = {
      hex: currentHex,
      rgb: { r: selectedR, g: selectedG, b: selectedB },
      isSystem: false,
      ...(colorName.trim() && { name: colorName.trim() }),
    };
    const trimmedName = colorName.trim();
    onSave?.({ color: colorInfo, ...(trimmedName && { name: trimmedName }), isFavorite });
    handleClose();
  }, [currentHex, selectedR, selectedG, selectedB, colorName, isFavorite, onSave, handleClose]);

  /* ─── Render ─── */

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onShow={onModalShow}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View style={[styles.containerWrapper, containerStyle]}>
          <View style={styles.container}>

            {/* Drag handle */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.handleZone}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Nuevo color</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* ── Color map + grayscale ── */}
              <View style={styles.colorMapSection}>
                <Text style={styles.label}>Seleccionar color</Text>
                <View style={styles.colorMapRow}>
                  {/* Main color grid */}
                  <View style={styles.colorMapContainer}>
                    {colorGrid.map((row, rowIdx) => (
                      <View key={rowIdx} style={{ flex: 1, flexDirection: 'row' }}>
                        {row.map((cellHex, colIdx) => (
                          <TouchableOpacity
                            key={`${rowIdx}-${colIdx}`}
                            style={{
                              flex: 1,
                              backgroundColor: cellHex,
                              borderWidth: cellHex === currentHex ? 2 : 0,
                              borderColor: '#FFFFFF',
                            }}
                            onPress={() => handleColorCellPress(cellHex)}
                            activeOpacity={0.8}
                          />
                        ))}
                      </View>
                    ))}
                  </View>

                  {/* Grayscale strip */}
                  <View style={styles.grayscaleStrip}>
                    {GRAYSCALE_STEPS.map((gray) => (
                      <TouchableOpacity
                        key={gray}
                        style={[
                          styles.grayscaleCell,
                          {
                            backgroundColor: gray,
                            borderWidth: gray === currentHex ? 2 : 0,
                            borderColor: gray === '#FFFFFF' ? '#000' : '#FFF',
                          },
                        ]}
                        onPress={() => handleGrayscalePress(gray)}
                        activeOpacity={0.8}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* ── Hue slider ── */}
              <View style={styles.hueSliderSection}>
                <View style={styles.hueSliderTrack}>
                  <View style={styles.hueSliderGradient}>
                    {hueBarColors.map((color, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={{ flex: 1, backgroundColor: color }}
                        onPress={() => handleHueCellPress(idx)}
                        activeOpacity={0.9}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* ── Preview ── */}
              <View style={styles.previewSection}>
                <View style={[styles.previewCircle, { backgroundColor: currentHex }]} />
                <View style={styles.previewInfo}>
                  <Text style={styles.previewLabel}>Vista previa</Text>
                  <Text style={styles.previewHex}>{currentHex}</Text>
                </View>
              </View>

              {/* ── Hex input ── */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Hexadecimal</Text>
                <TextInput
                  style={[styles.hexInput, hexFocused && styles.hexInputFocused]}
                  value={hexText}
                  onChangeText={setHexText}
                  onBlur={() => { setHexFocused(false); handleHexSubmit(); }}
                  onFocus={() => setHexFocused(true)}
                  onSubmitEditing={handleHexSubmit}
                  placeholder="#F2C94C"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={7}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              {/* ── RGB inputs ── */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>RGB</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>R</Text>
                    <TextInput
                      style={[styles.textInput, rFocused && styles.textInputFocused]}
                      value={String(selectedR)}
                      onChangeText={(v) => handleRgbChange('r', v)}
                      onFocus={() => setRFocused(true)}
                      onBlur={() => setRFocused(false)}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>G</Text>
                    <TextInput
                      style={[styles.textInput, gFocused && styles.textInputFocused]}
                      value={String(selectedG)}
                      onChangeText={(v) => handleRgbChange('g', v)}
                      onFocus={() => setGFocused(true)}
                      onBlur={() => setGFocused(false)}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>B</Text>
                    <TextInput
                      style={[styles.textInput, bFocused && styles.textInputFocused]}
                      value={String(selectedB)}
                      onChangeText={(v) => handleRgbChange('b', v)}
                      onFocus={() => setBFocused(true)}
                      onBlur={() => setBFocused(false)}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>

              {/* ── Name ── */}
              <View style={styles.nameSection}>
                <Text style={styles.label}>Nombre (opcional)</Text>
                <TextInput
                  style={[styles.hexInput, nameFocused && styles.hexInputFocused]}
                  value={colorName}
                  onChangeText={setColorName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="Ej: Azul cielo"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={50}
                />
              </View>

              {/* ── Favorite toggle ── */}
              <View style={styles.favoriteSection}>
                <View style={styles.favoriteLabel}>
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={22}
                    color={isFavorite ? theme.colors.warning : theme.colors.textSecondary}
                  />
                  <Text style={styles.favoriteLabelText}>Favorito</Text>
                </View>
                <Switch
                  value={isFavorite}
                  onValueChange={setIsFavorite}
                  trackColor={{
                    false: theme.colors.borderSoft,
                    true: theme.colors.primarySoft,
                  }}
                  thumbColor={isFavorite ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>

              {/* ── Save button ── */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Guardar color</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
