import { Effects } from './types';

export const effects: Effects = {
    shadowsOffset: {
    central: { width: 0, height: 0 },
    bitDown: { width: 0, height: 2 },
    slightDown: { width: 0, height: 8 },
    slightUp: { width: 0, height: -8 },
    slightLeft: { width: -8, height: 0 },
    slightRight: { width: 8, height: 0 },
  },
  shadowsOpacity: {
    xs: 0.1,
    sm: 0.15,
    md: 0.25,
    lg: 0.3,
  },
  elevation: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 10,
  },
  radius: {
    exs: 2,
    xxs: 4,
    xs: 8,
    md: 12,
    lg: 16,
  },
  borderWidth: {
    xs: 0.25,
    md: 1,
    lg: 2,
  }
}

