import React, { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useCustomAlertStyles } from "./styles";

interface CustomPopupProps {
  title: string;
  isVisible: boolean;
  onDismiss: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  dismissOnBackdropPress?: boolean;
}

export const CustomPopup = ({
  title,
  isVisible,
  onDismiss,
  children,
  footer,
  dismissOnBackdropPress = true,
}: CustomPopupProps) => {
  const styles = useCustomAlertStyles();

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      onDismiss();
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleBackdropPress}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>
          {children ? <View style={styles.content}>{children}</View> : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
