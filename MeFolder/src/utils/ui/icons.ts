import { FileCategory } from "@/types";
import { Ionicons } from "@expo/vector-icons";

export const getIconByCategory = (
  category: FileCategory,
): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case "video":
      return "videocam-outline";
    case "audio":
      return "musical-notes-outline";
    case "image":
      return "image-outline";
    case "code":
      return "code-slash-outline";
    case "document":
      return "document-outline";
    case "archive":
      return "archive-outline";
    case "spreadsheet":
      return "grid-outline";
    default:
      return "document-outline";
  }
};

/**
 * Detecta si un nombre de icono pertenece a Ionicons.
 * Prioriza Ionicons sobre MaterialCommunityIcons.
 */
export const isIoniconsIcon = (name: string): boolean => {
  if (name === "folder") return false;
  return name in Ionicons.glyphMap;
};
