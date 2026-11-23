import AsyncStorage from '@react-native-async-storage/async-storage';

import { removePhoto } from './photoStore';

const KEY = 'laborator7.journal.v1';

let queue = Promise.resolve();

function enqueue(operation) {
  const result = queue.then(operation);

  // O eroare nu blochează operațiile următoare.
  queue = result.catch(() => {});

  return result;
}

async function readSnapshot() {
  const raw = await AsyncStorage.getItem(KEY);

  if (raw === null) {
    return {
      entries: [],
      pendingDeletes: [],
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'Metadatele sunt corupte. Datele nu au fost suprascrise.'
    );
  }

  const validEntries =
    Array.isArray(parsed?.entries) &&
    parsed.entries.every(
      item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.file === 'string' &&
        typeof item.caption === 'string' &&
        typeof item.createdAt === 'string' &&
        Number.isFinite(Date.parse(item.createdAt))
    );

  const validDeletes =
    Array.isArray(parsed?.pendingDeletes) &&
    parsed.pendingDeletes.every(
      file => typeof file === 'string'
    );

  if (!validEntries || !validDeletes) {
    throw new Error('Formatul metadatelor este invalid.');
  }

  return parsed;
}

async function commit(entries, pendingDeletes) {
  const inUse = new Set(
    entries.map(entry => entry.file)
  );

  const pending = [...new Set(pendingDeletes)].filter(
    file => !inUse.has(file)
  );

  // Salvăm întâi noua listă și intenția de ștergere.
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({
      version: 1,
      entries,
      pendingDeletes: pending,
    })
  );

  const remaining = [];

  for (const file of pending) {
    try {
      await removePhoto(file);
    } catch {
      remaining.push(file);
    }
  }

  // Eliminăm din coadă fișierele șterse cu succes.
  if (remaining.length !== pending.length) {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        entries,
        pendingDeletes: remaining,
      })
    );
  }

  return {
    entries,
    pendingDeletes: remaining,
    warning: remaining.length
      ? `${remaining.length} fișiere nu au putut fi șterse.`
      : null,
  };
}

export function loadEntries() {
  return enqueue(async () => {
    const snapshot = await readSnapshot();

    if (snapshot.pendingDeletes.length > 0) {
      return commit(
        snapshot.entries,
        snapshot.pendingDeletes
      );
    }

    return {
      ...snapshot,
      warning: null,
    };
  });
}

export function saveEntries(
  entries,
  pendingDeletes = []
) {
  const snapshot = JSON.parse(
    JSON.stringify({
      entries,
      pendingDeletes,
    })
  );

  return enqueue(async () => {
    const old = await readSnapshot();

    return commit(snapshot.entries, [
      ...old.pendingDeletes,
      ...snapshot.pendingDeletes,
    ]);
  });
}