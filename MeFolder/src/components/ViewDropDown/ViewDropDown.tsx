import {
  View,
  TouchableOpacity,
  Dimensions,
  Text,
  Modal,
  Animated,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getResponsiveSize } from "@/utils/ui/responsive";
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

const { width: screenWidth } = Dimensions.get("window");
const responsive = getResponsiveSize(screenWidth);

export default function ViewDropDown({
  disabled = false,
  size = 38,
  onChange,
  defaultValue = "list",
  viewOptions = { showExtension: true, showHiddenFiles: false },
  onViewOptionsChange,
}: ViewDropDownProps = {}) {
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

  const selectViewMode = (mode: any) => {
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
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                      onPress={() => setShowOptionsPanel(false)}
                    >
                      <Ionicons
                        name="chevron-back-outline"
                        size={responsive.iconSize * 0.45}
                        style={styles.IconColor}
                      />
                      <Text style={styles.dropdownTitle}>Mostrar</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dropdownItem}>
                    <Ionicons
                      name="text-outline"
                      size={responsive.iconSize * 0.55}
                      style={styles.IconColor}
                    />
                    <Text style={styles.itemText}>Extensiones</Text>
                    <Switch
                      value={viewOptions.showExtension}
                      onValueChange={(value) =>
                        onViewOptionsChange?.({
                          ...viewOptions,
                          showExtension: value,
                        })
                      }
                    />
                  </View>
                  <View style={styles.dropdownItem}>
                    <Ionicons
                      name="eye-off-outline"
                      size={responsive.iconSize * 0.55}
                      style={styles.IconColor}
                    />
                    <Text style={styles.itemText}>Archivos ocultos</Text>
                    <Switch
                      value={viewOptions.showHiddenFiles}
                      onValueChange={(value) =>
                        onViewOptionsChange?.({
                          ...viewOptions,
                          showHiddenFiles: value,
                        })
                      }
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>Ver</Text>
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
                      <Ionicons
                        name={mode.icon}
                        size={responsive.iconSize * 0.55}
                        style={[
                          styles.IconColor,
                          selectedViewMode === mode.id &&
                            styles.selectedIconColor,
                        ]}
                      />
                      <Text
                        style={[
                          styles.itemText,
                          selectedViewMode === mode.id &&
                            styles.selectedItemText,
                        ]}
                      >
                        {mode.name}
                      </Text>
                      {selectedViewMode === mode.id && (
                        <Ionicons
                          name={"ellipse"}
                          size={responsive.iconSize * 0.25}
                          style={styles.checkmark}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => setShowOptionsPanel(true)}
                  >
                    <Ionicons
                      name="options-outline"
                      size={responsive.iconSize * 0.55}
                      style={styles.IconColor}
                    />
                    <Text style={styles.itemText}>Mostrar</Text>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={responsive.iconSize * 0.45}
                      style={styles.IconColor}
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
