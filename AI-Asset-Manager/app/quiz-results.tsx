import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGamification } from '@/contexts/GamificationContext';
import { markLessonComplete } from '@/lib/storage-keys';
import { useTasks } from '@/hooks/useTasks';
import AnimatedMascot from '@/components/AnimatedMascot';
import ParticleExplosion from '@/components/quiz/ParticleExplosion';
import { playQuizSound, triggerHaptic } from '@/lib/quiz-sounds';

const { width: SCREEN_W } = Dimensions.get('window');

function AnimatedStar({ index, total, delay }: { index: number; total: number; delay: number }) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-180);
  const glow = useSharedValue(0);
  const filled = index < total;

  useEffect(() => {
    if (filled) {
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(1.4, { damping: 6, stiffness: 150 }),
          withSpring(1, { damping: 10, stiffness: 120 })
        )
      );
      rotation.value = withDelay(
        delay,
        withSpring(0, { damping: 8, stiffness: 80 })
      );
      glow.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 400 }),
          withRepeat(
            withSequence(
              withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
              withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          )
        )
      );
    } else {
      scale.value = withDelay(delay, withSpring(0.8, { damping: 15 }));
      rotation.value = withDelay(delay, withTiming(0, { duration: 600 }));
    }
  }, [filled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: interpolate(scale.value, [0, 0.5, 1], [0, 0.6, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.3 }],
  }));

  return (
    <View style={st.starWrapper}>
      {filled && (
        <Animated.View style={[st.starGlow, glowStyle]}>
          <View style={[st.starGlowInner, { backgroundColor: Colors.gold }]} />
        </Animated.View>
      )}
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={index === 1 ? 64 : 48}
          color={filled ? Colors.gold : Colors.textMuted}
        />
      </Animated.View>
    </View>
  );
}

function AnimatedCounter({ target, duration = 1500, delay = 800 }: { target: number; duration?: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const updateDisplay = (val: number) => {
      setDisplay(Math.round(val));
    };

    progress.value = withDelay(
      delay,
      withTiming(target, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );

    const interval = setInterval(() => {
      const current = progress.value;
      setDisplay(Math.round(current));
      if (Math.round(current) >= target) {
        clearInterval(interval);
      }
    }, 32);

    return () => clearInterval(interval);
  }, [target]);

  return <Text style={st.counterText}>{display}%</Text>;
}

