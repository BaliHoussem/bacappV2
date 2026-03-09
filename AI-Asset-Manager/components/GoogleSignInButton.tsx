import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { getApiUrl } from '@/lib/query-client';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

function generateState() {
  return Crypto.randomUUID();
}

export default function GoogleSignInButton({ onBeforeAuth }: { onBeforeAuth?: () => Promise<void> } = {}) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function pollForResult(state: string, baseUrl: string): Promise<any> {
    const pollUrl = new URL('/api/auth/google/poll', baseUrl);
    pollUrl.searchParams.set('state', state);

    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(pollUrl.toString());
        const data = await res.json();
        if (data.status === 'complete') return data;
        if (data.status === 'pending') {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    return null;
  }

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);

    try {
      if (onBeforeAuth) await onBeforeAuth();
      const baseUrl = getApiUrl();
      const callbackUrl = new URL('/api/auth/google/callback', baseUrl).toString();
      const state = generateState();

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=select_account` +
        `&state=${encodeURIComponent(state)}`;

      await WebBrowser.openBrowserAsync(authUrl);

      const result = await pollForResult(state, baseUrl);

      if (result && result.success) {
        if (result.googlePicture) {
          await AsyncStorage.setItem('@najahi_google_picture', result.googlePicture);
        }
        if (result.googleName) {
          await AsyncStorage.setItem('@najahi_google_name', result.googleName);
        }
        const loginResult = await loginWithGoogle(result);

        if (loginResult.success && loginResult.onboarded) {
          router.replace('/(tabs)');
        } else if (loginResult.success) {
          router.replace('/onboarding');
        }
        return;
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <Pressable
      onPress={handleGoogleSignIn}
      disabled={loading}
      style={({ pressed }) => [
        styles.googleButton,
        pressed && styles.buttonPressed,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#333" size="small" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.googleText}>الدخول بحساب Google</Text>
        </>
      )}
    </Pressable>
  );
}

function OrDivider() {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>أو</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export { OrDivider };

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  googleText: {
    fontSize: 16,
    fontFamily: 'Cairo_600SemiBold',
    color: '#333333',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textMuted,
  },
});
