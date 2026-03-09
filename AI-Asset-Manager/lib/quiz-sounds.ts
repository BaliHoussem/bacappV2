import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const quizSoundAssets = {
  correct: require('@/assets/sounds/achievement.wav'),
  wrong: require('@/assets/sounds/back.wav'),
  tap: require('@/assets/sounds/tap.wav'),
  streak: require('@/assets/sounds/level_up.wav'),
  complete: require('@/assets/sounds/complete.wav'),
  select: require('@/assets/sounds/select.wav'),
  xp: require('@/assets/sounds/xp.wav'),
  timerWarning: require('@/assets/sounds/next.wav'),
};

export type QuizSoundName = keyof typeof quizSoundAssets;

export type HapticType = 'light' | 'success' | 'error' | 'heavy' | 'medium';

export async function playQuizSound(name: QuizSoundName): Promise<void> {
  try {
    const { Audio } = await import('expo-av');
    const asset = quizSoundAssets[name];
    if (!asset) return;

    const { sound } = await Audio.Sound.createAsync(asset);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (e) {
    if (__DEV__) console.warn('[quiz-sounds] playback error:', e);
  }
}

export async function triggerHaptic(type: HapticType): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    if (__DEV__) console.warn('[quiz-sounds] haptic error:', e);
  }
}

export async function playCorrect(): Promise<void> {
  await Promise.all([playQuizSound('correct'), triggerHaptic('success')]);
}

export async function playWrong(): Promise<void> {
  await Promise.all([playQuizSound('wrong'), triggerHaptic('error')]);
}

export async function playTap(): Promise<void> {
  await Promise.all([playQuizSound('tap'), triggerHaptic('light')]);
}

export async function playStreak(): Promise<void> {
  await Promise.all([playQuizSound('streak'), triggerHaptic('heavy')]);
}

export async function playComplete(): Promise<void> {
  await Promise.all([playQuizSound('complete'), triggerHaptic('success')]);
}

export async function playSelect(): Promise<void> {
  await Promise.all([playQuizSound('select'), triggerHaptic('light')]);
}

export async function playTimerWarning(): Promise<void> {
  await Promise.all([playQuizSound('timerWarning'), triggerHaptic('medium')]);
}
