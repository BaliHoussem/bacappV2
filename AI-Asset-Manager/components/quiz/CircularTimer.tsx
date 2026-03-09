import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Colors from '@/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularTimer({
  totalSeconds,
  remainingSeconds,
  size = 48,
  strokeWidth = 4,
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const fraction = remainingSeconds / totalSeconds;
  const isLow = remainingSeconds <= 5;

  useEffect(() => {
    progress.value = withTiming(fraction, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
  }, [fraction]);

  useEffect(() => {
    if (isLow && remainingSeconds > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isLow, remainingSeconds]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const colorValue = useDerivedValue(() => {
    return progress.value;
  });

  const strokeColor = useDerivedValue(() => {
    if (colorValue.value > 0.5) {
      return interpolateColor(
        colorValue.value,
        [0.5, 1],
        [Colors.warning, Colors.success]
      );
    }
    return interpolateColor(
      colorValue.value,
      [0, 0.5],
      [Colors.error, Colors.warning]
    );
  });

  const animatedStrokeProps = useAnimatedProps(() => {
    return {
      stroke: strokeColor.value,
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const textColor = isLow ? Colors.error : Colors.text;

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center},${center}`}
          animatedProps={{ ...animatedCircleProps, ...animatedStrokeProps }}
        />
      </Svg>
      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Animated.Text style={[styles.timerText, { color: textColor, fontSize: size * 0.3 }]}>
          {remainingSeconds}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: '800',
  },
});
