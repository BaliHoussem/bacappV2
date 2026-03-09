import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { getSubject, getTotalLessons } from '@/constants/curriculum';
import { isLessonComplete } from '@/lib/storage-keys';

export default function SubjectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const subject = getSubject(id || '');
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  const loadProgress = useCallback(async () => {
    try {
      const counts: Record<string, number> = {};
      for (const trimester of subject.trimesters) {
        let completed = 0;
        for (const lesson of trimester.lessons) {
          const done = await isLessonComplete(subject.id, trimester.id, lesson.id);
          if (done) completed++;
        }
        counts[trimester.id] = completed;
      }
      setCompletedCounts(counts);
    } catch (e) {
      console.error('Failed to load progress', e);
    }
  }, [id, subject]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const trimesterIcons = ['school-outline', 'library-outline', 'trophy-outline'] as const;
  const trimesterGradients: [string, string][] = [
    [subject.color + '30', subject.color + '10'],
    [subject.color + '25', subject.color + '08'],
    [subject.color + '20', subject.color + '05'],
  ];

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
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: subject.color + '20' }]}>
            <Ionicons name={subject.icon as any} size={24} color={subject.color} />
          </View>
          <Text style={styles.headerTitle}>{subject.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
      >
        <View style={styles.subjectInfo}>
          <View style={[styles.bigIcon, { backgroundColor: subject.color + '15' }]}>
            <Ionicons name={subject.icon as any} size={48} color={subject.color} />
          </View>
          <Text style={styles.totalLessons}>{getTotalLessons(subject)} درس</Text>
          <Text style={styles.subtitle}>اختر الفصل للبدء بالمراجعة</Text>
        </View>

        <View style={styles.trimestersList}>
          {subject.trimesters.map((trimester, index) => {
            const completed = completedCounts[trimester.id] || 0;
            const total = trimester.lessons.length;
            const progress = total > 0 ? completed / total : 0;
            const isFullyCompleted = completed === total && total > 0;

            return (
              <Animated.View key={trimester.id} entering={FadeInDown.delay(index * 120).duration(500)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.trimesterCard,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() =>
                    router.push(`/trimester?subjectId=${subject.id}&trimesterId=${trimester.id}` as any)
                  }
                >
                  <LinearGradient
                    colors={trimesterGradients[index] || trimesterGradients[0]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.trimesterContent}>
                    <View style={[styles.trimesterIconWrap, { backgroundColor: subject.color + '25' }]}>
                      <Ionicons
                        name={isFullyCompleted ? 'checkmark-circle' : (trimesterIcons[index] as any)}
                        size={32}
                        color={isFullyCompleted ? Colors.success : subject.color}
                      />
                    </View>

                    <View style={styles.trimesterInfo}>
                      <Text style={styles.trimesterTitle}>{trimester.title}</Text>
                      <Text style={styles.trimesterLessons}>
                        {total} {total === 1 ? 'درس' : 'دروس'}
                      </Text>

                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.round(progress * 100)}%`,
                                backgroundColor: isFullyCompleted ? Colors.success : subject.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {completed}/{total}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-back" size={22} color={Colors.textMuted} />
                  </View>

                  <View style={[styles.trimesterAccent, { backgroundColor: subject.color }]} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  subjectInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  bigIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalLessons: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
  },
  trimestersList: {
    gap: 16,
  },
  trimesterCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  trimesterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  trimesterIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trimesterInfo: {
    flex: 1,
  },
  trimesterTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 2,
  },
  trimesterLessons: {
    fontSize: 13,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary,
    minWidth: 30,
    textAlign: 'center',
  },
  trimesterAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
});
