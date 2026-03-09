import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';

const TASKS_BASE = '@najahi_tasks';
const TASKS_CLAIMED_BASE = '@najahi_tasks_claimed';

function taskKey(email: string | null, base: string) {
  if (!email) return base;
  return `${base}_${email.toLowerCase().trim()}`;
}

function getDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${week}`;
}

export interface TaskDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  target: number;
  reward: number;
  category: 'daily' | 'weekly' | 'special';
  trackKey: string;
}

export interface TaskProgress {
  current: number;
  claimed: boolean;
}

export const DAILY_TASKS: TaskDef[] = [
  {
    id: 'daily_open',
    title: '\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642',
    description: '\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0627\u0644\u064A\u0648\u0645',
    icon: 'phone-portrait-outline',
    color: '#00D4AA',
    target: 1,
    reward: 5,
    category: 'daily',
    trackKey: 'app_opened',
  },
  {
    id: 'daily_lesson',
    title: '\u0623\u0643\u0645\u0644 \u062F\u0631\u0633',
    description: '\u0623\u0643\u0645\u0644 \u062F\u0631\u0633 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644',
    icon: 'book-outline',
    color: '#4FC3F7',
    target: 1,
    reward: 10,
    category: 'daily',
    trackKey: 'lessons_completed',
  },
  {
    id: 'daily_correct_10',
    title: '\u0623\u062C\u0628 10 \u0635\u062D\u064A\u062D',
    description: '\u0627\u062C\u0628 \u0639\u0644\u0649 10 \u0623\u0633\u0626\u0644\u0629 \u0635\u062D\u064A\u062D\u0629',
    icon: 'checkmark-done-outline',
    color: '#3FB950',
    target: 10,
    reward: 15,
    category: 'daily',
    trackKey: 'correct_answers',
  },
  {
    id: 'daily_streak_3',
    title: '\u0633\u0644\u0633\u0644\u0629 3',
    description: '\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0633\u0644\u0633\u0644\u0629 3 \u0625\u062C\u0627\u0628\u0627\u062A \u0645\u062A\u062A\u0627\u0644\u064A\u0629',
    icon: 'flame-outline',
    color: '#FF6B6B',
    target: 3,
    reward: 10,
    category: 'daily',
    trackKey: 'max_streak',
  },
  {
    id: 'daily_gems_30',
    title: '\u0627\u062C\u0645\u0639 30 \u062C\u0648\u0647\u0631\u0629',
    description: '\u0627\u062C\u0645\u0639 30 \u062C\u0648\u0647\u0631\u0629 \u0627\u0644\u064A\u0648\u0645',
    icon: 'diamond-outline',
    color: '#7C5CFF',
    target: 30,
    reward: 15,
    category: 'daily',
    trackKey: 'gems_earned',
  },
  {
    id: 'daily_usage_30',
    title: '\u0627\u0633\u062A\u0639\u0645\u0644 30 \u062F\u0642\u064A\u0642\u0629',
    description: '\u0627\u0633\u062A\u0639\u0645\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0644\u0645\u062F\u0629 30 \u062F\u0642\u064A\u0642\u0629',
    icon: 'time-outline',
    color: '#26C6DA',
    target: 30,
    reward: 15,
    category: 'daily',
    trackKey: 'usage_minutes',
  },
];

export const WEEKLY_TASKS: TaskDef[] = [
  {
    id: 'weekly_lessons_5',
    title: '\u0623\u0643\u0645\u0644 5 \u062F\u0631\u0648\u0633',
    description: '\u0623\u0643\u0645\u0644 5 \u062F\u0631\u0648\u0633 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
    icon: 'library-outline',
    color: '#4FC3F7',
    target: 5,
    reward: 30,
    category: 'weekly',
    trackKey: 'lessons_completed',
  },
  {
    id: 'weekly_streak_5',
    title: '5 \u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629',
    description: '\u0627\u062F\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 5 \u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629',
    icon: 'calendar-outline',
    color: '#FF8C42',
    target: 5,
    reward: 40,
    category: 'weekly',
    trackKey: 'login_streak',
  },
  {
    id: 'weekly_correct_50',
    title: '50 \u0625\u062C\u0627\u0628\u0629 \u0635\u062D\u064A\u062D\u0629',
    description: '\u0627\u062C\u0628 \u0639\u0644\u0649 50 \u0633\u0624\u0627\u0644 \u0635\u062D\u064A\u062D \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
    icon: 'star-outline',
    color: '#FFD700',
    target: 50,
    reward: 50,
    category: 'weekly',
    trackKey: 'correct_answers',
  },
  {
    id: 'weekly_perfect',
    title: '\u0643\u0648\u064A\u0632 \u0645\u062B\u0627\u0644\u064A',
    description: '\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 100% \u0641\u064A \u0643\u0648\u064A\u0632',
    icon: 'ribbon-outline',
    color: '#FF6B6B',
    target: 1,
    reward: 25,
    category: 'weekly',
    trackKey: 'perfect_quizzes',
  },
  {
    id: 'weekly_usage_120',
    title: '\u0627\u0633\u062A\u0639\u0645\u0644 \u0633\u0627\u0639\u062A\u064A\u0646',
    description: '\u0627\u0633\u062A\u0639\u0645\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0633\u0627\u0639\u062A\u064A\u0646 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639',
    icon: 'hourglass-outline',
    color: '#26C6DA',
    target: 120,
    reward: 40,
    category: 'weekly',
    trackKey: 'usage_minutes',
  },
];

export const SPECIAL_TASKS: TaskDef[] = [
  {
    id: 'special_streak_10',
    title: '\u0633\u0644\u0633\u0644\u0629 10',
    description: '\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0633\u0644\u0633\u0644\u0629 10 \u0625\u062C\u0627\u0628\u0627\u062A \u0635\u062D\u064A\u062D\u0629 \u0645\u062A\u062A\u0627\u0644\u064A\u0629',
    icon: 'bonfire-outline',
    color: '#FF4500',
    target: 10,
    reward: 35,
    category: 'special',
    trackKey: 'max_streak_ever',
  },
  {
    id: 'special_gems_500',
    title: '\u062C\u0627\u0645\u0639 \u0627\u0644\u062C\u0648\u0627\u0647\u0631',
    description: '\u0627\u062C\u0645\u0639 500 \u062C\u0648\u0647\u0631\u0629 \u0625\u062C\u0645\u0627\u0644\u064A\u0627',
    icon: 'diamond',
    color: '#7C5CFF',
    target: 500,
    reward: 50,
    category: 'special',
    trackKey: 'total_gems',
  },
  {
    id: 'special_lessons_20',
    title: '\u0637\u0627\u0644\u0628 \u0645\u062B\u0627\u0628\u0631',
    description: '\u0623\u0643\u0645\u0644 20 \u062F\u0631\u0633 \u0625\u062C\u0645\u0627\u0644\u064A\u0627',
    icon: 'school-outline',
    color: '#00D4AA',
    target: 20,
    reward: 75,
    category: 'special',
    trackKey: 'total_lessons',
  },
  {
    id: 'special_correct_200',
    title: '\u0639\u0628\u0642\u0631\u064A',
    description: '\u0627\u062C\u0628 \u0639\u0644\u0649 200 \u0633\u0624\u0627\u0644 \u0635\u062D\u064A\u062D \u0625\u062C\u0645\u0627\u0644\u064A\u0627',
    icon: 'bulb-outline',
    color: '#FFB74D',
    target: 200,
    reward: 100,
    category: 'special',
    trackKey: 'total_correct',
  },
  {
    id: 'special_usage_600',
    title: '\u0645\u062B\u0627\u0628\u0631 \u062D\u0642\u064A\u0642\u064A',
    description: '\u0627\u0633\u062A\u0639\u0645\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 10 \u0633\u0627\u0639\u0627\u062A \u0625\u062C\u0645\u0627\u0644\u064A\u0627',
    icon: 'timer-outline',
    color: '#26C6DA',
    target: 600,
    reward: 75,
    category: 'special',
    trackKey: 'total_usage_minutes',
  },
];

export const ALL_TASKS = [...DAILY_TASKS, ...WEEKLY_TASKS, ...SPECIAL_TASKS];

export interface TasksState {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  special: Record<string, number>;
  claimed: Record<string, boolean>;
  dailyDate: string;
  weekId: string;
  dailyAllClaimed: boolean;
  dailyBonusClaimed: boolean;
}

const EMPTY_STATE: TasksState = {
  daily: {},
  weekly: {},
  special: {},
  claimed: {},
  dailyDate: '',
  weekId: '',
  dailyAllClaimed: false,
  dailyBonusClaimed: false,
};

export function useTasks() {
  const { currentEmail } = useAuth();
  const { addGems, totalGems } = useGamification();
  const [state, setState] = useState<TasksState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const storageKey = taskKey(currentEmail, TASKS_BASE);

  const load = useCallback(async () => {
    if (!currentEmail) {
      setState(EMPTY_STATE);
      setLoaded(false);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as TasksState;
        const today = getDateStr();
        const week = getWeekId();

        if (saved.dailyDate !== today) {
          saved.daily = {};
          saved.dailyDate = today;
          saved.dailyAllClaimed = false;
          saved.dailyBonusClaimed = false;
          const claimedCopy = { ...saved.claimed };
          DAILY_TASKS.forEach(t => { delete claimedCopy[t.id]; });
          saved.claimed = claimedCopy;
        }

        if (saved.weekId !== week) {
          saved.weekly = {};
          saved.weekId = week;
          const claimedCopy = { ...saved.claimed };
          WEEKLY_TASKS.forEach(t => { delete claimedCopy[t.id]; });
          saved.claimed = claimedCopy;
        }

        setState(saved);
      } else {
        const fresh: TasksState = {
          ...EMPTY_STATE,
          dailyDate: getDateStr(),
          weekId: getWeekId(),
        };
        setState(fresh);
      }
    } catch (e) {
      if (__DEV__) console.warn('[useTasks] load error:', e);
    }
    setLoaded(true);
  }, [currentEmail, storageKey]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (newState: TasksState) => {
    if (!currentEmail) return;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (e) {
      if (__DEV__) console.warn('[useTasks] save error:', e);
    }
  }, [currentEmail, storageKey]);

  const incrementTask = useCallback(async (trackKey: string, amount: number = 1, category?: 'daily' | 'weekly' | 'special') => {
    if (!currentEmail) return;
    setState(prev => {
      const updated = { ...prev };
      if (!category || category === 'daily') {
        updated.daily = { ...prev.daily };
        updated.daily[trackKey] = (updated.daily[trackKey] || 0) + amount;
      }
      if (!category || category === 'weekly') {
        updated.weekly = { ...prev.weekly };
        updated.weekly[trackKey] = (updated.weekly[trackKey] || 0) + amount;
      }
      if (!category || category === 'special') {
        updated.special = { ...prev.special };
        updated.special[trackKey] = (updated.special[trackKey] || 0) + amount;
      }
      save(updated);
      return updated;
    });
  }, [currentEmail, save]);

  const setTaskValue = useCallback(async (trackKey: string, value: number, category?: 'daily' | 'weekly' | 'special') => {
    if (!currentEmail) return;
    setState(prev => {
      const updated = { ...prev };
      if (!category || category === 'daily') {
        updated.daily = { ...prev.daily };
        updated.daily[trackKey] = Math.max(updated.daily[trackKey] || 0, value);
      }
      if (!category || category === 'weekly') {
        updated.weekly = { ...prev.weekly };
        updated.weekly[trackKey] = Math.max(updated.weekly[trackKey] || 0, value);
      }
      if (!category || category === 'special') {
        updated.special = { ...prev.special };
        updated.special[trackKey] = Math.max(updated.special[trackKey] || 0, value);
      }
      save(updated);
      return updated;
    });
  }, [currentEmail, save]);

  const getProgress = useCallback((task: TaskDef): TaskProgress => {
    const s = stateRef.current;
    const dataMap = task.category === 'daily' ? s.daily : task.category === 'weekly' ? s.weekly : s.special;
    const current = dataMap[task.trackKey] || 0;

    if (task.trackKey === 'total_gems') {
      return { current: Math.min(totalGems, task.target), claimed: !!s.claimed[task.id] };
    }

    return { current: Math.min(current, task.target), claimed: !!s.claimed[task.id] };
  }, [totalGems]);

  const claimReward = useCallback(async (taskId: string): Promise<number> => {
    const task = ALL_TASKS.find(t => t.id === taskId);
    if (!task) return 0;
    const progress = getProgress(task);
    if (progress.current < task.target || progress.claimed) return 0;

    addGems(task.reward);

    setState(prev => {
      const updated = {
        ...prev,
        claimed: { ...prev.claimed, [taskId]: true },
      };

      const allDailyClaimed = DAILY_TASKS.every(t => {
        if (t.id === taskId) return true;
        return !!updated.claimed[t.id];
      });
      updated.dailyAllClaimed = allDailyClaimed;

      save(updated);
      return updated;
    });

    return task.reward;
  }, [getProgress, addGems, save]);

  const claimDailyBonus = useCallback(async (): Promise<number> => {
    if (state.dailyBonusClaimed || !state.dailyAllClaimed) return 0;
    const bonus = 20;
    addGems(bonus);
    setState(prev => {
      const updated = { ...prev, dailyBonusClaimed: true };
      save(updated);
      return updated;
    });
    return bonus;
  }, [state.dailyAllClaimed, state.dailyBonusClaimed, addGems, save]);

  const getDailyCompletedCount = useCallback((): number => {
    return DAILY_TASKS.filter(t => {
      const p = getProgress(t);
      return p.current >= t.target;
    }).length;
  }, [getProgress]);

  return {
    state,
    loaded,
    incrementTask,
    setTaskValue,
    getProgress,
    claimReward,
    claimDailyBonus,
    getDailyCompletedCount,
    dailyTasks: DAILY_TASKS,
    weeklyTasks: WEEKLY_TASKS,
    specialTasks: SPECIAL_TASKS,
  };
}
