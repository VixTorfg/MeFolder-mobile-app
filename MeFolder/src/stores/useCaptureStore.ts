import { create } from "zustand";

type CaptureType = "photo" | "video";

interface CaptureState {
  uri: string | null;
  type: CaptureType | null;
  setCapture: (uri: string, type: CaptureType) => void;
  clear: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  uri: null,
  type: null,
  setCapture: (uri, type) => set({ uri, type }),
  clear: () => set({ uri: null, type: null }),
}));
