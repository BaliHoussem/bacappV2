import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerEffectProps {
  width: number;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
  duration?: number;
}

export default function ShimmerEffect({
  width,
  height,
  style,
  borderRadius = 20,
  duration = 2500,
}: ShimmerEffectProps) {
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnim.value,
      [0, 1],
      [-width, width],
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width,
          height,
          borderRadius,
          overflow: 'hidden',
          pointerEvents: 'none' as const,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerStrip, { height }, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.04)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.04)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shimmerStrip: {
    width: 120,
    position: 'absolute',
    top: 0,
  },
  gradient: {
    flex: 1,
  },
});
