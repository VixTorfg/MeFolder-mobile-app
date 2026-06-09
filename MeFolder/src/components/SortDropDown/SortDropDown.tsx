import { View, Text, Modal, Animated } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { MultiActionButton } from "../MultiActionButton";
import { useRef, useState } from "react";
import { useSortDropDownStyles } from "./styles";
import { FolderSortBy, FolderSortOrder } from "@/types/entities/folder";

export interface SortDropDownProps {
  disabled?: boolean;
  size?: number;
  onChangeOrderBy: (orderBy: FolderSortBy) => void;
  onChangeSortValue: (sortValue: FolderSortOrder) => void;
  defaultSortValue?: FolderSortOrder;
  defaultOrderByValue?: FolderSortBy;
}

export default function SortDropDown({
  disabled = false,
  size = 38,
  onChangeOrderBy,
  onChangeSortValue,
  defaultSortValue = "asc",
  defaultOrderByValue = "name",
}: SortDropDownProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const selectedSortValue = defaultSortValue;
  const selectedOrderOption = defaultOrderByValue;

  const orderOptions: {
    id: FolderSortBy;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "name", name: "Nombre", icon: "text-outline" },
    { id: "date", name: "Fecha", icon: "calendar-outline" },
    { id: "size", name: "Tamaño", icon: "resize-outline" },
    { id: "type", name: "Tipo", icon: "pricetag-outline" },
  ];

  const sortOptions: {
    id: FolderSortOrder;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "asc", name: "Ascendente", icon: "arrow-up-outline" },
    { id: "desc", name: "Descendente", icon: "arrow-down-outline" },
  ];

  const styles = useSortDropDownStyles();

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

  const handleSelectOrderOption = (option: (typeof orderOptions)[number]) => {
    onChangeOrderBy?.(option.id);
    toggleDropdown();
  };

  const handleSelectSortOption = (option: (typeof sortOptions)[number]) => {
    onChangeSortValue?.(option.id);
    toggleDropdown();
  };

  return (
    <>
      <MultiActionButton
        icon={"swap-vertical"}
        size={size}
        backgroundColor="transparent"
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
                  <Text style={styles.dropdownTitle}>Ordenar</Text>
                </View>
              </View>
              <Text style={styles.sectionLabel}>Campo</Text>
              {orderOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    selectedOrderOption === option.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelectOrderOption(option)}
                >
                  <View
                    style={[
                      styles.itemIconWrapper,
                      selectedOrderOption === option.id &&
                        styles.selectedItemIconWrapper,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={12}
                      style={[
                        styles.IconColor,
                        selectedOrderOption === option.id &&
                          styles.selectedIconColor,
                      ]}
                    />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text
                      style={[
                        styles.itemText,
                        selectedOrderOption === option.id &&
                          styles.selectedItemText,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </View>
                  {selectedOrderOption === option.id && (
                    <Ionicons
                      name={"checkmark-circle"}
                      size={10}
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Dirección</Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    selectedSortValue === option.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelectSortOption(option)}
                >
                  <View
                    style={[
                      styles.itemIconWrapper,
                      selectedSortValue === option.id &&
                        styles.selectedItemIconWrapper,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={12}
                      style={[
                        styles.IconColor,
                        selectedSortValue === option.id &&
                          styles.selectedIconColor,
                      ]}
                    />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text
                      style={[
                        styles.itemText,
                        selectedSortValue === option.id &&
                          styles.selectedItemText,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </View>
                  {selectedSortValue === option.id && (
                    <Ionicons
                      name={"checkmark-circle"}
                      size={10}
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
