import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { BRANCHES, ACADEMIC_LEVELS } from '@/constants/data';
import { useGamification, LEVELS, ALL_BADGES } from '@/contexts/GamificationContext';
import { useStreak } from '@/hooks/useStreak';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout, currentEmail } = useAuth();
  const { totalXp, currentLevel, nextLevel, levelProgress, unlockedBadges, dailyXp } = useGamification();
  const { streakCount } = useStreak();

  const branchLabel = BRANCHES.find(b => b.id === user?.branch)?.label || '';
  const levelLabel = ACADEMIC_LEVELS.find(l => l.id === user?.academicLevel)?.label || '';

  const goBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout().then(() => router.replace('/'));
    } else {
      Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: () => logout().then(() => router.replace('/')) },
      ]);
    }
  };

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
        contentContainerStyle={{ paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 30 }}
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <LinearGradient
            colors={[`${currentLevel.color}30`, `${currentLevel.color}10`, '#0A0F1A']}
            locations={[0, 0.6, 1]}
            style={[st.heroCard, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10 }]}
          >
            <View style={st.heroHeader}>
              <Pressable onPress={goBack} style={st.backBtn}>
                <Ionicons name="chevron-forward" size={22} color={Colors.text} />
              </Pressable>
              <Text style={st.heroHeaderTitle}>الملف الشخصي</Text>
              <View style={{ width: 38 }} />
            </View>

            <View style={st.avatarSection}>
              <View style={[st.avatarRingOuter, { borderColor: `${currentLevel.color}35` }]}>
                <View style={[st.avatarRingInner, { borderColor: `${currentLevel.color}60` }]}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={st.avatarImg} />
                  ) : (
                    <LinearGradient
                      colors={[currentLevel.color, `${currentLevel.color}80`]}
                      style={st.avatarFallback}
                    >
                      <Text style={st.avatarLetter}>{user?.fullName?.charAt(0) || '?'}</Text>
                    </LinearGradient>
                  )}
                </View>
              </View>

              <View style={st.levelIndicator}>
                <LinearGradient
                  colors={[currentLevel.color, `${currentLevel.color}CC`]}
                  style={st.levelIndicatorInner}
                >
                  <Text style={st.levelIndicatorText}>{currentLevel.level}</Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={st.userName}>{user?.fullName || 'طالب'}</Text>
            <Text style={st.userHandle}>@{user?.username || 'user'}</Text>

            <View style={st.tagRow}>
              <View style={[st.tag, { borderColor: `${currentLevel.color}30`, backgroundColor: `${currentLevel.color}10` }]}>
                <View style={[st.tagDot, { backgroundColor: currentLevel.color }]} />
                <Text style={[st.tagText, { color: currentLevel.color }]}>المستوى {currentLevel.level}</Text>
              </View>
              <View style={[st.tag, { borderColor: 'rgba(255, 107, 107, 0.3)', backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                <View style={[st.tagDot, { backgroundColor: Colors.accent }]} />
                <Text style={[st.tagText, { color: Colors.accent }]}>{streakCount} يوم</Text>
              </View>
              {branchLabel ? (
                <View style={[st.tag, { borderColor: 'rgba(0, 212, 170, 0.3)', backgroundColor: 'rgba(0, 212, 170, 0.1)' }]}>
                  <View style={[st.tagDot, { backgroundColor: Colors.primary }]} />
                  <Text style={[st.tagText, { color: Colors.primary }]}>{branchLabel}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={st.content}>
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <View style={st.xpSection}>
              <View style={st.xpHeaderRow}>
                <Text style={st.sectionLabel}>تقدم المستوى</Text>
                <View style={st.xpAmountRow}>
                  <View style={st.xpBadge}>
                    <Text style={st.xpBadgeText}>XP</Text>
                  </View>
                  <Text style={st.xpAmountNum}>{totalXp}</Text>
                  <Text style={st.xpAmountLabel}>نقطة خبرة</Text>
                </View>
              </View>

              <View style={st.progressRow}>
                <View style={st.progressBarBg}>
                  <LinearGradient
                    colors={[currentLevel.color, `${currentLevel.color}60`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[st.progressBarFill, { width: `${Math.max(3, levelProgress * 100)}%` as any }]}
                  />
                </View>
                <View style={[st.progressEndDot, { backgroundColor: currentLevel.color }]} />
              </View>

              <View style={st.progressLabels}>
                <Text style={st.progressPercent}>{Math.round(levelProgress * 100)}%</Text>
                <Text style={st.progressRemain}>
                  {nextLevel ? `${xpToNext} XP للمستوى التالي` : 'وصلت لأعلى مستوى!'}
                </Text>
              </View>

              <View style={st.levelPath}>
                <View style={st.levelPathItem}>
                  <View style={[st.levelPathDot, { backgroundColor: currentLevel.color }]} />
                  <Text style={[st.levelPathText, { color: currentLevel.color }]}>{currentLevel.title}</Text>
                </View>
                <View style={[st.levelPathLine, { backgroundColor: `${currentLevel.color}30` }]} />
                {nextLevel && (
                  <View style={st.levelPathItem}>
                    <View style={[st.levelPathDot, { backgroundColor: Colors.textMuted }]} />
                    <Text style={st.levelPathTextNext}>{nextLevel.title}</Text>
                  </View>
                )}
              </View>

              <View style={st.dailyXpRow}>
                <View style={st.dailyXpPill}>
                  <Ionicons name="flash" size={14} color="#FFD700" />
                  <Text style={st.dailyXpText}>+{dailyXp} XP اليوم</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <View style={st.badgeSectionHeader}>
              <Pressable onPress={() => router.push('/badges')} style={st.viewAllBtn}>
                <Text style={st.viewAllText}>عرض الكل</Text>
                <Ionicons name="chevron-back" size={14} color={Colors.primary} />
              </Pressable>
              <View style={st.badgeSectionRight}>
                <Text style={st.sectionTitle}>الإنجازات</Text>
                <View style={st.badgeCountChip}>
                  <Text style={st.badgeCountText}>{unlockedBadges.length}/{ALL_BADGES.length}</Text>
                </View>
              </View>
            </View>
            <View style={st.badgesGrid}>
              {ALL_BADGES.slice(0, 3).map(badge => {
                const unlocked = unlockedBadges.some(b => b.id === badge.id);
                return (
                  <View key={badge.id} style={[st.badgeCard, !unlocked && st.badgeLocked]}>
                    <View style={[
                      st.badgeIconWrap,
                      { backgroundColor: unlocked ? `${badge.color}18` : 'rgba(255,255,255,0.03)' },
                    ]}>
                      <Ionicons
                        name={badge.icon as any}
                        size={22}
                        color={unlocked ? badge.color : Colors.textMuted}
                      />
                    </View>
                    <Text style={[st.badgeName, unlocked && { color: Colors.text }]} numberOfLines={1}>
                      {badge.title}
                    </Text>
                    {unlocked && <View style={[st.badgeUnlockedBar, { backgroundColor: badge.color }]} />}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(500)}>
            <Text style={st.sectionTitle}>المعلومات</Text>
            <View style={st.infoCard}>
              <InfoRow label="البريد الإلكتروني" value={currentEmail || user?.email || '-'} color={Colors.gems} />
              <View style={st.sep} />
              <InfoRow label="الولاية" value={user?.wilaya || '-'} color={Colors.cyan} />
              <View style={st.sep} />
              <InfoRow label="المستوى الدراسي" value={levelLabel || '-'} color={Colors.gold} />
              <View style={st.sep} />
              <InfoRow label="الشعبة" value={branchLabel || '-'} color={Colors.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(500)}>
            <Text style={st.sectionTitle}>الإعدادات</Text>
            <View style={st.infoCard}>
              <Pressable onPress={() => router.push('/progress')} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <SettingsRow icon="bar-chart-outline" label="تقدمي" color={Colors.gold} />
              </Pressable>
              <View style={st.sep} />
              <SettingsRow icon="notifications-outline" label="الإشعارات" color={Colors.primary} />
              <View style={st.sep} />
              <Pressable onPress={() => router.push('/themes')} style={{ width: '100%' }}>
                <SettingsRow icon="color-palette-outline" label="الألوان" color={Colors.secondary} />
              </Pressable>
              <View style={st.sep} />
              <SettingsRow icon="language-outline" label="اللغة" color={Colors.cyan} />
              <View style={st.sep} />
              <SettingsRow icon="shield-checkmark-outline" label="الخصوصية" color={Colors.gold} />
              <View style={st.sep} />
              <SettingsRow icon="help-circle-outline" label="المساعدة" color={Colors.textSecondary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(500)}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [st.logoutBtn, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient
                colors={['rgba(248, 81, 73, 0.1)', 'rgba(248, 81, 73, 0.04)']}
                style={st.logoutGrad}
              >
                <Text style={st.logoutText}>تسجيل الخروج</Text>
                <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={st.infoRow}>
      <Text style={st.infoValue}>{value}</Text>
      <View style={st.infoLabelRow}>
        <Text style={st.infoLabel}>{label}</Text>
        <View style={[st.infoColorDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <Pressable style={({ pressed }) => [st.settingsRow, pressed && { opacity: 0.7 }]}>
      <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
      <View style={st.settingsRight}>
        <Text style={st.settingsLabel}>{label}</Text>
        <View style={[st.settingsIconWrap, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  heroCard: { paddingBottom: 28, paddingHorizontal: 20 },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroHeaderTitle: {
    fontSize: 17, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },

  avatarSection: { alignItems: 'center', marginBottom: 14, position: 'relative' as const },
  avatarRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarRingInner: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
  levelIndicator: {
    position: 'absolute', bottom: -6, alignSelf: 'center',
  },
  levelIndicatorInner: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#0A0F1A',
  },
  levelIndicatorText: {
    fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#fff', lineHeight: 16,
  },

  userName: {
    fontSize: 24, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 14, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
    textAlign: 'center', marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8,
  },
  tag: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1,
  },
  tagDot: { width: 5, height: 5, borderRadius: 3 },
  tagText: { fontSize: 12, fontFamily: 'Cairo_600SemiBold' },

  content: { paddingHorizontal: 16 },

  xpSection: {
    backgroundColor: '#141B28', borderRadius: 20,
    padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  xpHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  xpAmountRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  xpBadge: {
    backgroundColor: 'rgba(124, 92, 255, 0.2)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1,
  },
  xpBadgeText: {
    fontSize: 10, fontFamily: 'Cairo_700Bold', color: Colors.secondary, lineHeight: 15,
  },
  xpAmountNum: {
    fontSize: 22, fontFamily: 'Cairo_700Bold', color: Colors.text, lineHeight: 28,
  },
  xpAmountLabel: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary, marginTop: 4,
  },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  progressBarBg: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressEndDot: { width: 10, height: 10, borderRadius: 5 },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14,
  },
  progressPercent: {
    fontSize: 11, fontFamily: 'Cairo_700Bold', color: Colors.textSecondary,
  },
  progressRemain: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },

  levelPath: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  levelPathItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  levelPathDot: { width: 7, height: 7, borderRadius: 4 },
  levelPathText: { fontSize: 13, fontFamily: 'Cairo_700Bold' },
  levelPathTextNext: { fontSize: 13, fontFamily: 'Cairo_500Medium', color: Colors.textMuted },
  levelPathLine: { flex: 1, height: 1.5, borderRadius: 1 },

  dailyXpRow: { alignItems: 'flex-end' },
  dailyXpPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  dailyXpText: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', color: '#FFD700',
  },

  sectionTitle: {
    fontSize: 16, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'right', marginBottom: 4,
  },

  badgeSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  badgeSectionRight: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
  },
  badgeCountChip: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeCountText: {
    fontSize: 11, fontFamily: 'Cairo_700Bold', color: Colors.secondary, lineHeight: 15,
  },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  viewAllText: {
    fontSize: 13, fontFamily: 'Cairo_600SemiBold', color: Colors.primary,
  },

  badgesGrid: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
    justifyContent: 'flex-end',
  },
  badgeCard: {
    width: (SCREEN_W - 52) / 3,
    backgroundColor: '#141B28',
    borderRadius: 16, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  badgeLocked: { opacity: 0.4 },
  badgeIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  badgeName: {
    fontSize: 11, fontFamily: 'Cairo_700Bold', color: Colors.textMuted,
    textAlign: 'center',
  },
  badgeUnlockedBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
  },

  infoCard: {
    backgroundColor: '#141B28', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden', marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoColorDot: { width: 6, height: 6, borderRadius: 3 },
  infoLabel: { fontSize: 14, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: Colors.text },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 14 },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { fontSize: 14, fontFamily: 'Cairo_500Medium', color: Colors.text },

  logoutBtn: { marginTop: 4, borderRadius: 16, overflow: 'hidden' },
  logoutGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(248, 81, 73, 0.15)',
  },
  logoutText: { fontSize: 15, fontFamily: 'Cairo_600SemiBold', color: Colors.error },
});
