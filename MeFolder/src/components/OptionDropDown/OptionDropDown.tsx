import {
  View,
  TouchableOpacity,
  Dimensions,
  Text,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getResponsiveSize } from "@/utils/ui/responsive";
import { MultiActionButton } from "../MultiActionButton";
import { useRef, useState } from "react";
import { useOptionDropDownStyles } from "./styles";
import { OptionsType } from "@/types/ui/components";

export interface OptionDropDownProps {
  disabled?: boolean;
  size?: number;
  onSelect?: (options: OptionsType) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const responsive = getResponsiveSize(screenWidth);

export default function OptionDropDown({
  disabled = false,
  size = 38,
  onSelect,
}: OptionDropDownProps = {}) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const options: OptionsType[] = [
    { id: "select_all", name: "Seleccionar todo", icon: "menu-outline" },
    { id: "no_select", name: "No seleccionar", icon: "grid-outline" },
    { id: "invert_select", name: "Invertir selección", icon: "stop-outline" },
    { id: "properties", name: "Propiedades", icon: "build-outline" },
    { id: "settings", name: "Configuración", icon: "settings-outline" },
  ];

  const styles = useOptionDropDownStyles(responsive);

  /**
   * Maneja el evento de presión del botón
   */
  const toggleDropdown = () => {
    if (!isDropdownVisible) {
      setIsDropdownVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsDropdownVisible(false);
      });
    }
  };

  const handleSelect = (option: OptionsType) => {
    onSelect?.(option);
    toggleDropdown();
  };

  return (
    <>
      <MultiActionButton
        icon={"ellipsis-vertical"}
        size={size}
        backgroundColor={"transparent"}
        iconColor={styles.primary.color}
        onPress={toggleDropdown}
        disabled={disabled}
      />

      <Modal
        transparent={true}
        visible={isDropdownVisible}
        onRequestClose={toggleDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <View style={styles.dropdownContainer}>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Ver Más</Text>
              </View>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={
                    option.id === "properties"
                      ? styles.optionDropdownItem
                      : styles.dropdownItem
                  }
                  onPress={() => handleSelect(option)}
                >
                  <Ionicons
                    name={option.icon}
                    size={responsive.iconSize * 0.55}
                    style={styles.IconColor}
                  />
                  <Text style={styles.itemText}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
