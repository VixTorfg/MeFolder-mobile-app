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
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface Typography {
  fontFamily: {
    primary: string;
    secondary?: string;
    monospace: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    light: '300';
    regular: '400';
    medium: '500';
    semiBold: '600';
    bold: '700';
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
  borderRadius: number;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
}