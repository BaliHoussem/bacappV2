import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { getSubject, Exercise } from '@/constants/curriculum';
import { useGamification } from '@/contexts/GamificationContext';
import CircularTimer from '@/components/quiz/CircularTimer';
import StreakFire from '@/components/quiz/StreakFire';
import HeartLives from '@/components/quiz/HeartLives';
import ParticleExplosion from '@/components/quiz/ParticleExplosion';
import {
  playCorrect,
  playWrong,
  playTap,
  playStreak,
  playComplete,
  playSelect,
  playTimerWarning,
  triggerHaptic,
} from '@/lib/quiz-sounds';

function calcStreakBonus(maxStreak: number, baseGems: number): number {
  let bonus = 0;
  for (let i = 1; i <= maxStreak; i++) {
    const mult = i >= 5 ? 3 : i >= 3 ? 2 : 1;
    if (mult > 1) bonus += baseGems * (mult - 1);
  }
  return bonus;
}

const { width: SW } = Dimensions.get('window');
const BASE_GEMS = 10;
const TIMER_SECONDS = 30;
const MAX_LIVES = 3;

type AnswerState = 'idle' | 'correct' | 'wrong';

const OPTION_LETTERS = ['\u0623', '\u0628', '\u062C', '\u062F', '\u0647\u0640', '\u0648'];

const MATCH_COLORS = [
  { bg: '#7C5CFF18', border: '#7C5CFF', text: '#B8A5FF' },
  { bg: '#00D4AA18', border: '#00D4AA', text: '#66E8CC' },
  { bg: '#FF6B6B18', border: '#FF6B6B', text: '#FF9E9E' },
  { bg: '#4FC3F718', border: '#4FC3F7', text: '#88D8FB' },
  { bg: '#FFB74D18', border: '#FFB74D', text: '#FFCC80' },
];

