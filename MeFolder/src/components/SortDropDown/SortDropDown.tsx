import { View, Text, Modal, Animated, useWindowDimensions } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { getResponsiveSize } from "@/utils/ui/responsive";
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
  const { width: screenWidth } = useWindowDimensions();
  const responsive = getResponsiveSize(screenWidth);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const selectedSortValue = defaultSortValue;
  const selectedOrderOption = defaultOrderByValue;

  const orderOptions: {
    id: string;
    name: string;
  }[] = [
    { id: "name", name: "Nombre" },
    { id: "date", name: "Fecha" },
    { id: "size", name: "Tamaño" },
    { id: "type", name: "Tipo" },
  ];

  const sortOptions: {
    id: string;
    name: string;
  }[] = [
    { id: "asc", name: "Ascendente" },
    { id: "desc", name: "Descendente" },
  ];

  const styles = useSortDropDownStyles(responsive);

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

  const handleSelectOrderOption = (option: any) => {
    onChangeOrderBy?.(option.id);
    toggleDropdown();
  };

  const handleSelectSortOption = (option: any) => {
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
                <Text style={styles.dropdownTitle}>Ordenar</Text>
              </View>
              {orderOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    selectedOrderOption === option.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelectOrderOption(option)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      selectedOrderOption === option.id &&
                        styles.selectedItemText,
                    ]}
                  >
                    {option.name}
                  </Text>
                  {selectedOrderOption === option.id && (
                    <Ionicons
                      name={"ellipse"}
                      size={responsive.iconSize * 0.25}
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <View style={styles.divider} />
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    selectedSortValue === option.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelectSortOption(option)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      selectedSortValue === option.id &&
                        styles.selectedItemText,
                    ]}
                  >
                    {option.name}
                  </Text>
                  {selectedSortValue === option.id && (
                    <Ionicons
                      name={"ellipse"}
                      size={responsive.iconSize * 0.25}
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
