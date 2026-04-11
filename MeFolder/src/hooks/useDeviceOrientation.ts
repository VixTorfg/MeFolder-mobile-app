import { useCallback, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import type { CameraOrientation } from "expo-camera";

export type DeviceOrientation =
  | "portrait"
  | "portrait-upside-down"
  | "landscape-left"
  | "landscape-right";

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientation;
  rotationDeg: number;
  isPortrait: boolean;
  isLandscape: boolean;
  setFromCameraOrientation: (orientation: CameraOrientation) => void;
}

const mapCameraToDeviceOrientation = (
  orientation: CameraOrientation,
): DeviceOrientation => {
  switch (orientation) {
    case "portraitUpsideDown":
      return "portrait-upside-down";
    case "landscapeLeft":
      return "landscape-left";
    case "landscapeRight":
      return "landscape-right";
    default:
      return "portrait";
  }
};

const getRotationDeg = (orientation: DeviceOrientation): number => {
  switch (orientation) {
    case "portrait-upside-down":
      return 180;
    case "landscape-left":
      return 90;
    case "landscape-right":
      return -90;
    default:
      return 0;
  }
};

const getInitialOrientation = (): DeviceOrientation => {
  const { width, height } = Dimensions.get("window");
  return width > height ? "landscape-right" : "portrait";
};

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientation, setOrientation] = useState<DeviceOrientation>(
    getInitialOrientation,
  );

  const setFromCameraOrientation = useCallback(
    (cameraOrientation: CameraOrientation) => {
      setOrientation(mapCameraToDeviceOrientation(cameraOrientation));
    },
    [],
  );

  const rotationDeg = useMemo(() => getRotationDeg(orientation), [orientation]);

  return {
    orientation,
    rotationDeg,
    isPortrait: orientation.startsWith("portrait"),
    isLandscape: orientation.startsWith("landscape"),
    setFromCameraOrientation,
  };
};
