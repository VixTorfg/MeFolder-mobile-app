import { ColorInfo, SystemColorName } from "@/types/common/colors";
import { Colors } from "./types";

export const lightColors: Colors = {
  background: "#FAFAF7",
  backgroundSoft: "#F4F4EE",
  mediaBackdrop: "#0F1114",
  surface: "#FFFFFF",

  card: "#FFFFFF",
  subCard: "#F1F2EB",
  borderSoft: "#E2E3DA",

  textPrimary: "#2B2B28",
  textSecondary: "#6B6B63",
  textMuted: "#9A9A90",
  textOnColor: "#FFFFFF",

  primary: "#F2C94C",
  primaryHover: "#E6BC3E",
  primarySoft: "#FFF4CC",

  secondary: "#5DA9C7",
  secondarySoft: "#E6F3F8",

  success: "#6FCF97",
  successSoft: "#E8F6EF",

  warning: "#F2994A",
  warningSoft: "#FDEBD9",

  error: "#EB5757",
  errorSoft: "#FCEAEA",

  divider: "#E8E9E1",
  focusRing: "#F2C94C",

  folderColor: "#FFB300",
};

export const darkColors: Colors = {
  background: "#161613",
  backgroundSoft: "#1D1D19",
  mediaBackdrop: "#0F1114",
  surface: "#23231E",

  card: "#25251F",
  subCard: "#2C2C25",
  borderSoft: "#34342C",

  textPrimary: "#F5F5EF",
  textSecondary: "#C7C7BC",
  textMuted: "#9E9E92",
  textOnColor: "#1A1A17",

  primary: "#F2C94C",
  primaryHover: "#FFD970",
  primarySoft: "rgba(242, 201, 76, 0.15)",

  secondary: "#6FB6D6",
  secondarySoft: "rgba(111, 182, 214, 0.15)",

  success: "#6FCF97",
  successSoft: "rgba(111, 207, 151, 0.15)",

  warning: "#F2994A",
  warningSoft: "rgba(242, 153, 74, 0.18)",

  error: "#EB5757",
  errorSoft: "rgba(235, 87, 87, 0.18)",

  divider: "#2E2E27",
  focusRing: "#F2C94C",

  folderColor: "#FFB300",
};

export const defaultColor: ColorInfo = {
  hex: lightColors.primary,
  rgb: {
    r: parseInt(lightColors.primary.slice(1, 3), 16),
    g: parseInt(lightColors.primary.slice(3, 5), 16),
    b: parseInt(lightColors.primary.slice(5, 7), 16),
  },
  name: "Primary",
  isSystem: false,
  isFavorite: false,
};

export const SYSTEM_COLORS: Record<SystemColorName, ColorInfo> = {
  yellow: {
    hex: "#F2C94C",
    rgb: { r: 242, g: 201, b: 76 },
    name: "Yellow",
    isSystem: true,
    isFavorite: false,
    systemName: "yellow",
  },
  red: {
    hex: "#EB5757",
    rgb: { r: 235, g: 87, b: 87 },
    name: "Red",
    isSystem: true,
    isFavorite: false,
    systemName: "red",
  },
  blue: {
    hex: "#5DA9C7",
    rgb: { r: 93, g: 169, b: 199 },
    name: "Blue",
    isSystem: true,
    isFavorite: false,
    systemName: "blue",
  },
  green: {
    hex: "#6FCF97",
    rgb: { r: 111, g: 207, b: 151 },
    name: "Green",
    isSystem: true,
    isFavorite: false,
    systemName: "green",
  },
  purple: {
    hex: "#9B51E0",
    rgb: { r: 155, g: 81, b: 224 },
    name: "Purple",
    isSystem: true,
    isFavorite: false,
    systemName: "purple",
  },
  orange: {
    hex: "#F2994A",
    rgb: { r: 242, g: 153, b: 74 },
    name: "Orange",
    isSystem: true,
    isFavorite: false,
    systemName: "orange",
  },
  pink: {
    hex: "#F06292",
    rgb: { r: 240, g: 98, b: 146 },
    name: "Pink",
    isSystem: true,
    isFavorite: false,
    systemName: "pink",
  },
  cyan: {
    hex: "#4DB6AC",
    rgb: { r: 77, g: 182, b: 172 },
    name: "Cyan",
    isSystem: true,
    isFavorite: false,
    systemName: "cyan",
  },
  gray: {
    hex: "#9A9A90",
    rgb: { r: 154, g: 154, b: 144 },
    name: "Gray",
    isSystem: true,
    isFavorite: false,
    systemName: "gray",
  },
  black: {
    hex: "#2B2B28",
    rgb: { r: 43, g: 43, b: 40 },
    name: "Black",
    isSystem: true,
    isFavorite: false,
    systemName: "black",
  },
};
