export interface Colors {
 background: string,
  backgroundSoft: string,
  surface: string,

  card: string,
  subCard: string,
  borderSoft: string,

  textPrimary: string,
  textSecondary: string,
  textMuted: string,
  textOnColor: string,

  primary: string,
  primaryHover: string,
  primarySoft: string,

  secondary: string,
  secondarySoft: string,

  success: string,
  successSoft: string,

  warning: string,
  warningSoft: string,

  error: string,
  errorSoft: string,

  divider: string,
  focusRing: string,

  folderColor: string
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface FontWeightMap {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
}

export interface Typography {
  fontFamily: {
    title: FontWeightMap;
    primary: FontWeightMap;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    loose: number;
  };
}

export interface Theme {
  colors: Colors;
  spacing: Spacing;
  typography: Typography;
  effects: Effects;
}

export interface Effects {
  shadowsOffset: {
    central: { width: number; height: number };
    bitDown: { width: number; height: number };
    slightDown: { width: number; height: number };
    slightUp: { width: number; height: number };
    slightLeft: { width: number; height: number };
    slightRight: { width: number; height: number };
  },
  shadowsOpacity: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  },
  elevation: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  },
  radius: {
    exs: number;
    xxs: number;
    xs: number;
    md: number;
    lg: number;
  },
  borderWidth: {
    xs: number;
    md: number;
    lg: number;
  }
  shadowColor: {
    default: string;
  }
}