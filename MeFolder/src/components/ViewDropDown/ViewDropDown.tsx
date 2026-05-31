import {
  View,
  Text,
  Modal,
  Animated,
  Switch,
  useWindowDimensions,
} from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { getResponsiveSize } from "@/utils/ui/responsive";
import { useTheme } from "@/providers";
import { MultiActionButton } from "../MultiActionButton";
import { useRef, useState } from "react";
import { useViewDropDownStyles } from "./styles";
import { FolderViewMode, ViewOptions } from "@/types/entities/folder";

interface ViewDropDownProps {
  disabled?: boolean;
  size?: number;
  onChange?: (selectedMode: {
    id: FolderViewMode;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => void;
  defaultValue?: FolderViewMode;
  viewOptions?: ViewOptions;
  onViewOptionsChange?: (options: ViewOptions) => void;
}

export default function ViewDropDown({
  disabled = false,
  size = 38,
  onChange,
  defaultValue = "list",
  viewOptions = { showExtension: true, showHiddenFiles: false },
  onViewOptionsChange,
}: ViewDropDownProps = {}) {
  const { width: screenWidth } = useWindowDimensions();
  const responsive = getResponsiveSize(screenWidth);
  const { theme } = useTheme();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const selectedViewMode = defaultValue;

  const viewModes: {
    id: FolderViewMode;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "list", name: "Lista", icon: "menu-outline" },
    { id: "big_icon", name: "Iconos grandes", icon: "square-outline" },
    { id: "medium_icon", name: "Iconos medianos", icon: "stop-outline" },
    { id: "small_icon", name: "Iconos pequeños", icon: "stop-outline" },
    { id: "content", name: "Contenido", icon: "list-outline" },
    { id: "grid", name: "Mosaico", icon: "grid-outline" },
  ];

  const styles = useViewDropDownStyles(responsive);

  /**
   * Maneja el evento de presión del botón
   */
  const toggleDropdown = () => {
    if (!isDropdownVisible) {
      setIsDropdownVisible(true);
      setShowOptionsPanel(false);
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

  const selectViewMode = (mode: {
    id: FolderViewMode;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    onChange?.(mode);
    toggleDropdown();
  };

  return (
    <>
      <MultiActionButton
        icon={"eye-outline"}
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
              {showOptionsPanel ? (
                <>
                  <View style={styles.dropdownHeader}>
                    <TouchableOpacity
                      style={styles.headerBackButton}
                      onPress={() => setShowOptionsPanel(false)}
                    >
                      <Ionicons
                        name="chevron-back-outline"
                        size={responsive.iconSize * 0.45}
                        style={styles.IconColor}
                      />
                      <View style={styles.headerTextGroup}>
                        <Text style={styles.dropdownTitle}>Mostrar</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.dropdownItem, styles.switchItem]}>
                    <View style={styles.itemIconWrapper}>
                      <Ionicons
                        name="text-outline"
                        size={responsive.iconSize * 0.5}
                        style={styles.IconColor}
                      />
                    </View>
                    <View style={styles.itemTextGroup}>
                      <Text style={styles.itemText}>Extensiones</Text>
                    </View>
                    <Switch
                      value={viewOptions.showExtension}
                      onValueChange={(value) =>
                        onViewOptionsChange?.({
                          ...viewOptions,
                          showExtension: value,
                        })
                      }
                      trackColor={{
                        false: theme.colors.borderSoft,
                        true: theme.colors.primary,
                      }}
                      thumbColor={theme.colors.surface}
                      ios_backgroundColor={theme.colors.borderSoft}
                    />
                  </View>
                  <View style={[styles.dropdownItem, styles.switchItem]}>
                    <View style={styles.itemIconWrapper}>
                      <Ionicons
                        name="eye-off-outline"
                        size={responsive.iconSize * 0.5}
                        style={styles.IconColor}
                      />
                    </View>
                    <View style={styles.itemTextGroup}>
                      <Text style={styles.itemText}>Archivos ocultos</Text>
                    </View>
                    <Switch
                      value={viewOptions.showHiddenFiles}
                      onValueChange={(value) =>
                        onViewOptionsChange?.({
                          ...viewOptions,
                          showHiddenFiles: value,
                        })
                      }
                      trackColor={{
                        false: theme.colors.borderSoft,
                        true: theme.colors.primary,
                      }}
                      thumbColor={theme.colors.surface}
                      ios_backgroundColor={theme.colors.borderSoft}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.dropdownHeader}>
                    <View style={styles.headerTextGroup}>
                      <Text style={styles.dropdownTitle}>Vista</Text>
                    </View>
                  </View>
                  {viewModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.dropdownItem,
                        selectedViewMode === mode.id && styles.selectedItem,
                      ]}
                      onPress={() => selectViewMode(mode)}
                    >
                      <View
                        style={[
                          styles.itemIconWrapper,
                          selectedViewMode === mode.id &&
                            styles.selectedItemIconWrapper,
                        ]}
                      >
                        <Ionicons
                          name={mode.icon}
                          size={responsive.iconSize * 0.5}
                          style={[
                            styles.IconColor,
                            selectedViewMode === mode.id &&
                              styles.selectedIconColor,
                          ]}
                        />
                      </View>
                      <View style={styles.itemTextGroup}>
                        <Text
                          style={[
                            styles.itemText,
                            selectedViewMode === mode.id &&
                              styles.selectedItemText,
                          ]}
                        >
                          {mode.name}
                        </Text>
                      </View>
                      {selectedViewMode === mode.id && (
                        <Ionicons
                          name={"checkmark-circle"}
                          size={responsive.iconSize * 0.42}
                          style={styles.checkmark}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => setShowOptionsPanel(true)}
                  >
                    <View style={styles.itemIconWrapper}>
                      <Ionicons
                        name="options-outline"
                        size={responsive.iconSize * 0.5}
                        style={styles.IconColor}
                      />
                    </View>
                    <View style={styles.itemTextGroup}>
                      <Text style={styles.itemText}>Mostrar</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={responsive.iconSize * 0.45}
                      style={styles.trailingIcon}
                    />
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
