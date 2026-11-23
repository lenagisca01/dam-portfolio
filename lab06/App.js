import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getMe, login, profileFrom } from './api/auth';
import { clearToken, loadToken, saveToken } from './storage/tokenStorage';
import { loadNotes, saveNotes } from './storage/notesStorage';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';

const Stack = createNativeStackNavigator();
const emptyNotes = () => ({ ownerId: null, items: [], loaded: false, dirty: false });

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [notesState, setNotesState] = useState(emptyNotes);
  const [readError, setReadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [readAttempt, setReadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const authBusy = useRef(false);
  const noteSequence = useRef(0);

  const notesLoaded = !!user && notesState.ownerId === user.id && notesState.loaded;
  const notes = notesLoaded ? notesState.items : [];

  // ready previne afișarea loginului înainte de verificarea sesiunii salvate.
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const token = await loadToken();
        if (cancelled) return;
        if (token) {
          const profile = profileFrom(await getMe(token));
          if (!cancelled) setUser(profile);
        }
      } catch (error) {
        if (cancelled) return;
        try {
          await clearToken();
          if (!cancelled) setSessionMessage('Sesiunea nu a putut fi restaurată. Autentifică-te din nou.');
        } catch {
          if (!cancelled) setSessionMessage('Sesiunea nu a putut fi citită sau ștearsă. Verifică accesul la stocare.');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // Întâi citim; ownerId și loaded împiedică amestecarea conturilor.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setNotesState({ ownerId: user.id, items: [], loaded: false, dirty: false });
    setReadError(null);
    setSaveError(null);
    setSaving(false);
    loadNotes(user.id).then(items => {
      if (!cancelled) setNotesState({ ownerId: user.id, items, loaded: true, dirty: false });
    }).catch(error => {
      if (!cancelled) setReadError(error.message || 'Notițele nu au putut fi citite.');
    });
    return () => { cancelled = true; };
  }, [user?.id, readAttempt]);

  // Nu salvăm lista goală înainte de citire. Salvăm numai modificările.
  useEffect(() => {
    if (!user || !notesState.loaded || notesState.ownerId !== user.id || !notesState.dirty) return;
    let cancelled = false;
    setSaving(true);
    setSaveError(null);
    saveNotes(user.id, notesState.items).then(() => {
      if (!cancelled) setSaving(false);
    }).catch(error => {
      if (!cancelled) {
        setSaving(false);
        setSaveError(error.message || 'Notițele nu au putut fi salvate.');
      }
    });
    return () => { cancelled = true; };
  }, [notesState, user?.id, saveAttempt]);

  const handleLogin = useCallback(async (username, password) => {
    if (authBusy.current) throw new Error('O cerere de autentificare este deja în curs.');
    authBusy.current = true;
    try {
      const data = await login(username, password);
      const profile = profileFrom(data);
      await saveToken(data.accessToken);
      setNotesState(emptyNotes());
      setSessionMessage(null);
      setLogoutError(null);
      setUser(profile);
    } finally {
      authBusy.current = false;
    }
  }, []);

  const addNote = useCallback(text => {
    const trimmed = text.trim();
    if (!trimmed || !user || loggingOut) return;
    const now = new Date().toISOString();
    const note = { id: `${Date.now()}-${++noteSequence.current}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed, createdAt: now };
    setNotesState(previous => previous.loaded && previous.ownerId === user.id
      ? { ...previous, items: [note, ...previous.items], dirty: true } : previous);
  }, [user?.id, loggingOut]);

  const deleteNote = useCallback(id => {
    if (!user || loggingOut) return;
    setNotesState(previous => previous.loaded && previous.ownerId === user.id
      ? { ...previous, items: previous.items.filter(note => note.id !== id), dirty: true } : previous);
  }, [user?.id, loggingOut]);

  const handleLogout = async () => {
    if (authBusy.current || !user) return;
    authBusy.current = true;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      // Așteptăm salvarea înainte de a închide sesiunea. Datele nu se șterg.
      if (notesLoaded && notesState.dirty) await saveNotes(user.id, notesState.items);
      await clearToken();
      setUser(null);
      setNotesState(emptyNotes());
      setReadError(null);
      setSaveError(null);
      setSaving(false);
    } catch (error) {
      setLogoutError(`Deconectarea a eșuat: ${error.message}`);
    } finally {
      authBusy.current = false;
      setLoggingOut(false);
    }
  };

  const retryLoad = useCallback(() => setReadAttempt(value => value + 1), []);
  const retrySave = useCallback(() => setSaveAttempt(value => value + 1), []);

  if (!ready) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#174A43" />
      <Text style={styles.muted}>Se verifică sesiunea salvată...</Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#174A43" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#174A43' }, headerTintColor: 'white', contentStyle: { backgroundColor: '#F2F6F5' } }}>
          {user ? (
            <Stack.Group navigationKey={`user-${user.id}`}>
              <Stack.Screen name="Home" options={{ title: 'Profil' }}>
                {props => <HomeScreen {...props} user={user} noteCount={notes.length} loaded={notesLoaded}
                  saving={saving} saveError={saveError} readError={readError}
                  loggingOut={loggingOut} logoutError={logoutError} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="Notes" options={{ title: 'Notițele mele' }}>
                {props => <NotesScreen {...props} notes={notes} loaded={notesLoaded}
                  onAdd={addNote} onDelete={deleteNote} saving={saving} saveError={saveError}
                  readError={readError} onRetryLoad={retryLoad} onRetrySave={retrySave} disabled={loggingOut} />}
              </Stack.Screen>
            </Stack.Group>
          ) : (
            <Stack.Screen name="Login" options={{ title: 'Autentificare' }}>
              {props => <LoginScreen {...props} onLogin={handleLogin} sessionMessage={sessionMessage} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F6F5', padding: 24, gap: 16 },
  muted: { color: '#65796F', textAlign: 'center' },
});
