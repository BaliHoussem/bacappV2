import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  symbol: string;
}

const PARTICLE_COLORS = [
  Colors.gems,
  Colors.gold,
  Colors.primary,
  Colors.cyan,
  '#FF6B9D',
  '#FFD93D',
];

const SYMBOLS = ['\u2726', '\u25C6', '\u2605', '\u2B25', '\u25CF', '\u2727'];

const PARTICLE_COUNT = 16;

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    particles.push({
      id: i,
      angle,
      distance: 60 + Math.random() * 80,
      size: 8 + Math.random() * 14,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      delay: Math.random() * 100,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    });
  }
  return particles;
}

function ParticleItem({ particle, trigger }: { particle: Particle; trigger: boolean }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      opacity.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(400, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }))
        )
      );
      progress.value = withDelay(
        particle.delay,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
      );
      scale.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1.3, { duration: 200, easing: Easing.out(Easing.back(2)) }),
          withTiming(0.3, { duration: 500, easing: Easing.in(Easing.ease) })
        )
      );
      rotation.value = withDelay(
        particle.delay,
        withTiming(360 + Math.random() * 360, { duration: 700, easing: Easing.out(Easing.ease) })
      );
    } else {
      progress.value = 0;
      opacity.value = 0;
      scale.value = 0;
      rotation.value = 0;
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(particle.angle) * particle.distance * progress.value;
    const y = Math.sin(particle.angle) * particle.distance * progress.value - 20 * progress.value;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.particle,
        { fontSize: particle.size, color: particle.color },
        animatedStyle,
      ]}
    >
      {particle.symbol}
    </Animated.Text>
  );
}

interface ParticleExplosionProps {
  trigger: boolean;
  style?: any;
}

export default function ParticleExplosion({ trigger, style }: ParticleExplosionProps) {
  const [particles] = React.useState(generateParticles);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles.map((p) => (
        <ParticleItem key={p.id} particle={p} trigger={trigger} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 1,
    height: 1,
  },
  particle: {
    position: 'absolute',
  },
});
