import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { usePropertyMenuStyles } from './styles';
import { FileModel, FolderModel } from '@/models';
import { FilePropertyMenu } from './FilePropertyMenu';

type SectionType = 'details' | 'customize';

interface PropertyMenuProps {
  item: FileModel | FolderModel;
  visible: boolean;
  onClose: () => void;
}


const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 120;

const OPEN_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};
const CLOSE_CONFIG = {
  duration: 250,
  easing: Easing.in(Easing.cubic),
};
const SNAP_BACK_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
};

export const PropertyMenu = ({
  item,
  visible,
  onClose,
}: PropertyMenuProps) => {

  const { theme } = useTheme();
  const styles = usePropertyMenuStyles();
  const [selectedSection, setSelectedSection] = useState<SectionType>('details');

  const isFile = item instanceof FileModel;
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayProgress = useSharedValue(0);

  const onModalShow = useCallback(() => {
    translateY.value = withTiming(0, OPEN_CONFIG);
    overlayProgress.value = withTiming(1, OPEN_CONFIG);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedSection('details');
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_CONFIG, (finished) => {
      if (finished) scheduleOnRN(closeModal);
    });
    overlayProgress.value = withTiming(0, CLOSE_CONFIG);
  }, [closeModal]);

  const handleClose = useCallback(() => {
    animateClose();
  }, [animateClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        overlayProgress.value = interpolate(
          e.translationY,
          [0, SCREEN_HEIGHT],
          [1, 0],
          Extrapolation.CLAMP,
        );
      }                                                                                                                                    
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD || e.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, CLOSE_CONFIG, (finished) => {
          if (finished) scheduleOnRN(closeModal);
        });
        overlayProgress.value = withTiming(0, CLOSE_CONFIG);
      } else {
        translateY.value = withTiming(0, SNAP_BACK_CONFIG);
        overlayProgress.value = withTiming(1, SNAP_BACK_CONFIG);
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayProgress.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onShow={onModalShow}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >    

        <Animated.View style={[styles.containerWrapper, containerStyle]}>
          <View style={styles.container}>
            
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.handleZone}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode='tail'>
                Propiedades de {item.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedSection === 'details' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedSection('details')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reader-outline"
                  size={22}
                  color={
                    selectedSection === 'details'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedSection === 'details' && styles.typeOptionTextActive,
                  ]}
                >
                  Detalles
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedSection === 'customize' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedSection('customize')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={22}
                  color={
                    selectedSection === 'customize'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedSection === 'customize' && styles.typeOptionTextActive,
                  ]}
                >
                  Estilo
                </Text>
              </TouchableOpacity>
            </View>

            {isFile ? (
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ 
                  paddingBottom: 4 * theme.spacing.xxl, 
                }}>
                  <FilePropertyMenu item={item} section={selectedSection} />
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ 
                  paddingBottom: 4 * theme.spacing.xxl, 
                }}>
                 
              </ScrollView>
            )}
          </View>
        </Animated.View>
        </KeyboardAvoidingView>    
      </GestureHandlerRootView>
    </Modal>
  );
}
