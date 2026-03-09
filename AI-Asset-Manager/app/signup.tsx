import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton, { OrDivider } from '@/components/GoogleSignInButton';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasLength = password.length >= 8;
  const strengthCount = [hasUpper, hasLower, hasNumber, hasSpecial, hasLength].filter(Boolean).length;

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = isValidEmail && strengthCount === 5 && passwordsMatch;

  const getStrengthColor = () => {
    if (strengthCount <= 2) return Colors.error;
    if (strengthCount <= 3) return Colors.warning;
    if (strengthCount <= 4) return Colors.gold;
    return Colors.success;
  };

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (strengthCount <= 2) return 'ضعيفة';
    if (strengthCount <= 3) return 'متوسطة';
    if (strengthCount <= 4) return 'جيدة';
    return 'قوية';
  };

  const handleSignup = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const result = await signup(email, password);
      if (result.success) {
        router.replace('/onboarding');
      } else if (result.error === 'exists') {
        setError('هذا البريد الإلكتروني مسجّل بالفعل، سجّل الدخول');
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
    } catch (e) {
      setError('حدث خطأ، حاول مرة أخرى');
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

        <Text style={styles.title}>إنشاء حساب</Text>
        <Text style={styles.subtitle}>ابدأ رحلتك نحو النجاح في البكالوريا</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>كلمة المرور</Text>
          <View style={styles.inputWrapper}>
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </Pressable>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
          </View>

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSegment,
                      { backgroundColor: i <= strengthCount ? getStrengthColor() : Colors.border },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                {getStrengthLabel()}
              </Text>
            </View>
          )}

          {password.length > 0 && (
            <View style={styles.rulesContainer}>
              <PasswordRule passed={hasLength} label="8 أحرف على الأقل" />
              <PasswordRule passed={hasUpper} label="حرف كبير" />
              <PasswordRule passed={hasLower} label="حرف صغير" />
              <PasswordRule passed={hasNumber} label="رقم" />
              <PasswordRule passed={hasSpecial} label="رمز خاص" />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
          <View style={styles.inputWrapper}>
            <Pressable onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </Pressable>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirm}
              textAlign="right"
            />
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
          </View>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.mismatchText}>كلمتا المرور غير متطابقتين</Text>
          )}
        </View>

        <Pressable
          onPress={handleSignup}
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
              <Text style={styles.submitText}>إنشاء الحساب</Text>
            )}
          </LinearGradient>
        </Pressable>

        <OrDivider />

        <GoogleSignInButton />

        <Pressable onPress={() => router.push('/login')} style={styles.switchLink}>
          <Text style={styles.switchText}>
            لديك حساب بالفعل؟{' '}
            <Text style={styles.switchHighlight}>تسجيل الدخول</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={[styles.ruleText, passed && styles.rulePassed]}>{label}</Text>
      <Ionicons
        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={passed ? Colors.success : Colors.textMuted}
      />
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
  },
  backButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 28,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.2)',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: Colors.error,
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
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.text,
    paddingVertical: 14,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
  },
  rulesContainer: {
    marginTop: 10,
    gap: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textMuted,
  },
  rulePassed: {
    color: Colors.success,
  },
  mismatchText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
    marginTop: 20,
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
