import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useCustomAlertStyles } from "./styles";
import { CustomAlertButton } from "@/types/ui/components";
import { CustomPopup } from "./CustomPopup";

interface CustomAlertProps {
  title: string;
  message?: string;
  buttons: CustomAlertButton[];
  isVisible: boolean;
  onDismiss: () => void;
}

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
    if (style === "destructive") return styles.destructiveButton;
    if (style === "cancel") return styles.cancelButton;
    return styles.confirmButton;
  };

  const getButtonTextStyle = (style?: string) => {
    if (style === "destructive") return styles.destructiveButtonText;
    if (style === "cancel") return styles.cancelButtonText;
    return styles.confirmButtonText;
  };

  return (
    <CustomPopup title={title} isVisible={isVisible} onDismiss={onDismiss}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.footer}>
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
      </View>
    </CustomPopup>
  );
};
