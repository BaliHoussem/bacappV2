import AsyncStorage from '@react-native-async-storage/async-storage';

let _currentEmail: string | null = null;
let _lessonMigrated = false;

export function setStorageEmail(email: string | null) {
  const prev = _currentEmail;
  _currentEmail = email ? email.toLowerCase().trim() : null;
  if (_currentEmail !== prev) _lessonMigrated = false;
}

export function getStorageEmail(): string | null {
  return _currentEmail;
}

export function lessonCompleteKey(subjectId: string, trimesterId: string, lessonId: string): string {
  const base = `@najahi_lesson_complete_${subjectId}_${trimesterId}_${lessonId}`;
  if (!_currentEmail) return base;
  return `${base}_${_currentEmail}`;
}

async function migrateLessonKeys(): Promise<void> {
  if (_lessonMigrated || !_currentEmail) return;
  _lessonMigrated = true;
  try {
    const migKey = `@najahi_lessons_migrated_${_currentEmail}`;
    const done = await AsyncStorage.getItem(migKey);
    if (done) return;

    const allKeys = await AsyncStorage.getAllKeys();
    const oldLessonKeys = allKeys.filter(
      k => k.startsWith('@najahi_lesson_complete_') && !k.includes('@')
    );
    if (oldLessonKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(oldLessonKeys);
      const writes: [string, string][] = [];
      for (const [key, val] of pairs) {
        if (val === 'true') {
          writes.push([`${key}_${_currentEmail}`, 'true']);
        }
      }
      if (writes.length > 0) {
        await AsyncStorage.multiSet(writes);
      }
    }
    await AsyncStorage.setItem(migKey, '1');
  } catch (e) {
    if (__DEV__) console.warn('[storage-keys] lesson migration error:', e);
  }
}

export async function isLessonComplete(subjectId: string, trimesterId: string, lessonId: string): Promise<boolean> {
  await migrateLessonKeys();
  const val = await AsyncStorage.getItem(lessonCompleteKey(subjectId, trimesterId, lessonId));
  return val === 'true';
}

export async function markLessonComplete(subjectId: string, trimesterId: string, lessonId: string): Promise<void> {
  await AsyncStorage.setItem(lessonCompleteKey(subjectId, trimesterId, lessonId), 'true');
}
