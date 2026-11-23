import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function LoginScreen({ onLogin, sessionMessage }) {
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
      await onLogin(username.trim(), password);
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
        <Text style={styles.eyebrow}>LABORATORUL 6</Text>
        <Text style={styles.title}>Bine ai revenit</Text>
        <Text style={styles.intro}>Autentifică-te pentru a accesa profilul și notițele tale.</Text>
        {!!sessionMessage && <Text style={styles.notice}>{sessionMessage}</Text>}
        <View style={styles.card}>
          <Text style={styles.label}>Nume de utilizator</Text>
          <TextInput accessibilityLabel="Nume de utilizator" style={styles.input} value={username} onChangeText={setUsername}
            placeholder="Introdu numele de utilizator" placeholderTextColor="#85958B" autoCapitalize="none"
            autoCorrect={false} autoComplete="username" editable={!loading} />
          <Text style={styles.label}>Parolă</Text>
          <TextInput accessibilityLabel="Parolă" style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Introdu parola" placeholderTextColor="#85958B" secureTextEntry
            autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!loading}
            onSubmitEditing={handleSubmit} returnKeyType="go" />
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={!canSubmit} style={[styles.primary, !canSubmit && styles.disabled]} onPress={handleSubmit}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Intră în cont</Text>}
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

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 22, paddingBottom: 36, width: '100%', maxWidth: 560, alignSelf: 'center' },
  eyebrow: { color: '#628173', fontWeight: '700', fontSize: 11, letterSpacing: 1, marginTop: 14 },
  title: { color: '#173D35', fontSize: 32, fontWeight: '800', marginTop: 12 },
  intro: { color: '#6A7C71', lineHeight: 24, fontSize: 15, marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: 'white', padding: 22, borderRadius: 18 },
  label: { color: '#355746', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#F7F9F7', borderWidth: 1, borderColor: '#DAE4DD', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15, color: '#244B3A' },
  primary: { padding: 16, borderRadius: 10, backgroundColor: '#174A43', alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: '#A83A30', lineHeight: 22, marginBottom: 18 },
  notice: { backgroundColor: '#F7EED9', color: '#806334', borderRadius: 10, padding: 14, lineHeight: 22, marginBottom: 18 },
  demo: { marginTop: 22, borderRadius: 16, padding: 20, backgroundColor: '#E2EDE5' },
  demoTitle: { color: '#355746', fontWeight: '700', fontSize: 14 },
  demoText: { color: '#56705F', lineHeight: 23, marginTop: 10, fontSize: 13 },
  demoButton: { paddingVertical: 12, marginTop: 4 },
  demoButtonText: { color: '#174A43', fontWeight: '700', fontSize: 13 },
  note: { color: '#6B8171', fontSize: 11, lineHeight: 19 },
});
