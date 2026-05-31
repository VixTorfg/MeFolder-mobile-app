import * as React from "react";
import Svg, { Path, Rect, SvgProps } from "react-native-svg";

interface EmptyAlbumProps extends SvgProps {
  albumColor?: string;
  crossColor?: string;
  strokeWidth?: number;
}

const EmptyAlbum: React.FC<EmptyAlbumProps> = ({
  albumColor = "#000",
  crossColor = "#000",
  strokeWidth = 32,
  ...props
}) => (
  <Svg viewBox="0 0 416 384" fill="none" {...props}>
    {/* Album */}
    <Rect
      width={384}
      height={256}
      x={16}
      y={112}
      rx={28.87}
      ry={28.87}
      stroke={albumColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />

    <Path
      d="M96 16h224M64 64h288"
      stroke={crossColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Aspa centrada */}
    <Path
      d="m152.89 184.89 110.22 110.22m-110.22 0 110.22-110.22"
      stroke={crossColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default EmptyAlbum;
