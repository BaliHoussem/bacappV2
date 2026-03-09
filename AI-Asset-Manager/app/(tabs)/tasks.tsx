import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { useGamification } from '@/contexts/GamificationContext';
import { useStreak } from '@/hooks/useStreak';
import {
  useTasks,
  TaskDef,
  DAILY_TASKS,
  WEEKLY_TASKS,
  SPECIAL_TASKS,
} from '@/hooks/useTasks';
import { playTap, triggerHaptic } from '@/lib/quiz-sounds';
import { useAppTime } from '@/hooks/useAppTime';

const { width: SW } = Dimensions.get('window');

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { totalGems } = useGamification();
  const { streakCount } = useStreak();
  const tasks = useTasks();
  const [activeSection, setActiveSection] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [claimAnim, setClaimAnim] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useAppTime(useCallback((daily: number, weekly: number, total: number) => {
    tasksRef.current.setTaskValue('usage_minutes', daily, 'daily');
    tasksRef.current.setTaskValue('usage_minutes', weekly, 'weekly');
    tasksRef.current.setTaskValue('total_usage_minutes', total, 'special');
  }, []));

  useFocusEffect(
    useCallback(() => {
      tasks.setTaskValue('app_opened', 1, 'daily');
      tasks.setTaskValue('total_gems', totalGems, 'special');
      if (streakCount > 0) {
        tasks.setTaskValue('login_streak', streakCount, 'weekly');
      }
    }, [totalGems, streakCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    tasks.setTaskValue('total_gems', totalGems, 'special');
    await new Promise(r => setTimeout(r, 400));
    setRefreshing(false);
  }, [totalGems]);

  const handleClaim = useCallback(async (taskId: string) => {
    playTap();
    triggerHaptic('success');
    setClaimAnim(taskId);
    const reward = await tasks.claimReward(taskId);
    if (reward > 0) {
      setTimeout(() => setClaimAnim(null), 800);
    } else {
      setClaimAnim(null);
    }
  }, [tasks]);

  const handleClaimBonus = useCallback(async () => {
    playTap();
    triggerHaptic('success');
    await tasks.claimDailyBonus();
  }, [tasks]);

  const dailyDone = tasks.getDailyCompletedCount();
  const dailyTotal = DAILY_TASKS.length;
  const dailyAllDone = dailyDone >= dailyTotal;
  const allDailyClaimed = tasks.state.dailyAllClaimed;

  const currentTasks = activeSection === 'daily' ? DAILY_TASKS
    : activeSection === 'weekly' ? WEEKLY_TASKS
    : SPECIAL_TASKS;

  return (
    <View style={st.root}>
      <LinearGradient
        colors={['#080C14', '#0E1628', '#0D1220', '#080C14']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={st.titleRow}>
          <View style={st.titleIconWrap}>
            <LinearGradient colors={[`${Colors.primary}25`, `${Colors.primary}08`]} style={st.titleIcon}>
              <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
            </LinearGradient>
          </View>
          <Text style={st.title}>{'\u0627\u0644\u0645\u0647\u0627\u0645'}</Text>
        </Animated.View>
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressBackgroundColor="#1A2235" />
        }
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <DailySummaryCard
            done={dailyDone}
            total={dailyTotal}
            allDone={dailyAllDone}
            allClaimed={allDailyClaimed}
            bonusClaimed={tasks.state.dailyBonusClaimed}
            onClaimBonus={handleClaimBonus}
            streakCount={streakCount}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={st.sectionTabs}>
          {([
            { key: 'daily' as const, label: '\u064A\u0648\u0645\u064A\u0629', icon: 'today-outline' },
            { key: 'weekly' as const, label: '\u0623\u0633\u0628\u0648\u0639\u064A\u0629', icon: 'calendar-outline' },
            { key: 'special' as const, label: '\u062A\u062D\u062F\u064A\u0627\u062A', icon: 'trophy-outline' },
          ]).map(tab => {
            const on = activeSection === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => { playTap(); setActiveSection(tab.key); }}
                style={[st.sectionTab, on && st.sectionTabOn]}
              >
                {on && (
                  <LinearGradient
                    colors={[Colors.primary, '#00B894']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                  />
                )}
                <Ionicons name={tab.icon as any} size={14} color={on ? '#fff' : Colors.textMuted} />
                <Text style={[st.sectionTabText, on && st.sectionTabTextOn]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {activeSection === 'daily' && (
          <View style={st.resetNote}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={st.resetNoteText}>{'\u062A\u062A\u062C\u062F\u062F \u0643\u0644 \u064A\u0648\u0645 \u0639\u0646\u062F \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0644\u064A\u0644'}</Text>
          </View>
        )}
        {activeSection === 'weekly' && (
          <View style={st.resetNote}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={st.resetNoteText}>{'\u062A\u062A\u062C\u062F\u062F \u0643\u0644 \u0623\u0633\u0628\u0648\u0639'}</Text>
          </View>
        )}

        <View style={st.tasksList}>
          {currentTasks.map((task, index) => {
            const progress = tasks.getProgress(task);
            return (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(300 + index * 80).duration(350)}
              >
                <TaskCard
                  task={task}
                  current={progress.current}
                  claimed={progress.claimed}
                  onClaim={() => handleClaim(task.id)}
                  isClaimAnimating={claimAnim === task.id}
                />
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function DailySummaryCard({
  done,
  total,
  allDone,
  allClaimed,
  bonusClaimed,
  onClaimBonus,
  streakCount,
}: {
  done: number;
  total: number;
  allDone: boolean;
  allClaimed: boolean;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
  streakCount: number;
}) {
  const progress = total > 0 ? done / total : 0;

  return (
    <View style={st.summaryCard}>
      <LinearGradient
        colors={['#0F1C3F', '#152244', '#0F1C3F']}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={st.summaryGlow} />

      <View style={st.summaryTop}>
        <View style={st.summaryLeft}>
          <View style={st.summaryCircleWrap}>
            <View style={st.summaryCircleBg}>
              <LinearGradient
                colors={allDone ? [Colors.primary, '#00B894'] : ['#1C2E66', '#0F1C3F']}
                style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
              />
              <Text style={st.summaryCircleText}>{done}/{total}</Text>
            </View>
            <View style={[st.summaryArc, { borderColor: allDone ? Colors.primary : '#1C2E66' }]} />
          </View>
        </View>
        <View style={st.summaryRight}>
          <Text style={st.summaryTitle}>{'\u0645\u0647\u0627\u0645 \u0627\u0644\u064A\u0648\u0645'}</Text>
          <Text style={st.summarySub}>
            {allDone
              ? '\u0623\u062D\u0633\u0646\u062A! \u0623\u0643\u0645\u0644\u062A \u0643\u0644 \u0627\u0644\u0645\u0647\u0627\u0645'
              : `${total - done} \u0645\u0647\u0627\u0645 \u0645\u062A\u0628\u0642\u064A\u0629`
            }
          </Text>
          {streakCount > 0 && (
            <View style={st.streakMini}>
              <Ionicons name="flame" size={13} color="#FF6B6B" />
              <Text style={st.streakMiniText}>{streakCount} \u064A\u0648\u0645 \u0645\u062A\u062A\u0627\u0644\u064A</Text>
            </View>
          )}
        </View>
      </View>

      <View style={st.summaryProgressBar}>
        <View style={[st.summaryProgressFill, { width: `${progress * 100}%` }]}>
          <LinearGradient
            colors={[Colors.primary, '#00B894']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 4 }]}
          />
        </View>
      </View>

      {allClaimed && !bonusClaimed && (
        <Animated.View entering={ZoomIn.duration(400)}>
          <Pressable style={st.bonusBtn} onPress={onClaimBonus}>
            <LinearGradient
              colors={[Colors.gems, '#6A4CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Ionicons name="gift-outline" size={18} color="#fff" />
            <Text style={st.bonusBtnText}>{'\u0627\u0633\u062A\u0644\u0645 \u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u064A\u0648\u0645 +20'}</Text>
            <Ionicons name="diamond" size={14} color="#fff" />
          </Pressable>
        </Animated.View>
      )}
      {bonusClaimed && (
        <View style={st.bonusDone}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={st.bonusDoneText}>{'\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u064A\u0648\u0645'}</Text>
        </View>
      )}
    </View>
  );
}

function TaskCard({
  task,
  current,
  claimed,
  onClaim,
  isClaimAnimating,
}: {
  task: TaskDef;
  current: number;
  claimed: boolean;
  onClaim: () => void;
  isClaimAnimating: boolean;
}) {
  const completed = current >= task.target;
  const progress = task.target > 0 ? Math.min(current / task.target, 1) : 0;
  const isTimeTask = task.trackKey === 'usage_minutes' || task.trackKey === 'total_usage_minutes';

  const fmtMin = (m: number) => {
    if (m < 60) return `${m} \u062F`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h} \u0633 ${r} \u062F` : `${h} \u0633`;
  };

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (completed && !claimed) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [completed, claimed]);

  const cardPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[st.taskCard, completed && !claimed && st.taskCardReady, claimed && st.taskCardClaimed, cardPulse]}>
      <LinearGradient
        colors={
          claimed ? ['#0A0F1A', '#0D1220']
          : completed ? [`${task.color}0A`, `${task.color}04`]
          : ['#141C2C', '#121828']
        }
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />

      {completed && !claimed && (
        <View style={[st.taskGlowEdge, { backgroundColor: task.color }]} />
      )}

      <View style={st.taskTop}>
        <View style={st.taskRight}>
          <View style={[st.taskIconBox, { backgroundColor: claimed ? '#1A2540' : `${task.color}15` }]}>
            <Ionicons
              name={task.icon as any}
              size={20}
              color={claimed ? Colors.textMuted : task.color}
            />
          </View>
          <View style={st.taskInfo}>
            <Text style={[st.taskTitle, claimed && st.taskTitleClaimed]}>{task.title}</Text>
            <Text style={[st.taskDesc, claimed && st.taskDescClaimed]}>{task.description}</Text>
          </View>
        </View>

        {completed && !claimed ? (
          <Pressable style={st.claimBtn} onPress={onClaim}>
            <LinearGradient
              colors={[task.color, `${task.color}CC`]}
              style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
            />
            <Text style={st.claimBtnText}>{'\u0627\u0633\u062A\u0644\u0645'}</Text>
          </Pressable>
        ) : claimed ? (
          <View style={st.claimedBadge}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </View>
        ) : (
          <View style={st.rewardTag}>
            <Ionicons name="diamond" size={12} color={Colors.gems} />
            <Text style={st.rewardTagText}>+{task.reward}</Text>
          </View>
        )}
      </View>

      <View style={st.taskBottom}>
        <View style={st.taskProgressBar}>
          <View
            style={[
              st.taskProgressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: claimed ? Colors.textMuted : task.color,
              },
            ]}
          />
        </View>
        <Text style={[st.taskProgressText, claimed && { color: Colors.textMuted }]}>
          {isTimeTask ? `${fmtMin(current)} / ${fmtMin(task.target)}` : `${current}/${task.target}`}
        </Text>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },

  header: { paddingHorizontal: 20, paddingBottom: 8, zIndex: 10 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 10, marginBottom: 4,
  },
  titleIconWrap: { position: 'relative' },
  titleIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.primary}20`,
  },
  title: { fontSize: 26, fontFamily: 'Cairo_700Bold', color: Colors.text },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  summaryCard: {
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#1C2E6630',
    overflow: 'hidden', marginBottom: 16,
  },
  summaryGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: `${Colors.primary}06`,
  },
  summaryTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, marginBottom: 14,
  },
  summaryLeft: { alignItems: 'center' },
  summaryCircleWrap: { position: 'relative', width: 60, height: 60 },
  summaryCircleBg: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  summaryCircleText: {
    fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  summaryArc: {
    position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 33, borderWidth: 2, borderStyle: 'dashed',
  },
  summaryRight: { flex: 1, alignItems: 'flex-end' },
  summaryTitle: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  summarySub: {
    fontSize: 13, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    marginTop: 2,
  },
  streakMini: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, backgroundColor: '#FF6B6B10',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  streakMiniText: {
    fontSize: 11, fontFamily: 'Cairo_600SemiBold', color: '#FF6B6B',
  },

  summaryProgressBar: {
    height: 6, backgroundColor: '#151D30',
    borderRadius: 4, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1F2940',
  },
  summaryProgressFill: {
    height: '100%', borderRadius: 4, overflow: 'hidden',
  },

  bonusBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 14, borderRadius: 14,
    paddingVertical: 12, overflow: 'hidden',
  },
  bonusBtnText: {
    fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  bonusDone: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 12,
  },
  bonusDoneText: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', color: Colors.success,
  },

  sectionTabs: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  sectionTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#141C2C', borderWidth: 1, borderColor: '#1C2540',
    overflow: 'hidden',
  },
  sectionTabOn: { borderColor: Colors.primary },
  sectionTabText: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', color: Colors.textMuted,
  },
  sectionTabTextOn: { color: '#fff' },

  resetNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, marginBottom: 10, paddingHorizontal: 4,
  },
  resetNoteText: {
    fontSize: 11, fontFamily: 'Cairo_400Regular', color: Colors.textMuted,
  },

  tasksList: { gap: 10 },

  taskCard: {
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: '#1C254050',
    overflow: 'hidden', position: 'relative',
  },
  taskCardReady: {
    borderColor: '#1C2E6660',
  },
  taskCardClaimed: {
    opacity: 0.55,
  },
  taskGlowEdge: {
    position: 'absolute', right: 0, top: '15%', bottom: '15%',
    width: 3, borderRadius: 2, opacity: 0.5,
  },

  taskTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  taskRight: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, flex: 1,
  },
  taskIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  taskInfo: { flex: 1, alignItems: 'flex-end' },
  taskTitle: {
    fontSize: 14, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'right',
  },
  taskTitleClaimed: { color: Colors.textMuted },
  taskDesc: {
    fontSize: 11, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
    textAlign: 'right', marginTop: 1,
  },
  taskDescClaimed: { color: Colors.textMuted },

  claimBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, overflow: 'hidden',
    marginLeft: 8,
  },
  claimBtnText: {
    fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  claimedBadge: {
    marginLeft: 8,
  },
  rewardTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: `${Colors.gems}10`, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 10, marginLeft: 8,
    borderWidth: 1, borderColor: `${Colors.gems}15`,
  },
  rewardTagText: {
    fontSize: 12, fontFamily: 'Cairo_700Bold', color: Colors.gems,
  },

  taskBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  taskProgressBar: {
    flex: 1, height: 5, backgroundColor: '#151D30',
    borderRadius: 3, overflow: 'hidden',
  },
  taskProgressFill: {
    height: '100%', borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 11, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary,
    minWidth: 30, textAlign: 'left',
  },
});
