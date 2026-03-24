import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '@/themes/themes';
import type { RouteName} from '@/types';
import { getResponsiveSize } from '@/utils/ui/responsive';
import { useFloatingTabBarStyles } from './styles';

const { width: screenWidth } = Dimensions.get('window'); 
const responsive = getResponsiveSize(screenWidth);

interface FloatingTabBarProps {
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  borderRadius?: number;
  borderColor?: string;
}

const ICONS = {
  home: 'home-outline' as keyof typeof Ionicons.glyphMap,
  library: 'folder-open-outline' as keyof typeof Ionicons.glyphMap, 
  tags: 'pricetags-outline' as keyof typeof Ionicons.glyphMap,
  trash: 'trash-outline' as keyof typeof Ionicons.glyphMap,
};

const tabs: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: RouteName;
}[] = [
  { name: 'index', icon: ICONS.home, label: 'Inicio', route: '/' },
  { name: 'library', icon: ICONS.library, label: 'Biblioteca', route: '/library' },
  { name: 'tags', icon: ICONS.tags, label: 'Etiquetas', route: '/tags' },
  { name: 'trash', icon: ICONS.trash, label: 'Papelera', route: '/trash' },
];

export default function FloatingTabBar({
  backgroundColor = lightTheme.colors.background,
  activeColor = lightTheme.colors.primary,
  inactiveColor = lightTheme.colors.textSecondary,
  borderColor = lightTheme.colors.borderSoft,
  borderRadius = 25,
}: FloatingTabBarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const styles = useFloatingTabBarStyles(responsive);
  
  const animationRefs = useRef<{[key: string]: {
    borderAnim: Animated.Value;
    glowAnim: Animated.Value;
    iconAnim: Animated.Value;
  }}>({});
  
  tabs.forEach(tab => {
    if (!animationRefs.current[tab.name]) {
      animationRefs.current[tab.name] = {
        borderAnim: new Animated.Value(0),
        glowAnim: new Animated.Value(0), 
        iconAnim: new Animated.Value(0),
      };
    }
  });

  /**
   * Maneja la navegación cuando se presiona una pestaña
   * @param route - La ruta a la que navegar
   */
  const handleTabPress = (route: RouteName) => {
    router.push(route);
  };

  /**
   * Determina si una pestaña está activa basándose en la ruta actual
   * @param tabRoute - La ruta de la pestaña a verificar
   * @returns boolean - true si la pestaña está activa
   */
  const isActiveTab = (tabRoute: RouteName): boolean => {
    return pathname === tabRoute; //startsWith(tabRoute)
  };
  
  /**
   * Anima la activación/desactivación de una pestaña
   * @param tabName - Nombre de la pestaña
   * @param isActive - Si debe animarse como activa o inactiva
   */
  const animateTab = (tabName: string, isActive: boolean) => {
    const anims = animationRefs.current[tabName];
    if (!anims) return;
    
    const toValue = isActive ? 1 : 0;
    const duration = 300;
    
    Animated.parallel([
      Animated.timing(anims.borderAnim, {
        toValue,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(anims.glowAnim, {
        toValue,
        duration: duration + 100, // Glow un poco más lento
        useNativeDriver: false,
      }),
      Animated.timing(anims.iconAnim, {
        toValue,
        duration: duration - 50, // Ícono un poco más rápido
        useNativeDriver: false,
      }),
    ]).start();
  };
  
  useEffect(() => {
    tabs.forEach(tab => {
      const isActive = isActiveTab(tab.route);
      animateTab(tab.name, isActive);
    });
  }, [pathname]);

  return (
    <View style={styles.floatingTabContainer}>
      <View style={[
        styles.floatingTabBar,
        { 
          backgroundColor,
          borderRadius,
          borderColor,        
        }
      ]}>
        {tabs.map((tab) => {
          const anims = animationRefs.current[tab.name];
          const isActive = isActiveTab(tab.route);
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`Ir a ${tab.label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {/* Borde superior animado */}
              <Animated.View 
                style={[
                  styles.topBorder,
                  { 
                    backgroundColor: activeColor,
                    opacity: anims?.borderAnim || 0,
                    transform: [{
                      scaleX: anims?.borderAnim || 0,
                    }]
                  }
                ]} 
              />
              
              {/* Efecto de glow animado */}
              <Animated.View 
                style={[
                  styles.glowEffect,
                  { 
                    shadowColor: activeColor,
                    backgroundColor: `${activeColor}15`,
                    opacity: anims?.glowAnim || 0,
                    transform: [{
                      scale: anims?.glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }) || 0.8,
                    }]
                  }
                ]} 
              />
              
              {/* Ícono con animación de color */}
              <Animated.View style={{
                transform: [{
                  scale: anims?.iconAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }) || 1,
                }]
              }}>
                <Ionicons
                  name={tab.icon}
                  size={responsive.iconSize}
                  color={isActive ? activeColor : inactiveColor}
                  aria-label={`Icono de ${tab.label}`}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

