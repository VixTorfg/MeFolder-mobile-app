import * as React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  SvgProps,
} from "react-native-svg";

const SplashLogo: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 236.004 193.789" fill="none" {...props}>
    <Defs>
      <LinearGradient
        id="splash-logo-gradient"
        x1={48.518}
        x2={212.915}
        y1={26.37}
        y2={189.458}
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0} stopColor="#f2c94c" />
        <Stop offset={0.483} stopColor="#e2e3da" />
        <Stop offset={0.608} stopColor="#6fcf97" />
        <Stop offset={0.769} stopColor="#fff4cc" />
        <Stop offset={0.974} stopColor="#6b6b63" />
      </LinearGradient>
    </Defs>

    <Path
      d="M17.543 34.48V14.05c0-6.63 5.37-12 12-12h61c6.63 0 12 5.37 12 12v4h104c6.63 0 12 5.37 12 12v4.43H12.533c-6.6 0-11.24 6.26-10.38 13.87l15.031 133.13c.64 5.69 5.699 10.26 11.299 10.26h179.191c5.61 0 10.66-4.57 11.3-10.26l14.88-133.13c.85-7.61-3.79-13.87-10.39-13.87h-4.92"
      stroke="url(#splash-logo-gradient)"
      strokeWidth={4.1}
      strokeMiterlimit={100}
    />
  </Svg>
);

export default SplashLogo;