function PerformanceBar({ correct, total, delay = 1200 }: { correct: number; total: number; delay?: number }) {
  const fillWidth = useSharedValue(0);
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  useEffect(() => {
    fillWidth.value = withDelay(
      delay,
      withTiming(percentage, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
  }, [percentage]);

  const correctStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as any,
  }));

  const wrongStyle = useAnimatedStyle(() => ({
    width: `${100 - fillWidth.value}%` as any,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={st.perfBarContainer}>
      <View style={st.perfBarLabels}>
        <View style={st.perfBarLabelRow}>
          <View style={[st.perfBarDot, { backgroundColor: Colors.success }]} />
          <Text style={st.perfBarLabelText}>صحيح {correct}</Text>
        </View>
        <View style={st.perfBarLabelRow}>
          <View style={[st.perfBarDot, { backgroundColor: Colors.error }]} />
          <Text style={st.perfBarLabelText}>خطأ {total - correct}</Text>
        </View>
      </View>
      <View style={st.perfBarTrack}>
        <Animated.View style={[st.perfBarFillCorrect, correctStyle]}>
          <LinearGradient
            colors={[Colors.success, '#2ecc71']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[st.perfBarFillWrong, wrongStyle]}>
          <LinearGradient
            colors={[Colors.error, '#e74c3c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function FlipStatCard({ icon, iconColor, value, label, delay, bgColors }: {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  delay: number;
  bgColors: string[];
}) {
  const flipY = useSharedValue(90);
  const opacity = useSharedValue(0);

  useEffect(() => {
    flipY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 80 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateX: `${flipY.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[st.flipCard, animStyle]}>
      <LinearGradient
        colors={bgColors as any}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={[st.flipIconCircle, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={st.flipValue}>{value}</Text>
      <Text style={st.flipLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function QuizResultsScreen() {
  const insets = useSafeAreaInsets();
  const { addXp } = useGamification();
  const { incrementTask, setTaskValue } = useTasks();
  const rawParams = useLocalSearchParams<{
    subjectId: string;
    trimesterId: string;
    lessonId: string;
    correct: string;
    total: string;
    gems: string;
    timeSpent: string;
    maxStreak: string;
    streakBonus: string;
  }>();

  const p = (key: keyof typeof rawParams) => {
    const v = rawParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const subjectId = p('subjectId') || '';
  const trimesterId = p('trimesterId') || '';
  const lessonId = p('lessonId') || '';
  const correct = parseInt(p('correct') || '0', 10);
  const total = parseInt(p('total') || '0', 10);
  const gems = parseInt(p('gems') || '0', 10);
  const timeSpent = parseInt(p('timeSpent') || '0', 10);
  const maxStreak = parseInt(p('maxStreak') || '0', 10);
  const streakBonus = parseInt(p('streakBonus') || '0', 10);
  const wrong = total - correct;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xpEarned = correct * 10 + (percentage >= 80 ? 25 : 0);

  const starCount = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 40 ? 1 : 0;
  const isHighScore = percentage >= 80;

  const [saved, setSaved] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const bgPulse = useSharedValue(0);

  useEffect(() => {
    if (saved) return;
    setSaved(true);

    const saveProgress = async () => {
      try {
        await markLessonComplete(subjectId, trimesterId, lessonId);
      } catch (e) {
        if (__DEV__) console.warn('[quiz-results] save error:', e);
      }
    };

    saveProgress();
    addXp('lesson_complete');

    incrementTask('lessons_completed', 1);
    incrementTask('total_lessons', 1, 'special');
    if (correct > 0) {
      incrementTask('correct_answers', correct);
      incrementTask('total_correct', correct, 'special');
    }
    if (gems > 0) {
      incrementTask('gems_earned', gems, 'daily');
    }
    if (maxStreak > 0) {
      setTaskValue('max_streak', maxStreak, 'daily');
      setTaskValue('max_streak_ever', maxStreak, 'special');
    }
    if (percentage === 100) {
      incrementTask('perfect_quizzes', 1, 'weekly');
    }

    if (isHighScore) {
      playQuizSound('complete');
      triggerHaptic('success');
      setTimeout(() => setShowParticles(true), 600);
    } else {
      playQuizSound('select');
      triggerHaptic('medium');
    }

    bgPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(bgPulse);
    };
  }, []);

  const bgAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bgPulse.value, [0, 1], [0.3, 0.6]),
  }));

  const goBack = () => {
    playQuizSound('tap');
    triggerHaptic('light');
    router.replace({
      pathname: '/trimester',
      params: { subjectId, trimesterId },
    });
  };

  const retryQuiz = () => {
    playQuizSound('tap');
    triggerHaptic('light');
    router.replace({
      pathname: '/lesson',
      params: { subjectId, trimesterId, lessonId },
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getMessage = () => {
    if (percentage >= 90) return 'نتيجة ممتازة! 🎉';
    if (percentage >= 80) return 'أحسنت، عمل رائع! 💪';
    if (percentage >= 60) return 'جيد، يمكنك التحسن 📚';
    if (percentage >= 40) return 'لا بأس، حاول مرة أخرى 🔄';
    return 'تحتاج مراجعة أكثر 📖';
  };

  const getGradient = (): string[] => {
    if (percentage >= 80) return ['#0A1628', '#0D2818', '#0A1628'];
    if (percentage >= 60) return ['#0A1628', '#1A1A0D', '#0A1628'];
    return ['#0A1628', '#1A0D0D', '#0A1628'];
  };

  return (
    <View style={st.container}>
      <LinearGradient
        colors={getGradient() as any}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {isHighScore && (
        <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', `${Colors.gold}08`, 'transparent']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10 }]}>
        <Text style={st.headerTitle}>نتائج التمارين</Text>
      </View>

      <Animated.ScrollView
        style={st.scrollView}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={st.starsContainer}>
          <View style={st.starsRow}>
            {[0, 1, 2].map((i) => (
              <AnimatedStar key={i} index={i} total={starCount} delay={400 + i * 350} />
            ))}
          </View>
          {showParticles && (
            <ParticleExplosion trigger={showParticles} style={st.particleCenter} />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={st.scoreSection}>
          <AnimatedCounter target={percentage} duration={1800} delay={900} />
          <Text style={st.scoreLabel}>نسبة الدقة</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={st.messageContainer}>
          {isHighScore && (
            <LinearGradient
              colors={[`${Colors.gold}15`, `${Colors.gold}05`]}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
          )}
          <AnimatedMascot size={50} animation={isHighScore ? 'celebrate' : 'idle'} />
          <Text style={[st.messageText, isHighScore && { color: Colors.gold }]}>{getMessage()}</Text>
        </Animated.View>

        <PerformanceBar correct={correct} total={total} delay={1000} />

        <View style={st.statsGrid}>
          <FlipStatCard
            icon="diamond"
            iconColor={Colors.gems}
            value={`${gems}`}
            label="جواهر"
            delay={1200}
            bgColors={[`${Colors.gems}15`, `${Colors.gems}05`]}
          />
          <FlipStatCard
            icon="sparkles"
            iconColor={Colors.secondary}
            value={`${xpEarned}`}
            label="نقطة XP"
            delay={1350}
            bgColors={[`${Colors.secondary}15`, `${Colors.secondary}05`]}
          />
          <FlipStatCard
            icon="time"
            iconColor={Colors.cyan}
            value={formatTime(timeSpent)}
            label="الوقت"
            delay={1500}
            bgColors={[`${Colors.cyan}15`, `${Colors.cyan}05`]}
          />
        </View>

        {(maxStreak > 0 || streakBonus > 0) && (
          <Animated.View entering={FadeInDown.delay(1600).duration(500)} style={st.streakCard}>
            <LinearGradient
              colors={['#FF6B6B15', '#FF8C4208']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <View style={st.streakRow}>
              <View style={st.streakItem}>
                <View style={[st.streakIconCircle, { backgroundColor: '#FF6B6B20' }]}>
                  <Ionicons name="flame" size={20} color="#FF6B6B" />
                </View>
                <View style={st.streakTextCol}>
                  <Text style={st.streakValue}>{maxStreak}</Text>
                  <Text style={st.streakLabel}>أعلى سلسلة</Text>
                </View>
              </View>
              {streakBonus > 0 && (
                <View style={st.streakItem}>
                  <View style={[st.streakIconCircle, { backgroundColor: `${Colors.gold}20` }]}>
                    <Ionicons name="gift" size={20} color={Colors.gold} />
                  </View>
                  <View style={st.streakTextCol}>
                    <Text style={st.streakValue}>+{streakBonus}</Text>
                    <Text style={st.streakLabel}>مكافأة سلسلة</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(1700).duration(500)} style={st.detailsCard}>
          <View style={st.detailRow}>
            <View style={st.detailItem}>
              <View style={[st.detailDot, { backgroundColor: Colors.success }]} />
              <Text style={st.detailLabel}>إجابات صحيحة</Text>
            </View>
            <Text style={[st.detailValue, { color: Colors.success }]}>{correct}</Text>
          </View>
          <View style={st.detailDivider} />
          <View style={st.detailRow}>
            <View style={st.detailItem}>
              <View style={[st.detailDot, { backgroundColor: Colors.error }]} />
              <Text style={st.detailLabel}>إجابات خاطئة</Text>
            </View>
            <Text style={[st.detailValue, { color: Colors.error }]}>{wrong}</Text>
          </View>
          <View style={st.detailDivider} />
          <View style={st.detailRow}>
            <View style={st.detailItem}>
              <View style={[st.detailDot, { backgroundColor: Colors.cyan }]} />
              <Text style={st.detailLabel}>إجمالي الأسئلة</Text>
            </View>
            <Text style={[st.detailValue, { color: Colors.text }]}>{total}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1900).duration(500)} style={st.buttonsContainer}>
          {!isHighScore && (
            <Pressable onPress={retryQuiz} style={st.retryButton}>
              <LinearGradient
                colors={[Colors.secondary, Colors.secondaryDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
              />
              <Ionicons name="refresh" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={st.retryButtonText}>أعد المحاولة</Text>
            </Pressable>
          )}
          <Pressable onPress={goBack} style={st.backButton}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Text style={st.backButtonText}>العودة للدروس</Text>
            <Ionicons name="arrow-back" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  starsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    height: 90,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  starWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlowInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
  },
  particleCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  counterText: {
    fontSize: 56,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    lineHeight: 64,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
    marginTop: -4,
  },
  messageContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: Colors.textSecondary,
    textAlign: 'right',
    flex: 1,
  },
  perfBarContainer: {
    width: '100%',
    marginBottom: 20,
  },
  perfBarLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  perfBarLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  perfBarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  perfBarLabelText: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary,
  },
  perfBarTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  perfBarFillCorrect: {
    height: '100%',
    borderRadius: 7,
    overflow: 'hidden',
  },
  perfBarFillWrong: {
    height: '100%',
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  flipCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    gap: 6,
  },
  flipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipValue: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  flipLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  streakCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B25',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  streakRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  streakIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextCol: {
    alignItems: 'flex-end',
  },
  streakValue: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
  },
});
