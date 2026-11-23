import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = userId => `notes:${userId}`;
const pendingWrites = new Map();

export async function loadNotes(userId) {
  // O reconectare rapidă așteaptă scrierea anterioară a aceluiași cont.
  await (pendingWrites.get(keyFor(userId)) || Promise.resolve()).catch(() => {});
  const json = await AsyncStorage.getItem(keyFor(userId));
  if (!json) return [];
  let parsed;
  try { parsed = JSON.parse(json); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  const valid = parsed.filter(note => note && typeof note.id === 'string' &&
    typeof note.text === 'string' && note.text.trim().length > 0 &&
    typeof note.createdAt === 'string' && Number.isFinite(Date.parse(note.createdAt)));
  return [...new Map(valid.map(note => [note.id, note])).values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveNotes(userId, notes) {
  const key = keyFor(userId);
  const json = JSON.stringify(notes);
  // Scrieri succesive în ordine: o listă veche nu poate suprascrie una nouă.
  const previous = pendingWrites.get(key) || Promise.resolve();
  const write = previous.catch(() => {}).then(() => AsyncStorage.setItem(key, json));
  pendingWrites.set(key, write);
  const release = () => { if (pendingWrites.get(key) === write) pendingWrites.delete(key); };
  write.then(release, release);
  return write;
}
