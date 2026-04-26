import { UUID } from "./base";

export interface ColorValue {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl?: {
    h: number;
    s: number;
    l: number;
  };
}

export type SystemColorName =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink"
  | "cyan"
  | "gray"
  | "black";

export interface ColorPalette {
  system: Record<SystemColorName, ColorValue>;
  custom: ColorValue[];
}

export interface ColorInfo extends ColorValue {
  id?: UUID;
  name?: string;
  isSystem: boolean;
  isFavorite: boolean;
  systemName?: SystemColorName;
}
