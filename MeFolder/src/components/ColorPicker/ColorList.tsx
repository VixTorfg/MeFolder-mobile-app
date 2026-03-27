import { ColorInfo } from "@/types/common/colors";
import { Ionicons } from "@expo/vector-icons";
import { useColorListStyles } from "./styles";
import { TouchableOpacity, View } from "react-native";
import ColorPicker from "./ColorPicker";


interface ColorListProps {
    colors: ColorInfo[];
    selectedColor: ColorInfo | null;
    onSelect: (color: ColorInfo) => void;
    onAddColor: () => void;
    showPicker: boolean;
    onClosePicker: () => void;
    onSavePickerColor: (color: ColorInfo) => Promise<void> | void; 
}

export const ColorList = ({ 
    colors, 
    selectedColor, 
    onSelect, 
    onAddColor, 
    showPicker, 
    onClosePicker, 
    onSavePickerColor 
}: ColorListProps) => {
    const styles = useColorListStyles();

    return(
        <>
       
            <View style={styles.colorList}>
            {colors.map((color) => (
                <TouchableOpacity
                key={color.hex}
                style={[
                    styles.colorOption,
                    selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => onSelect(color)}
                activeOpacity={0.7}
                >
                <View
                    style={[styles.colorOptionInner, { backgroundColor: color.hex }]}
                />
                {color.isFavorite && (
                    <Ionicons
                    name="star"
                    size={16}
                    color={styles.favoriteIconColor.color}
                    style={styles.favoriteIcon}
                    />
                )}
                </TouchableOpacity>
            ))}

            {/* Agregar color personalizado */}
            <TouchableOpacity
                style={styles.colorOption}
                onPress={onAddColor}
                activeOpacity={0.7}
            >
                <View style={styles.addButtonInner}>
                    <Ionicons name="add" size={18} color={styles.addIconColor.color} />
                </View>
            </TouchableOpacity>
            </View>

        <ColorPicker
            visible={showPicker}
            onClose={onClosePicker}
            onSave={onSavePickerColor}
        />
      </>
    )
}