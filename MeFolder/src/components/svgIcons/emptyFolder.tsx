import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

interface EmptyFolderProps extends SvgProps {
  folderColor?: string
  crossColor?: string
  strokeWidth?: number
}

const EmptyFolder: React.FC<EmptyFolderProps> = ({
  folderColor = "#000",
  crossColor = "#000",
  strokeWidth = 1.5,
  ...props
}) => (
  <Svg viewBox="0 0 18.4 14.4" fill="none" {...props}>
    
    {/* Carpeta */}
    <Path
        d="M4.8 18.7a1.454 1.454 0 0 1-1.5-1.5V6.8a1.454 1.454 0 0 1 1.5-1.5h4.675l2 2H19.2a1.454 1.454 0 0 1 1.5 1.5v8.4a1.454 1.454 0 0 1-1.5 1.5Z"
        transform="translate(-2.8 -4.8)"
        stroke={folderColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
    />

    {/* Aspa centrada */}
    <Path
        d="m7.365 6.14 1.838 1.83M11.049 9.807 9.203 7.97M11.035 6.133 9.203 7.97M9.203 7.97 7.365 9.813"
        stroke={crossColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
    />

  </Svg>
)

export default EmptyFolder