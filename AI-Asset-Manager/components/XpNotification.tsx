import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  withDelay, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGamification } from '@/contexts/GamificationContext';

export default function XpNotification() {
  const { notifications, dismissNotification } = useGamification();
  const insets = useSafeAreaInsets();
  const topOffset = Platform.OS === 'web' ? 67 : insets.top;
  const notif = notifications[0];
  const isAnimating = useRef(false);
  const notifId = useRef<string | null>(null);

  const progress = useSharedValue(0);

  const onAnimationDone = () => {
    isAnimating.current = false;
    notifId.current = null;
    dismissNotification();
  };

  useEffect(() => {
    if (!notif) {
      isAnimating.current = false;
      notifId.current = null;
      return;
    }

    const id = `${notif.type}_${Date.now()}`;
    if (isAnimating.current && notifId.current === id) return;

    isAnimating.current = true;
    notifId.current = id;

    progress.value = 0;
    const fadeInMs = 450;
    const holdMs = notif.type === 'xp' ? 1800 : 3000;
    const fadeOutMs = 400;

    progress.value = withSequence(
      withTiming(1, { duration: fadeInMs, easing: Easing.out(Easing.cubic) }),
      withDelay(holdMs, withTiming(0, { duration: fadeOutMs, easing: Easing.in(Easing.cubic) })),
    );

    const timeout = setTimeout(() => {
      runOnJS(onAnimationDone)();
    }, fadeInMs + holdMs + fadeOutMs + 150);

    return () => clearTimeout(timeout);
  }, [notif]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-24, 0]) },
    ],
    opacity: progress.value,
  }));

  if (!notif) return null;

  if (notif.type === 'xp') {
    return (
      <Animated.View style={[st.xpContainer, { top: topOffset + 8, pointerEvents: 'none' as const }, containerStyle]}>
        <LinearGradient
          colors={['rgba(124, 92, 255, 0.25)', 'rgba(0, 212, 170, 0.15)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={st.xpBadge}
        >
          <View style={st.xpIconWrap}>
            <Ionicons name="flash" size={14} color="#FFD700" />
          </View>
          <Text style={st.xpText}>+{notif.xpAmount}</Text>
          <Text style={st.xpLabel}>XP</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (notif.type === 'level_up') {
    const color = notif.newLevel?.color || Colors.secondary;
    return (
      <Animated.View style={[st.cardContainer, { top: topOffset + 14 }, containerStyle]}>
        <View style={st.cardSolid}>
          <LinearGradient
            colors={[`${color}40`, '#131A2B']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={st.card}
          >
            <View style={st.cardBorder}>
              <View style={st.cardRow}>
                <View style={st.cardInfo}>
                  <Text style={st.cardLabel}>ارتقيت للمستوى</Text>
                  <Text style={[st.cardTitle, { color }]}>{notif.newLevel?.title}</Text>
                  <View style={st.cardLevelRow}>
                    <View style={[st.cardLevelDot, { backgroundColor: color }]} />
                    <Text style={st.cardSub}>المستوى {notif.newLevel?.level}</Text>
                  </View>
                </View>
                <View style={[st.cardIconOuter, { borderColor: `${color}40` }]}>
                  <LinearGradient colors={[`${color}30`, `${color}10`]} style={st.cardIconInner}>
                    <Ionicons name="arrow-up-circle" size={26} color={color} />
                  </LinearGradient>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }

  if (notif.type === 'badge') {
    const color = notif.badge?.color || Colors.primary;
    return (
      <Animated.View style={[st.cardContainer, { top: topOffset + 14 }, containerStyle]}>
        <View style={st.cardSolid}>
          <LinearGradient
            colors={[`${color}40`, '#131A2B']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={st.card}
          >
            <View style={st.cardBorder}>
              <View style={st.cardRow}>
                <View style={st.cardInfo}>
                  <Text style={st.cardLabel}>إنجاز جديد!</Text>
                  <Text style={[st.cardTitle, { color }]}>{notif.badge?.title}</Text>
                  <Text style={st.cardDesc}>{notif.badge?.description}</Text>
                </View>
                <View style={[st.cardIconOuter, { borderColor: `${color}40` }]}>
                  <LinearGradient colors={[`${color}30`, `${color}10`]} style={st.cardIconInner}>
                    <Ionicons name={notif.badge?.icon as any} size={26} color={color} />
                  </LinearGradient>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }

  return null;
}

const st = StyleSheet.create({
  xpContainer: {
    position: 'absolute', alignSelf: 'center', zIndex: 9999,
  },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(124, 92, 255, 0.35)',
  },
  xpIconWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  xpText: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  xpLabel: {
    fontSize: 11, fontFamily: 'Cairo_600SemiBold', color: Colors.secondary,
    marginTop: 1,
  },

  cardContainer: {
    position: 'absolute', left: 16, right: 16, zIndex: 9999,
  },
  cardSolid: {
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: '#131A2B',
  },
  card: {
    borderRadius: 18, overflow: 'hidden',
  },
  cardBorder: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14,
  },
  cardInfo: { flex: 1, alignItems: 'flex-end' },
  cardLabel: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 20, fontFamily: 'Cairo_700Bold', lineHeight: 28,
  },
  cardLevelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2,
  },
  cardLevelDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  cardSub: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },
  cardDesc: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textMuted, marginTop: 2,
  },
  cardIconOuter: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardIconInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
});
