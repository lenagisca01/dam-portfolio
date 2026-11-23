import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'laborator9.reminders.v1';
let queue = Promise.resolve();

export async function loadReminders() {
  await queue;
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    // Detaliile sunt reconstruite din data ale notificărilor proprii din sistem.
    return [];
  }
  return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string') : [];
}

export function saveReminders(reminders) {
  const json = JSON.stringify(reminders);
  const write = queue.then(() => AsyncStorage.setItem(KEY, json));
  queue = write.catch(() => {});
  return write;
}
