import { Ionicons } from '@expo/vector-icons';
import { Toggle }  from './Toggle';
import { View, Text } from 'react-native';
import { useTogglesChildrenStyles } from './styles';

interface TogglesAlbumProps {
    onToggle: () => void;
    isActive: boolean;
}

export const ToggleAlbum = ({ onToggle, isActive }: TogglesAlbumProps) => {
    const styles = useTogglesChildrenStyles();
    return (
        <Toggle onToggle={onToggle} isActive={isActive}>
            <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, isActive && styles.optionIconActive]}>
                <Ionicons
                    name="albums-outline"
                    size={20}
                    color={isActive ? styles.textOnColor.color : styles.textPrimary.color}
                />
                </View>
                <View>
                <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
                    Álbum
                </Text>
                <Text style={styles.optionDescription}>
                    Agrupar archivos como un álbum
                </Text>
                </View>
            </View>
            <View style={[styles.optionToggle, isActive && styles.optionToggleActive]}>
                <View style={[styles.optionToggleKnob, isActive && styles.optionToggleKnobActive]} />
            </View>
        </Toggle>
    );
}