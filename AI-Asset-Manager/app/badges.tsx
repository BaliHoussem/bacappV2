import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGamification, ALL_BADGES } from '@/contexts/GamificationContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlockedBadges } = useGamification();

  const goBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const unlocked = unlockedBadges.map(b => b.id);

  return (
    <View style={st.container}>
      <LinearGradient
        colors={['#0A0F1A', '#0F1A2E', '#0A0F1A']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10 }]}>
        <Pressable onPress={goBack} style={st.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </Pressable>
        <Text style={st.headerTitle}>الإنجازات</Text>
        <View style={st.headerRight}>
          <View style={st.countChip}>
            <Text style={st.countText}>{unlockedBadges.length}/{ALL_BADGES.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.list, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 30 }]}
      >
        {ALL_BADGES.map((badge, index) => {
          const isUnlocked = unlocked.includes(badge.id);
          return (
            <Animated.View key={badge.id} entering={FadeInDown.delay(index * 40).duration(400)}>
              <View style={[st.card, !isUnlocked && st.cardLocked]}>
                <View style={[st.accentLine, { backgroundColor: isUnlocked ? badge.color : Colors.textMuted }]} />
                <View style={st.cardInner}>
                  <View style={st.cardRow}>
                    <View style={[
                      st.iconWrap,
                      { backgroundColor: isUnlocked ? `${badge.color}18` : 'rgba(255,255,255,0.04)' },
                    ]}>
                      <Ionicons
                        name={badge.icon as any}
                        size={24}
                        color={isUnlocked ? badge.color : Colors.textMuted}
                      />
                    </View>
                    <View style={st.cardContent}>
                      <Text style={[st.cardTitle, isUnlocked && { color: Colors.text }]}>
                        {badge.title}
                      </Text>
                      <Text style={st.cardDesc}>{badge.description}</Text>
                    </View>
                    {isUnlocked ? (
                      <View style={[st.statusBadge, { backgroundColor: `${badge.color}18`, borderColor: `${badge.color}30` }]}>
                        <Ionicons name="checkmark" size={14} color={badge.color} />
                      </View>
                    ) : (
                      <View style={st.lockedBadge}>
                        <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  headerRight: { width: 38, alignItems: 'flex-end' },
  countChip: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  countText: {
    fontSize: 12, fontFamily: 'Cairo_700Bold', color: Colors.secondary, lineHeight: 16,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },

  card: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#141B28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLocked: { opacity: 0.5 },
  accentLine: { height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, opacity: 0.7 },
  cardInner: { padding: 14 },
  cardRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, alignItems: 'flex-end' },
  cardTitle: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.textMuted,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12, fontFamily: 'Cairo_400Regular', color: Colors.textMuted,
    textAlign: 'right',
  },
  statusBadge: {
    width: 30, height: 30, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  lockedBadge: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
});
