import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

type Props = {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  haptic?: boolean;
  scaleTo?: number;
};

export default function PressableScale({ onPress, children, style, disabled, testID, haptic = true, scaleTo = 0.97 }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { opacity: disabled ? 0.55 : 1 }]}>
      <Pressable
        testID={testID}
        disabled={disabled}
        onPressIn={() => { scale.value = withTiming(scaleTo, { duration: 90 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 200 }); }}
        onPress={() => {
          if (haptic) { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} }
          onPress?.();
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
