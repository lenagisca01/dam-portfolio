import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MapPanel() {
  return <View style={styles.panel}>
    <Text style={styles.title}>Harta se verifică pe telefon</Text>
    <Text style={styles.text}>Harta nativă nu este disponibilă pe Web. Deschide acest Snack în Expo Go. Lista și calculul distanțelor funcționează în Web.</Text>
  </View>;
}

const styles = StyleSheet.create({
  panel: { flex: 1, minHeight: 220, backgroundColor: '#E7EEE8', justifyContent: 'center', alignItems: 'center', padding: 28, borderRadius: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#315A44', textAlign: 'center', marginBottom: 14 },
  text: { fontSize: 14, color: '#738779', lineHeight: 23, textAlign: 'center' },
});
