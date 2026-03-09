import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';
import { setStorageEmail } from '@/lib/storage-keys';

export interface UserProfile {
  fullName: string;
  username: string;
  branch: string;
  subBranch?: string;
  wilaya: string;
  birthDate: string;
  hearAbout?: string;
  academicLevel?: string;
  goals?: string[];
  learningPace?: number;
  gender?: string;
  candidateType?: string;
  averageScore?: number;
  email?: string;
  profilePicture?: string;
}

type LoginResult =
  | { success: true; onboarded: boolean }
  | { success: false; error: 'not_found' | 'wrong_password' | 'google_account' };

type GoogleLoginResult =
  | { success: true; onboarded: boolean; googleName?: string; googlePicture?: string }
  | { success: false; error: string };

interface AuthContextValue {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  hasSeenWelcome: boolean;
  hasSeenNotifications: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (params: { accessToken: string } | { success: boolean; email: string; isNew: boolean; onboarded: boolean; profile?: any; accountId?: number; googleName?: string; googlePicture?: string }) => Promise<GoogleLoginResult>;
  logout: () => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  markNotificationsSeen: () => Promise<void>;
  isLoading: boolean;
  currentEmail: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  CURRENT_EMAIL: '@najahi_current_email',
  WELCOME: '@najahi_welcome',
  NOTIFICATIONS: '@najahi_notifications',
  CACHED_PROFILE: '@najahi_cached_profile',
  CACHED_ONBOARDED: '@najahi_cached_onboarded',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    setStorageEmail(currentEmail);
  }, [currentEmail]);

  async function loadState() {
    try {
      await AsyncStorage.multiRemove([
        '@najahi_user', '@najahi_auth', '@najahi_onboarded',
        '@najahi_accounts',
      ]);

      const [savedEmail, welcomeData, notifData, cachedProfile, cachedOnboarded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.WELCOME),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CACHED_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.CACHED_ONBOARDED),
      ]);

      if (welcomeData) setHasSeenWelcome(true);
      if (notifData) setHasSeenNotifications(true);

      if (savedEmail) {
        setCurrentEmail(savedEmail);
        setIsAuthenticated(true);

        if (cachedOnboarded === 'true' && cachedProfile) {
          setUser(JSON.parse(cachedProfile));
          setIsOnboarded(true);
        }

        try {
          const baseUrl = getApiUrl();
          const url = new URL(`/api/auth/account/${encodeURIComponent(savedEmail)}`, baseUrl);
          const res = await fetch(url.toString());
          if (res.ok) {
            const data = await res.json();
            if (data.onboarded && data.profile) {
              setUser(data.profile);
              setIsOnboarded(true);
              await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(data.profile));
              await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ONBOARDED, 'true');
            }
          } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_EMAIL);
            setIsAuthenticated(false);
            setCurrentEmail(null);
          }
        } catch (fetchErr) {
          console.log('Could not reach server, using cached data');
        }
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<LoginResult> {
    const key = email.toLowerCase().trim();
    try {
      const baseUrl = getApiUrl();
      const url = new URL('/api/auth/login', baseUrl);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: key, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'not_found') {
          return { success: false, error: 'not_found' };
        }
        if (data.error === 'google_account') {
          return { success: false, error: 'google_account' };
        }
        if (data.error === 'wrong_password') {
          return { success: false, error: 'wrong_password' };
        }
        return { success: false, error: 'wrong_password' };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_EMAIL, key);
      setCurrentEmail(key);
      setIsAuthenticated(true);

      if (data.onboarded && data.profile) {
        setUser(data.profile);
        setIsOnboarded(true);
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(data.profile));
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ONBOARDED, 'true');
        return { success: true, onboarded: true };
      }

      return { success: true, onboarded: false };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'wrong_password' };
    }
  }

  async function signup(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const key = email.toLowerCase().trim();
    try {
      const baseUrl = getApiUrl();
      const url = new URL('/api/auth/signup', baseUrl);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: key, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'exists') {
          return { success: false, error: 'exists' };
        }
        return { success: false, error: 'server_error' };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_EMAIL, key);
      setCurrentEmail(key);
      setIsAuthenticated(true);
      return { success: true };
    } catch (e) {
      console.error('Signup error:', e);
      return { success: false, error: 'server_error' };
    }
  }

  async function loginWithGoogle(params: any): Promise<GoogleLoginResult> {
    try {
      let data: any;

      if (params.accessToken && !params.email) {
        const baseUrl = getApiUrl();
        const url = new URL('/api/auth/google', baseUrl);
        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: params.accessToken }),
        });
        data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'server_error' };
        }
      } else {
        data = params;
      }

      const key = data.email;
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_EMAIL, key);
      setCurrentEmail(key);
      setIsAuthenticated(true);

      if (data.onboarded && data.profile) {
        setUser(data.profile);
        setIsOnboarded(true);
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(data.profile));
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ONBOARDED, 'true');
        return { success: true, onboarded: true };
      }

      return { success: true, onboarded: false, googleName: data.googleName, googlePicture: data.googlePicture };
    } catch (e) {
      console.error('Google login error:', e);
      return { success: false, error: 'server_error' };
    }
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CURRENT_EMAIL,
      STORAGE_KEYS.CACHED_PROFILE,
      STORAGE_KEYS.CACHED_ONBOARDED,
    ]);
    setIsAuthenticated(false);
    setIsOnboarded(false);
    setUser(null);
    setCurrentEmail(null);
  }

  async function completeOnboarding(profile: UserProfile) {
    const email = currentEmail || await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_EMAIL);
    if (email) {
      const baseUrl = getApiUrl();
      const url = new URL('/api/auth/onboarding', baseUrl);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, profile }),
      });
      if (res.status === 409) {
        const data = await res.json();
        throw new Error(data.error || 'username_taken');
      }
      if (!res.ok) {
        throw new Error('server_error');
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(profile));
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ONBOARDED, 'true');
    setUser(profile);
    setIsOnboarded(true);
  }

  async function markWelcomeSeen() {
    await AsyncStorage.setItem(STORAGE_KEYS.WELCOME, 'true');
    setHasSeenWelcome(true);
  }

  async function markNotificationsSeen() {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, 'true');
    setHasSeenNotifications(true);
  }

  const value = useMemo(() => ({
    isAuthenticated,
    isOnboarded,
    hasSeenWelcome,
    hasSeenNotifications,
    user,
    login,
    signup,
    loginWithGoogle,
    logout,
    completeOnboarding,
    markWelcomeSeen,
    markNotificationsSeen,
    isLoading,
    currentEmail,
  }), [isAuthenticated, isOnboarded, hasSeenWelcome, hasSeenNotifications, user, isLoading, currentEmail]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
