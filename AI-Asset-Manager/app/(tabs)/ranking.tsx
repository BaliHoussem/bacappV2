import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, FlatList, ActivityIndicator, Image, Dimensions, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, LEVELS } from '@/contexts/GamificationContext';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';
import AnimatedMascot from '@/components/AnimatedMascot';

const { width: SW } = Dimensions.get('window');
const PODIUM_W = (SW - 48) / 3;

interface RankingEntry {
  rank: number;
  name: string;
  username: string;
  xp: number;
  gems: number;
  wilaya: string;
  emailId: string;
  profilePicture: string | null;
}

function getLevelFromXp(xp: number) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) lvl = l;
    else break;
  }
  return lvl;
}

function emailToId(email: string): string {
  const encoded = email.toLowerCase();
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new TextEncoder().encode(encoded);
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] || 0;
    const c = bytes[i + 2] || 0;
    result += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)] + chars[((b & 15) << 2) | (c >> 6)] + chars[c & 63];
  }
  return result.slice(0, 16);
}

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { totalGems, syncNow } = useGamification();
  const [activeTab, setActiveTab] = useState<'wilaya' | 'national'>('national');
  const [refreshing, setRefreshing] = useState(false);

  const wilaya = activeTab === 'wilaya' && user?.wilaya ? user.wilaya : '';

  const { data, isLoading, refetch } = useQuery<{ rankings: RankingEntry[]; totalUsers: number }>({
    queryKey: ['/api/leaderboard', wilaya],
    queryFn: async () => {
      const base = getApiUrl();
      const url = new URL('/api/leaderboard', base);
      if (wilaya) url.searchParams.set('wilaya', wilaya);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useFocusEffect(
    useCallback(() => {
      syncNow();
      setTimeout(() => refetch(), 500);
    }, [refetch, syncNow])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    syncNow();
    await new Promise(r => setTimeout(r, 600));
    await refetch();
    setRefreshing(false);
  }, [syncNow, refetch]);

  const rankings = useMemo(() => data?.rankings || [], [data]);
  const totalUsers = data?.totalUsers || 0;
  const currentUserId = user?.email ? emailToId(user.email) : '';
  const podiumCount = Math.min(rankings.length, 3);

  const displayGems = useMemo(() => {
    const serverGems = rankings.find(r => r.emailId === currentUserId)?.gems || 0;
    return Math.max(totalGems, serverGems);
  }, [rankings, currentUserId, totalGems]);

  return (
    <View style={st.root}>
      <LinearGradient
        colors={['#080C14', '#0E1525', '#0A1628', '#080C14']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <View style={st.titleRow}>
          <LinearGradient colors={['#FFD70025', '#FFD70008']} style={st.titleIcon}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </LinearGradient>
          <Text style={st.title}>التصنيف</Text>
        </View>

        <View style={st.statsRow}>
          <LinearGradient colors={['#1A2540', '#151D30']} style={st.statCard}>
            <View style={[st.statIconBox, { backgroundColor: `${Colors.primary}18` }]}>
              <Ionicons name="people" size={16} color={Colors.primary} />
            </View>
            <View style={st.statTextCol}>
              <Text style={st.statNum}>{totalUsers.toLocaleString('ar-DZ')}</Text>
              <Text style={st.statLabel}>طالب مسجل</Text>
            </View>
          </LinearGradient>
          <LinearGradient colors={['#1A2540', '#151D30']} style={st.statCard}>
            <View style={[st.statIconBox, { backgroundColor: `${Colors.gems}18` }]}>
              <Ionicons name="diamond" size={16} color={Colors.gems} />
            </View>
            <View style={st.statTextCol}>
              <Text style={[st.statNum, { color: Colors.gems }]}>{displayGems.toLocaleString('ar-DZ')}</Text>
              <Text style={st.statLabel}>جواهرك</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={st.tabs}>
          {(['national', 'wilaya'] as const).map(tab => {
            const on = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[st.tab, on && st.tabOn]}>
                {on && <LinearGradient colors={[Colors.primary, '#00B894']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                <Ionicons name={tab === 'national' ? 'globe-outline' : 'location-outline'} size={15} color={on ? '#fff' : Colors.textSecondary} style={{ marginLeft: 5 }} />
                <Text style={[st.tabLabel, on && st.tabLabelOn]}>{tab === 'national' ? 'وطني' : 'ولائي'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={st.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : rankings.length > 0 ? (
        <FlatList
          data={rankings}
          keyExtractor={item => item.emailId}
          contentContainerStyle={[st.list, { paddingBottom: 160 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressBackgroundColor="#1A2235" />}
          ListHeaderComponent={
            podiumCount >= 1 ? (
              <Animated.View entering={FadeInDown.duration(500)}>
                <ClassicPodium rankings={rankings} podiumCount={podiumCount} currentUserId={currentUserId} />
                {rankings.length > podiumCount && (
                  <View style={st.sectionDivider}>
                    <View style={st.divLine} />
                    <Text style={st.divText}>بقية المتسابقين</Text>
                    <View style={st.divLine} />
                  </View>
                )}
              </Animated.View>
            ) : null
          }
          renderItem={({ item, index }) => {
            if (index < podiumCount) return null;
            return (
              <Animated.View entering={FadeInDown.delay(Math.min((index - podiumCount) * 60, 240)).duration(350)}>
                <ListRow item={item} isMe={item.emailId === currentUserId} />
              </Animated.View>
            );
          }}
        />
      ) : (
        <View style={st.center}>
          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', gap: 12 }}>
            <AnimatedMascot size={120} animation="idle" />
            <Text style={st.emptyTitle}>{activeTab === 'wilaya' ? 'لا يوجد تصنيف في ولايتك بعد' : 'لا يوجد تصنيف بعد'}</Text>
            <Text style={st.emptySub}>اجمع الجواهر من الاختبارات لتظهر في التصنيف</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function ClassicPodium({ rankings, podiumCount, currentUserId }: { rankings: RankingEntry[]; podiumCount: number; currentUserId: string }) {
  const first = rankings[0];
  const second = podiumCount >= 2 ? rankings[1] : null;
  const third = podiumCount >= 3 ? rankings[2] : null;

  return (
    <View style={st.podiumWrap}>
      <View style={st.podiumGlow} />

      <View style={st.podiumColumns}>
        <View style={[st.podiumCol, { width: PODIUM_W }]}>
          {second ? (
            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={st.podiumPlayerCol}>
              <PodiumAvatar rank={2} item={second} isMe={second.emailId === currentUserId} />
            </Animated.View>
          ) : (
            <View style={st.podiumPlayerCol}>
              <EmptyPodiumSlot />
            </View>
          )}
          <LinearGradient
            colors={['#A8B8D035', '#A8B8D010', '#A8B8D005']}
            style={[st.podiumBlock, { height: 80 }]}
          >
            <View style={[st.podiumBlockTop, { backgroundColor: '#A8B8D0' }]} />
            <Text style={[st.podiumBlockNum, { color: '#A8B8D0' }]}>2</Text>
          </LinearGradient>
        </View>

        <View style={[st.podiumCol, { width: PODIUM_W }]}>
          <Animated.View entering={FadeInUp.delay(150).duration(500)} style={st.podiumPlayerCol}>
            <PodiumAvatar rank={1} item={first} isMe={first.emailId === currentUserId} />
          </Animated.View>
          <LinearGradient
            colors={['#FFD70038', '#FFD70012', '#FFD70005']}
            style={[st.podiumBlock, { height: 110 }]}
          >
            <View style={[st.podiumBlockTop, { backgroundColor: '#FFD700' }]} />
            <Ionicons name="trophy" size={22} color="#FFD70060" style={{ marginBottom: 4 }} />
            <Text style={[st.podiumBlockNum, { color: '#FFD700', fontSize: 28 }]}>1</Text>
          </LinearGradient>
        </View>

        <View style={[st.podiumCol, { width: PODIUM_W }]}>
          {third ? (
            <Animated.View entering={FadeInUp.delay(450).duration(400)} style={st.podiumPlayerCol}>
              <PodiumAvatar rank={3} item={third} isMe={third.emailId === currentUserId} />
            </Animated.View>
          ) : (
            <View style={st.podiumPlayerCol}>
              <EmptyPodiumSlot />
            </View>
          )}
          <LinearGradient
            colors={['#CD7F3230', '#CD7F3210', '#CD7F3205']}
            style={[st.podiumBlock, { height: 60 }]}
          >
            <View style={[st.podiumBlockTop, { backgroundColor: '#CD7F32' }]} />
            <Text style={[st.podiumBlockNum, { color: '#CD7F32' }]}>3</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

function PodiumAvatar({ rank, item, isMe }: { rank: number; item: RankingEntry; isMe: boolean }) {
  const isFirst = rank === 1;
  const color = rank === 1 ? '#FFD700' : rank === 2 ? '#A8B8D0' : '#CD7F32';
  const gradColors: [string, string] = rank === 1 ? ['#FFD700', '#F5A623'] : rank === 2 ? ['#C0CCE0', '#7888A0'] : ['#D4944A', '#A0621A'];
  const icon = rank === 1 ? 'trophy' : rank === 2 ? 'medal' : 'ribbon';
  const avatarSz = isFirst ? 68 : 52;
  const ringSz = avatarSz + 8;
  const level = getLevelFromXp(item.xp);

  return (
    <View style={st.pAvatar}>
      {isMe && (
        <View style={[st.pMeBadge, { backgroundColor: `${color}25`, borderColor: `${color}50` }]}>
          <Text style={[st.pMeText, { color }]}>انت</Text>
        </View>
      )}

      <View style={st.pAvatarWrap}>
        <View style={[st.pCrown, { backgroundColor: color, width: isFirst ? 28 : 22, height: isFirst ? 28 : 22, borderRadius: isFirst ? 14 : 11, top: isFirst ? -14 : -11 }]}>
          <Ionicons name={icon as any} size={isFirst ? 15 : 11} color="#fff" />
        </View>

        <LinearGradient colors={gradColors} style={[st.pRing, { width: ringSz, height: ringSz, borderRadius: ringSz / 2 }]}>
          <View style={[st.pAvatarInner, { width: avatarSz, height: avatarSz, borderRadius: avatarSz / 2 }]}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={st.avatarImg} />
            ) : (
              <>
                <LinearGradient colors={[`${color}45`, `${color}12`]} style={[StyleSheet.absoluteFill, { borderRadius: avatarSz / 2 }]} />
                <Text style={[st.pAvatarLetter, { fontSize: isFirst ? 26 : 20, color }]}>{item.name.charAt(0)}</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      <Text style={[st.pName, isFirst && { color: '#fff', fontSize: 13 }]} numberOfLines={1}>{item.name}</Text>

      <View style={[st.pGemRow, { backgroundColor: `${color}12`, borderColor: `${color}22` }]}>
        <Ionicons name="diamond" size={11} color={Colors.gems} />
        <Text style={[st.pGemVal, { color }]}>{item.gems.toLocaleString('ar-DZ')}</Text>
      </View>

      <View style={[st.pLvlRow, { backgroundColor: `${level.color}12` }]}>
        <View style={[st.lvlDot, { backgroundColor: level.color }]} />
        <Text style={[st.lvlText, { color: level.color }]}>{level.title}</Text>
      </View>
    </View>
  );
}

function EmptyPodiumSlot() {
  return (
    <View style={st.pAvatar}>
      <View style={st.emptyAvatar}>
        <Ionicons name="person-outline" size={22} color="#2A3550" />
      </View>
      <Text style={st.emptyLabel}>---</Text>
    </View>
  );
}

function ListRow({ item, isMe }: { item: RankingEntry; isMe: boolean }) {
  const level = getLevelFromXp(item.xp);
  const top10 = item.rank <= 10;

  return (
    <View style={[st.row, isMe && st.rowHighlight]}>
      <View style={[st.rankBox, top10 && { backgroundColor: `${Colors.primary}14` }]}>
        <Text style={[st.rankText, top10 && { color: Colors.primary }]}>{item.rank}</Text>
      </View>

      <View style={[st.rowAvatar, { borderColor: `${level.color}35` }]}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={st.rowAvatarImg} />
        ) : (
          <>
            <LinearGradient colors={[`${level.color}30`, `${level.color}10`]} style={[StyleSheet.absoluteFill, { borderRadius: 21 }]} />
            <Text style={[st.rowAvatarLetter, { color: level.color }]}>{item.name.charAt(0)}</Text>
          </>
        )}
      </View>

      <View style={st.rowInfo}>
        <View style={st.rowNameRow}>
          <Text style={st.rowName} numberOfLines={1}>{item.name}</Text>
          {isMe && <View style={st.meTag}><Text style={st.meTagText}>انت</Text></View>}
        </View>
        <View style={st.rowMetaRow}>
          {item.wilaya ? (
            <>
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
              <Text style={st.rowWilaya}>{item.wilaya}</Text>
            </>
          ) : null}
          <View style={[st.lvlDot, { backgroundColor: level.color }]} />
          <Text style={[st.lvlText, { color: level.color }]}>{level.title}</Text>
        </View>
      </View>

      <View style={st.rowGemCol}>
        <Ionicons name="diamond" size={14} color={Colors.gems} style={{ marginLeft: 3 }} />
        <Text style={st.rowGemNum}>{item.gems.toLocaleString('ar-DZ')}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14' },

  header: { paddingHorizontal: 20, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 },
  titleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Cairo_700Bold', color: Colors.text },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, gap: 10,
    borderWidth: 1, borderColor: '#1F2940',
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statTextCol: { flex: 1, alignItems: 'flex-start' },
  statNum: { fontSize: 17, fontFamily: 'Cairo_700Bold', color: Colors.primary, lineHeight: 22 },
  statLabel: { fontSize: 10, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary, marginTop: -2 },

  tabs: { flexDirection: 'row', backgroundColor: '#131A2A', borderRadius: 14, padding: 3, borderWidth: 1, borderColor: '#1F2940' },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden' },
  tabOn: { overflow: 'hidden' },
  tabLabel: { fontSize: 13, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary },
  tabLabelOn: { color: '#fff' },

  list: { paddingHorizontal: 16 },

  podiumWrap: { paddingTop: 10, paddingBottom: 8 },
  podiumGlow: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    width: SW * 0.7, height: 100, borderRadius: 50,
    backgroundColor: '#FFD70006',
  },
  podiumColumns: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  podiumCol: {
    alignItems: 'center',
  },
  podiumPlayerCol: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  podiumBlockTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  podiumBlockNum: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
  },

  pAvatar: { alignItems: 'center', gap: 4 },
  pMeBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, borderWidth: 1, marginBottom: 2 },
  pMeText: { fontSize: 9, fontFamily: 'Cairo_700Bold' },

  pAvatarWrap: { alignItems: 'center', position: 'relative' },
  pCrown: {
    position: 'absolute', zIndex: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pRing: { padding: 3, alignItems: 'center', justifyContent: 'center' },
  pAvatarInner: { backgroundColor: '#151E30', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pAvatarLetter: { fontFamily: 'Cairo_700Bold' },
  avatarImg: { width: '100%', height: '100%' },

  pName: { fontSize: 11, fontFamily: 'Cairo_600SemiBold', color: Colors.text, textAlign: 'center', maxWidth: PODIUM_W - 8 },

  pGemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1,
  },
  pGemVal: { fontSize: 12, fontFamily: 'Cairo_700Bold' },

  pLvlRow: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  lvlDot: { width: 4, height: 4, borderRadius: 2 },
  lvlText: { fontSize: 9, fontFamily: 'Cairo_600SemiBold' },

  emptyAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#111825',
    borderWidth: 2, borderColor: '#1F2940', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyLabel: { fontSize: 11, fontFamily: 'Cairo_500Medium', color: '#2A3550' },

  sectionDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: 16, paddingHorizontal: 8,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#1F2940' },
  divText: { fontSize: 13, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141C2C', borderRadius: 16, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#1C2540', gap: 10,
  },
  rowHighlight: { borderColor: `${Colors.primary}35`, backgroundColor: `${Colors.primary}08` },

  rankBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1520' },
  rankText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: Colors.textMuted },

  rowAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0F1520', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5 },
  rowAvatarImg: { width: '100%', height: '100%' },
  rowAvatarLetter: { fontSize: 16, fontFamily: 'Cairo_700Bold' },

  rowInfo: { flex: 1, alignItems: 'flex-end' },
  rowNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: Colors.text, maxWidth: 120 },
  meTag: { backgroundColor: `${Colors.primary}18`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: `${Colors.primary}30` },
  meTagText: { fontSize: 10, fontFamily: 'Cairo_700Bold', color: Colors.primary },

  rowMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  rowWilaya: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary },

  rowGemCol: { flexDirection: 'row', alignItems: 'center', minWidth: 50 },
  rowGemNum: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.gems },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
