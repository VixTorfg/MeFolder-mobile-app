import { FileCategory } from "@/types";
import { Ionicons } from "@expo/vector-icons";

export const getIconByCategory = (category: FileCategory): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'video':
      return 'videocam-outline';
    case 'audio':
      return 'musical-notes-outline';
    case 'image':
      return 'image-outline';
    case 'code':
      return 'code-slash-outline';
    case 'document':
      return 'document-outline';
    case 'archive':
      return 'archive-outline';
    case 'spreadsheet':
      return 'grid-outline';
    default:
      return 'document-outline';
  }
};