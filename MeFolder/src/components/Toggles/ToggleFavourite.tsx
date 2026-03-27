import { Ionicons } from '@expo/vector-icons';
import { Toggle }  from './Toggle';
import { View, Text } from 'react-native';
import { useTogglesChildrenStyles } from './styles';

interface ToggleFavouriteProps {
    onToggle: () => void;
    isActive: boolean;
}

export const ToggleFavourite = ({ onToggle, isActive }: ToggleFavouriteProps) => {
    const styles = useTogglesChildrenStyles();
    return (
        <Toggle onToggle={onToggle} isActive={isActive}>
            <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, isActive && styles.optionIconActive]}>
                <Ionicons
                    name={isActive ? 'star' : 'star-outline'}
                    size={20}
                    color={isActive ? styles.textOnColor.color : styles.textPrimary.color}
                />
                </View>
                <View>
                <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
                    Favorito
                </Text>
                <Text style={styles.optionDescription}>
                    Marcar como etiqueta favorita
                </Text>
                </View>
            </View>
            <View style={[styles.optionToggle, isActive && styles.optionToggleActive]}>
                <View style={[styles.optionToggleKnob, isActive && styles.optionToggleKnobActive]} />
            </View>
        </Toggle>
    );
}