import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions } from 'react-native';
import { router, useNavigation, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useGamification, LEVELS } from '@/contexts/GamificationContext';
import { useStreak } from '@/hooks/useStreak';
import { getStorageEmail } from '@/lib/storage-keys';

const { width: SCREEN_W } = Dimensions.get('window');
const ACTIVITY_BASE = '@najahi_daily_activity';
function activityKey() {
  const email = getStorageEmail();
  return email ? `${ACTIVITY_BASE}_${email}` : ACTIVITY_BASE;
}
const HEATMAP_DAYS = 30;
const CELL_SIZE = Math.floor((SCREEN_W - 60) / 7) - 4;

interface DailyActivity {
  [date: string]: number;
}

function getDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayLabel(date: Date): string {
  const labels = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  return labels[date.getDay()];
}

function getMonthLabel(date: Date): string {
  const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return months[date.getMonth()];
}

export async function recordDailyXp(amount: number) {
  try {
    const today = getDateStr();
    const key = activityKey();
    const raw = await AsyncStorage.getItem(key);
    const activity: DailyActivity = raw ? JSON.parse(raw) : {};
    activity[today] = (activity[today] || 0) + amount;
    await AsyncStorage.setItem(key, JSON.stringify(activity));
  } catch (e) {
    if (__DEV__) console.warn('[progress] activity save error:', e);
  }
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { totalXp, currentLevel, nextLevel, levelProgress, dailyXp } = useGamification();
  const { streakCount, activeDates } = useStreak();
  const [activityData, setActivityData] = useState<DailyActivity>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(activityKey());
          if (raw) setActivityData(JSON.parse(raw));
        } catch (e) {
          if (__DEV__) console.warn('[progress] activity load error:', e);
        }
      })();
    }, [])
  );

  const goBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const heatmapData = useMemo(() => {
    const days: { date: string; xp: number; dateObj: Date }[] = [];
    const today = new Date();
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getDateStr(d);
      days.push({ date: dateStr, xp: activityData[dateStr] || 0, dateObj: d });
    }
    return days;
  }, [activityData]);

  const xpStats = useMemo(() => {
    const values = Object.values(activityData);
    const total = values.reduce((s, v) => s + v, 0);
    const daysWithActivity = values.filter(v => v > 0).length;
    const avg = daysWithActivity > 0 ? Math.round(total / daysWithActivity) : 0;
    const best = values.length > 0 ? Math.max(...values) : 0;
    return { total: totalXp, dailyAvg: avg, bestDay: best, activeDays: daysWithActivity };
  }, [activityData, totalXp]);

  const maxDayXp = useMemo(() => {
    const vals = heatmapData.map(d => d.xp);
    return Math.max(...vals, 1);
  }, [heatmapData]);

  const getHeatColor = (xp: number) => {
    if (xp === 0) return 'rgba(255, 255, 255, 0.04)';
    const intensity = Math.min(xp / maxDayXp, 1);
    if (intensity < 0.25) return 'rgba(0, 212, 170, 0.2)';
    if (intensity < 0.5) return 'rgba(0, 212, 170, 0.4)';
    if (intensity < 0.75) return 'rgba(0, 212, 170, 0.65)';
    return 'rgba(0, 212, 170, 0.9)';
  };

  const longestStreak = useMemo(() => {
    if (activeDates.length === 0) return 0;
    const sorted = [...activeDates].sort();
    let max = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }
    return Math.max(max, current);
  }, [activeDates]);

  const xpToNext = nextLevel ? nextLevel.minXp - totalXp : 0;

  return (
    <View style={st.container}>
      <LinearGradient
        colors={['#0A0F1A', '#0F1A2E', '#0A0F1A']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10,
          paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 30,
          paddingHorizontal: 16,
        }}
      >
        <Animated.View entering={FadeInUp.duration(500)} style={st.header}>
          <Pressable onPress={goBack} style={st.backBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.text} />
          </Pressable>
          <Text style={st.headerTitle}>تقدمي</Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={st.statsRow}>
            <StatCard
              value={totalXp.toString()}
              label="إجمالي XP"
              icon="sparkles"
              color={Colors.secondary}
            />
            <StatCard
              value={xpStats.dailyAvg.toString()}
              label="المعدل اليومي"
              icon="trending-up"
              color={Colors.primary}
            />
            <StatCard
              value={xpStats.bestDay.toString()}
              label="أفضل يوم"
              icon="star"
              color={Colors.gold}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={st.card}>
            <View style={st.cardHeader}>
              <View style={st.cardTitleRow}>
                <Ionicons name="calendar" size={18} color={Colors.primary} />
                <Text style={st.cardTitle}>نشاط آخر 30 يوم</Text>
              </View>
              <Text style={st.cardSubtitle}>{xpStats.activeDays} يوم نشط</Text>
            </View>

            <View style={st.heatmapGrid}>
              {heatmapData.map((day, i) => (
                <View key={day.date} style={st.heatmapCellWrap}>
                  <View
                    style={[
                      st.heatmapCell,
                      {
                        backgroundColor: getHeatColor(day.xp),
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      },
                      day.date === getDateStr() && st.heatmapCellToday,
                    ]}
                  >
                    {day.xp > 0 && (
                      <Text style={st.heatmapCellText}>
                        {day.dateObj.getDate()}
                      </Text>
                    )}
                  </View>
                  {day.xp === 0 && (
                    <Text style={st.heatmapDateText}>{day.dateObj.getDate()}</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={st.heatmapLegend}>
              <Text style={st.legendLabel}>أقل</Text>
              <View style={[st.legendBox, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
              <View style={[st.legendBox, { backgroundColor: 'rgba(0,212,170,0.2)' }]} />
              <View style={[st.legendBox, { backgroundColor: 'rgba(0,212,170,0.4)' }]} />
              <View style={[st.legendBox, { backgroundColor: 'rgba(0,212,170,0.65)' }]} />
              <View style={[st.legendBox, { backgroundColor: 'rgba(0,212,170,0.9)' }]} />
              <Text style={st.legendLabel}>أكثر</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={st.card}>
            <View style={st.cardHeader}>
              <View style={st.cardTitleRow}>
                <Ionicons name="arrow-up-circle" size={18} color={currentLevel.color} />
                <Text style={st.cardTitle}>تقدم المستوى</Text>
              </View>
              <Text style={[st.levelBadge, { color: currentLevel.color, backgroundColor: `${currentLevel.color}15` }]}>
                {currentLevel.title}
              </Text>
            </View>

            <View style={st.levelVisual}>
              <View style={st.levelCircleWrap}>
                <View style={[st.levelCircleOuter, { borderColor: `${currentLevel.color}30` }]}>
                  <LinearGradient
                    colors={[currentLevel.color, `${currentLevel.color}80`]}
                    style={st.levelCircle}
                  >
                    <Text style={st.levelNumber}>{currentLevel.level}</Text>
                  </LinearGradient>
                </View>
              </View>

              <View style={st.levelInfo}>
                <View style={st.levelProgressBarBg}>
                  <LinearGradient
                    colors={[currentLevel.color, `${currentLevel.color}60`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[st.levelProgressBarFill, { width: `${Math.max(3, levelProgress * 100)}%` as any }]}
                  />
                </View>
                <Text style={st.levelProgressText}>
                  {Math.round(levelProgress * 100)}%
                </Text>
                <Text style={st.levelNextText}>
                  {nextLevel ? `${xpToNext} XP للمستوى التالي (${nextLevel.title})` : 'أعلى مستوى!'}
                </Text>
              </View>
            </View>

            <View style={st.todayXpRow}>
              <View style={st.todayXpPill}>
                <Ionicons name="flash" size={14} color="#FFD700" />
                <Text style={st.todayXpText}>+{dailyXp} XP اليوم</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={st.card}>
            <View style={st.cardHeader}>
              <View style={st.cardTitleRow}>
                <Ionicons name="flame" size={18} color={Colors.accent} />
                <Text style={st.cardTitle}>إحصائيات السلسلة</Text>
              </View>
            </View>

            <View style={st.streakStatsGrid}>
              <View style={st.streakStatItem}>
                <View style={[st.streakStatIcon, { backgroundColor: 'rgba(255, 107, 107, 0.12)' }]}>
                  <Ionicons name="flame" size={22} color={Colors.accent} />
                </View>
                <Text style={st.streakStatValue}>{streakCount}</Text>
                <Text style={st.streakStatLabel}>السلسلة الحالية</Text>
              </View>

              <View style={st.streakStatDivider} />

              <View style={st.streakStatItem}>
                <View style={[st.streakStatIcon, { backgroundColor: 'rgba(255, 183, 77, 0.12)' }]}>
                  <Ionicons name="trophy" size={22} color={Colors.gold} />
                </View>
                <Text style={st.streakStatValue}>{longestStreak}</Text>
                <Text style={st.streakStatLabel}>أطول سلسلة</Text>
              </View>

              <View style={st.streakStatDivider} />

              <View style={st.streakStatItem}>
                <View style={[st.streakStatIcon, { backgroundColor: 'rgba(0, 212, 170, 0.12)' }]}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                </View>
                <Text style={st.streakStatValue}>{activeDates.length}</Text>
                <Text style={st.streakStatLabel}>أيام النشاط</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <View style={st.statCard}>
      <View style={[st.statIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },

  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: {
    fontSize: 20, fontFamily: 'Cairo_700Bold', color: Colors.text, lineHeight: 26,
  },
  statLabel: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  cardTitle: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
  },

  heatmapGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    justifyContent: 'flex-start',
  },
  heatmapCellWrap: {
    alignItems: 'center',
  },
  heatmapCell: {
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  heatmapCellToday: {
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  heatmapCellText: {
    fontSize: 9, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  heatmapDateText: {
    fontSize: 8, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
    marginTop: 1,
  },
  heatmapLegend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 14,
  },
  legendBox: {
    width: 14, height: 14, borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },

  levelBadge: {
    fontSize: 12, fontFamily: 'Cairo_700Bold',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    overflow: 'hidden',
  },
  levelVisual: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  levelCircleWrap: { alignItems: 'center' },
  levelCircleOuter: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  levelCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  levelInfo: { flex: 1 },
  levelProgressBarBg: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    marginBottom: 6,
  },
  levelProgressBarFill: { height: '100%', borderRadius: 4 },
  levelProgressText: {
    fontSize: 13, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'right',
  },
  levelNextText: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  todayXpRow: { alignItems: 'flex-end', marginTop: 14 },
  todayXpPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  todayXpText: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', color: '#FFD700',
  },

  streakStatsGrid: {
    flexDirection: 'row', alignItems: 'center',
  },
  streakStatItem: {
    flex: 1, alignItems: 'center', gap: 6,
  },
  streakStatIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  streakStatValue: {
    fontSize: 22, fontFamily: 'Cairo_700Bold', color: Colors.text, lineHeight: 28,
  },
  streakStatLabel: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    textAlign: 'center',
  },
  streakStatDivider: {
    width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
