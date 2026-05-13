import { ColorInfo } from "@/types/common/colors";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { useTagPreviewStyles } from "./styles";

interface TagPreviewProps {
    name: string;
    color: ColorInfo;
    isAlbum: boolean;
    isFavorite: boolean;
}

export const TagPreview = ({ name, color, isAlbum, isFavorite }: TagPreviewProps) => {
  const styles = useTagPreviewStyles();
 
  return ( 
     <View style={styles.previewContainer}>
          <View style={[styles.previewTag, { borderColor: color.hex }]}>
            <View style={[styles.previewDot, { backgroundColor: color.hex }]} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.previewTagText}>
              {name.trim() || 'Etiqueta'}
            </Text>
            {isAlbum && (
              <Ionicons name="albums" size={14} color={styles.isAlbum.color} />
            )}
            {isFavorite && (
              <Ionicons name="star" size={14} color={styles.isFavorite.color} />
            )}
        </View>
    </View>
  )
}