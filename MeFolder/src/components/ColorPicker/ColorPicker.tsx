import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlert, useTheme } from "@/providers";
import { useColorPickerStyles } from "./styles";
import { BottomSheet } from "@/animations";
import { ColorInfo } from "@/types/common/colors";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const GRAYSCALE_STEPS = [
  "#FFFFFF",
  "#E0E0E0",
  "#C0C0C0",
  "#A0A0A0",
  "#808080",
  "#606060",
  "#404040",
  "#202020",
  "#000000",
];

const HUE_STEPS = 36;

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
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
  const toHex = (v: number) => clamp(v, 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex
    .replace("#", "")
    .match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
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

const COLOR_MAP_COLS = 12;
const COLOR_MAP_ROWS = 10;

function buildColorMapGrid(hue: number, lightnessLevel: number): string[][] {
  const grid: string[][] = [];
  const t = lightnessLevel / (GRAYSCALE_STEPS.length - 1);
  const center = 0.8 - t * 0.6;
  const halfRange = 0.425 - Math.abs(t - 0.5) * 0.49;
  const minL = Math.max(0.02, center - halfRange);
  const maxL = Math.min(0.98, center + halfRange);

  for (let row = 0; row < COLOR_MAP_ROWS; row++) {
    const rowColors: string[] = [];
    const rowT = 1 - row / (COLOR_MAP_ROWS - 1);
    const lightness = minL + rowT * (maxL - minL);
    for (let col = 0; col < COLOR_MAP_COLS; col++) {
      const saturation = col / (COLOR_MAP_COLS - 1);
      const rgb = hslToRgb(hue, saturation, lightness);
      rowColors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    grid.push(rowColors);
  }
  return grid;
}

export interface ColorPickerProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: ColorInfo) => Promise<void> | void;
  onDelete?: (data: ColorInfo) => Promise<void> | void;
  initialData?: {
    color: ColorInfo | null;
    name: string;
    isFavorite: boolean;
    isSystem?: boolean;
  };
  showDeleteButton?: boolean;
}

