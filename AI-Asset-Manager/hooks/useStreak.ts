import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const STREAK_BASE = '@najahi_streak_dates';

function streakKey(email: string | null) {
  if (!email) return STREAK_BASE;
  return `${STREAK_BASE}_${email.toLowerCase().trim()}`;
}

function getDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useStreak() {
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const { currentEmail } = useAuth();

  const loadStreak = useCallback(async () => {
    if (!currentEmail) {
      setActiveDates([]);
      setStreakCount(0);
      setLoaded(false);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(streakKey(currentEmail));
      const dates: string[] = raw ? JSON.parse(raw) : [];
      setActiveDates(dates);
      setStreakCount(calculateStreak(dates));
    } catch (e) {
      if (__DEV__) console.warn('[useStreak] load error:', e);
    }
    setLoaded(true);
  }, [currentEmail]);

  const markTodayActive = useCallback(async () => {
    if (!currentEmail) return;
    try {
      const today = getDateStr();
      const key = streakKey(currentEmail);
      const raw = await AsyncStorage.getItem(key);
      let dates: string[] = raw ? JSON.parse(raw) : [];
      if (!dates.includes(today)) {
        dates.push(today);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffStr = getDateStr(cutoff);
        dates = dates.filter(d => d >= cutoffStr);
        await AsyncStorage.setItem(key, JSON.stringify(dates));
        setActiveDates(dates);
        setStreakCount(calculateStreak(dates));
      }
    } catch (e) {
      if (__DEV__) console.warn('[useStreak] mark active error:', e);
    }
  }, [currentEmail]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const getWeekData = useCallback(() => {
    const today = new Date();
    const todayDay = today.getDay();
    const weekLabels = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - todayDay + i);
      weekDates.push(getDateStr(d));
    }

    return weekLabels.map((label, i) => ({
      label,
      isToday: i === todayDay,
      isActive: activeDates.includes(weekDates[i]),
    }));
  }, [activeDates]);

  return { streakCount, activeDates, loaded, markTodayActive, getWeekData };
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = getDateStr();
  const yesterday = getDateStr(new Date(Date.now() - 86400000));

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let count = 0;
  let current = sorted[0] === today ? new Date() : new Date(Date.now() - 86400000);

  for (let i = 0; i < 365; i++) {
    const checkStr = getDateStr(current);
    if (sorted.includes(checkStr)) {
      count++;
      current = new Date(current.getTime() - 86400000);
    } else {
      break;
    }
  }
  return count;
}
