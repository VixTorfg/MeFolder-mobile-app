import { View, TouchableOpacity, Dimensions, Text, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getResponsiveSize } from '@/utils/ui/responsive';
import { MultiActionButton } from '../MultiActionButton';
import { useRef, useState } from 'react';
import { useViewDropDownStyles } from './styles';
import { ViewDropDownProps } from '@/types/ui/components';

const { width: screenWidth } = Dimensions.get('window'); 
const responsive = getResponsiveSize(screenWidth);

export default function ViewDropDown({
  disabled = false,
  size = 38,
  onChange,
  defaultValue = 'lista',
}: ViewDropDownProps = {}) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedViewMode, setSelectedViewMode] = useState(defaultValue);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const viewModes: {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: 'lista', name: 'Lista', icon: 'menu-outline' },
    { id: 'iconos-grandes', name: 'Iconos grandes', icon: 'square-outline'},
    { id: 'iconos-medianos', name: 'Iconos medianos', icon: 'stop-outline' },
    { id: 'iconos-pequeños', name: 'Iconos pequeños', icon: 'stop-outline'},
    { id: 'contenido', name: 'Contenido', icon: 'list-outline' },
    { id: 'mosaico', name: 'Mosaico', icon: 'grid-outline'},
  ];

  const styles = useViewDropDownStyles(responsive);
 
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
 
  const selectViewMode = (mode: any) => {
    setSelectedViewMode(mode.id);
    onChange?.(mode);
    toggleDropdown();
  };

  return (
    <>
    <MultiActionButton 
        icon={'eye-outline'} 
        size={size} 
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
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>Ver</Text>
                  </View>
                  {viewModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.dropdownItem,
                        selectedViewMode === mode.id && styles.selectedItem
                      ]}
                      onPress={() => selectViewMode(mode)}
                    >
                      <Ionicons 
                            name={mode.icon} 
                            size={responsive.iconSize * 0.55} 
                            style={[
                                styles.IconColor,
                                selectedViewMode === mode.id && styles.selectedIconColor
                            ]} 
                        />
                      <Text style={[
                        styles.itemText,
                        selectedViewMode === mode.id && styles.selectedItemText
                      ]}>
                        {mode.name}
                      </Text>
                      {selectedViewMode === mode.id && (
                        <Ionicons name={"ellipse"} size={responsive.iconSize * 0.25} style={styles.checkmark} />
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

