import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTutorialPopupStyles } from "./styles";
import { TUTORIAL_STEPS, type TutorialStep } from "./steps";

interface TutorialPopupProps {
  /** Controla la visibilidad del modal. */
  visible: boolean;
  /** Se llama al cerrar (botón X o al finalizar en el último paso). */
  onClose: () => void;
  /** Pasos a mostrar. Por defecto usa TUTORIAL_STEPS. */
  steps?: TutorialStep[];
}

export const TutorialPopup = ({
  visible,
  onClose,
  steps = TUTORIAL_STEPS,
}: TutorialPopupProps) => {
  const styles = useTutorialPopupStyles();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const directionRef = useRef<1 | -1>(1);

  // Reinicia al primer paso cada vez que se abre.
  useEffect(() => {
    if (visible) {
      directionRef.current = 1;
      setIndex(0);
    }
  }, [visible]);

  if (steps.length === 0) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const step = steps[index];

  const goNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    directionRef.current = 1;
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    if (isFirst) return;
    directionRef.current = -1;
    setIndex((current) => Math.max(current - 1, 0));
  };

  const entering = directionRef.current === 1 ? SlideInRight : SlideInLeft;
  const exiting = directionRef.current === 1 ? SlideOutLeft : SlideOutRight;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={styles.container}>
          {/* Cabecera: progreso + cerrar */}
          <View style={styles.header}>
            <View style={styles.stepIndicator}>
              {steps.map((_, dotIndex) => (
                <View
                  key={dotIndex}
                  style={[styles.dot, dotIndex === index && styles.dotActive]}
                />
              ))}
            </View>
            <Pressable
              style={styles.closeButton}
              hitSlop={8}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar tutorial"
            >
              <Ionicons name="close" size={24} color={styles.iconColor.color} />
            </Pressable>
          </View>

          {/* Cuerpo: captura + texto, con transición direccional */}
          <View style={styles.body}>
            <Animated.View
              key={index}
              entering={entering.duration(280)}
              exiting={exiting.duration(220)}
              style={styles.slide}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={step!.image}
                  style={styles.image}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{step!.title}</Text>
                <Text style={styles.description}>{step!.description}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Pie: atrás / contador / continuar */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.navButton,
                styles.navButtonGhost,
                isFirst && styles.navButtonHidden,
              ]}
              hitSlop={8}
              onPress={goBack}
              disabled={isFirst}
              accessibilityRole="button"
              accessibilityLabel="Anterior"
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={styles.navGhostIcon.color}
              />
            </Pressable>

            <Text style={styles.counter}>
              {index + 1} / {steps.length}
            </Text>

            <Pressable
              style={styles.navButton}
              hitSlop={8}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel={isLast ? "Finalizar" : "Continuar"}
            >
              <Ionicons
                name={isLast ? "checkmark" : "chevron-forward"}
                size={26}
                color={styles.navIcon.color}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
