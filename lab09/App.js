import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function App() {
  // Pe Web nu încărcăm deloc modulul nativ de notificări.
  if (Platform.OS === 'web') return (
    <View style={styles.web}>
      <Text style={styles.label}>LABORATORUL 9</Text>
      <Text style={styles.title}>Remindere locale</Text>
      <Text style={styles.description}>Notificările acestui laborator se testează pe un telefon real, în Expo Go. În Web nu se cer permisiuni și nu se programează notificări.</Text>
      <View style={styles.box}>
        <Text style={styles.item}>1. Salvează proiectul în Snack.</Text>
        <Text style={styles.item}>2. Deschide-l pe telefon în Expo Go.</Text>
        <Text style={styles.item}>3. Programează un reminder peste 10 secunde.</Text>
      </View>
      <Text style={styles.note}>Proiectul folosește notificări locale, fără server și fără token push.</Text>
    </View>
  );

  const RemindersScreen = require('./screens/RemindersScreen').default;
  return <SafeAreaView style={styles.app}>
    <StatusBar barStyle="dark-content" backgroundColor="#F3F6F4" />
    <RemindersScreen />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F3F6F4', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
  web: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#F3F6F4', width: '100%', maxWidth: 700, alignSelf: 'center' },
  label: { color: '#74907D', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  title: { color: '#173D35', fontSize: 32, fontWeight: '800', marginTop: 14 },
  description: { color: '#6A8272', fontSize: 16, lineHeight: 26, marginTop: 16 },
  box: { backgroundColor: '#E1EBE4', padding: 22, borderRadius: 14, marginTop: 24, gap: 14 },
  item: { color: '#436B50', lineHeight: 23, fontSize: 14 },
  note: { color: '#8A9A8E', fontSize: 12, lineHeight: 20, marginTop: 20 },
});
