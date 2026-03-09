import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface StreakFireProps {
  streak: number;
  multiplier?: number;
}

export default function StreakFire({ streak, multiplier = 1 }: StreakFireProps) {
  const flameScale = useSharedValue(1);
  const flameOpacity = useSharedValue(0.7);
  const flameSway = useSharedValue(0);
  const counterScale = useSharedValue(1);
  const multiplierScale = useSharedValue(0);
  const innerFlameScale = useSharedValue(0.6);

  const isActive = streak > 0;
  const isHot = streak >= 3;
  const isOnFire = streak >= 5;

  useEffect(() => {
    if (isActive) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.92, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      flameOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      flameSway.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      innerFlameScale.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 350, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      flameScale.value = withTiming(0, { duration: 200 });
      flameOpacity.value = withTiming(0, { duration: 200 });
      flameSway.value = 0;
      innerFlameScale.value = 0.6;
    }
  }, [isActive]);

  useEffect(() => {
    if (streak > 0) {
      counterScale.value = withSequence(
        withTiming(1.5, { duration: 150, easing: Easing.out(Easing.back(3)) }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
  }, [streak]);

  useEffect(() => {
    if (multiplier > 1) {
      multiplierScale.value = withDelay(
        200,
        withSequence(
          withTiming(1.4, { duration: 200, easing: Easing.out(Easing.back(4)) }),
          withSpring(1, { damping: 8, stiffness: 150 })
        )
      );
    } else {
      multiplierScale.value = withTiming(0, { duration: 150 });
    }
  }, [multiplier]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameSway.value}deg` },
    ],
    opacity: flameOpacity.value,
  }));

  const innerFlameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerFlameScale.value }],
  }));

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const multiplierStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multiplierScale.value }],
    opacity: multiplierScale.value,
  }));

  const flameSize = isOnFire ? 26 : isHot ? 22 : 18;
  const outerColor = isOnFire ? '#FF4500' : isHot ? '#FF6B00' : '#FFB74D';
  const innerColor = isOnFire ? '#FFD700' : isHot ? '#FFAB40' : '#FFE082';
  const glowColor = isOnFire ? '#FF450040' : isHot ? '#FF6B0030' : '#FFB74D20';

  const streakTextStyle: TextStyle = {
    fontSize: isOnFire ? 20 : 17,
    fontFamily: 'Cairo_700Bold',
    color: isOnFire ? '#FF4500' : Colors.gold,
  };

  return (
    <View style={styles.container}>
      <View style={styles.fireContainer}>
        <View style={styles.flameWrap}>
          <View style={[styles.glowCircle, { backgroundColor: glowColor, width: flameSize + 18, height: flameSize + 18, borderRadius: (flameSize + 18) / 2 }]} />
          <Animated.View style={[styles.flameIconWrap, flameStyle]}>
            <Ionicons name="flame" size={flameSize} color={outerColor} />
            <Animated.View style={[styles.innerFlame, innerFlameStyle]}>
              <Ionicons name="flame" size={flameSize * 0.6} color={innerColor} />
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View style={counterStyle}>
          <Text style={streakTextStyle}>{streak}</Text>
        </Animated.View>
      </View>
      {multiplier > 1 && (
        <Animated.View style={[styles.multiplierBadge, multiplierStyle]}>
          <LinearGradient
            colors={isOnFire ? ['#FF4500', '#FF6B00'] : [Colors.gems, '#6A4CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
          />
          <Text style={styles.multiplierText}>x{multiplier}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  fireContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  flameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
  },
  flameIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerFlame: {
    position: 'absolute',
    bottom: 0,
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    overflow: 'hidden',
  },
  multiplierText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
  },
});
