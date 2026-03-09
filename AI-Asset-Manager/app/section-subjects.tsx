import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { BRANCH_SUBJECTS, getSubject, getTotalLessons } from '@/constants/curriculum';
import { isLessonComplete } from '@/lib/storage-keys';

export default function SectionSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ branch: string }>();
  const branch = Array.isArray(params.branch) ? params.branch[0] : params.branch;

  const subjectIds = BRANCH_SUBJECTS[branch || 'sciences'] || BRANCH_SUBJECTS.sciences;
  const subjects = subjectIds.map(id => getSubject(id));

  const [progress, setProgress] = useState<Record<string, number>>({});

  const loadProgress = useCallback(async () => {
    try {
      const progressMap: Record<string, number> = {};
      for (const subject of subjects) {
        const totalLessons = getTotalLessons(subject);
        if (totalLessons === 0) {
          progressMap[subject.id] = 0;
          continue;
        }
        let completed = 0;
        for (const trimester of subject.trimesters) {
          for (const lesson of trimester.lessons) {
            const done = await isLessonComplete(subject.id, trimester.id, lesson.id);
            if (done) completed++;
          }
        }
        progressMap[subject.id] = Math.round((completed / totalLessons) * 100);
      }
      setProgress(progressMap);
    } catch (e) {
      console.error('Failed to load progress', e);
    }
  }, [branch]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

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
          <Text style={styles.headerTitle}>المواد</Text>
          <Text style={styles.headerSubtitle}>{subjects.length} مادة دراسية</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="book-outline" size={22} color="#7C5CFF" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
      >
        <View style={styles.grid}>
          {subjects.map((subject, index) => {
            const totalLessons = getTotalLessons(subject);
            const pct = progress[subject.id] || 0;

            return (
              <Animated.View key={subject.id} entering={FadeInDown.delay(index * 80).duration(400)}>
                <Pressable
                  onPress={() => router.push(`/subject?id=${subject.id}`)}
                  style={({ pressed }) => [
                    styles.subjectCard,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={[styles.subjectIconContainer, { backgroundColor: `${subject.color}15` }]}>
                    <Ionicons name={subject.icon as any} size={28} color={subject.color} />
                  </View>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectTitle}>{subject.title}</Text>
                    <View style={styles.subjectMeta}>
                      <Text style={styles.subjectLessons}>{totalLessons} درس</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.subjectTrimesters}>{subject.trimesters.length} فصول</Text>
                    </View>
                    {pct > 0 && (
                      <View style={styles.progressRow}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: subject.color }]} />
                        </View>
                        <Text style={[styles.progressText, { color: subject.color }]}>{pct}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.subjectArrow}>
                    <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
                  </View>
                  <View style={[styles.subjectAccent, { backgroundColor: subject.color }]} />
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
    backgroundColor: '#7C5CFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  grid: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  subjectIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subjectTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.text,
    textAlign: 'right',
  },
  subjectMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  subjectLessons: {
    fontSize: 12,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  subjectTrimesters: {
    fontSize: 12,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    width: '100%',
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Cairo_700Bold',
    minWidth: 28,
    textAlign: 'left',
  },
  subjectArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});
