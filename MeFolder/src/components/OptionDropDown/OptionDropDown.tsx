import { View, Text, Modal, Animated } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { MultiActionButton } from "../MultiActionButton";
import { useRef, useState } from "react";
import { useOptionDropDownStyles } from "./styles";
import { OptionsType } from "@/types/ui/components";
import { OptionsIds } from "@/types";

export interface OptionDropDownProps {
  disabled?: boolean;
  size?: number;
  showProperties?: boolean;
  options?: OptionsType[];
  onSelect?: (options: OptionsType) => void;
}

export default function OptionDropDown({
  disabled = false,
  size = 38,
  showProperties = true,
  options: customOptions,
  onSelect,
}: OptionDropDownProps = {}) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const allOptions: OptionsType[] = [
    {
      id: OptionsIds.SELECT_ALL,
      name: "Seleccionar todo",
      icon: "menu-outline",
    },
    {
      id: OptionsIds.NO_SELECT,
      name: "No seleccionar",
      icon: "grid-outline",
    },
    {
      id: OptionsIds.INVERT_SELECT,
      name: "Invertir selección",
      icon: "stop-outline",
    },
    {
      id: OptionsIds.PROPERTIES,
      name: "Propiedades",
      icon: "build-outline",
    },
    {
      id: OptionsIds.SETTINGS,
      name: "Configuración",
      icon: "settings-outline",
    },
  ];

  const options =
    customOptions ??
    (showProperties
      ? allOptions
      : allOptions.filter((o) => o.id !== OptionsIds.PROPERTIES));

  const selectionOptionIds = new Set<OptionsType["id"]>([
    OptionsIds.SELECT_ALL,
    OptionsIds.NO_SELECT,
    OptionsIds.INVERT_SELECT,
  ]);

  const styles = useOptionDropDownStyles();

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

  const shouldShowGroupSeparator = (option: OptionsType) => {
    if (option.id !== OptionsIds.PROPERTIES) {
      return false;
    }

    return options.some((currentOption) =>
      selectionOptionIds.has(currentOption.id),
    );
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
                <View style={styles.headerTextGroup}>
                  <Text style={styles.dropdownTitle}>Ver más</Text>
                </View>
              </View>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    shouldShowGroupSeparator(option) &&
                      styles.groupSeparatorItem,
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <View style={styles.itemIconWrapper}>
                    <Ionicons
                      name={option.icon}
                      size={12}
                      style={styles.IconColor}
                    />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text style={styles.itemText}>{option.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
