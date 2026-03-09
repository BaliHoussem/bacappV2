import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withDelay, withRepeat, withSequence, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const ORBIT_SIZE = Math.min(SCREEN_W - 40, 340);
const INNER_R = ORBIT_SIZE * 0.28;
const OUTER_R = ORBIT_SIZE * 0.44;

const ORBIT_ICONS = [
  { angle: 30, r: OUTER_R, icon: 'flask-outline', color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
  { angle: 90, r: INNER_R, icon: 'calculator-outline', color: '#B06CFF', bg: 'rgba(176,108,255,0.15)' },
  { angle: 150, r: OUTER_R, icon: 'book-outline', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
  { angle: 210, r: INNER_R, icon: 'language-outline', color: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
  { angle: 270, r: OUTER_R, icon: 'trophy-outline', color: '#FFB74D', bg: 'rgba(255,183,77,0.15)' },
  { angle: 330, r: INNER_R, icon: 'bar-chart-outline', color: '#FF8C42', bg: 'rgba(255,140,66,0.15)' },
  { angle: 0, r: OUTER_R * 0.7, icon: 'school-outline', color: '#7C5CFF', bg: 'rgba(124,92,255,0.15)' },
  { angle: 180, r: OUTER_R * 0.7, icon: 'construct-outline', color: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
];

function FloatingIcon({ icon, color, bg, x, y, delay }: {
  icon: string; color: string; bg: string; x: number; y: number; delay: number;
}) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [0, -8]) },
      { scale: interpolate(anim.value, [0, 1], [0.95, 1.05]) },
    ],
    opacity: interpolate(anim.value, [0, 1], [0.75, 1]),
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', left: x - 22, top: y - 22,
    }, style]}>
      <View style={[styles.orbitIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isOnboarded, hasSeenWelcome, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isOnboarded) {
      router.replace('/(tabs)');
      return;
    }
    if (hasSeenWelcome && isAuthenticated && !isOnboarded) {
      router.replace('/onboarding');
      return;
    }
    if (hasSeenWelcome) {
      router.replace('/entry');
    }
  }, [isLoading, isAuthenticated, isOnboarded, hasSeenWelcome]);

  if (isLoading) return <View style={[styles.root, { backgroundColor: '#070B14' }]} />;

  const center = ORBIT_SIZE / 2;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#070B14', '#0D1628', '#070B14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 20 }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.orbitArea}>
          <View style={{ width: ORBIT_SIZE, height: ORBIT_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <View style={[styles.ring, { width: OUTER_R * 2, height: OUTER_R * 2, borderRadius: OUTER_R }]} />
            <View style={[styles.ring, { width: INNER_R * 2, height: INNER_R * 2, borderRadius: INNER_R }]} />

            <View style={styles.logoCenter}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDim]}
                style={styles.logoCenterGrad}
              >
                <Text style={styles.logoCenterText}>ن</Text>
              </LinearGradient>
            </View>

            {ORBIT_ICONS.map((item, i) => {
              const rad = (item.angle * Math.PI) / 180;
              const x = center + Math.cos(rad) * item.r;
              const y = center + Math.sin(rad) * item.r;
              return (
                <FloatingIcon
                  key={i}
                  icon={item.icon}
                  color={item.color}
                  bg={item.bg}
                  x={x} y={y}
                  delay={i * 300}
                />
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.brandArea}>
          <Text style={styles.brandName}>نجاحي</Text>
          <Text style={styles.tagline}>ادرس بذكاء, حقق نجاحك</Text>
          <Text style={styles.subtitle}>مدرستك الرقمية المتكاملة</Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(800).duration(700)}
        style={[styles.footer, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}
      >
        <Pressable
          onPress={() => router.push('/entry')}
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDim]}
            style={styles.ctaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaText}>ابدأ الآن</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B14' },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  orbitArea: { marginBottom: 20 },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,170,0.12)',
  },
  logoCenter: {
    width: 72, height: 72, borderRadius: 36,
    ...Platform.select({
      web: { boxShadow: '0 0 20px rgba(0, 212, 170, 0.4)' },
      default: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
    }),
  },
  logoCenterGrad: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  logoCenterText: {
    fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#070B14',
  },
  orbitIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    }),
  },
  brandArea: { alignItems: 'center', gap: 4 },
  brandName: {
    fontSize: 44, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  tagline: {
    fontSize: 20, fontFamily: 'Cairo_600SemiBold', color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
    textAlign: 'center', marginTop: 2,
  },
  footer: { paddingHorizontal: 24 },
  ctaBtn: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 18,
  },
  ctaText: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#070B14',
  },
});
