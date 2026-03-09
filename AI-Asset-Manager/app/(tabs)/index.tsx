import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withSpring, Easing, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { BAC_EXAM_DATE, BRANCHES } from '@/constants/data';
import { useStreak } from '@/hooks/useStreak';
import { useGamification } from '@/contexts/GamificationContext';
import { useNotificationCenter } from '@/contexts/NotificationCenterContext';
import XpNotification from '@/components/XpNotification';
import ShimmerEffect from '@/components/ShimmerEffect';
import AnimatedMascot from '@/components/AnimatedMascot';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { streakCount, markTodayActive, getWeekData, loaded: streakLoaded } = useStreak();
  const { addXp, checkBadge, grantDailyOpenXp } = useGamification();
  const { unreadCount } = useNotificationCenter();
  const xpGranted = useRef(false);

  const branchLabel = BRANCHES.find(b => b.id === user?.branch)?.label || '';

  useEffect(() => {
    if (streakLoaded) markTodayActive();
  }, [streakLoaded]);

  useEffect(() => {
    if (streakLoaded && !xpGranted.current) {
      xpGranted.current = true;

      const badgeQueue: string[] = [];
      badgeQueue.push('first_login');
      if (streakCount >= 3) badgeQueue.push('streak_3');
      if (streakCount >= 7) badgeQueue.push('streak_7');
      if (streakCount >= 14) badgeQueue.push('streak_14');
      if (streakCount >= 30) badgeQueue.push('streak_30');
      const h = new Date().getHours();
      if (h >= 0 && h < 6) badgeQueue.push('night_owl');
      if (h >= 4 && h < 6) badgeQueue.push('early_bird');
      const day = new Date().getDay();
      if (day === 5 || day === 6) badgeQueue.push('weekend_warrior');

      grantDailyOpenXp().then(isNew => {
        if (isNew) {
          setTimeout(() => addXp('app_open'), 800);
          if (streakCount >= 2) setTimeout(() => addXp('streak_bonus'), 3500);
          let delay = 6500;
          for (const bid of badgeQueue) {
            setTimeout(() => checkBadge(bid), delay);
            delay += 4000;
          }
        } else {
          let delay = 1500;
          for (const bid of badgeQueue) {
            setTimeout(() => checkBadge(bid), delay);
            delay += 4000;
          }
        }
      });
    }
  }, [streakLoaded, streakCount]);

  const pulseAnim = useSharedValue(0);
  const avatarRingAnim = useSharedValue(0);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
    avatarRingAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1, false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.05]) }],
  }));

  const updateCountdown = useCallback(() => {
    const now = new Date();
    const diff = BAC_EXAM_DATE.getTime() - now.getTime();
    if (diff <= 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    setCountdown({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  }, []);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);


  const totalDays = useMemo(() => {
    const start = new Date(2025, 8, 1);
    return Math.ceil((BAC_EXAM_DATE.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const progressPercent = useMemo(() => {
    const elapsed = totalDays - countdown.days;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  }, [countdown.days, totalDays]);

  const weekDaysData = useMemo(() => getWeekData(), [getWeekData]);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[Colors.background, '#0F1A2E', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <XpNotification />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10,
            paddingBottom: Platform.OS === 'web' ? 110 : 160,
          },
        ]}
      >
        <Animated.View entering={FadeInUp.duration(500)} style={s.header}>
          <View style={s.headerLeft}>
            <Pressable style={s.notifButton} onPress={() => router.push('/inbox')}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
          <View style={s.headerRight}>
            <View style={s.headerTextBlock}>
              <Text style={s.greetingName} numberOfLines={1}>{user?.fullName || 'طالب'}</Text>
              <View style={s.branchRow}>
                <Text style={s.branchLabel}>{branchLabel}</Text>
                <View style={s.branchDot} />
              </View>
            </View>
            <Pressable onPress={() => router.push('/profile')} style={s.avatarOuter}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, Colors.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.avatarRing}
              >
                <View style={s.avatarInner}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={s.avatarImage} />
                  ) : (
                    <LinearGradient colors={['#1A2744', '#0F1A2E']} style={s.avatarFallback}>
                      <Text style={s.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              <View style={s.avatarStatusDot}>
                <View style={s.avatarStatusInner} />
              </View>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <View style={s.mascotCard}>
            <View style={s.mascotTextSide}>
              <Text style={s.mascotGreeting}>{getGreetingByTime()}</Text>
              <Text style={s.mascotMessage}>
                {countdown.days > 60
                  ? 'وقتك لا يزال كافي، استغله بذكاء!'
                  : countdown.days > 30
                  ? 'اقتربت الامتحانات، ركز وراجع!'
                  : 'الوقت ضيق، كل دقيقة تفرق!'}
              </Text>
            </View>
            <AnimatedMascot size={70} animation="idle" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View style={s.countdownCard}>
            <ShimmerEffect width={width - 40} height={300} borderRadius={24} />
            <Animated.View style={[s.countdownGlow, glowStyle]} />
            <LinearGradient
              colors={['#0C1929', '#111D33', '#0A1525']}
              style={s.countdownInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={s.countdownTopRow}>
                <View style={s.countdownBadge}>
                  <Ionicons name="school" size={14} color={Colors.gold} />
                  <Text style={s.countdownBadgeText}>بكالوريا 2026</Text>
                </View>
              </View>

              <View style={s.countdownDaysHero}>
                <Text style={s.countdownDaysNumber}>{countdown.days}</Text>
                <Text style={s.countdownDaysLabel}>يوم متبقي</Text>
              </View>

              <View style={s.countdownProgressWrap}>
                <View style={s.countdownProgressBg}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.cyan]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.countdownProgressFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <Text style={s.countdownProgressText}>{progressPercent}% من العام الدراسي</Text>
              </View>

              <View style={s.countdownTimerRow}>
                <TimerUnit value={countdown.seconds} label="ثانية" />
                <View style={s.timerSep}><Text style={s.timerSepText}>:</Text></View>
                <TimerUnit value={countdown.minutes} label="دقيقة" />
                <View style={s.timerSep}><Text style={s.timerSepText}>:</Text></View>
                <TimerUnit value={countdown.hours} label="ساعة" />
              </View>

              <Text style={s.countdownDate}>14 جوان 2026</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(600)}>
          <View style={s.streakCard}>
            <View style={s.streakHeader}>
              <View style={s.streakRight}>
                <View style={s.streakFireWrap}>
                  <Ionicons name="flame" size={20} color={streakCount > 0 ? Colors.accent : Colors.textMuted} />
                </View>
                <View>
                  <Text style={s.streakTitle}>سلسلة النشاط</Text>
                  <Text style={s.streakSubtitle}>
                    {streakCount > 0 ? `${streakCount} يوم متتالي` : 'ابدأ سلسلتك اليوم!'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={s.streakWeek}>
              {weekDaysData.map((day, i) => (
                <View key={i} style={s.streakDayCol}>
                  <View style={[
                    s.streakDot,
                    day.isActive && s.streakDotActive,
                    day.isToday && !day.isActive && s.streakDotToday,
                  ]}>
                    {day.isActive ? (
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                    ) : day.isToday ? (
                      <View style={s.streakDotTodayInner} />
                    ) : null}
                  </View>
                  <Text style={[
                    s.streakDayLabel,
                    day.isToday && { color: Colors.primary, fontFamily: 'Cairo_700Bold' },
                  ]}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550).duration(600)} style={s.quickActions}>
          <Text style={s.sectionTitle}>الوصول السريع</Text>
          <View style={s.actionsGrid}>
            <View style={s.actionsGridRow}>
              <QuickLink icon="grid-outline" label="الأقسام" subtitle="المواد الدراسية" color={Colors.secondary} onPress={() => router.push('/(tabs)/sections')} />
              <QuickLink icon="bar-chart-outline" label="تقدمي" subtitle="الإحصائيات" color={Colors.gold} onPress={() => router.push('/progress')} />
            </View>
            <View style={s.actionsGridRow}>
              <QuickLink icon="checkmark-circle-outline" label="المهام" subtitle="المهام اليومية" color={Colors.primary} onPress={() => router.push('/(tabs)/tasks')} />
              <QuickLink icon="people-outline" label="التصنيف" subtitle="الترتيب العام" color={Colors.cyan} onPress={() => router.push('/(tabs)/ranking')} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getGreetingByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'صباح الخير';
  if (h >= 12 && h < 18) return 'مرحبا';
  return 'مساء الخير';
}

function TimerUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.timerUnit}>
      <Text style={s.timerValue}>{value.toString().padStart(2, '0')}</Text>
      <Text style={s.timerLabel}>{label}</Text>
    </View>
  );
}

function QuickLink({ icon, label, subtitle, color, onPress }: { icon: string; label: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        s.quickLinkCard,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={s.quickLinkContent}>
        <View style={s.quickLinkTextWrap}>
          <Text style={s.quickLinkLabel}>{label}</Text>
          <Text style={s.quickLinkSubtitle}>{subtitle}</Text>
        </View>
        <View style={[s.quickLinkIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
      </View>
      <View style={[s.quickLinkAccent, { backgroundColor: color }]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  notifButton: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.background,
  },
  notifBadgeText: {
    fontSize: 10, fontFamily: 'Cairo_700Bold', color: '#fff', lineHeight: 14,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTextBlock: { alignItems: 'flex-end' },
  greetingSmall: {
    fontSize: 13, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
  },
  greetingName: {
    fontSize: 22, fontFamily: 'Cairo_700Bold', color: Colors.text,
    marginTop: -2, maxWidth: width - 140,
  },
  branchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2,
  },
  branchDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary,
  },
  branchLabel: { fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.primary },
  avatarOuter: { position: 'relative' as const },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    padding: 2.5,
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 26,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: Colors.primary },
  avatarStatusDot: {
    position: 'absolute' as const, bottom: 0, left: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  avatarStatusInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success,
  },

  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 10,
    paddingRight: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.secondary}20`,
  },
  mascotTextSide: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  mascotGreeting: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
  },
  mascotMessage: {
    fontSize: 13,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 22,
  },

  countdownCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(0, 212, 170, 0.15)',
  },
  countdownGlow: {
    position: 'absolute', top: -40, left: -40, right: -40, bottom: -40,
    borderRadius: 60, backgroundColor: 'rgba(0, 212, 170, 0.06)',
  },
  countdownInner: { padding: 24, paddingBottom: 20 },
  countdownTopRow: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 16,
  },
  countdownBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255, 183, 77, 0.1)', paddingHorizontal: 14,
    paddingVertical: 5, borderRadius: 20,
  },
  countdownBadgeText: {
    fontSize: 13, fontFamily: 'Cairo_600SemiBold', color: Colors.gold,
  },

  countdownDaysHero: { alignItems: 'center', marginBottom: 16 },
  countdownDaysNumber: {
    fontSize: 64, fontFamily: 'Cairo_700Bold', color: Colors.primary,
    lineHeight: 72,
  },
  countdownDaysLabel: {
    fontSize: 16, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary,
    marginTop: -4,
  },

  countdownProgressWrap: { marginBottom: 20, alignItems: 'center' },
  countdownProgressBg: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden',
    marginBottom: 6,
  },
  countdownProgressFill: { height: '100%', borderRadius: 3 },
  countdownProgressText: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },

  countdownTimerRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start',
    gap: 4, marginBottom: 12,
  },
  timerUnit: { alignItems: 'center', width: 54 },
  timerValue: {
    fontSize: 22, fontFamily: 'Cairo_700Bold', color: Colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10, overflow: 'hidden', textAlign: 'center',
    minWidth: 50,
  },
  timerLabel: {
    fontSize: 10, fontFamily: 'Cairo_500Medium', color: Colors.textMuted, marginTop: 4,
  },
  timerSep: { paddingTop: 6 },
  timerSepText: {
    fontSize: 20, fontFamily: 'Cairo_700Bold', color: Colors.textMuted,
  },

  countdownDate: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textMuted, textAlign: 'center',
  },

  streakCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: Colors.border,
  },
  streakHeader: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20,
  },
  streakRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakFireWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: Colors.text, textAlign: 'right' },
  streakSubtitle: { fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary, textAlign: 'right' },
  streakWeek: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  streakDayCol: { alignItems: 'center', gap: 8 },
  streakDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  streakDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  streakDotToday: { borderColor: Colors.primary },
  streakDotTodayInner: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  streakDayLabel: {
    fontSize: 13, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'right', marginBottom: 14,
  },

  quickActions: { marginBottom: 20 },
  actionsGrid: { gap: 10 },
  actionsGridRow: { flexDirection: 'row', gap: 10 },
  quickLinkCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  quickLinkContent: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  quickLinkTextWrap: { flex: 1, alignItems: 'flex-end' },
  quickLinkLabel: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: Colors.text, textAlign: 'right' },
  quickLinkSubtitle: { fontSize: 10, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary, textAlign: 'right' },
  quickLinkIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLinkAccent: {
    height: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
});
