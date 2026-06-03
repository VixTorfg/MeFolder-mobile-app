import React from "react";
import { View, Text, Modal } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers";
import { useBottomSheet } from "./useBottomSheet";
import { useBottomSheetStyles } from "./styles";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onBeforeClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

function BottomSheetContent({
  onClose,
  onBeforeClose,
  title,
  children,
}: Omit<BottomSheetProps, "visible">) {
  const { theme } = useTheme();
  const styles = useBottomSheetStyles();
  const { onModalShow, handleClose, panGesture, overlayStyle, containerStyle } =
    useBottomSheet({
      onClose,
      ...(onBeforeClose !== undefined && { onBeforeClose }),
    });

  const { height } = useReanimatedKeyboardAnimation();
  const keyboardStyle = useAnimatedStyle(() => ({
    bottom: Math.abs(height.value),
  }));

  React.useEffect(() => {
    onModalShow?.();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      <Animated.View
        style={[styles.containerWrapper, containerStyle, keyboardStyle]}
      >
        <View style={styles.container}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.handleZone}>
              <View style={styles.handle} />
            </Animated.View>
          </GestureDetector>

          {title && (
            <View style={styles.header}>
              <Text
                style={styles.headerTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
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
          )}

          {children}
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

export default function BottomSheet({
  visible,
  onClose,
  onBeforeClose,
  title,
  children,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardProvider statusBarTranslucent>
        <BottomSheetContent
          onClose={onClose}
          {...(onBeforeClose !== undefined && { onBeforeClose })}
          {...(title !== undefined && { title })}
        >
          {children}
        </BottomSheetContent>
      </KeyboardProvider>
    </Modal>
  );
}
