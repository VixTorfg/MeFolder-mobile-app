import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import { useCaptureStore } from "@/stores/useCaptureStore";
import { useTimer } from "@/hooks/useTimer";
import lightTheme from "@/constants/themes";

const FLASH_MODES = [
  { mode: "off", icon: "flash-off", color: "white" },
  { mode: "on", icon: "flash", color: "#F2C94C" },
  { mode: "auto", icon: "flash-auto", color: "white" },
] as const;

const TORCH_MODES = [
  { enable: false, icon: "flashlight-off", color: "white" },
  { enable: true, icon: "flashlight", color: "#F2C94C" },
] as const;

export default function CameraScreen() {
  const [flashIndex, setFlashIndex] = useState(0);
  const [torchIndex, setTorchIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const [blurOverlayUri, setBlurOverlayUri] = useState<string | null>(null);
  const [cameraMount, setCameraMount] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [isOverlayLandscape, setIsOverlayLandscape] = useState(false);
  const pendingRecordRef = useRef(false);
  const overlayLoadedRef = useRef<(() => void) | null>(null);
  const discardRef = useRef(false);
  const { start, formatted } = useTimer();

  const flash = FLASH_MODES[flashIndex]!;
  const torch = TORCH_MODES[torchIndex]!;

  const captureAndWaitOverlay = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        shutterSound: false,
      });
      if (photo?.uri) {
        setIsOverlayLandscape(photo.width > photo.height);
        const loaded = new Promise<void>((resolve) => {
          overlayLoadedRef.current = resolve;
        });

        setBlurOverlayUri(photo.uri);
        await loaded;
      }
    } catch (e) {
      console.warn("Error capturando overlay:", e);
    }
  };

  const clearOverlay = useCallback(async () => {
    if (!blurOverlayUri) return;
    const uri = blurOverlayUri;
    setBlurOverlayUri(null);
    try {
      new File(uri).delete();
    } catch {}
  }, [blurOverlayUri]);

  const startPulse = useCallback(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  /** Detiene la animación de pulso */
  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const beginRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      start();
      const video = await cameraRef.current.recordAsync();
      if (discardRef.current) {
        discardRef.current = false;
        if (video?.uri) {
          try {
            new File(video.uri).delete();
          } catch {}
        }
      } else if (video?.uri) {
        useCaptureStore.getState().setCapture(video.uri, "video");
        router.back();
      }
    } catch (e) {
      console.warn("Error grabando video:", e);
    }

    stopPulse();
    setIsRecording(false);
  }, [stopPulse]);

  const onCameraReady = useCallback(() => {
    if (blurOverlayUri) {
      setTimeout(() => clearOverlay(), 500);
    }
    if (pendingRecordRef.current) {
      pendingRecordRef.current = false;

      setTimeout(() => beginRecording(), 300);
    }
  }, [blurOverlayUri, clearOverlay, beginRecording]);

  const cycleFlashMode = () => {
    setFlashIndex((prev) => (prev + 1) % FLASH_MODES.length);
  };

  const cycleTorchMode = () => {
    setTorchIndex((prev) => (prev + 1) % TORCH_MODES.length);
  };

  if (!permission) {
    return <View />;
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();

    useCaptureStore.getState().setCapture(photo.uri, "photo");
    router.back();
  };

  const startVideo = async () => {
    if (!cameraRef.current) return;

    await captureAndWaitOverlay();

    setIsRecording(true);
    startPulse();

    setCameraActive(false);
    setCameraMount(false);
    pendingRecordRef.current = true;

    await new Promise((r) => setTimeout(r, 50));

    setCameraActive(true);
    setCameraMount(true);
  };

  const handlePress = async () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
    } else {
      takePicture();
    }
  };

  const handleLongPress = () => {
    startVideo();
  };

  const handleClose = () => {
    if (isRecording) {
      discardRef.current = true;
      cameraRef.current?.stopRecording();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {cameraMount && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode={isRecording ? "video" : "picture"}
          flash={flash.mode}
          enableTorch={torch.enable}
          onCameraReady={onCameraReady}
          animateShutter={false}
          active={cameraActive}
          responsiveOrientationWhenOrientationLocked={true}
        />
      )}

      {/* Overlay con blur mientras la cámara cambia de modo */}
      {blurOverlayUri && (
        <View style={styles.blurOverlayContainer}>
          <Image
            source={{ uri: blurOverlayUri }}
            onLoad={() => {
              if (overlayLoadedRef.current) {
                overlayLoadedRef.current();
                overlayLoadedRef.current = null;
              }
            }}
            style={[
              styles.blurOverlayImage,
              isOverlayLandscape && {
                width: Dimensions.get("window").height,
                height: Dimensions.get("window").width,
                transform: [{ rotate: "90deg" }],
              },
            ]}
            blurRadius={10}
            contentFit="cover"
          />
        </View>
      )}

      {/* Botón cerrar */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.filaContainer}>
          <View style={styles.dot} />
          <Text style={styles.timer}>{formatted}</Text>
        </View>
      )}

      {/* Botones superiores */}
      <TouchableOpacity style={styles.flashButton} onPress={cycleFlashMode}>
        <MaterialCommunityIcons
          name={flash.icon}
          size={28}
          color={flash.color}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.torchButton} onPress={cycleTorchMode}>
        <MaterialCommunityIcons
          name={torch.icon}
          size={28}
          color={torch.color}
        />
      </TouchableOpacity>

      {/* Controles inferiores */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={150}
        >
          {isRecording ? (
            <Animated.View
              style={[
                styles.captureInnerRecording,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>

        <View style={styles.flipButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "#fff",
  },
  camera: {
    flex: 1,
  },
  blurOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  blurOverlayImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 8,
    zIndex: 20,
    elevation: 20,
  },
  filaContainer: {
    position: "absolute",
    top: 54,
    left: "30%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    zIndex: 20,
    borderRadius: 4,
    backgroundColor: "red",
  },
  timer: {
    padding: 8,
    color: "white",
    fontFamily: lightTheme.typography.fontFamily.primary.semiBold,
    fontSize: 16,
    zIndex: 20,
    elevation: 20,
  },
  flashButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 8,
    zIndex: 20,
    elevation: 20,
  },
  torchButton: {
    position: "absolute",
    top: 50,
    right: 100,
    padding: 8,
    zIndex: 20,
    elevation: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 32,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  flipButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },
  captureInnerRecording: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "red",
  },
});
