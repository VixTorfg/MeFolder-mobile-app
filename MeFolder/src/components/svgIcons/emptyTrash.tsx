import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface EmptyTrashProps extends SvgProps {
  trashColor?: string;
  crossColor?: string;
  strokeWidth?: number;
}

const EmptyTrash: React.FC<EmptyTrashProps> = ({
  trashColor = "#000",
  crossColor = "#000",
  strokeWidth = 1.5,
  ...props
}) => (
  <Svg viewBox="0 0 384 448" fill="none" {...props}>
    {/* Papelera */}
    <Path
      d="m48 80 20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"
      stroke={trashColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 80h352"
      stroke={trashColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M128 80V40c-.04-13.22 10.64-23.96 23.86-24H232c13.22-.04 23.96 10.64 24 23.86V80"
      stroke={trashColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Aspa centrada */}
    <Path
      d="m136.89 200.89 110.22 110.22m-110.22 0 110.22-110.22"
      stroke={crossColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default EmptyTrash;
