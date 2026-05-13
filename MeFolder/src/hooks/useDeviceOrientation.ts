import { useCallback, useMemo, useState } from "react";
import { Dimensions, useWindowDimensions } from "react-native";
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
  windowWidth: number;
  windowHeight: number;
  shortestSide: number;
  isTablet: boolean;
  setFromCameraOrientation: (orientation: CameraOrientation) => void;
}

const TABLET_MIN_SIDE = 768;

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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
  const shortestSide = useMemo(
    () => Math.min(windowWidth, windowHeight),
    [windowHeight, windowWidth],
  );

  return {
    orientation,
    rotationDeg,
    isPortrait: orientation.startsWith("portrait"),
    isLandscape: orientation.startsWith("landscape"),
    windowWidth,
    windowHeight,
    shortestSide,
    isTablet: shortestSide >= TABLET_MIN_SIDE,
    setFromCameraOrientation,
  };
};
