import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'laborator10.theme';
let pending = Promise.resolve();

export async function loadTheme() {
  await pending.catch(() => {});
  const value = await AsyncStorage.getItem(KEY);
  return value === 'dark' ? 'dark' : 'light';
}

export function saveTheme(mode) {
  const write = pending.catch(() => {}).then(() => AsyncStorage.setItem(KEY, mode));
  pending = write;
  return write;
}
