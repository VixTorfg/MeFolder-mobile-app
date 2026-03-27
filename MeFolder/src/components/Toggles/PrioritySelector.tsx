import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TagPriority } from '@/types/entities/tag';
import { usePrioritySelectorStyles } from './styles';

interface PriorityOption {
  value: TagPriority;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRIORITIES: PriorityOption[] = [
  { value: 'low',      label: 'Baja',     icon: 'arrow-down-outline'   },
  { value: 'normal',   label: 'Normal',   icon: 'remove-outline'       },
  { value: 'high',     label: 'Alta',     icon: 'arrow-up-outline'     },
  { value: 'critical', label: 'Muy Alta',  icon: 'alert-circle-outline' },
];

interface PrioritySelectorProps {
  selected: TagPriority;
  onSelect: (priority: TagPriority) => void;
}

export const PrioritySelector = ({ selected, onSelect }: PrioritySelectorProps) => {
  const styles = usePrioritySelectorStyles();

  return (
    <View style={styles.container}>
      {PRIORITIES.map((option) => {
        const isActive = selected === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isActive && styles[`${option.value}Option`],
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                isActive ? styles[`${option.value}Icon`] : styles.iconCircleInactive,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={isActive ? styles.iconActive.color : styles.iconInactive.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles[`${option.value}Label`],
              ]}
            >
              {option.label}
            </Text>
            {isActive && (
              <View style={[styles.dot, styles[`${option.value}Dot`]]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

