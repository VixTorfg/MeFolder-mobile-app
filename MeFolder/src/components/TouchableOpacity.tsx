import React from "react";
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type TouchableOpacityProps = Omit<PressableProps, "style"> & {
  activeOpacity?: number;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

export const TouchableOpacity = React.forwardRef<any, TouchableOpacityProps>(
  ({ activeOpacity = 0.2, disabled, style, children, ...props }, ref) => {
    const resolveStyle = (state: PressableStateCallbackType) => {
      const baseStyle = typeof style === "function" ? style(state) : style;

      if (!state.pressed || disabled || activeOpacity >= 1) {
        return baseStyle;
      }

      return [baseStyle, { opacity: activeOpacity }];
    };

    return (
      <Pressable ref={ref} disabled={disabled} style={resolveStyle} {...props}>
        {typeof children === "function" ? children : children}
      </Pressable>
    );
  },
);

TouchableOpacity.displayName = "TouchableOpacity";
