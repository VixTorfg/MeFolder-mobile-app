import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface EmptyTagProps extends SvgProps {
  tagColor?: string;
  crossColor?: string;
  strokeWidth?: number;
}

const EmptyTag: React.FC<EmptyTagProps> = ({
  tagColor = "#000",
  crossColor = "#000",
  strokeWidth = 1.5,
  ...props
}) => (
  <Svg viewBox="0 0 492 460" fill="none" {...props}>
    {/* Etiqueta */}
    <Path
      d="M393.29 6H270.36c-3.82 0-7.49 1.51-10.2 4.2L14.4 255.9c-11.2 11.26-11.2 29.44 0 40.7l117 117c11.26 11.2 29.45 11.2 40.71 0L417.8 168c2.69-2.71 4.2-6.38 4.2-10.2v-123c.08-15.83-12.69-28.72-28.52-28.8Z"
      stroke={tagColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Orificio */}
    <Path
      d="M342 102c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16"
      fill={tagColor}
    />

    {/* Aspa */}
    <Path
      d="m220 454 262-262c2.63-2.65 4.08-6.26 4-10V54M178.61 324.37c.54-29.04 1.07-58.07 1.61-87.11.45-24.55.91-49.11 1.36-73.66M260.48 245.47c-29.04-.54-58.07-1.07-87.11-1.61-24.55-.45-49.11-.91-73.66-1.36"
      stroke={crossColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default EmptyTag;
