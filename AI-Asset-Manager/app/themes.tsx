import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useTheme, THEMES, ThemeDefinition } from '@/contexts/ThemeContext';
import { useGamification } from '@/contexts/GamificationContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ThemesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currentTheme, setTheme, isThemeUnlocked } = useTheme();
  const { currentLevel } = useGamification();

  const goBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

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
          <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10 }]}>
            <Pressable onPress={goBack} style={st.backBtn}>
              <Ionicons name="chevron-forward" size={22} color={Colors.text} />
            </Pressable>
            <Text style={st.headerTitle}>الألوان</Text>
            <View style={{ width: 38 }} />
          </View>
        </Animated.View>

        <View style={st.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View style={st.currentPreview}>
              <LinearGradient
                colors={[`${currentTheme.primary}25`, `${currentTheme.secondary}15`, '#141B28']}
                locations={[0, 0.5, 1]}
                style={st.currentPreviewGrad}
              >
                <View style={st.currentPreviewCircles}>
                  {currentTheme.previewColors.map((c, i) => (
                    <View key={i} style={[st.previewCircleLg, { backgroundColor: c, marginRight: i > 0 ? -12 : 0 }]} />
                  ))}
                </View>
                <Text style={[st.currentLabel, { color: currentTheme.primary }]}>اللون الحالي</Text>
                <Text style={st.currentName}>{currentTheme.nameAr}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={st.sectionTitle}>اختر اللون</Text>
            <Text style={st.sectionSub}>افتح ألوان جديدة بالوصول لمستويات أعلى</Text>
          </Animated.View>

          <View style={st.themesGrid}>
            {THEMES.map((theme, index) => {
              const unlocked = isThemeUnlocked(theme, currentLevel.level);
              const isActive = currentTheme.id === theme.id;
              return (
                <Animated.View key={theme.id} entering={FadeInDown.delay(250 + index * 80).duration(500)}>
                  <Pressable
                    onPress={() => {
                      if (unlocked) setTheme(theme.id);
                    }}
                    style={({ pressed }) => [
                      st.themeCard,
                      isActive && { borderColor: `${theme.primary}50` },
                      !unlocked && st.themeLocked,
                      pressed && unlocked && { opacity: 0.85 },
                    ]}
                  >
                    <LinearGradient
                      colors={[`${theme.primary}12`, '#141B28']}
                      locations={[0, 1]}
                      style={st.themeCardGrad}
                    >
                      <View style={st.themeCardTop}>
                        <View style={st.themePreviewDots}>
                          {theme.previewColors.map((c, i) => (
                            <View key={i} style={[st.previewDot, { backgroundColor: unlocked ? c : Colors.textMuted }]} />
                          ))}
                        </View>
                        {!unlocked && (
                          <View style={st.lockBadge}>
                            <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
                          </View>
                        )}
                        {isActive && (
                          <View style={[st.activeBadge, { backgroundColor: `${theme.primary}25` }]}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                          </View>
                        )}
                      </View>

                      <View style={[st.themeIconWrap, { backgroundColor: unlocked ? `${theme.primary}18` : 'rgba(255,255,255,0.03)' }]}>
                        <Ionicons
                          name={theme.icon as any}
                          size={24}
                          color={unlocked ? theme.primary : Colors.textMuted}
                        />
                      </View>

                      <Text style={[st.themeName, unlocked && { color: Colors.text }]} numberOfLines={1}>
                        {theme.nameAr}
                      </Text>

                      {!unlocked ? (
                        <View style={st.levelReq}>
                          <Ionicons name="arrow-up-circle" size={12} color={Colors.textMuted} />
                          <Text style={st.levelReqText}>المستوى {theme.requiredLevel}</Text>
                        </View>
                      ) : (
                        <View style={st.levelReq}>
                          <Ionicons name="checkmark" size={12} color={Colors.success} />
                          <Text style={[st.levelReqText, { color: Colors.success }]}>مفتوح</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },

  content: { paddingHorizontal: 16 },

  currentPreview: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  currentPreviewGrad: {
    padding: 24, alignItems: 'center',
  },
  currentPreviewCircles: {
    flexDirection: 'row', marginBottom: 14,
  },
  previewCircleLg: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 3, borderColor: '#141B28',
  },
  currentLabel: {
    fontSize: 12, fontFamily: 'Cairo_600SemiBold', marginBottom: 2,
  },
  currentName: {
    fontSize: 20, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },

  sectionTitle: {
    fontSize: 16, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'right', marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    textAlign: 'right', marginBottom: 18,
  },

  themesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'space-between',
  },
  themeCard: {
    width: (SCREEN_W - 44) / 2,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  themeLocked: { opacity: 0.55 },
  themeCardGrad: {
    padding: 16, alignItems: 'center',
  },
  themeCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', marginBottom: 14,
  },
  themePreviewDots: {
    flexDirection: 'row', gap: 5,
  },
  previewDot: {
    width: 14, height: 14, borderRadius: 7,
  },
  lockBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeBadge: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  themeIconWrap: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  themeName: {
    fontSize: 14, fontFamily: 'Cairo_700Bold', color: Colors.textMuted,
    textAlign: 'center', marginBottom: 4,
  },
  levelReq: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
  },
  levelReqText: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },
});
