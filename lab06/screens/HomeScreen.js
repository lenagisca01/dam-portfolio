import React from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function HomeScreen({ navigation, user, noteCount, loaded, saving, saveError, readError, loggingOut, logoutError, onLogout }) {
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
      {!!logoutError && <Text accessibilityRole="alert" style={styles.error}>{logoutError}</Text>}
      <Pressable accessibilityRole="button" disabled={loggingOut} style={[styles.logout, loggingOut && styles.disabled]} onPress={onLogout}>
        {loggingOut ? <ActivityIndicator color="#A83A30" /> : <Text style={styles.logoutText}>Ieșire din cont</Text>}
      </Pressable>
      <Text style={styles.note}>Deconectarea șterge sesiunea. Notițele contului rămân salvate și reapar la următoarea autentificare.</Text>
    </ScrollView>
  );
}
export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 36, width: '100%', maxWidth: 620, alignSelf: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', color: '#638273', letterSpacing: 1, marginVertical: 14 },
  card: { backgroundColor: 'white', padding: 26, borderRadius: 18, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E4EEE7' },
  name: { fontSize: 26, fontWeight: '800', color: '#173D35', marginTop: 18, textAlign: 'center' },
  username: { color: '#5B7B69', marginTop: 6, fontSize: 14 },
  email: { color: '#7D8D82', fontSize: 13, marginTop: 10, textAlign: 'center' },
  separator: { height: 1, backgroundColor: '#E4ECE6', width: '100%', marginVertical: 24 },
  statNumber: { fontSize: 34, fontWeight: '800', color: '#174A43' },
  statLabel: { fontSize: 13, color: '#6D8274', marginTop: 6, textAlign: 'center' },
  saveStatus: { fontSize: 11, color: '#819186', marginTop: 12, textAlign: 'center', lineHeight: 18 },
  primary: { padding: 16, borderRadius: 10, backgroundColor: '#174A43', alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 15 },
  storage: { backgroundColor: '#E3EDE6', padding: 18, borderRadius: 12, marginVertical: 20 },
  storageTitle: { color: '#355C47', fontWeight: '700', fontSize: 13 },
  storageText: { color: '#637E6D', lineHeight: 21, fontSize: 12, marginTop: 6 },
  logout: { borderWidth: 1, borderColor: '#D8B9AF', borderRadius: 10, padding: 15, alignItems: 'center' },
  logoutText: { color: '#A83A30', fontWeight: '700' },
  error: { color: '#A83A30', marginBottom: 16, lineHeight: 22 },
  note: { color: '#819186', fontSize: 11, lineHeight: 19, marginTop: 16 },
  disabled: { opacity: 0.5 },
});
