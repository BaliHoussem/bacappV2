import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedMascot from '@/components/AnimatedMascot';

export default function EntryScreen() {
  const insets = useSafeAreaInsets();
  const { markWelcomeSeen } = useAuth();

  const handleSignup = async () => {
    await markWelcomeSeen();
    router.push('/signup');
  };

  const handleLogin = async () => {
    await markWelcomeSeen();
    router.push('/login');
  };

  const topPad = (Platform.OS === 'web' ? 67 : insets.top) + 20;
  const botPad = (Platform.OS === 'web' ? 34 : insets.bottom) + 20;

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#070B14', '#0D1628', '#070B14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); }} hitSlop={12}>
          <Ionicons name="arrow-forward" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={s.center}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={s.bubbleAbove}>
          <View style={s.speechBubble}>
            <Text style={s.speechText}>مرحبا! أنا نجاحي!</Text>
          </View>
          <View style={s.speechTail} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={s.mascotWrap}>
          <AnimatedMascot size={180} animation="wave" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text style={s.welcomeText}>رفيقك الذكي نحو البكالوريا</Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(600)}
        style={[s.bottom, { paddingBottom: botPad }]}
      >
        <Pressable
          onPress={handleSignup}
          style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDim]}
            style={s.primaryBtnGrad}
          >
            <Text style={s.primaryBtnText}>إنشاء حساب</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleLogin} style={s.loginLink}>
          <Text style={s.loginLinkHighlight}>سجل الدخول  </Text>
          <Text style={s.loginLinkText}>لديك حساب؟</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B14' },
  header: { paddingHorizontal: 20, alignItems: 'flex-end' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 30, gap: 24,
  },
  bubbleAbove: { alignItems: 'center' },
  speechBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingHorizontal: 28, paddingVertical: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  speechText: {
    fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#F0F3F8',
    textAlign: 'center',
  },
  speechTail: {
    width: 0, height: 0, marginTop: -1,
    borderLeftWidth: 10, borderLeftColor: 'transparent',
    borderTopWidth: 10, borderTopColor: 'rgba(255,255,255,0.08)',
    borderRightWidth: 10, borderRightColor: 'transparent',
  },
  mascotWrap: {
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 16, fontFamily: 'Cairo_500Medium', color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottom: { paddingHorizontal: 24, gap: 14 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 18,
  },
  primaryBtnText: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#070B14',
  },
  loginLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 15, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
  },
  loginLinkHighlight: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: Colors.primary,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
