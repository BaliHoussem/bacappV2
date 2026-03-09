import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useNotificationCenter } from '@/contexts/NotificationCenterContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

function userKey(email: string | null, base: string) {
  if (!email) return base;
  return `${base}_${email.toLowerCase().trim()}`;
}

const XP_BASE = '@najahi_xp';
const GEMS_BASE = '@najahi_gems';
const BADGES_BASE = '@najahi_badges';
const DAILY_XP_BASE = '@najahi_daily_xp';
const LAST_OPEN_XP_BASE = '@najahi_last_open_xp_date';
const ACTIVITY_BASE = '@najahi_daily_activity';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  unlockedAt?: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_login', title: 'أول خطوة', description: 'فتحت التطبيق لأول مرة', icon: 'rocket-outline', color: '#00D4AA', bg: '#00D4AA20' },
  { id: 'streak_3', title: 'نشيط', description: '3 أيام متتالية من النشاط', icon: 'flame', color: '#FF6B6B', bg: '#FF6B6B20' },
  { id: 'streak_7', title: 'مثابر', description: '7 أيام متتالية من النشاط', icon: 'flame', color: '#FF8C42', bg: '#FF8C4220' },
  { id: 'streak_14', title: 'محارب', description: '14 يوم متتالي من النشاط', icon: 'shield-checkmark', color: '#FFB74D', bg: '#FFB74D20' },
  { id: 'streak_30', title: 'أسطورة', description: '30 يوم متتالي من النشاط', icon: 'star', color: '#FFD700', bg: '#FFD70020' },
  { id: 'xp_100', title: 'متعلم', description: 'جمعت 100 نقطة XP', icon: 'sparkles', color: '#7C5CFF', bg: '#7C5CFF20' },
  { id: 'xp_500', title: 'مجتهد', description: 'جمعت 500 نقطة XP', icon: 'diamond', color: '#4FC3F7', bg: '#4FC3F720' },
  { id: 'xp_1000', title: 'متفوق', description: 'جمعت 1000 نقطة XP', icon: 'trophy', color: '#FFB74D', bg: '#FFB74D20' },
  { id: 'xp_5000', title: 'عبقري', description: 'جمعت 5000 نقطة XP', icon: 'medal', color: '#FF6B6B', bg: '#FF6B6B20' },
  { id: 'level_5', title: 'طالب واعد', description: 'وصلت للمستوى 5', icon: 'trending-up', color: '#00D4AA', bg: '#00D4AA20' },
  { id: 'level_10', title: 'نجم صاعد', description: 'وصلت للمستوى 10', icon: 'star-half', color: '#FFB74D', bg: '#FFB74D20' },
  { id: 'level_20', title: 'بطل البكالوريا', description: 'وصلت للمستوى 20', icon: 'ribbon', color: '#FF6B6B', bg: '#FF6B6B20' },
  { id: 'night_owl', title: 'بومة الليل', description: 'درست بعد منتصف الليل', icon: 'moon', color: '#7C5CFF', bg: '#7C5CFF20' },
  { id: 'early_bird', title: 'عصفور الصباح', description: 'درست قبل السادسة صباحا', icon: 'sunny', color: '#FFB74D', bg: '#FFB74D20' },
  { id: 'weekend_warrior', title: 'محارب نهاية الأسبوع', description: 'درست يوم الجمعة والسبت', icon: 'fitness', color: '#00D4AA', bg: '#00D4AA20' },
];

