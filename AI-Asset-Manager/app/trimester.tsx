import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { getSubject, type Lesson } from '@/constants/curriculum';
import { isLessonComplete } from '@/lib/storage-keys';

export default function TrimesterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rawParams = useLocalSearchParams<{ subjectId: string; trimesterId: string }>();
  const subjectId = Array.isArray(rawParams.subjectId) ? rawParams.subjectId[0] : rawParams.subjectId;
  const trimesterId = Array.isArray(rawParams.trimesterId) ? rawParams.trimesterId[0] : rawParams.trimesterId;
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const subject = subjectId ? getSubject(subjectId) : undefined;
  const trimester = subject?.trimesters.find((t) => t.id === trimesterId);

  const loadProgress = useCallback(async () => {
    if (!trimester) return;
    const completed = new Set<string>();
    for (const lesson of trimester.lessons) {
      const done = await isLessonComplete(subjectId || '', trimesterId || '', lesson.id);
      if (done) {
        completed.add(lesson.id);
      }
    }
    setCompletedLessons(completed);
  }, [subjectId, trimesterId, trimester]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const isLessonUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const prevLesson = trimester?.lessons[index - 1];
    return prevLesson ? completedLessons.has(prevLesson.id) : false;
  };

  const getLessonStatus = (lesson: Lesson, index: number): 'completed' | 'unlocked' | 'locked' => {
    if (completedLessons.has(lesson.id)) return 'completed';
    if (isLessonUnlocked(index)) return 'unlocked';
    return 'locked';
  };

  const handleLessonPress = (lesson: Lesson, index: number) => {
    const status = getLessonStatus(lesson, index);
    if (status === 'locked') return;
    router.push(`/lesson?subjectId=${subjectId}&trimesterId=${trimesterId}&lessonId=${lesson.id}`);
  };

  if (!subject || !trimester) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>لم يتم العثور على البيانات</Text>
      </View>
    );
  }

  const subjectColor = subject.color;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0F1A2E', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 20 : insets.top) + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{trimester.title}</Text>
          <Text style={styles.headerSubtitle}>{subject.title}</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: `${subjectColor}20` }]}>
          <Ionicons name={subject.icon as any} size={22} color={subjectColor} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
      >
        <View style={styles.progressSummary}>
          <Text style={styles.progressText}>
            {completedLessons.size} / {trimester.lessons.length} دروس مكتملة
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(completedLessons.size / trimester.lessons.length) * 100}%`,
                  backgroundColor: subjectColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.timeline}>
          {trimester.lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson, index);
            const isLocked = status === 'locked';
            const isCompleted = status === 'completed';

            return (
              <Animated.View key={lesson.id} entering={FadeInDown.delay(index * 100).duration(400)}>
                <Pressable
                  onPress={() => handleLessonPress(lesson, index)}
                  style={({ pressed }) => [
                    styles.lessonCard,
                    isLocked && styles.lessonCardLocked,
                    pressed && !isLocked && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={styles.timelineConnector}>
                    <View
                      style={[
                        styles.timelineDot,
                        isCompleted && { backgroundColor: Colors.success },
                        !isCompleted && !isLocked && { backgroundColor: subjectColor },
                        isLocked && { backgroundColor: Colors.textMuted },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      ) : isLocked ? (
                        <Ionicons name="lock-closed" size={12} color={Colors.textSecondary} />
                      ) : (
                        <Text style={styles.lessonNumber}>{index + 1}</Text>
                      )}
                    </View>
                    {index < trimester.lessons.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted && { backgroundColor: Colors.success },
                          !isCompleted && { backgroundColor: Colors.border },
                        ]}
                      />
                    )}
                  </View>

                  <View style={[styles.lessonContent, isLocked && { opacity: 0.5 }]}>
                    <View style={styles.lessonHeader}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                        </View>
                      )}
                      {!isCompleted && !isLocked && (
                        <View style={[styles.playBadge, { backgroundColor: `${subjectColor}20` }]}>
                          <Ionicons name="play" size={16} color={subjectColor} />
                        </View>
                      )}
                      {isLocked && (
                        <View style={styles.lockBadge}>
                          <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.lessonExerciseCount}>
                      {lesson.exercises.length} تمارين
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  progressSummary: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeline: {
    gap: 0,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingRight: 4,
  },
  lessonCardLocked: {},
  timelineConnector: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    height: 52,
    marginTop: 4,
  },
  lessonNumber: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
  },
  lessonContent: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.text,
    textAlign: 'right',
  },
  lessonExerciseCount: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  completedBadge: {},
  playBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {},
  errorText: {
    fontSize: 16,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
