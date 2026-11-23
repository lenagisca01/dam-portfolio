/* eslint-disable react-native/no-unused-styles */
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotes, useNotesActions } from '../context/NotesContext';

function HomeScreen({ navigation }) {
  // Temporar: console.log('render HomeScreen');
  const { user, signOut } = useAuth();
  const { notes, loaded, saving, saveError, readError } = useNotes();
  const { flushNotes } = useNotesActions();
  const { mode, colors, toggleTheme, storageError, retrySaveTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const noteCount = notes.length;
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const busy = useRef(false);
  const onLogout = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await flushNotes();
      await signOut();
    } catch (error) {
      setLogoutError(`Deconectarea a eșuat: ${error.message}`);
      setLoggingOut(false);
    } finally { busy.current = false; }
  };
  if (!user) return null;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SESIUNE AUTENTIFICATĂ</Text>
      <View style={styles.card}>
        {!!user.image && <Image source={{ uri: user.image }} style={styles.avatar} accessibilityLabel="Imagine de profil" />}
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.separator} />
        <Text style={styles.statNumber}>{loaded ? noteCount : '—'}</Text>
        <Text style={styles.statLabel}>{loaded ? 'Notițe în contul tău' : readError ? 'Citirea notițelor a eșuat' : 'Se încarcă notițele...'}</Text>
        {loaded && <Text style={styles.saveStatus}>{saving ? 'Se salvează modificările...' : saveError ? 'Salvarea a eșuat. Deschide notițele pentru a reîncerca.' : 'Notițe păstrate local pe acest dispozitiv'}</Text>}
      </View>
      <Pressable accessibilityRole="button" disabled={loggingOut} style={[styles.primary, loggingOut && styles.disabled]} onPress={() => navigation.navigate('Notes')}>
        <Text style={styles.primaryText}>Deschide notițele {loaded ? `(${noteCount})` : ''}</Text>
      </Pressable>
      <View style={styles.storage}>
        <Text style={styles.storageTitle}>{Platform.OS === 'web' ? 'Mod Web' : 'Mod dispozitiv'}</Text>
        <Text style={styles.storageText}>{Platform.OS === 'web'
          ? 'Tokenul este păstrat în AsyncStorage / localStorage, fără protecția SecureStore. Această variantă este pentru laborator.'
          : 'Tokenul este păstrat în SecureStore. Notițele sunt salvate separat în AsyncStorage.'}</Text>
      </View>
      <View style={styles.storage}>
        <Text style={styles.storageTitle}>Tema: {mode === 'dark' ? 'întunecată' : 'luminoasă'}</Text>
        <Pressable accessibilityRole="button" style={styles.logout} onPress={toggleTheme}>
          <Text style={styles.logoutText}>Schimbă în tema {mode === 'dark' ? 'luminoasă' : 'întunecată'}</Text>
        </Pressable>
        {!!storageError && <>
          <Text style={styles.error}>{storageError}</Text>
          <Pressable accessibilityRole="button" onPress={retrySaveTheme} style={styles.logout}>
            <Text style={styles.logoutText}>Reîncearcă salvarea temei</Text>
          </Pressable>
        </>}
      </View>
      {!!logoutError && <Text accessibilityRole="alert" style={styles.error}>{logoutError}</Text>}
      <Pressable accessibilityRole="button" disabled={loggingOut} style={[styles.logout, loggingOut && styles.disabled]} onPress={onLogout}>
        {loggingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.logoutText}>Ieșire din cont</Text>}
      </Pressable>
      <Text style={styles.note}>Deconectarea șterge sesiunea. Notițele contului rămân salvate și reapar la următoarea autentificare.</Text>
    </ScrollView>
  );
}
export default React.memo(HomeScreen);

const makeStyles = colors => StyleSheet.create({
  content: { padding: 22, paddingBottom: 36, width: '100%', maxWidth: 620, alignSelf: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginVertical: 14 },
  card: { backgroundColor: colors.card, padding: 26, borderRadius: 18, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.soft },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 18, textAlign: 'center' },
  username: { color: colors.muted, marginTop: 6, fontSize: 14 },
  email: { color: colors.muted, fontSize: 13, marginTop: 10, textAlign: 'center' },
  separator: { height: 1, backgroundColor: colors.border, width: '100%', marginVertical: 24 },
  statNumber: { fontSize: 34, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center' },
  saveStatus: { fontSize: 11, color: colors.muted, marginTop: 12, textAlign: 'center', lineHeight: 18 },
  primary: { padding: 16, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
  storage: { backgroundColor: colors.soft, padding: 18, borderRadius: 12, marginVertical: 20 },
  storageTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  storageText: { color: colors.muted, lineHeight: 21, fontSize: 12, marginTop: 6 },
  logout: { borderWidth: 1, borderColor: colors.muted, borderRadius: 10, padding: 15, alignItems: 'center' },
  logoutText: { color: colors.danger, fontWeight: '700' },
  error: { color: colors.danger, marginBottom: 16, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 16 },
  disabled: { opacity: 0.5 },
});
