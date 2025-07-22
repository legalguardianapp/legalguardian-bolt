import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ViewStyle, TouchableOpacityProps } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scaleAmount?: number;
  duration?: number;
}

export default function AnimatedButton({
  children,
  style,
  scaleAmount = 0.95,
  duration = 100,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    Animated.timing(scaleAnim, {
      toValue: scaleAmount,
      duration,
      useNativeDriver: true,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
    onPressOut?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}