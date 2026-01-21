import { Pressable as RNPressable, PressableProps } from 'react-native';

export function Pressable({ children, style, ...props }: PressableProps) {
  return (
    <RNPressable style={style} {...props}>
      {children}
    </RNPressable>
  );
}