function getMultiplier(streak: number): number {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addGems: addGemsGlobal } = useGamification();
  const rawParams = useLocalSearchParams<{
    subjectId: string;
    trimesterId: string;
    lessonId: string;
  }>();
  const subjectId = Array.isArray(rawParams.subjectId) ? rawParams.subjectId[0] : rawParams.subjectId;
  const trimesterId = Array.isArray(rawParams.trimesterId) ? rawParams.trimesterId[0] : rawParams.trimesterId;
  const lessonId = Array.isArray(rawParams.lessonId) ? rawParams.lessonId[0] : rawParams.lessonId;

  const subject = getSubject(subjectId || '');
  const trimester = subject.trimesters.find(t => t.id === trimesterId);
  const lesson = trimester?.lessons.find(l => l.id === lessonId);
  const exercises = lesson?.exercises || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const gemsRef = useRef(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);

  const [filledBlanks, setFilledBlanks] = useState<string[]>([]);
  const [orderSelected, setOrderSelected] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [shuffledRight, setShuffledRight] = useState<number[]>([]);

  const shakeX = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const flashColorVal = useSharedValue(0);
  const gemScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const exercise = exercises[currentIndex] as Exercise | undefined;
  const totalExercises = exercises.length;

  useEffect(() => {
    if (totalExercises > 0) {
      progressWidth.value = withTiming((currentIndex / totalExercises) * 100, { duration: 600, easing: Easing.out(Easing.cubic) });
    }
  }, [currentIndex, totalExercises]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [currentIndex]);

  useEffect(() => {
    if (exercise?.type === 'matching' && exercise.pairs) {
      const indices = exercise.pairs.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledRight(indices);
    }
  }, [currentIndex]);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimer(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          stopTimer();
          handleTimeUp();
          return 0;
        }
        if (prev === 6) playTimerWarning();
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    if (answerState !== 'idle') return;
    setAnswerState('wrong');
    wrongRef.current += 1;
    streakRef.current = 0;
    setStreak(0);
    setLives(prev => Math.max(0, prev - 1));
    playWrong();
    doWrongFlash();
    setTimeout(() => goToNext(), 1400);
  }, [answerState]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      flashColorVal.value,
      [0, 1],
      ['rgba(63, 185, 80, 0.3)', 'rgba(248, 81, 73, 0.3)']
    );
    return {
      position: 'absolute' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: color,
      opacity: flashOpacity.value,
      zIndex: 100,
      pointerEvents: 'none' as const,
    };
  });

  const gemAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gemScale.value }],
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const resetExerciseState = useCallback(() => {
    setAnswerState('idle');
    setSelectedOption(null);
    setFilledBlanks([]);
    setOrderSelected([]);
    setMatchedPairs([]);
    setSelectedLeft(null);
    setShowParticles(false);
  }, []);

  const navigateToResults = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const bonus = calcStreakBonus(maxStreakRef.current, BASE_GEMS);
    playComplete();
    router.replace({
      pathname: '/quiz-results',
      params: {
        subjectId: subjectId || '',
        trimesterId: trimesterId || '',
        lessonId: lessonId || '',
        correct: correctRef.current.toString(),
        wrong: wrongRef.current.toString(),
        total: totalExercises.toString(),
        gems: gemsRef.current.toString(),
        timeSpent: timeSpent.toString(),
        maxStreak: maxStreakRef.current.toString(),
        streakBonus: bonus.toString(),
      },
    });
  }, [subjectId, trimesterId, lessonId, totalExercises]);

  const goToNext = useCallback(() => {
    if (lives <= 0 && answerState === 'wrong') {
      navigateToResults();
      return;
    }
    if (currentIndex + 1 >= totalExercises) {
      navigateToResults();
    } else {
      resetExerciseState();
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalExercises, lives, answerState, navigateToResults]);

  const doCorrectFlash = useCallback(() => {
    flashColorVal.value = 0;
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 500 })
    );
  }, []);

  const doWrongFlash = useCallback(() => {
    flashColorVal.value = 1;
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 500 })
    );
    shakeX.value = withSequence(
      withTiming(-14, { duration: 40 }),
      withTiming(14, { duration: 40 }),
      withTiming(-10, { duration: 40 }),
      withTiming(10, { duration: 40 }),
      withTiming(-6, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
  }, []);

  const showCorrect = useCallback(() => {
    stopTimer();
    setAnswerState('correct');
    correctRef.current += 1;
    const newStreak = streakRef.current + 1;
    streakRef.current = newStreak;
    setStreak(newStreak);
    if (newStreak > maxStreakRef.current) {
      maxStreakRef.current = newStreak;
      setMaxStreak(newStreak);
    }

    const mult = getMultiplier(newStreak);
    const earned = BASE_GEMS * mult;
    gemsRef.current += earned;
    setGems(gemsRef.current);
    addGemsGlobal(earned);

    setShowParticles(true);
    playCorrect();
    doCorrectFlash();

    gemScale.value = withSequence(
      withSpring(1.6, { damping: 4 }),
      withSpring(1, { damping: 10 })
    );

    if (newStreak === 3 || newStreak === 5) {
      setTimeout(() => playStreak(), 300);
    }

    setTimeout(() => goToNext(), 1400);
  }, [goToNext, stopTimer]);

  const showWrong = useCallback(() => {
    stopTimer();
    setAnswerState('wrong');
    wrongRef.current += 1;
    streakRef.current = 0;
    setStreak(0);
    setLives(prev => Math.max(0, prev - 1));
    playWrong();
    doWrongFlash();
    setTimeout(() => goToNext(), 1400);
  }, [goToNext, stopTimer]);

  const handleMCQAnswer = useCallback((index: number) => {
    if (answerState !== 'idle') return;
    setSelectedOption(index);
    playTap();
    if (exercise?.correctAnswer === index) {
      showCorrect();
    } else {
      showWrong();
    }
  }, [answerState, exercise, showCorrect, showWrong]);

  const handleFillBlankTap = useCallback((word: string) => {
    if (answerState !== 'idle' || !exercise?.blanks) return;
    playSelect();
    const newFilled = [...filledBlanks, word];
    setFilledBlanks(newFilled);

    if (newFilled.length === exercise.blanks.answers.length) {
      const isCorrect = newFilled.every((w, i) => w === exercise.blanks!.answers[i]);
      if (isCorrect) showCorrect();
      else showWrong();
    }
  }, [answerState, exercise, filledBlanks, showCorrect, showWrong]);

  const removeFillBlank = useCallback((index: number) => {
    if (answerState !== 'idle') return;
    playTap();
    setFilledBlanks(prev => prev.filter((_, i) => i !== index));
  }, [answerState]);

  const handleOrderTap = useCallback((index: number) => {
    if (answerState !== 'idle' || !exercise?.correctOrder) return;
    if (orderSelected.includes(index)) return;
    playSelect();
    const newOrder = [...orderSelected, index];
    setOrderSelected(newOrder);

    if (newOrder.length === exercise.items!.length) {
      const isCorrect = newOrder.every((val, i) => val === exercise.correctOrder![i]);
      if (isCorrect) showCorrect();
      else showWrong();
    }
  }, [answerState, exercise, orderSelected, showCorrect, showWrong]);

  const handleMatchTap = useCallback((side: 'left' | 'right', index: number) => {
    if (answerState !== 'idle' || !exercise?.pairs) return;
    if (matchedPairs.includes(index)) return;

    playTap();
    if (side === 'left') {
      setSelectedLeft(index);
    } else if (selectedLeft !== null) {
      const isCorrect = selectedLeft === index;
      if (isCorrect) {
        playSelect();
        setMatchedPairs(prev => {
          const newMatched = [...prev, index];
          if (newMatched.length === exercise.pairs!.length) {
            setTimeout(() => showCorrect(), 400);
          }
          return newMatched;
        });
      } else {
        triggerHaptic('error');
        setTimeout(() => setSelectedLeft(null), 400);
      }
      setSelectedLeft(null);
    }
  }, [answerState, exercise, selectedLeft, matchedPairs, showCorrect]);

  if (!exercise || totalExercises === 0) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#080C14', '#0F1A2E', '#080C14']} style={StyleSheet.absoluteFill} />
        <View style={s.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.textMuted} />
          <Text style={s.emptyText}>{'\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0645\u0627\u0631\u064A\u0646 \u0644\u0647\u0630\u0627 \u0627\u0644\u062F\u0631\u0633'}</Text>
          <Pressable style={s.emptyBtn} onPress={() => router.back()}>
            <Text style={s.emptyBtnText}>{'\u0627\u0644\u0639\u0648\u062F\u0629'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const multiplier = getMultiplier(streak);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'quiz': return { label: '\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F', icon: 'apps-outline' as const, color: '#7C5CFF', gradient: ['#7C5CFF20', '#7C5CFF08'] as [string, string] };
      case 'fill_blank': return { label: '\u0627\u0645\u0644\u0623 \u0627\u0644\u0641\u0631\u0627\u063A', icon: 'create-outline' as const, color: '#00D4AA', gradient: ['#00D4AA20', '#00D4AA08'] as [string, string] };
      case 'ordering': return { label: '\u0631\u062A\u0628 \u0627\u0644\u0639\u0646\u0627\u0635\u0631', icon: 'git-merge-outline' as const, color: '#FF6B6B', gradient: ['#FF6B6B20', '#FF6B6B08'] as [string, string] };
      case 'matching': return { label: '\u0627\u0631\u0628\u0637 \u0627\u0644\u0639\u0646\u0627\u0635\u0631', icon: 'link-outline' as const, color: '#4FC3F7', gradient: ['#4FC3F720', '#4FC3F708'] as [string, string] };
      default: return { label: '\u062A\u0645\u0631\u064A\u0646', icon: 'help-outline' as const, color: Colors.primary, gradient: ['#00D4AA20', '#00D4AA08'] as [string, string] };
    }
  };

  const typeConfig = getTypeConfig(exercise.type);

  return (
    <View style={[s.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <LinearGradient colors={['#080C14', '#0E1628', '#0A1020', '#080C14']} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={flashStyle} />

      <View style={s.header}>
        <Pressable onPress={() => { playTap(); router.back(); }} style={s.closeBtn}>
          <LinearGradient colors={['#1A2540', '#151D30']} style={StyleSheet.absoluteFill} />
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>

        <View style={s.headerCenter}>
          <HeartLives lives={lives} maxLives={MAX_LIVES} />
        </View>

        <View style={s.headerRight}>
          <CircularTimer
            totalSeconds={TIMER_SECONDS}
            remainingSeconds={timer}
            size={42}
            strokeWidth={3}
          />
          <Animated.View style={[s.gemPill, gemAnimStyle]}>
            <Ionicons name="diamond" size={14} color={Colors.gems} />
            <Text style={s.gemText}>{gems}</Text>
          </Animated.View>
        </View>
      </View>

      <View style={s.progressRow}>
        <View style={s.progressBarBg}>
          <Animated.View style={[s.progressBarFill, progressAnimStyle]}>
            <LinearGradient
              colors={[typeConfig.color, `${typeConfig.color}80`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 6 }]}
            />
          </Animated.View>
          <View style={s.progressGlow} />
        </View>
        <Text style={s.progressCount}>{currentIndex + 1}/{totalExercises}</Text>
      </View>

      {streak >= 2 && (
        <Animated.View entering={ZoomIn.duration(300)} style={s.streakRow}>
          <StreakFire streak={streak} multiplier={multiplier} />
        </Animated.View>
      )}

      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={shakeStyle} key={`q-${currentIndex}`}>
          <Animated.View entering={FadeInDown.delay(50).duration(300)}>
            <LinearGradient colors={typeConfig.gradient} style={s.typeBadge}>
              <Ionicons name={typeConfig.icon} size={14} color={typeConfig.color} />
              <Text style={[s.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={s.questionText}>{exercise.question}</Text>

          {exercise.type === 'quiz' && renderMCQ(exercise, selectedOption, answerState, handleMCQAnswer, typeConfig.color)}
          {exercise.type === 'fill_blank' && exercise.blanks && renderFillBlank(exercise, filledBlanks, answerState, handleFillBlankTap, removeFillBlank)}
          {exercise.type === 'ordering' && exercise.items && renderOrdering(exercise, orderSelected, answerState, handleOrderTap)}
          {exercise.type === 'matching' && exercise.pairs && renderMatching(exercise, matchedPairs, selectedLeft, answerState, handleMatchTap, shuffledRight)}
        </Animated.View>

        {answerState !== 'idle' && (
          <Animated.View entering={FadeInUp.duration(350)} style={s.feedbackContainer}>
            <View style={s.feedbackInner}>
              {answerState === 'correct' ? (
                <LinearGradient colors={['#3FB95015', '#3FB95005']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
              ) : (
                <LinearGradient colors={['#F8514915', '#F8514905']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
              )}

              <View style={[s.feedbackIconRing, { borderColor: answerState === 'correct' ? Colors.success : Colors.error }]}>
                <Ionicons
                  name={answerState === 'correct' ? 'checkmark' : 'close'}
                  size={24}
                  color={answerState === 'correct' ? Colors.success : Colors.error}
                />
              </View>

              <View style={s.feedbackTextCol}>
                <Text style={[s.feedbackTitle, { color: answerState === 'correct' ? Colors.success : Colors.error }]}>
                  {answerState === 'correct' ? '\u0627\u062C\u0627\u0628\u0629 \u0635\u062D\u064A\u062D\u0629' : '\u0627\u062C\u0627\u0628\u0629 \u062E\u0627\u0637\u0626\u0629'}
                </Text>
                {answerState === 'correct' && (
                  <View style={s.feedbackReward}>
                    <View style={s.feedbackGemChip}>
                      <Ionicons name="diamond" size={12} color={Colors.gems} />
                      <Text style={s.feedbackGemText}>+{BASE_GEMS * multiplier}</Text>
                    </View>
                    {multiplier > 1 && (
                      <View style={s.feedbackMultChip}>
                        <Text style={s.feedbackMultText}>x{multiplier}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {answerState === 'correct' && (
              <ParticleExplosion trigger={showParticles} style={s.particleCenter} />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function renderMCQ(
  exercise: Exercise,
  selectedOption: number | null,
  answerState: AnswerState,
  handleMCQAnswer: (index: number) => void,
  accentColor: string,
) {
  return (
    <View style={s.mcqContainer}>
      {exercise.options?.map((option, index) => {
        const isSelected = selectedOption === index;
        const isCorrectAnswer = exercise.correctAnswer === index;
        const showResult = answerState !== 'idle';

        let borderColor = '#1F294080';
        let bgColors: [string, string] = ['#141C2C', '#121828'];
        let letterBg = '#1A2540';
        let letterColor = Colors.textMuted;
        let textColor = Colors.text;

        if (showResult && isCorrectAnswer) {
          borderColor = Colors.success;
          bgColors = [`${Colors.success}15`, `${Colors.success}08`];
          letterBg = `${Colors.success}25`;
          letterColor = Colors.success;
          textColor = Colors.success;
        } else if (showResult && isSelected && !isCorrectAnswer) {
          borderColor = Colors.error;
          bgColors = [`${Colors.error}15`, `${Colors.error}08`];
          letterBg = `${Colors.error}25`;
          letterColor = Colors.error;
          textColor = Colors.error;
        } else if (!showResult && isSelected) {
          borderColor = accentColor;
          bgColors = [`${accentColor}12`, `${accentColor}06`];
          letterBg = `${accentColor}25`;
          letterColor = accentColor;
        }

        return (
          <Animated.View key={index} entering={FadeInDown.delay(100 + index * 80).duration(300)}>
            <Pressable
              onPress={() => handleMCQAnswer(index)}
              disabled={answerState !== 'idle'}
              style={({ pressed }) => [
                s.mcqOption,
                { borderColor },
                pressed && answerState === 'idle' && s.mcqOptionPressed,
              ]}
            >
              <LinearGradient colors={bgColors} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />

              <View style={s.mcqContent}>
                {showResult && isCorrectAnswer && (
                  <Animated.View entering={ZoomIn.duration(300)}>
                    <View style={[s.mcqResultIcon, { backgroundColor: `${Colors.success}20` }]}>
                      <Ionicons name="checkmark" size={16} color={Colors.success} />
                    </View>
                  </Animated.View>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <Animated.View entering={ZoomIn.duration(300)}>
                    <View style={[s.mcqResultIcon, { backgroundColor: `${Colors.error}20` }]}>
                      <Ionicons name="close" size={16} color={Colors.error} />
                    </View>
                  </Animated.View>
                )}

                <Text style={[s.mcqOptionText, { color: textColor }]}>{option}</Text>

                <View style={[s.mcqLetter, { backgroundColor: letterBg }]}>
                  <Text style={[s.mcqLetterText, { color: letterColor }]}>{OPTION_LETTERS[index]}</Text>
                </View>
              </View>

              <View style={[s.mcqBottomEdge, { backgroundColor: borderColor }]} />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function renderFillBlank(
  exercise: Exercise,
  filledBlanks: string[],
  answerState: AnswerState,
  handleFillBlankTap: (word: string) => void,
  removeFillBlank: (index: number) => void,
) {
  const blanks = exercise.blanks!;
  return (
    <View style={s.fillContainer}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.sentenceCard}>
        <LinearGradient colors={['#1A254015', '#1A254005']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <View style={s.sentenceInner}>
          {blanks.sentence.split('___').map((part, i, arr) => (
            <React.Fragment key={i}>
              <Text style={s.sentenceText}>{part}</Text>
              {i < arr.length - 1 && (
                <Pressable
                  onPress={() => filledBlanks[i] && removeFillBlank(i)}
                  disabled={!filledBlanks[i] || answerState !== 'idle'}
                >
                  <Animated.View
                    entering={filledBlanks[i] ? ZoomIn.duration(200) : undefined}
                    style={[
                      s.blankSlot,
                      filledBlanks[i] && s.blankFilled,
                      answerState === 'correct' && s.blankCorrect,
                      answerState === 'wrong' && s.blankWrong,
                    ]}
                  >
                    <Text style={[
                      s.blankText,
                      answerState === 'correct' && { color: Colors.success },
                      answerState === 'wrong' && { color: Colors.error },
                    ]}>
                      {filledBlanks[i] || '       '}
                    </Text>
                    {!filledBlanks[i] && <View style={s.blankPulse} />}
                  </Animated.View>
                </Pressable>
              )}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      <Text style={s.sectionLabel}>{'\u0627\u062E\u062A\u0631 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629'}</Text>
      <View style={s.wordBank}>
        {blanks.words.map((word, index) => {
          const isUsed = filledBlanks.includes(word);
          return (
            <Animated.View key={index} entering={FadeInDown.delay(200 + index * 60).duration(250)}>
              <Pressable
                style={({ pressed }) => [
                  s.wordChip,
                  isUsed && s.wordChipUsed,
                  pressed && !isUsed && s.wordChipPressed,
                ]}
                onPress={() => handleFillBlankTap(word)}
                disabled={isUsed || answerState !== 'idle'}
              >
                <LinearGradient
                  colors={isUsed ? ['#0A0F1A', '#0A0F1A'] : ['#1C2540', '#151D30']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <Text style={[s.wordChipText, isUsed && s.wordChipTextUsed]}>{word}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function renderOrdering(
  exercise: Exercise,
  orderSelected: number[],
  answerState: AnswerState,
  handleOrderTap: (index: number) => void,
) {
  const items = exercise.items!;
  return (
    <View style={s.orderContainer}>
      {orderSelected.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={s.orderTimeline}>
          <View style={s.timelineLine} />
          {orderSelected.map((idx, pos) => (
            <Animated.View key={pos} entering={FadeInDown.delay(pos * 60).duration(250)} style={s.timelineItem}>
              <View style={[
                s.timelineNode,
                answerState === 'correct' && { backgroundColor: Colors.success, borderColor: Colors.success },
                answerState === 'wrong' && { backgroundColor: Colors.error, borderColor: Colors.error },
              ]}>
                <Text style={s.timelineNodeText}>{pos + 1}</Text>
              </View>
              <View style={[
                s.timelineCard,
                answerState === 'correct' && { borderColor: `${Colors.success}40` },
                answerState === 'wrong' && { borderColor: `${Colors.error}40` },
              ]}>
                <Text style={[
                  s.timelineCardText,
                  answerState === 'correct' && { color: Colors.success },
                  answerState === 'wrong' && { color: Colors.error },
                ]}>{items[idx]}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      <Text style={s.sectionLabel}>{'\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0635\u062D\u064A\u062D'}</Text>
      <View style={s.orderOptions}>
        {items.map((item, index) => {
          const isSelected = orderSelected.includes(index);
          const pos = orderSelected.indexOf(index);
          return (
            <Animated.View key={index} entering={FadeInDown.delay(150 + index * 70).duration(250)}>
              <Pressable
                style={({ pressed }) => [
                  s.orderBtn,
                  isSelected && s.orderBtnDone,
                  pressed && !isSelected && s.orderBtnPressed,
                ]}
                onPress={() => handleOrderTap(index)}
                disabled={isSelected || answerState !== 'idle'}
              >
                <LinearGradient
                  colors={isSelected ? ['#0A0F1A', '#0A0F1A'] : ['#1C2540', '#151D30']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <View style={s.orderBtnContent}>
                  <Text style={[s.orderBtnText, isSelected && { color: Colors.textMuted }]}>{item}</Text>
                  {isSelected ? (
                    <View style={s.orderCheckCircle}>
                      <Ionicons name="checkmark" size={14} color={Colors.primary} />
                    </View>
                  ) : (
                    <View style={s.orderAddCircle}>
                      <Ionicons name="add" size={16} color={Colors.textMuted} />
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function renderMatching(
  exercise: Exercise,
  matchedPairs: number[],
  selectedLeft: number | null,
  answerState: AnswerState,
  handleMatchTap: (side: 'left' | 'right', index: number) => void,
  shuffledRight: number[],
) {
  const pairs = exercise.pairs!;
  return (
    <View style={s.matchContainer}>
      <Text style={s.sectionLabel}>{'\u0627\u0631\u0628\u0637 \u0643\u0644 \u0639\u0646\u0635\u0631 \u0645\u0646 \u0627\u0644\u064A\u0645\u064A\u0646 \u0628\u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0645\u0646 \u0627\u0644\u064A\u0633\u0627\u0631'}</Text>
      <View style={s.matchColumns}>
        <View style={s.matchCol}>
          {pairs.map((pair, index) => {
            const isMatched = matchedPairs.includes(index);
            const isActive = selectedLeft === index;
            const matchColor = MATCH_COLORS[index % MATCH_COLORS.length];

            return (
              <Animated.View key={`l-${index}`} entering={FadeInDown.delay(100 + index * 80).duration(300)}>
                <Pressable
                  onPress={() => handleMatchTap('left', index)}
                  disabled={isMatched || answerState !== 'idle'}
                  style={[
                    s.matchCard,
                    isMatched && { borderColor: matchColor.border, backgroundColor: matchColor.bg },
                    isActive && { borderColor: matchColor.border, backgroundColor: `${matchColor.border}15` },
                  ]}
                >
                  {isActive && <View style={[s.matchGlow, { backgroundColor: `${matchColor.border}15` }]} />}
                  <Text style={[
                    s.matchCardText,
                    isMatched && { color: matchColor.text },
                    isActive && { color: matchColor.text },
                  ]}>{pair.left}</Text>
                  {isMatched && (
                    <Animated.View entering={ZoomIn.duration(200)} style={[s.matchCheckBadge, { backgroundColor: matchColor.border }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={s.matchDivider}>
          {pairs.map((_, i) => (
            <View key={i} style={s.matchDivDot} />
          ))}
        </View>

        <View style={s.matchCol}>
          {shuffledRight.map((origIndex, displayIndex) => {
            const pair = pairs[origIndex];
            const isMatched = matchedPairs.includes(origIndex);
            const matchColor = MATCH_COLORS[origIndex % MATCH_COLORS.length];

            return (
              <Animated.View key={`r-${origIndex}`} entering={FadeInDown.delay(200 + displayIndex * 80).duration(300)}>
                <Pressable
                  onPress={() => handleMatchTap('right', origIndex)}
                  disabled={isMatched || answerState !== 'idle'}
                  style={[
                    s.matchCard,
                    isMatched && { borderColor: matchColor.border, backgroundColor: matchColor.bg },
                  ]}
                >
                  <Text style={[
                    s.matchCardText,
                    isMatched && { color: matchColor.text },
                  ]}>{pair.right}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1F2940',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gemPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1A2540',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#2A3560',
  },
  gemText: {
    fontSize: 14, fontFamily: 'Cairo_700Bold', color: Colors.gems,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  progressBarBg: {
    flex: 1, height: 8,
    backgroundColor: '#151D30',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2940',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
  },
  progressCount: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', color: Colors.textMuted,
    minWidth: 28, textAlign: 'center',
  },

  streakRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 40 },

  typeBadge: {
    flexDirection: 'row-reverse', alignItems: 'center',
    alignSelf: 'flex-end', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 12, marginBottom: 16,
  },
  typeBadgeText: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold',
  },
  questionText: {
    fontSize: 20, fontFamily: 'Cairo_700Bold',
    color: Colors.text, textAlign: 'right',
    marginBottom: 24, lineHeight: 34,
    writingDirection: 'rtl',
  },

  mcqContainer: { gap: 10 },
  mcqOption: {
    borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 2,
  },
  mcqOptionPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  mcqContent: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, gap: 12,
  },
  mcqResultIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  mcqOptionText: {
    fontSize: 15, fontFamily: 'Cairo_600SemiBold',
    textAlign: 'right', flex: 1,
    writingDirection: 'rtl', lineHeight: 24,
  },
  mcqLetter: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  mcqLetterText: { fontSize: 15, fontFamily: 'Cairo_700Bold' },
  mcqBottomEdge: {
    height: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    opacity: 0.4,
  },

  fillContainer: { gap: 20 },
  sentenceCard: {
    borderRadius: 20, borderWidth: 1, borderColor: '#1F2940',
    padding: 20, overflow: 'hidden',
  },
  sentenceInner: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    alignItems: 'center', gap: 6,
  },
  sentenceText: {
    fontSize: 16, fontFamily: 'Cairo_500Medium',
    color: Colors.text, lineHeight: 32, writingDirection: 'rtl',
  },
  blankSlot: {
    backgroundColor: '#151D30',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 80, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#2A3560', borderStyle: 'dashed',
  },
  blankFilled: {
    borderStyle: 'solid', borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  blankCorrect: {
    borderColor: Colors.success, backgroundColor: `${Colors.success}12`,
    borderStyle: 'solid',
  },
  blankWrong: {
    borderColor: Colors.error, backgroundColor: `${Colors.error}12`,
    borderStyle: 'solid',
  },
  blankText: {
    fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: Colors.primary,
  },
  blankPulse: {
    position: 'absolute', bottom: 8, left: 14, right: 14,
    height: 2, backgroundColor: Colors.textMuted,
    borderRadius: 1, opacity: 0.2,
  },

  sectionLabel: {
    fontSize: 13, fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary, textAlign: 'center', marginBottom: 8,
  },
  wordBank: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    gap: 8, justifyContent: 'center',
  },
  wordChip: {
    borderRadius: 14, borderWidth: 1.5,
    borderColor: '#2A3560',
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: 4, borderBottomColor: '#1F294080',
    overflow: 'hidden',
  },
  wordChipUsed: { opacity: 0.2, borderBottomWidth: 1.5 },
  wordChipPressed: { transform: [{ scale: 0.95 }] },
  wordChipText: {
    fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: Colors.text,
  },
  wordChipTextUsed: { color: Colors.textMuted },

  orderContainer: { gap: 16 },
  orderTimeline: {
    position: 'relative', paddingRight: 30, marginBottom: 12,
  },
  timelineLine: {
    position: 'absolute', right: 15, top: 20, bottom: 20,
    width: 2, backgroundColor: `${Colors.primary}30`,
  },
  timelineItem: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: 10, marginBottom: 8,
  },
  timelineNode: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, borderWidth: 2,
    borderColor: `${Colors.primary}60`,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  timelineNodeText: {
    fontSize: 13, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  timelineCard: {
    flex: 1, backgroundColor: '#141C2C',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#1F2940',
  },
  timelineCardText: {
    fontSize: 14, fontFamily: 'Cairo_500Medium',
    color: Colors.text, textAlign: 'right', writingDirection: 'rtl',
  },

  orderOptions: { gap: 8 },
  orderBtn: {
    borderRadius: 14, borderWidth: 1.5, borderColor: '#2A3560',
    borderBottomWidth: 4, borderBottomColor: '#1F294080',
    overflow: 'hidden',
  },
  orderBtnDone: { opacity: 0.2, borderBottomWidth: 1.5 },
  orderBtnPressed: { transform: [{ scale: 0.97 }] },
  orderBtnContent: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
  },
  orderBtnText: {
    fontSize: 14, fontFamily: 'Cairo_600SemiBold',
    color: Colors.text, textAlign: 'right',
    flex: 1, writingDirection: 'rtl',
  },
  orderCheckCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  orderAddCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1A2540',
    alignItems: 'center', justifyContent: 'center',
  },

  matchContainer: { gap: 14 },
  matchColumns: {
    flexDirection: 'row-reverse',
    gap: 0, alignItems: 'flex-start',
  },
  matchCol: { flex: 1, gap: 8 },
  matchDivider: {
    width: 24, alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 16,
  },
  matchDivDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#2A3560', marginVertical: 20,
  },
  matchCard: {
    backgroundColor: '#141C2C',
    borderWidth: 1.5, borderColor: '#1F2940',
    borderRadius: 14, padding: 14,
    minHeight: 52, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  matchGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  matchCardText: {
    fontSize: 13, fontFamily: 'Cairo_600SemiBold',
    color: Colors.text, textAlign: 'center',
    writingDirection: 'rtl', lineHeight: 20,
  },
  matchCheckBadge: {
    position: 'absolute', top: 4, left: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  feedbackContainer: {
    marginTop: 20, alignItems: 'center',
    overflow: 'visible',
  },
  feedbackInner: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: 14, padding: 18, borderRadius: 20,
    borderWidth: 1, borderColor: '#1F2940',
    width: '100%', overflow: 'hidden',
  },
  feedbackIconRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A0F1A',
  },
  feedbackTextCol: { flex: 1, alignItems: 'flex-end', gap: 4 },
  feedbackTitle: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', writingDirection: 'rtl',
  },
  feedbackReward: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  feedbackGemChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.gems}15`,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  feedbackGemText: {
    fontSize: 13, fontFamily: 'Cairo_700Bold', color: Colors.gems,
  },
  feedbackMultChip: {
    backgroundColor: `${Colors.gold}20`,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  feedbackMultText: {
    fontSize: 12, fontFamily: 'Cairo_700Bold', color: Colors.gold,
  },
  particleCenter: {
    position: 'absolute', top: '50%', left: '50%',
  },

  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 16, padding: 40,
  },
  emptyText: {
    fontSize: 17, fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary, textAlign: 'center', writingDirection: 'rtl',
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.white,
  },
});
