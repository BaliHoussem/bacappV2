import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

function userKey(email: string | null, base: string) {
  if (!email) return base;
  return `${base}_${email.toLowerCase().trim()}`;
}

const NOTIFS_BASE = '@najahi_inbox_notifications';
const SEEDED_BASE = '@najahi_inbox_seeded_v2';

export type NotifSender = 'system' | 'developer' | 'achievement';

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  sender: NotifSender;
  icon: string;
  color: string;
  read: boolean;
  createdAt: string;
  details?: string;
}

interface NotificationCenterValue {
  notifications: InboxNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<InboxNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  loaded: boolean;
}

const NotificationCenterContext = createContext<NotificationCenterValue | null>(null);

export function useNotificationCenter() {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  return ctx;
}

const SENDER_LABELS: Record<NotifSender, string> = {
  system: 'النظام',
  developer: 'فريق نجاحي',
  achievement: 'الإنجازات',
};

export { SENDER_LABELS };

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { currentEmail } = useAuth();

  useEffect(() => {
    if (!currentEmail) {
      setNotifications([]);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const migKey = `@najahi_notif_migrated_${currentEmail}`;
        const migrated = await AsyncStorage.getItem(migKey);
        if (!migrated) {
          const oldNotifs = await AsyncStorage.getItem(NOTIFS_BASE);
          if (oldNotifs) {
            await AsyncStorage.setItem(userKey(currentEmail, NOTIFS_BASE), oldNotifs);
          }
          const oldSeeded = await AsyncStorage.getItem(SEEDED_BASE);
          if (oldSeeded) {
            await AsyncStorage.setItem(userKey(currentEmail, SEEDED_BASE), oldSeeded);
          }
          await AsyncStorage.setItem(migKey, '1');
        }

        const nKey = userKey(currentEmail, NOTIFS_BASE);
        const raw = await AsyncStorage.getItem(nKey);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as InboxNotification[];
          setNotifications(parsed);
        } else {
          setNotifications([]);
        }
      } catch (e) {
        if (__DEV__) console.warn('[NotificationCenter] load error:', e);
      }

      try {
        const sKey = userKey(currentEmail, SEEDED_BASE);
        const seeded = await AsyncStorage.getItem(sKey);
        if (cancelled) return;
        if (!seeded) {
          const welcomeNotifs: InboxNotification[] = [
            {
              id: genId(),
              title: 'مرحبا بك في نجاحي!',
              body: 'نتمنى لك التوفيق في مشوارك الدراسي. استعد للبكالوريا معنا!',
              sender: 'developer',
              icon: 'heart',
              color: '#FF6B6B',
              read: false,
              createdAt: new Date().toISOString(),
              details: 'فريق نجاحي يرحب بك ويتمنى لك النجاح والتفوق في البكالوريا. نحن هنا لمساعدتك في كل خطوة.',
            },
            {
              id: genId(),
              title: 'نظام الإنجازات مفعّل',
              body: 'اكسب XP واصعد في المستويات كل يوم!',
              sender: 'system',
              icon: 'trophy',
              color: '#FFB74D',
              read: false,
              createdAt: new Date(Date.now() - 1000).toISOString(),
              details: 'كل يوم تفتح التطبيق تكسب نقاط XP. حافظ على سلسلة النشاط لكسب نقاط إضافية وفتح إنجازات جديدة.',
            },
          ];
          setNotifications(prev => {
            const merged = [...welcomeNotifs, ...prev];
            AsyncStorage.setItem(userKey(currentEmail, NOTIFS_BASE), JSON.stringify(merged)).catch(() => {});
            return merged;
          });
          await AsyncStorage.setItem(sKey, '1');
        }
      } catch {}

      if (!cancelled) setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [currentEmail]);

  const persist = useCallback((notifs: InboxNotification[]) => {
    const email = currentEmail;
    if (email) {
      AsyncStorage.setItem(userKey(email, NOTIFS_BASE), JSON.stringify(notifs)).catch(() => {});
    }
  }, [currentEmail]);

  const addNotification = useCallback((notif: Omit<InboxNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => {
      const full: InboxNotification = {
        ...notif,
        id: genId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [full, ...prev].slice(0, 50);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [persist]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationCenterContext.Provider value={{
      notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll, loaded,
    }}>
      {children}
    </NotificationCenterContext.Provider>
  );
}
