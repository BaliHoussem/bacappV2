import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { getSubject } from '@/constants/curriculum';

type LessonView = 'choice' | 'summary';

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rawParams = useLocalSearchParams<{
    subjectId: string;
    trimesterId: string;
    lessonId: string;
  }>();
  const subjectId = Array.isArray(rawParams.subjectId) ? rawParams.subjectId[0] : rawParams.subjectId;
  const trimesterId = Array.isArray(rawParams.trimesterId) ? rawParams.trimesterId[0] : rawParams.trimesterId;
  const lessonId = Array.isArray(rawParams.lessonId) ? rawParams.lessonId[0] : rawParams.lessonId;

  const [view, setView] = useState<LessonView>('choice');

  const subject = useMemo(() => subjectId ? getSubject(subjectId) : undefined, [subjectId]);
  const trimester = useMemo(() => subject?.trimesters.find((t) => t.id === trimesterId), [subject, trimesterId]);
  const lesson = useMemo(() => trimester?.lessons.find((l) => l.id === lessonId), [trimester, lessonId]);

  const subjectColor = subject?.color ?? Colors.primary;

  const goToQuiz = () => {
    (router as any).push(`/quiz?subjectId=${subjectId}&trimesterId=${trimesterId}&lessonId=${lessonId}`);
  };

  if (!lesson) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, '#0F1A2E', Colors.background]} style={StyleSheet.absoluteFill} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>الدرس غير موجود</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>العودة</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, '#0F1A2E', Colors.background]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 20 : insets.top) + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-forward" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.headerSubtitle}>{subject?.title} • {trimester?.title}</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: `${subjectColor}20` }]}>
          <Ionicons name={(subject?.icon as any) ?? 'book-outline'} size={22} color={subjectColor} />
        </View>
      </View>

      {view === 'choice' ? (
        <View style={styles.choiceContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.choiceCard}>
            <View style={[styles.choiceIconCircle, { backgroundColor: `${subjectColor}15` }]}>
              <Ionicons name="help-circle-outline" size={56} color={subjectColor} />
            </View>

            <Text style={styles.choiceQuestion}>هل أنت حافظ هذا الدرس؟</Text>
            <Text style={styles.choiceHint}>اختر الطريقة التي تناسبك للمتابعة</Text>

            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.choiceBtns}>
              <Pressable
                onPress={goToQuiz}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  styles.skipBtn,
                  { borderColor: subjectColor },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name="flash-outline" size={24} color={subjectColor} />
                <Text style={[styles.choiceBtnTitle, { color: subjectColor }]}>تخطي إلى التمارين</Text>
                <Text style={styles.choiceBtnDesc}>أنا جاهز للاختبار مباشرة</Text>
              </Pressable>

              <Pressable
                onPress={() => setView('summary')}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  styles.reviewBtn,
                  { backgroundColor: subjectColor },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name="book-outline" size={24} color={Colors.white} />
                <Text style={[styles.choiceBtnTitle, { color: Colors.white }]}>مراجعة الدرس أولا</Text>
                <Text style={[styles.choiceBtnDesc, { color: 'rgba(255,255,255,0.7)' }]}>أريد قراءة الملخص قبل التمارين</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.summaryScroll, { paddingBottom: 120 }]}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIconCircle, { backgroundColor: `${subjectColor}15` }]}>
                <Ionicons name="document-text-outline" size={28} color={subjectColor} />
              </View>
              <Text style={styles.summaryTitle}>ملخص الدرس</Text>
            </View>

            <View style={styles.summaryCard}>
              {lesson.summary.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <View key={i} style={styles.summarySpacing} />;

                const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                const isNumbered = /^\d+[\.\)]/.test(trimmed);
                const isHeading = !isBullet && !isNumbered && trimmed.endsWith(':');

                if (isHeading) {
                  return (
                    <Text key={i} style={[styles.summaryHeading, { color: subjectColor }]}>
                      {trimmed}
                    </Text>
                  );
                }

                if (isBullet || isNumbered) {
                  return (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: subjectColor }]} />
                      <Text style={styles.summaryText}>{trimmed.replace(/^[•\-]\s*/, '').replace(/^\d+[\.\)]\s*/, '')}</Text>
                    </View>
                  );
                }

                return <Text key={i} style={styles.summaryText}>{trimmed}</Text>;
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Pressable
              onPress={goToQuiz}
              style={({ pressed }) => [
                styles.startQuizBtn,
                { backgroundColor: subjectColor },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="play-circle-outline" size={24} color={Colors.white} />
              <Text style={styles.startQuizText}>ابدأ التمارين</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  choiceCard: {
    alignItems: 'center',
  },
  choiceIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  choiceQuestion: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  choiceHint: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  choiceBtns: {
    width: '100%',
    gap: 14,
  },
  choiceBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  skipBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
  },
  reviewBtn: {
    borderWidth: 0,
  },
  choiceBtnTitle: {
    fontSize: 17,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
  },
  choiceBtnDesc: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeading: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'right',
  },
  summaryText: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.text,
    lineHeight: 26,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 8,
    marginVertical: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  summarySpacing: {
    height: 8,
  },
  startQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  startQuizText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: Colors.white,
  },
});
