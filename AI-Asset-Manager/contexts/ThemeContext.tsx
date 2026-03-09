import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@najahi_selected_theme';

export interface ThemeDefinition {
  id: string;
  name: string;
  nameAr: string;
  requiredLevel: number;
  primary: string;
  primaryDim: string;
  secondary: string;
  secondaryDim: string;
  accent: string;
  accentDim: string;
  gold: string;
  goldDim: string;
  cyan: string;
  icon: string;
  previewColors: string[];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    nameAr: 'الافتراضي',
    requiredLevel: 1,
    primary: '#00D4AA',
    primaryDim: '#00A88A',
    secondary: '#7C5CFF',
    secondaryDim: '#6347CC',
    accent: '#FF6B6B',
    accentDim: '#CC5555',
    gold: '#FFB74D',
    goldDim: '#CC923E',
    cyan: '#4FC3F7',
    icon: 'color-palette',
    previewColors: ['#00D4AA', '#7C5CFF', '#FF6B6B'],
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    nameAr: 'أزرق المحيط',
    requiredLevel: 3,
    primary: '#0EA5E9',
    primaryDim: '#0284C7',
    secondary: '#06B6D4',
    secondaryDim: '#0891B2',
    accent: '#38BDF8',
    accentDim: '#2196F3',
    gold: '#7DD3FC',
    goldDim: '#5BB8E8',
    cyan: '#67E8F9',
    icon: 'water',
    previewColors: ['#0EA5E9', '#06B6D4', '#38BDF8'],
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    nameAr: 'البنفسجي الملكي',
    requiredLevel: 5,
    primary: '#A855F7',
    primaryDim: '#9333EA',
    secondary: '#C084FC',
    secondaryDim: '#A855F7',
    accent: '#E879F9',
    accentDim: '#D946EF',
    gold: '#D8B4FE',
    goldDim: '#C084FC',
    cyan: '#F0ABFC',
    icon: 'diamond',
    previewColors: ['#A855F7', '#C084FC', '#E879F9'],
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    nameAr: 'برتقالي الغروب',
    requiredLevel: 7,
    primary: '#F97316',
    primaryDim: '#EA580C',
    secondary: '#FB923C',
    secondaryDim: '#F97316',
    accent: '#FBBF24',
    accentDim: '#F59E0B',
    gold: '#FCD34D',
    goldDim: '#FBBF24',
    cyan: '#FDBA74',
    icon: 'sunny',
    previewColors: ['#F97316', '#FB923C', '#FBBF24'],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    nameAr: 'الزمردي',
    requiredLevel: 9,
    primary: '#10B981',
    primaryDim: '#059669',
    secondary: '#34D399',
    secondaryDim: '#10B981',
    accent: '#6EE7B7',
    accentDim: '#34D399',
    gold: '#A7F3D0',
    goldDim: '#6EE7B7',
    cyan: '#5EEAD4',
    icon: 'leaf',
    previewColors: ['#10B981', '#34D399', '#6EE7B7'],
  },
  {
    id: 'gold_premium',
    name: 'Gold Premium',
    nameAr: 'الذهبي المميز',
    requiredLevel: 12,
    primary: '#F59E0B',
    primaryDim: '#D97706',
    secondary: '#FBBF24',
    secondaryDim: '#F59E0B',
    accent: '#FCD34D',
    accentDim: '#FBBF24',
    gold: '#FDE68A',
    goldDim: '#FCD34D',
    cyan: '#FDE047',
    icon: 'star',
    previewColors: ['#F59E0B', '#FBBF24', '#FCD34D'],
  },
];

interface ThemeContextValue {
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  allThemes: ThemeDefinition[];
  isThemeUnlocked: (theme: ThemeDefinition, userLevel: number) => boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedThemeId, setSelectedThemeId] = useState('default');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(id => {
      if (id && THEMES.find(t => t.id === id)) {
        setSelectedThemeId(id);
      }
    }).catch(() => {});
  }, []);

  const setTheme = useCallback((themeId: string) => {
    setSelectedThemeId(themeId);
    AsyncStorage.setItem(THEME_KEY, themeId).catch(() => {});
  }, []);

  const isThemeUnlocked = useCallback((theme: ThemeDefinition, userLevel: number) => {
    return userLevel >= theme.requiredLevel;
  }, []);

  const currentTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  const value = useMemo(() => ({
    currentTheme,
    setTheme,
    allThemes: THEMES,
    isThemeUnlocked,
  }), [currentTheme, setTheme, isThemeUnlocked]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
