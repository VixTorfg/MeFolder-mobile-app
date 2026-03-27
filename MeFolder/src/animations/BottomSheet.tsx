import React from 'react';
import { View, Text, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useBottomSheet } from './useBottomSheet';
import { useBottomSheetStyles } from './styles';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onBeforeClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  visible,
  onClose,
  onBeforeClose,
  title,
  children,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const styles = useBottomSheetStyles();
  const { onModalShow, handleClose, panGesture, overlayStyle, containerStyle } =
    useBottomSheet({ onClose, ...(onBeforeClose !== undefined && { onBeforeClose }) });

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

              {title && (
                <View style={styles.header}>
                  <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
