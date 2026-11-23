import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { envLabel, formatVersion, hostOf, runtimeLabel, show } from './utils/buildInfo';

// Static access is replaced by Expo CLI during bundling.
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Intentionally dynamic for the laboratory experiment. Record the observed result.
const variableName = 'EXPO_PUBLIC_APP_ENV';
const DYNAMIC = process.env[variableName];

function InfoSection({ title, rows }) {
  return <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {rows.map(([label, value]) => <View key={label} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{show(value)}</Text>
    </View>)}
  </View>;
}

export default function App() {
  const nativeRows = [
    ['Nume (app.json)', Constants.expoConfig?.name],
    ['Versiune (app.json)', Constants.expoConfig?.version],
    ['Platformă', Platform.OS],
    ['Mediu de execuție', Constants.executionEnvironment],
    ['Explicația mediului', runtimeLabel(Constants.executionEnvironment)],
    ['__DEV__', __DEV__],
    ['ID aplicație', Application.applicationId],
    ['Versiune nativă', Application.nativeApplicationVersion],
    ['Cod build nativ', Application.nativeBuildVersion],
    ['Versiune completă', formatVersion(Application.nativeApplicationVersion, Application.nativeBuildVersion)],
  ];
  const envRows = [
    ['Mediu configurat', envLabel(APP_ENV)],
    ['EXPO_PUBLIC_APP_ENV', APP_ENV],
    ['URL API', API_URL],
    ['Gazdă API', hostOf(API_URL)],
    ['Referire dinamică', DYNAMIC],
  ];
  return <View style={styles.container}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LABORATORUL 11 · EAS BUILD</Text>
      <Text style={styles.title}>Informații despre build</Text>
      <Text style={styles.subtitle}>Compară valorile din Expo Go cu cele din APK-ul instalat.</Text>
      <View style={styles.badge}><Text style={styles.badgeText}>{envLabel(APP_ENV).toUpperCase()}</Text></View>
      <InfoSection title="Aplicație și runtime" rows={nativeRows} />
      <InfoSection title="Variabile de mediu" rows={envRows} />
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Verificare pe dispozitiv</Text>
        <Text style={styles.note}>În APK verifică identificatorul, versiunea nativă și codul build-ului.
          Închide aplicația și redeschide-o fără Expo Go și fără serverul de dezvoltare.</Text>
      </View>
      <Text style={styles.footer}>Valorile lipsă sunt afișate ca —. Variabilele EXPO_PUBLIC_* sunt publice.
        Acest ecran afișează configurația; nu trimite cereri către API.</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F5' },
  content: { paddingHorizontal: 20, paddingTop: Math.max(Constants.statusBarHeight || 0, 24) + 20,
    paddingBottom: 48, width: '100%', maxWidth: 680, alignSelf: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#58786C', letterSpacing: 1 },
  title: { color: '#173D35', fontSize: 30, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#65796F', fontSize: 14, lineHeight: 22, marginTop: 10 },
  badge: { backgroundColor: '#DCEDE4', alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginVertical: 20 },
  badgeText: { color: '#174A43', fontWeight: '700', fontSize: 11 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 18 },
  sectionTitle: { color: '#173D35', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6EEE8' },
  label: { color: '#65796F', fontSize: 13, lineHeight: 20, flex: 1 },
  value: { color: '#173D35', fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'right', flex: 1.2 },
  notice: { backgroundColor: '#E2EDE5', padding: 18, borderRadius: 12 },
  noticeTitle: { color: '#355746', fontWeight: '700', marginBottom: 8 },
  note: { color: '#4A6658', fontSize: 13, lineHeight: 21 },
  footer: { color: '#65796F', fontSize: 11, lineHeight: 19, marginTop: 18 },
});
