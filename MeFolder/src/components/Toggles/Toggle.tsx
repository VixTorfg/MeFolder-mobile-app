import { TouchableOpacity } from "react-native"
import { useTogglesStyles } from "./styles";

interface TogglesProps {
    onToggle: () => void;
    isActive: boolean;
    children: React.ReactNode;
}

export const Toggle = ({onToggle, isActive, children}: TogglesProps) => {
    const styles = useTogglesStyles();
    return (
        <TouchableOpacity
          style={[styles.optionRow, isActive && styles.optionRowActive]}
          onPress={onToggle}
          activeOpacity={0.7}
        >
            {children}
        </TouchableOpacity>
    )
}