export const LEVELS = [
  { level: 1, title: 'مبتدئ', minXp: 0, color: '#8B949E' },
  { level: 2, title: 'متحمس', minXp: 50, color: '#00D4AA' },
  { level: 3, title: 'نشيط', minXp: 120, color: '#00D4AA' },
  { level: 4, title: 'مجتهد', minXp: 200, color: '#4FC3F7' },
  { level: 5, title: 'طالب واعد', minXp: 350, color: '#4FC3F7' },
  { level: 6, title: 'متقدم', minXp: 550, color: '#7C5CFF' },
  { level: 7, title: 'ذكي', minXp: 800, color: '#7C5CFF' },
  { level: 8, title: 'متميز', minXp: 1100, color: '#FFB74D' },
  { level: 9, title: 'متفوق', minXp: 1500, color: '#FFB74D' },
  { level: 10, title: 'نجم صاعد', minXp: 2000, color: '#FF8C42' },
  { level: 11, title: 'محترف', minXp: 2600, color: '#FF8C42' },
  { level: 12, title: 'خبير', minXp: 3300, color: '#FF6B6B' },
  { level: 13, title: 'عالم', minXp: 4100, color: '#FF6B6B' },
  { level: 14, title: 'عبقري', minXp: 5000, color: '#FF6B6B' },
  { level: 15, title: 'أسطورة', minXp: 6000, color: '#FFD700' },
  { level: 16, title: 'ملك المراجعة', minXp: 7200, color: '#FFD700' },
  { level: 17, title: 'بطل التحديات', minXp: 8500, color: '#FFD700' },
  { level: 18, title: 'قائد المتفوقين', minXp: 10000, color: '#FFD700' },
  { level: 19, title: 'حكيم البكالوريا', minXp: 12000, color: '#FFD700' },
  { level: 20, title: 'بطل البكالوريا', minXp: 15000, color: '#FFD700' },
];

export type XpEvent = 'app_open' | 'streak_bonus' | 'lesson_complete' | 'exercise_correct' | 'daily_goal' | 'badge_earned';

const XP_AMOUNTS: Record<XpEvent, number> = {
  app_open: 5,
  streak_bonus: 10,
  lesson_complete: 25,
  exercise_correct: 10,
  daily_goal: 50,
  badge_earned: 30,
};

interface PendingNotification {
  type: 'xp' | 'level_up' | 'badge';
  xpAmount?: number;
  newLevel?: typeof LEVELS[0];
  badge?: Badge;
}

interface GamificationContextValue {
  totalXp: number;
  totalGems: number;
  currentLevel: typeof LEVELS[0];
  nextLevel: typeof LEVELS[0] | null;
  levelProgress: number;
  unlockedBadges: Badge[];
  allBadges: Badge[];
  addXp: (event: XpEvent) => void;
  addGems: (amount: number) => void;
  syncNow: () => void;
  checkBadge: (badgeId: string) => void;
  notifications: PendingNotification[];
  dismissNotification: () => void;
  dailyXp: number;
  grantDailyOpenXp: () => Promise<boolean>;
  resetAll: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}

const achievementSound: { current: Audio.Sound | null } = { current: null };
const levelUpSound: { current: Audio.Sound | null } = { current: null };
const xpSound: { current: Audio.Sound | null } = { current: null };