export default function ColorPicker({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
  showDeleteButton = false,
}: ColorPickerProps) {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const styles = useColorPickerStyles();

  const initRgb = initialData?.color?.rgb ?? { r: 242, g: 201, b: 76 };
  const initHsl = rgbToHsl(initRgb.r, initRgb.g, initRgb.b);

  const [hue, setHue] = useState(initHsl.h);
  const [selectedR, setSelectedR] = useState(initRgb.r);
  const [selectedG, setSelectedG] = useState(initRgb.g);
  const [selectedB, setSelectedB] = useState(initRgb.b);
  const [hexText, setHexText] = useState(
    rgbToHex(initRgb.r, initRgb.g, initRgb.b),
  );
  const [colorName, setColorName] = useState(initialData?.name ?? "");
  const [isFavorite, setIsFavorite] = useState(
    initialData?.isFavorite ?? false,
  );
  const [lightnessLevel, setLightnessLevel] = useState(4);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const [hexFocused, setHexFocused] = useState(false);
  const [rFocused, setRFocused] = useState(false);
  const [gFocused, setGFocused] = useState(false);
  const [bFocused, setBFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const isEditingExistingColor = Boolean(
    initialData?.color?.id && !initialData?.color?.isSystem,
  );

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const nextRgb = initialData?.color?.rgb ?? { r: 242, g: 201, b: 76 };
    const nextHsl = rgbToHsl(nextRgb.r, nextRgb.g, nextRgb.b);

    setHue(nextHsl.h);
    setSelectedR(nextRgb.r);
    setSelectedG(nextRgb.g);
    setSelectedB(nextRgb.b);
    setHexText(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
    setColorName(initialData?.name ?? "");
    setIsFavorite(initialData?.isFavorite ?? false);
    setLightnessLevel(4);
    setSelectedCell(null);
  }, [visible, initialData]);

  const currentHex = rgbToHex(selectedR, selectedG, selectedB);

  const colorGrid = useMemo(
    () => buildColorMapGrid(hue, lightnessLevel),
    [hue, lightnessLevel],
  );

  const hueBarColors = useMemo(() => {
    const colors: string[] = [];
    for (let i = 0; i <= HUE_STEPS; i++) {
      const h = (i / HUE_STEPS) * 360;
      const rgb = hslToRgb(h, 1, 0.5);
      colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors;
  }, []);

  const applyRgb = useCallback((r: number, g: number, b: number) => {
    setSelectedR(r);
    setSelectedG(g);
    setSelectedB(b);
    setHexText(rgbToHex(r, g, b));
    const hsl = rgbToHsl(r, g, b);
    setHue(hsl.h);
  }, []);

  const applyFromCell = useCallback(
    (row: number, col: number, grid: string[][]) => {
      const hex = grid[row]?.[col];
      if (!hex) return;
      const rgb = hexToRgb(hex);
      if (rgb) {
        setSelectedR(rgb.r);
        setSelectedG(rgb.g);
        setSelectedB(rgb.b);
        setHexText(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
    },
    [],
  );

  const handleColorCellPress = useCallback(
    (hex: string, row: number, col: number) => {
      setSelectedCell({ row, col });
      const rgb = hexToRgb(hex);
      if (rgb) applyRgb(rgb.r, rgb.g, rgb.b);
    },
    [applyRgb],
  );

  const handleGrayscalePress = useCallback(
    (index: number) => {
      setLightnessLevel(index);
      if (selectedCell) {
        const newGrid = buildColorMapGrid(hue, index);
        applyFromCell(selectedCell.row, selectedCell.col, newGrid);
      }
    },
    [selectedCell, hue, applyFromCell],
  );

  const handleHueCellPress = useCallback(
    (index: number) => {
      const newHue = (index / HUE_STEPS) * 360;
      setHue(newHue);
      if (selectedCell) {
        const newGrid = buildColorMapGrid(newHue, lightnessLevel);
        applyFromCell(selectedCell.row, selectedCell.col, newGrid);
      } else {
        const rgb = hslToRgb(newHue, 1, 0.5);
        setSelectedR(rgb.r);
        setSelectedG(rgb.g);
        setSelectedB(rgb.b);
        setHexText(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
    },
    [selectedCell, lightnessLevel, applyFromCell],
  );

  const handleHexSubmit = useCallback(() => {
    const clean = hexText.startsWith("#") ? hexText : `#${hexText}`;
    const rgb = hexToRgb(clean);
    if (rgb) {
      applyRgb(rgb.r, rgb.g, rgb.b);
    } else {
      setHexText(currentHex);
    }
  }, [hexText, currentHex, applyRgb]);

  const handleRgbChange = useCallback(
    (channel: "r" | "g" | "b", value: string) => {
      const num = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(num)) return;
      const clamped = clamp(num, 0, 255);
      const r = channel === "r" ? clamped : selectedR;
      const g = channel === "g" ? clamped : selectedG;
      const b = channel === "b" ? clamped : selectedB;
      applyRgb(r, g, b);
    },
    [selectedR, selectedG, selectedB, applyRgb],
  );

  const handleSave = useCallback(() => {
    const trimmedName = colorName.trim();
    if (!trimmedName) {
      showAlert({
        title: "Error",
        message: "Es necesario asignar un nombre al color para guardarlo.",
      });
      return;
    }

    const colorInfo: ColorInfo = {
      ...(initialData?.color?.id && { id: initialData.color.id }),
      hex: currentHex,
      rgb: { r: selectedR, g: selectedG, b: selectedB },
      name: trimmedName,
      isSystem: initialData?.color?.isSystem ?? initialData?.isSystem ?? false,
      isFavorite,
    };

    onSave?.(colorInfo);
    onClose();
  }, [
    currentHex,
    selectedR,
    selectedG,
    selectedB,
    colorName,
    isFavorite,
    onSave,
    onClose,
    initialData,
  ]);

  const handleDelete = useCallback(() => {
    if (initialData?.color?.isSystem ?? initialData?.isSystem) {
      showAlert({
        title: "Error",
        message: "No se puede eliminar un color del sistema.",
      });
      return;
    }

    showAlert({
      title: "Confirmar eliminación",
      message:
        "¿Estás seguro de que quieres eliminar este color personalizado?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const colorInfo: ColorInfo = {
              ...(initialData?.color?.id && { id: initialData.color.id }),
              hex: currentHex,
              rgb: { r: selectedR, g: selectedG, b: selectedB },
              name: colorName.trim(),
              isSystem:
                initialData?.color?.isSystem ?? initialData?.isSystem ?? false,
              isFavorite,
            };

            onDelete?.(colorInfo);
            onClose();
          },
        },
      ],
    });
  }, [
    onClose,
    onDelete,
    currentHex,
    selectedR,
    selectedG,
    selectedB,
    colorName,
    isFavorite,
    initialData,
  ]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Personalizar color">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SCREEN_HEIGHT * 0.08 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.colorMapSection}>
          <Text style={styles.label}>Seleccionar color</Text>
          <View style={styles.colorMapRow}>
            <View style={styles.colorMapContainer}>
              {colorGrid.map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    marginBottom: rowIdx < COLOR_MAP_ROWS - 1 ? -1 : 0,
                  }}
                >
                  {row.map((cellHex, colIdx) => (
                    <TouchableOpacity
                      key={`${rowIdx}-${colIdx}`}
                      style={{
                        flex: 1,
                        backgroundColor: cellHex,
                        borderWidth:
                          selectedCell?.row === rowIdx &&
                          selectedCell?.col === colIdx
                            ? 2
                            : 0,
                        borderColor: "#FFFFFF",
                      }}
                      onPress={() =>
                        handleColorCellPress(cellHex, rowIdx, colIdx)
                      }
                      activeOpacity={0.8}
                    />
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.grayscaleStrip}>
              {GRAYSCALE_STEPS.map((gray, index) => (
                <TouchableOpacity
                  key={gray}
                  style={[
                    styles.grayscaleCell,
                    {
                      marginBottom: index < GRAYSCALE_STEPS.length - 1 ? -1 : 0,
                      backgroundColor: gray,
                      borderWidth: index === lightnessLevel ? 2 : 0,
                      borderColor: gray === "#FFFFFF" ? "#000" : "#FFF",
                    },
                  ]}
                  onPress={() => handleGrayscalePress(index)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>
        </View>

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

        <View style={styles.previewSection}>
          <View
            style={[styles.previewCircle, { backgroundColor: currentHex }]}
          />
          <View style={styles.previewInfo}>
            <Text style={styles.previewLabel}>Vista previa</Text>
            <Text style={styles.previewHex}>{currentHex}</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Hexadecimal</Text>
          <TextInput
            style={[styles.hexInput, hexFocused && styles.hexInputFocused]}
            value={hexText}
            onChangeText={setHexText}
            onBlur={() => {
              setHexFocused(false);
              handleHexSubmit();
            }}
            onFocus={() => setHexFocused(true)}
            onSubmitEditing={handleHexSubmit}
            placeholder="#F2C94C"
            placeholderTextColor={theme.colors.textMuted}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>RGB</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>R</Text>
              <TextInput
                style={[styles.textInput, rFocused && styles.textInputFocused]}
                value={String(selectedR)}
                onChangeText={(v) => handleRgbChange("r", v)}
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
                onChangeText={(v) => handleRgbChange("g", v)}
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
                onChangeText={(v) => handleRgbChange("b", v)}
                onFocus={() => setBFocused(true)}
                onBlur={() => setBFocused(false)}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.label}>Nombre</Text>
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

        <View style={styles.favoriteSection}>
          <View style={styles.favoriteLabel}>
            <Ionicons
              name={isFavorite ? "star" : "star-outline"}
              size={22}
              color={
                isFavorite ? theme.colors.warning : theme.colors.textSecondary
              }
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
            thumbColor={
              isFavorite ? theme.colors.primary : theme.colors.textMuted
            }
          />
        </View>

        <View style={styles.buttonBottomRow}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              showDeleteButton && styles.actionButtonCompact,
            ]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {isEditingExistingColor ? "Actualizar color" : "Guardar color"}
            </Text>
          </TouchableOpacity>

          {showDeleteButton && (
            <TouchableOpacity
              style={[styles.deleteButton, styles.actionButtonCompact]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Eliminar color</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
