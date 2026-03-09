import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const soundAssets = {
  tap: require('@/assets/sounds/tap.wav'),
  select: require('@/assets/sounds/select.wav'),
  next: require('@/assets/sounds/next.wav'),
  complete: require('@/assets/sounds/complete.wav'),
  back: require('@/assets/sounds/back.wav'),
};

type SoundName = keyof typeof soundAssets;

export function useSound() {
  const soundsRef = useRef<Record<string, Audio.Sound | null>>({});

  useEffect(() => {
    return () => {
      Object.values(soundsRef.current).forEach(sound => {
        if (sound) sound.unloadAsync().catch(() => {});
      });
      soundsRef.current = {};
    };
  }, []);

  const play = useCallback(async (name: SoundName) => {
    try {
      const existing = soundsRef.current[name];
      if (existing) {
        await existing.setPositionAsync(0);
        await existing.playAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(soundAssets[name]);
      soundsRef.current[name] = sound;
      await sound.playAsync();
    } catch (e) {
      if (__DEV__) console.warn('[useSound] playback error:', e);
    }
  }, []);

  return { play };
}