async function playSound(ref: { current: Audio.Sound | null }, asset: any) {
  try {
    if (ref.current) {
      await ref.current.setPositionAsync(0);
      await ref.current.playAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync(asset);
      ref.current = sound;
      await sound.playAsync();
    }
  } catch (e) {
    if (__DEV__) console.warn('[Gamification] sound error:', e);
  }
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [totalXp, setTotalXp] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<PendingNotification[]>([]);
  const [dailyXp, setDailyXp] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const notifQueue = useRef<PendingNotification[]>([]);
  const { addNotification: pushToInbox } = useNotificationCenter();
  const pushToInboxRef = useRef(pushToInbox);
  pushToInboxRef.current = pushToInbox;
  const { user, currentEmail, isAuthenticated } = useAuth();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedXp = useRef(0);
  const lastSyncedGems = useRef(0);
  const xpRef = useRef(0);
  const gemsRef = useRef(0);
  const emailRef = useRef<string | null>(null);
  xpRef.current = totalXp;
  gemsRef.current = totalGems;
  emailRef.current = currentEmail;

  const doSync = useCallback(() => {
    const email = emailRef.current || user?.email;
    if (!email) return;
    const xp = xpRef.current;
    const gems = gemsRef.current;
    lastSyncedXp.current = xp;
    lastSyncedGems.current = gems;
    if (__DEV__) console.log('[Gamification] syncing to server:', { email, xp, gems });
    apiRequest('POST', '/api/leaderboard/sync', { email, xp, gems })
      .then(() => { if (__DEV__) console.log('[Gamification] sync success'); })
      .catch((e) => { if (__DEV__) console.warn('[Gamification] sync error:', e); });
  }, [user?.email]);

  const syncToServer = useCallback(() => {
    const email = emailRef.current || user?.email;
    const xp = xpRef.current;
    const gems = gemsRef.current;
    if (!email || (xp === lastSyncedXp.current && gems === lastSyncedGems.current)) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(doSync, 3000);
  }, [user?.email, doSync]);

  const syncNow = useCallback(() => {
    const email = emailRef.current || user?.email;
    if (!email) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    if (__DEV__) console.log('[Gamification] syncNow called, xp:', xpRef.current, 'gems:', gemsRef.current);
    if (xpRef.current > 0 || gemsRef.current > 0) {
      doSync();
    }
  }, [user?.email, doSync]);

  useEffect(() => {
    if (!currentEmail) {
      setTotalXp(0);
      setTotalGems(0);
      setUnlockedBadgeIds([]);
      setDailyXp(0);
      notifQueue.current = [];
      setNotifications([]);
      setLoaded(false);
      lastSyncedXp.current = 0;
      lastSyncedGems.current = 0;
      xpRef.current = 0;
      gemsRef.current = 0;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const email = currentEmail;

        const migrated = await AsyncStorage.getItem(`@najahi_migrated_${email}`);
        if (!migrated) {
          const [oldXp, oldGems, oldBadges, oldDaily, oldActivity, oldLastOpen] = await Promise.all([
            AsyncStorage.getItem(XP_BASE),
            AsyncStorage.getItem(GEMS_BASE),
            AsyncStorage.getItem(BADGES_BASE),
            AsyncStorage.getItem(DAILY_XP_BASE),
            AsyncStorage.getItem(ACTIVITY_BASE),
            AsyncStorage.getItem(LAST_OPEN_XP_BASE),
          ]);
          const writes: [string, string][] = [];
          if (oldXp) writes.push([userKey(email, XP_BASE), oldXp]);
          if (oldGems) writes.push([userKey(email, GEMS_BASE), oldGems]);
          if (oldBadges) writes.push([userKey(email, BADGES_BASE), oldBadges]);
          if (oldDaily) writes.push([userKey(email, DAILY_XP_BASE), oldDaily]);
          if (oldActivity) writes.push([userKey(email, ACTIVITY_BASE), oldActivity]);
          if (oldLastOpen) writes.push([userKey(email, LAST_OPEN_XP_BASE), oldLastOpen]);
          if (writes.length > 0) {
            await AsyncStorage.multiSet(writes);
          }
          await AsyncStorage.setItem(`@najahi_migrated_${email}`, '1');
          if (__DEV__) console.log('[Gamification] migrated old data for', email);
        }

        const [xpRaw, gemsRaw, badgesRaw, dailyRaw] = await Promise.all([
          AsyncStorage.getItem(userKey(email, XP_BASE)),
          AsyncStorage.getItem(userKey(email, GEMS_BASE)),
          AsyncStorage.getItem(userKey(email, BADGES_BASE)),
          AsyncStorage.getItem(userKey(email, DAILY_XP_BASE)),
        ]);
        if (cancelled) return;

        const parsedXp = parseInt(xpRaw || '0', 10) || 0;
        const parsedGems = parseInt(gemsRaw || '0', 10) || 0;
        if (__DEV__) console.log('[Gamification] loaded for', email, '- xp:', parsedXp, 'gems:', parsedGems);

        let serverXp = 0;
        let serverGems = 0;
        try {
          const res = await apiRequest('GET', `/api/auth/account/${encodeURIComponent(email)}`);
          if (res && typeof res === 'object') {
            serverXp = (res as any).xp || 0;
            serverGems = (res as any).gems || 0;
          }
        } catch {}
        if (cancelled) return;

        const finalXp = Math.max(parsedXp, serverXp);
        const finalGems = Math.max(parsedGems, serverGems);

        setTotalXp(finalXp);
        setTotalGems(finalGems);
        xpRef.current = finalXp;
        gemsRef.current = finalGems;

        if (badgesRaw) setUnlockedBadgeIds(JSON.parse(badgesRaw));
        else setUnlockedBadgeIds([]);

        if (dailyRaw) {
          const { date, xp } = JSON.parse(dailyRaw);
          const today = new Date().toISOString().slice(0, 10);
          if (date === today) setDailyXp(xp);
          else setDailyXp(0);
        } else {
          setDailyXp(0);
        }

        if (finalXp > parsedXp || finalGems > parsedGems) {
          await AsyncStorage.setItem(userKey(email, XP_BASE), finalXp.toString());
          await AsyncStorage.setItem(userKey(email, GEMS_BASE), finalGems.toString());
        }

        if (finalXp > serverXp || finalGems > serverGems) {
          lastSyncedXp.current = 0;
          lastSyncedGems.current = 0;
          syncToServer();
        }
      } catch (e) {
        if (__DEV__) console.warn('[Gamification] state load error:', e);
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [currentEmail]);

  const getLevelFromXp = useCallback((xp: number) => {
    let lvl = LEVELS[0];
    for (const l of LEVELS) {
      if (xp >= l.minXp) lvl = l;
      else break;
    }
    return lvl;
  }, []);

  const currentLevel = getLevelFromXp(totalXp);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1) || null;
  const levelProgress = nextLevel
    ? (totalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)
    : 1;

  const pushNotification = useCallback((notif: PendingNotification) => {
    notifQueue.current.push(notif);
    setNotifications([...notifQueue.current]);
  }, []);

  const addXp = useCallback((event: XpEvent) => {
    if (!loaded || !emailRef.current) return;
    const email = emailRef.current;
    const amount = XP_AMOUNTS[event];
    setTotalXp(prev => {
      const newXp = prev + amount;
      xpRef.current = newXp;
      AsyncStorage.setItem(userKey(email, XP_BASE), newXp.toString()).catch(() => {});

      const oldLevel = getLevelFromXp(prev);
      const newLevel = getLevelFromXp(newXp);

      playSound(xpSound, require('@/assets/sounds/xp.wav'));
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      pushNotification({ type: 'xp', xpAmount: amount });

      if (newLevel.level > oldLevel.level) {
        setTimeout(() => {
          playSound(levelUpSound, require('@/assets/sounds/level_up.wav'));
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          pushNotification({ type: 'level_up', newLevel });
          pushToInboxRef.current({
            title: `ارتقيت للمستوى ${newLevel.level}`,
            body: `مبروك! وصلت لمستوى "${newLevel.title}"`,
            sender: 'achievement',
            icon: 'arrow-up-circle',
            color: newLevel.color,
            details: `لقد جمعت ${newXp} نقطة XP ووصلت لمستوى "${newLevel.title}". واصل الاجتهاد للوصول للمستوى التالي!`,
          });

          if (newLevel.level === 5) checkBadgeInternal('level_5');
          if (newLevel.level === 10) checkBadgeInternal('level_10');
          if (newLevel.level === 20) checkBadgeInternal('level_20');
        }, 800);
      }

      if (newXp >= 100) checkBadgeInternal('xp_100');
      if (newXp >= 500) checkBadgeInternal('xp_500');
      if (newXp >= 1000) checkBadgeInternal('xp_1000');
      if (newXp >= 5000) checkBadgeInternal('xp_5000');

      syncToServer();
      return newXp;
    });

    setDailyXp(prev => {
      const n = prev + amount;
      const today = new Date().toISOString().slice(0, 10);
      AsyncStorage.setItem(userKey(email, DAILY_XP_BASE), JSON.stringify({ date: today, xp: n })).catch(() => {});
      return n;
    });

    AsyncStorage.getItem(userKey(email, ACTIVITY_BASE)).then(raw => {
      const activity = raw ? JSON.parse(raw) : {};
      const today = new Date().toISOString().slice(0, 10);
      activity[today] = (activity[today] || 0) + amount;
      AsyncStorage.setItem(userKey(email, ACTIVITY_BASE), JSON.stringify(activity)).catch(() => {});
    }).catch(() => {});
  }, [loaded]);

  const addGems = useCallback((amount: number) => {
    if (!loaded || amount <= 0 || !emailRef.current) return;
    const email = emailRef.current;
    setTotalGems(prev => {
      const newGems = prev + amount;
      gemsRef.current = newGems;
      AsyncStorage.setItem(userKey(email, GEMS_BASE), newGems.toString()).catch(() => {});
      syncToServer();
      return newGems;
    });
  }, [loaded]);

  const checkBadgeInternal = useCallback((badgeId: string) => {
    setUnlockedBadgeIds(prev => {
      if (prev.includes(badgeId)) return prev;
      const updated = [...prev, badgeId];
      const email = emailRef.current;
      if (email) {
        AsyncStorage.setItem(userKey(email, BADGES_BASE), JSON.stringify(updated)).catch(() => {});
      }

      const badge = ALL_BADGES.find(b => b.id === badgeId);
      if (badge) {
        setTimeout(() => {
          playSound(achievementSound, require('@/assets/sounds/achievement.wav'));
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          pushNotification({ type: 'badge', badge: { ...badge, unlockedAt: new Date().toISOString() } });
          pushToInboxRef.current({
            title: badge.title,
            body: badge.description,
            sender: 'achievement',
            icon: badge.icon,
            color: badge.color,
            details: `لقد فتحت إنجاز "${badge.title}". ${badge.description}. واصل التقدم لفتح المزيد من الإنجازات!`,
          });
        }, 1200);
      }
      return updated;
    });
  }, []);

  const checkBadge = useCallback((badgeId: string) => {
    checkBadgeInternal(badgeId);
  }, [checkBadgeInternal]);

  const dismissNotification = useCallback(() => {
    notifQueue.current.shift();
    setNotifications([...notifQueue.current]);
  }, []);

  const grantDailyOpenXp = useCallback(async (): Promise<boolean> => {
    try {
      const email = emailRef.current;
      if (!email) return false;
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = await AsyncStorage.getItem(userKey(email, LAST_OPEN_XP_BASE));
      if (lastDate === today) return false;
      await AsyncStorage.setItem(userKey(email, LAST_OPEN_XP_BASE), today);
      return true;
    } catch { return false; }
  }, []);

  const resetAll = useCallback(async () => {
    const email = emailRef.current;
    if (email) {
      await AsyncStorage.multiRemove([
        userKey(email, XP_BASE),
        userKey(email, GEMS_BASE),
        userKey(email, BADGES_BASE),
        userKey(email, DAILY_XP_BASE),
        userKey(email, LAST_OPEN_XP_BASE),
      ]).catch(() => {});
    }
    setTotalXp(0);
    setTotalGems(0);
    setUnlockedBadgeIds([]);
    setDailyXp(0);
    notifQueue.current = [];
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      if (achievementSound.current) achievementSound.current.unloadAsync().catch(() => {});
      if (levelUpSound.current) levelUpSound.current.unloadAsync().catch(() => {});
      if (xpSound.current) xpSound.current.unloadAsync().catch(() => {});
    };
  }, []);

  const unlockedBadges = ALL_BADGES.filter(b => unlockedBadgeIds.includes(b.id));

  const value: GamificationContextValue = {
    totalXp, totalGems, currentLevel, nextLevel, levelProgress,
    unlockedBadges, allBadges: ALL_BADGES,
    addXp, addGems, syncNow, checkBadge, notifications, dismissNotification, dailyXp, grantDailyOpenXp, resetAll,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}
