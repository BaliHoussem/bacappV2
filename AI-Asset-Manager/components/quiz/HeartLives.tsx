import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface HeartLivesProps {
  lives: number;
  maxLives?: number;
}

const HEART_ACTIVE_COLOR = '#FF4B6E';
const HEART_GLOW_COLOR = '#FF4B6E25';
const HEART_LOST_COLOR = '#2A3550';

function Heart({ filled, justLost }: { filled: boolean; justLost: boolean }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(filled ? 1 : 0.35);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (justLost) {
      scale.value = withSequence(
        withTiming(1.5, { duration: 100, easing: Easing.out(Easing.ease) }),
        withTiming(0.5, { duration: 150, easing: Easing.in(Easing.ease) }),
        withSpring(1, { damping: 6, stiffness: 200 })
      );
      rotation.value = withSequence(
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withSpring(0, { damping: 8 })
      );
      opacity.value = withDelay(
        200,
        withTiming(0.35, { duration: 300, easing: Easing.out(Easing.ease) })
      );
      translateY.value = withSequence(
        withTiming(-10, { duration: 100, easing: Easing.out(Easing.ease) }),
        withSpring(0, { damping: 8 })
      );
    } else {
      opacity.value = withTiming(filled ? 1 : 0.35, { duration: 300 });
    }
  }, [filled, justLost]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.heartWrap, heartStyle]}>
      {filled && <View style={styles.heartGlow} />}
      <View style={styles.heartInner}>
        <Ionicons
          name={filled ? 'heart' : 'heart-outline'}
          size={24}
          color={filled ? HEART_ACTIVE_COLOR : HEART_LOST_COLOR}
        />
        {filled && (
          <View style={styles.heartShine}>
            <Ionicons name="heart" size={10} color="#ffffff50" />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function HeartLives({ lives, maxLives = 3 }: HeartLivesProps) {
  const prevLivesRef = useRef(lives);
  const lostIndex = prevLivesRef.current > lives ? lives : -1;

  useEffect(() => {
    prevLivesRef.current = lives;
  }, [lives]);

  return (
    <View style={styles.container}>
      {Array.from({ length: maxLives }, (_, i) => (
        <Heart
          key={i}
          filled={i < lives}
          justLost={i === lostIndex}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    position: 'relative',
  },
  heartGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: HEART_GLOW_COLOR,
  },
  heartInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartShine: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
});
