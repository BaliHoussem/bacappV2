import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

async function registerForPushNotifications(email: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    try {
      const baseUrl = getApiUrl();
      const url = new URL('/api/notifications/register', baseUrl);
      await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: pushToken,
          platform: Platform.OS,
        }),
      });
    } catch (e) {
      console.log('Could not register push token on server');
    }

    return true;
  } catch (e) {
    console.log('Push notifications not available:', e);
    return false;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { markNotificationsSeen, currentEmail } = useAuth();
  const [enabling, setEnabling] = useState(false);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      if (currentEmail) {
        await registerForPushNotifications(currentEmail);
      }
    } catch (e) {
      if (__DEV__) console.warn('[notifications] push registration failed:', e);
    }
    await markNotificationsSeen();
    setEnabling(false);
    router.replace('/(tabs)');
  };

  const handleLater = async () => {
    await markNotificationsSeen();
    router.replace('/(tabs)');
  };

  const benefits = [
    { icon: 'time-outline', text: 'مراجعة في وقت مناسب' },
    { icon: 'checkbox-outline', text: 'تذكير بالمهام' },
    { icon: 'flame-outline', text: 'تنبيهات السلسلة اليومية' },
    { icon: 'calendar-outline', text: 'اقتراب البكالوريا' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0F1A2E', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 40 }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.iconContainer}>
          <View style={styles.bellCircle}>
            <LinearGradient
              colors={[Colors.gold, Colors.accent]}
              style={styles.bellGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="notifications" size={40} color={Colors.white} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.title}>ابقَ على اطلاع</Text>
          <Text style={styles.subtitle}>
            فعّل الإشعارات حتى لا يفوتك أي شيء مهم
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.benefitsList}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitText}>{b.text}</Text>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon as any} size={22} color={Colors.primary} />
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(800).duration(600)}
        style={[styles.bottomSection, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}
      >
        <Pressable
          onPress={handleEnable}
          disabled={enabling}
          style={({ pressed }) => [styles.enableButton, pressed && styles.buttonPressed]}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDim]}
            style={styles.enableGradient}
          >
            {enabling ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={20} color={Colors.background} />
                <Text style={styles.enableText}>تفعيل الإشعارات</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleLater} style={styles.laterButton}>
          <Text style={styles.laterText}>لاحقًا</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  bellCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
  },
  bellGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  benefitsList: {
    width: '100%',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo_500Medium',
    color: Colors.text,
    textAlign: 'right',
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  enableButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  enableGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  enableText: {
    fontSize: 17,
    fontFamily: 'Cairo_700Bold',
    color: Colors.background,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  laterText: {
    fontSize: 15,
    fontFamily: 'Cairo_500Medium',
    color: Colors.textSecondary,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
