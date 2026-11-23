import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system/next';
const isWeb = Platform.OS === 'web';

let sequence = 0;

function photosDirectory() {
  const directory = new Directory(
    Paths.document,
    'laborator7-photos'
  );

  directory.create({
    idempotent: true,
    intermediates: true,
  });

  return directory;
}

function safeName(name) {
  const valid =
    typeof name === 'string' &&
    /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]{1,8}$/.test(name);

  if (!valid) {
    throw new Error('Nume de fișier invalid.');
  }

  return name;
}

function extensionOf(uri) {
  const match =
    /\.([a-zA-Z0-9]{1,8})(?:[?#].*)?$/.exec(uri);

  return match ? match[1].toLowerCase() : 'jpg';
}

export async function persistPhoto(tempUri) {
  if (typeof tempUri !== 'string' || !tempUri) {
    throw new Error('Imagine invalidă.');
  }

  // Pe Web URI-ul este temporar.
  if (isWeb) {
    return tempUri;
  }

  sequence += 1;

  const random = Math.random().toString(36).slice(2, 9);

  const fileName =
    `${Date.now()}-${sequence}-${random}.` +
    extensionOf(tempUri);

  const destination = new File(
    photosDirectory(),
    safeName(fileName)
  );

  const source = new File(tempUri);

  await source.copy(destination);

  // Salvăm numele, nu calea absolută.
  return fileName;
}

export function resolvePhotoUri(stored) {
  if (isWeb) {
    return stored;
  }

  return new File(
    photosDirectory(),
    safeName(stored)
  ).uri;
}

export async function removePhoto(stored) {
  if (isWeb) {
    return;
  }

  const file = new File(
    photosDirectory(),
    safeName(stored)
  );

  if (file.exists) {
    await file.delete();
  }
}