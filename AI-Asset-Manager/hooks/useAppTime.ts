import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const APP_TIME_BASE = '@najahi_app_time';
const UPDATE_INTERVAL = 30_000;

function timeKey(email: string | null, suffix: string) {
  if (!email) return `${APP_TIME_BASE}_${suffix}`;
  return `${APP_TIME_BASE}_${suffix}_${email.toLowerCase().trim()}`;
}

function getDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${week}`;
}

interface StoredTime {
  dailySeconds: number;
  weeklySeconds: number;
  totalSeconds: number;
  dailyDate: string;
  weekId: string;
}

const EMPTY: StoredTime = { dailySeconds: 0, weeklySeconds: 0, totalSeconds: 0, dailyDate: '', weekId: '' };

function toMinutes(s: number) { return Math.floor(s / 60); }

export function useAppTime(onUpdate?: (dailyMin: number, weeklyMin: number, totalMin: number) => void) {
  const { currentEmail } = useAuth();
  const lastSave = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const loadStored = useCallback(async (): Promise<StoredTime> => {
    if (!currentEmail) return { ...EMPTY, dailyDate: getDateStr(), weekId: getWeekId() };
    try {
      const raw = await AsyncStorage.getItem(timeKey(currentEmail, 'data'));
      if (raw) {
        const data = JSON.parse(raw) as StoredTime;
        const today = getDateStr();
        const week = getWeekId();
        if (data.dailyDate !== today) {
          data.dailySeconds = 0;
          data.dailyDate = today;
        }
        if (data.weekId !== week) {
          data.weeklySeconds = 0;
          data.weekId = week;
        }
        return data;
      }
    } catch (e) {
      if (__DEV__) console.warn('[useAppTime] load error:', e);
    }
    return { ...EMPTY, dailyDate: getDateStr(), weekId: getWeekId() };
  }, [currentEmail]);

  const notify = useCallback((stored: StoredTime) => {
    onUpdateRef.current?.(
      toMinutes(stored.dailySeconds),
      toMinutes(stored.weeklySeconds),
      toMinutes(stored.totalSeconds)
    );
  }, []);

  const saveTime = useCallback(async () => {
    if (!currentEmail) return;
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastSave.current) / 1000);
    if (elapsedSec < 1) return;
    lastSave.current = now;

    try {
      const stored = await loadStored();
      stored.dailySeconds += elapsedSec;
      stored.weeklySeconds += elapsedSec;
      stored.totalSeconds += elapsedSec;
      await AsyncStorage.setItem(timeKey(currentEmail, 'data'), JSON.stringify(stored));
      notify(stored);
    } catch (e) {
      if (__DEV__) console.warn('[useAppTime] save error:', e);
    }
  }, [currentEmail, loadStored, notify]);

  useEffect(() => {
    if (!currentEmail) return;

    lastSave.current = Date.now();

    loadStored().then(notify);

    intervalRef.current = setInterval(saveTime, UPDATE_INTERVAL);

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        saveTime();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (nextState === 'active') {
        lastSave.current = Date.now();
        intervalRef.current = setInterval(saveTime, UPDATE_INTERVAL);
        loadStored().then(notify);
      }
    });

    return () => {
      saveTime();
      sub.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentEmail, saveTime, loadStored, notify]);

  return { saveTime };
}
