import { create } from "zustand";

type CaptureType = "photo" | "video";

interface CaptureData {
  uri: string;
  type: CaptureType;
  mimeType?: string;
  width?: number;
  height?: number;
}

interface CaptureState {
  uri: string | null;
  type: CaptureType | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  setCapture: (data: CaptureData) => void;
  clear: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  uri: null,
  type: null,
  mimeType: null,
  width: null,
  height: null,
  setCapture: ({ uri, type, mimeType, width, height }) =>
    set({
      uri,
      type,
      mimeType: mimeType ?? null,
      width: width ?? null,
      height: height ?? null,
    }),
  clear: () =>
    set({ uri: null, type: null, mimeType: null, width: null, height: null }),
}));
