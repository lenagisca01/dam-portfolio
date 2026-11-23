/* eslint-disable react-native/no-unused-styles */
import React, { useRef, useState, useMemo } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function LoginScreen() {
  const { signIn, sessionMessage } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const canSubmit = username.trim() !== '' && password !== '' && !loading;

  const handleSubmit = async () => {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      await signIn(username.trim(), password);
      // La succes, navigatorul demontează formularul.
    } catch (err) {
      submitting.current = false;
      setError(err.message || 'Autentificarea a eșuat.');
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername('emilys');
    setPassword('emilyspass');
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>LABORATORUL 10</Text>
        <Text style={styles.title}>Bine ai revenit</Text>
        <Text style={styles.intro}>Autentifică-te pentru a accesa profilul și notițele tale.</Text>
        {!!sessionMessage && <Text style={styles.notice}>{sessionMessage}</Text>}
        <View style={styles.card}>
          <Text style={styles.label}>Nume de utilizator</Text>
          <TextInput accessibilityLabel="Nume de utilizator" style={styles.input} value={username} onChangeText={setUsername}
            placeholder="Introdu numele de utilizator" placeholderTextColor={colors.muted} autoCapitalize="none"
            autoCorrect={false} autoComplete="username" editable={!loading} />
          <Text style={styles.label}>Parolă</Text>
          <TextInput accessibilityLabel="Parolă" style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Introdu parola" placeholderTextColor={colors.muted} secureTextEntry
            autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!loading}
            onSubmitEditing={handleSubmit} returnKeyType="go" />
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={!canSubmit} style={[styles.primary, !canSubmit && styles.disabled]} onPress={handleSubmit}>
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Intră în cont</Text>}
          </Pressable>
        </View>
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Cont de test DummyJSON</Text>
          <Text style={styles.demoText}>Utilizator: emilys{ '\n' }Parolă: emilyspass</Text>
          <Pressable accessibilityRole="button" disabled={loading} onPress={fillDemo} style={styles.demoButton}>
            <Text style={styles.demoButtonText}>Completează contul de test</Text>
          </Pressable>
          <Text style={styles.note}>Folosește doar conturi de test. Nu introduce parole personale.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export default React.memo(LoginScreen);

const makeStyles = colors => StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 22, paddingBottom: 36, width: '100%', maxWidth: 560, alignSelf: 'center' },
  eyebrow: { color: colors.muted, fontWeight: '700', fontSize: 11, letterSpacing: 1, marginTop: 14 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 12 },
  intro: { color: colors.muted, lineHeight: 24, fontSize: 15, marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: colors.card, padding: 22, borderRadius: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15, color: colors.text },
  primary: { padding: 16, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, lineHeight: 22, marginBottom: 18 },
  notice: { backgroundColor: colors.noticeBg, color: colors.notice, borderRadius: 10, padding: 14, lineHeight: 22, marginBottom: 18 },
  demo: { marginTop: 22, borderRadius: 16, padding: 20, backgroundColor: colors.soft },
  demoTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  demoText: { color: colors.muted, lineHeight: 23, marginTop: 10, fontSize: 13 },
  demoButton: { paddingVertical: 12, marginTop: 4 },
  demoButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 19 },
});
