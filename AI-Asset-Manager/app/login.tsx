import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton, { OrDivider } from '@/components/GoogleSignInButton';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<'none' | 'not_found' | 'wrong_password' | 'google_account'>('none');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isValidEmail && password.length >= 1;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorType('none');
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.onboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        setErrorType(result.error);
      }
    } catch (e) {
      setErrorType('wrong_password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0F1A2E', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10,
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/entry')} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={Colors.text} />
        </Pressable>

        <View style={styles.headerSection}>
          <View style={styles.logoSmall}>
            <LinearGradient
              colors={[Colors.primary, Colors.cyan]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="compass" size={28} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>مرحبًا من جديد</Text>
          <Text style={styles.subtitle}>سجّل الدخول لمتابعة رحلتك</Text>
        </View>

        {errorType === 'wrong_password' && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>كلمة المرور خاطئة، أعد المحاولة</Text>
          </View>
        )}

        {errorType === 'google_account' && (
          <View style={styles.errorBanner}>
            <Ionicons name="logo-google" size={18} color={Colors.warning} />
            <Text style={styles.errorText}>هذا الحساب مسجّل عبر Google، استخدم زر Google</Text>
          </View>
        )}

        {errorType === 'not_found' && (
          <View style={styles.notFoundBanner}>
            <View style={styles.notFoundContent}>
              <Ionicons name="person-outline" size={18} color={Colors.warning} />
              <Text style={styles.notFoundText}>هذا البريد الإلكتروني غير مسجّل</Text>
            </View>
            <Pressable
              onPress={() => router.push('/signup')}
              style={({ pressed }) => [styles.createAccountBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.createAccountText}>هل تريد إنشاء حساب جديد؟</Text>
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            </Pressable>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
          <View style={[
            styles.inputWrapper,
            errorType === 'not_found' && styles.inputError,
          ]}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorType('none'); }}
              placeholder="example@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
            <Ionicons name="mail-outline" size={20} color={errorType === 'not_found' ? Colors.warning : Colors.textMuted} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>كلمة المرور</Text>
          <View style={[
            styles.inputWrapper,
            errorType === 'wrong_password' && styles.inputError,
          ]}>
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </Pressable>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorType('none'); }}
              placeholder="كلمة المرور"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <Ionicons name="lock-closed-outline" size={20} color={errorType === 'wrong_password' ? Colors.error : Colors.textMuted} />
          </View>
        </View>

        <Pressable style={styles.forgotLink}>
          <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          disabled={!canSubmit || loading}
          style={({ pressed }) => [
            styles.submitButton,
            (!canSubmit || loading) && styles.submitDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={canSubmit ? [Colors.primary, Colors.primaryDim] : [Colors.textMuted, Colors.textMuted]}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.submitText}>تسجيل الدخول</Text>
            )}
          </LinearGradient>
        </Pressable>

        <OrDivider />

        <GoogleSignInButton />

        <Pressable onPress={() => router.push('/signup')} style={styles.switchLink}>
          <Text style={styles.switchText}>
            ليس لديك حساب؟{' '}
            <Text style={styles.switchHighlight}>إنشاء حساب</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.2)',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.error,
  },
  notFoundBanner: {
    backgroundColor: 'rgba(210, 153, 34, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(210, 153, 34, 0.2)',
    gap: 12,
  },
  notFoundContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  notFoundText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.warning,
  },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  createAccountText: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.text,
    paddingVertical: 14,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.secondary,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  submitText: {
    fontSize: 17,
    fontFamily: 'Cairo_700Bold',
    color: Colors.background,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
  },
  switchHighlight: {
    color: Colors.primary,
    fontFamily: 'Cairo_600SemiBold',
  },
});
