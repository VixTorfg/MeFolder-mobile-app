import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useCustomAlertStyles } from './styles';
import { CustomAlertProps } from '@/types/ui/components';

export const CustomAlert = ({
  title,
  message,
  buttons,
  isVisible,
  onDismiss,
}: CustomAlertProps) => {
  const styles = useCustomAlertStyles();

  const handlePress = (onPress?: () => void) => {
    onDismiss();
    onPress?.();
  };

  const getButtonStyle = (style?: string) => {
    if (style === 'destructive') return styles.destructiveButton;
    if (style === 'cancel') return styles.cancelButton;
    return styles.confirmButton;
  };

  const getButtonTextStyle = (style?: string) => {
    if (style === 'destructive') return styles.destructiveButtonText;
    if (style === 'cancel') return styles.cancelButtonText;
    return styles.confirmButtonText;
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={getButtonStyle(btn.style)}
                onPress={() => handlePress(btn.onPress)}
              >
                <Text style={getButtonTextStyle(btn.style)}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
