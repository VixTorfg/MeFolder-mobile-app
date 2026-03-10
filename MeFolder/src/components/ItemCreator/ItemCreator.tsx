import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
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
import { useItemCreatorStyles } from './styles';
import FileCreator from './FileCreator';
import FolderCreator from './FolderCreator';
import { ROOT_FOLDER_ID } from '@/database/seeds/systemFolders';

type CreatorType = 'file' | 'folder';

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

interface ItemCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSaveFile?: (data: any) => Promise<void> | void;
  onSaveFolder?: (data: any) => Promise<void> | void;
  currentFolderId?: string;
}

export default function ItemCreator({
  visible,
  onClose,
  onSaveFile,
  onSaveFolder,
  currentFolderId = ROOT_FOLDER_ID,
}: ItemCreatorProps) {
  const { theme } = useTheme();
  const styles = useItemCreatorStyles();
  const [selectedType, setSelectedType] = useState<CreatorType>('file');

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayProgress = useSharedValue(0);

  const onModalShow = useCallback(() => {
    translateY.value = withTiming(0, OPEN_CONFIG);
    overlayProgress.value = withTiming(1, OPEN_CONFIG);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedType('file');
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

  const handleSaveFile = async (data: any): Promise<void> => {
    if (onSaveFile) {
      await onSaveFile(data);
    }
    handleClose();
  };

  const handleSaveFolder = async (data: any): Promise<void> => {
    if (onSaveFolder) {
      await onSaveFolder(data);
    }
    handleClose();
  };

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
        <Animated.View style={[styles.containerWrapper, containerStyle]}>
          <View style={styles.container}>
            {/* Handle - zona de arrastre */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.handleZone}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Nuevo elemento</Text>
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

            {/* Selector de tipo: Archivo / Carpeta */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'file' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedType('file')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-outline"
                  size={22}
                  color={
                    selectedType === 'file'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'file' && styles.typeOptionTextActive,
                  ]}
                >
                  Archivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'folder' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedType('folder')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="folder-outline"
                  size={22}
                  color={
                    selectedType === 'folder'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'folder' && styles.typeOptionTextActive,
                  ]}
                >
                  Carpeta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contenido dinámico */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingBottom: 4 * theme.spacing.xxl, 
              }}
             >
              {selectedType === 'file' ? (
                <FileCreator
                  onSave={handleSaveFile}
                  currentFolderId={currentFolderId}
                />
              ) : (
                <FolderCreator
                  onSave={handleSaveFolder}
                  currentFolderId={currentFolderId}
                />
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
