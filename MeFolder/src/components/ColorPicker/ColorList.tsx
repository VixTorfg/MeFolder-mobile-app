import { ColorInfo } from "@/types/common/colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers";
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
    const { theme } = useTheme();
    const styles = useColorListStyles();

    return(
        <>
       
            <View style={styles.colorList}>
            {colors.map((color, index) => (
                <TouchableOpacity
                key={index}
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
                    color={theme.colors.primary}
                    style={{ position: 'absolute', top: 20, right: 0 }}
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
                <View
                style={[
                    styles.colorOptionInner,
                    {
                        borderWidth: 1.5,
                        borderColor: theme.colors.borderSoft,
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                ]}
                >
                <Ionicons name="add" size={18} color={theme.colors.textSecondary} />
                </View>
            </TouchableOpacity>
            </View>

        <ColorPicker
            visible={showPicker}
            onClose={onClosePicker}
            onSave={async (data) => await onSavePickerColor(data)}
        />
      </>
    )
}