import React, { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const mascotImg = require('@/assets/images/mascot.png');

type AnimationType = 'idle' | 'bounce' | 'celebrate' | 'wave';

interface AnimatedMascotProps {
  size?: number;
  animation?: AnimationType;
}

export default function AnimatedMascot({ size = 64, animation = 'idle' }: AnimatedMascotProps) {
  const floatY = useSharedValue(0);
  const scaleVal = useSharedValue(1);
  const rotateVal = useSharedValue(0);
  const entryScale = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(floatY);
    cancelAnimation(scaleVal);
    cancelAnimation(rotateVal);

    floatY.value = 0;
    scaleVal.value = 1;
    rotateVal.value = 0;

    entryScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    switch (animation) {
      case 'idle':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        scaleVal.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        break;

      case 'bounce':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 400, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 400, easing: Easing.bounce }),
          ),
          -1,
          false,
        );
        break;

      case 'celebrate':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 500, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        scaleVal.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 600, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        rotateVal.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(4, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(-3, { duration: 250, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 250, easing: Easing.inOut(Easing.ease) }),
            withDelay(1200, withTiming(0, { duration: 0 })),
          ),
          -1,
          false,
        );
        break;

      case 'wave':
        floatY.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        rotateVal.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        scaleVal.value = withRepeat(
          withSequence(
            withTiming(1.04, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
        break;
    }

    return () => {
      cancelAnimation(floatY);
      cancelAnimation(scaleVal);
      cancelAnimation(rotateVal);
      cancelAnimation(entryScale);
    };
  }, [animation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: entryScale.value * scaleVal.value },
      { translateY: floatY.value },
      { rotate: `${rotateVal.value}deg` },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image source={mascotImg} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}
