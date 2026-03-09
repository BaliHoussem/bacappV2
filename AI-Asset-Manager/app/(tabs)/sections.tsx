import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { BRANCH_SUBJECTS, getSubject, getTotalLessons } from '@/constants/curriculum';
import { isLessonComplete } from '@/lib/storage-keys';

export default function SectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const branch = user?.branch || 'sciences';
  const subjectIds = BRANCH_SUBJECTS[branch] || BRANCH_SUBJECTS.sciences;
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const loadProgress = useCallback(async () => {
    try {
      let totalLessons = 0;
      let completedLessons = 0;
      for (const subjectId of subjectIds) {
        const subject = getSubject(subjectId);
        totalLessons += getTotalLessons(subject);
        for (const trimester of subject.trimesters) {
          for (const lesson of trimester.lessons) {
            const done = await isLessonComplete(subject.id, trimester.id, lesson.id);
            if (done) completedLessons++;
          }
        }
      }
      setProgress({ completed: completedLessons, total: totalLessons });
    } catch (e) {
      console.error('Failed to load progress', e);
    }
  }, [branch]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0F1A2E', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10,
            paddingBottom: 160,
          },
        ]}
      >
        <Text style={styles.screenTitle}>الأقسام</Text>
        <Text style={styles.screenSubtitle}>اختر القسم للبدء بالمراجعة</Text>

        <View style={styles.grid}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Pressable
              onPress={() => router.push(`/section-subjects?branch=${branch}`)}
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={['#7C5CFF20', '#7C5CFF05']}
                style={StyleSheet.absoluteFill}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

              <View style={styles.cardContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="book-outline" size={34} color="#7C5CFF" />
                </View>

                <View style={styles.cardTextArea}>
                  <Text style={styles.cardTitle}>المواد</Text>
                  <Text style={styles.cardSubtitle}>{subjectIds.length} مادة دراسية</Text>
                </View>

                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-back" size={22} color="#7C5CFF" />
                </View>
              </View>

              {pct > 0 && (
                <View style={styles.progressArea}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>{pct}%</Text>
                </View>
              )}

              <View style={styles.accent} />
            </Pressable>
          </Animated.View>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 24,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#7C5CFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  cardArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressArea: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#7C5CFF',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#7C5CFF',
    minWidth: 32,
    textAlign: 'left',
  },
  accent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#7C5CFF',
  },
});
