import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from "@expo-google-fonts/cairo";
import * as Font from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { NotificationCenterProvider } from "@/contexts/NotificationCenterContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(['timeout exceeded', '6000ms timeout']);

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || '';
    if (typeof msg === 'string' && msg.includes('timeout exceeded')) {
      event.preventDefault();
    }
  });
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (typeof msg === 'string' && msg.includes('timeout exceeded')) {
      event.preventDefault();
    }
  });
}

if ((global as any).ErrorUtils) {
  const orig = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    if (error?.message?.includes?.('timeout exceeded')) return;
    if (orig) orig(error, isFatal);
  });
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="entry" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="inbox" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="badges" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="themes" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="progress" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="section-subjects" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subject" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="trimester" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="lesson" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="quiz" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="quiz-results" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await Font.loadAsync({
          Cairo_400Regular,
          Cairo_500Medium,
          Cairo_600SemiBold,
          Cairo_700Bold,
        });
      } catch (_e) {
      }
      if (!cancelled) {
        setReady(true);
        SplashScreen.hideAsync();
      }
    };

    load();

    const fallback = setTimeout(() => {
      if (!cancelled) {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <AuthProvider>
              <NotificationCenterProvider>
                <GamificationProvider>
                  <ThemeProvider>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </ThemeProvider>
                </GamificationProvider>
              </NotificationCenterProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
