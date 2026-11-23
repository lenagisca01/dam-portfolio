import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function HomeScreen({ navigation, productCount, favoriteCount, loading, error, retry }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Ionicons name="bag-handle-outline" size={52} color="#174A43" />
        <Text style={styles.eyebrow}>LABORATORUL 4 · DUMMYJSON</Text>
        <Text style={styles.title}>Descoperă catalogul</Text>
        <Text style={styles.description}>Caută produse, explorează categoriile și păstrează favoritele într-un singur loc.</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          {loading ? <ActivityIndicator color="#174A43" /> : <Text style={styles.number}>{error ? '—' : productCount}</Text>}
          <Text style={styles.label}>Produse în catalog</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.number}>{favoriteCount}</Text>
          <Text style={styles.label}>Produse favorite</Text>
        </View>
      </View>
      {!!error && <View style={styles.errorBox}>
        <Text style={styles.error}>Eroare: {error}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.secondary}>
          <Text style={styles.secondaryText}>Reîncearcă</Text>
        </Pressable>
      </View>}
      <Pressable accessibilityRole="button" style={styles.primary} onPress={() => navigation.navigate('ProductList')}>
        <Text style={styles.primaryText}>Vezi produsele</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => navigation.navigate('Favorites')}>
        <Ionicons name="heart-outline" size={20} color="#174A43" />
        <Text style={styles.secondaryText}>Favorite ({favoriteCount})</Text>
      </Pressable>
      <Text style={styles.note}>Favoritele se păstrează doar în sesiunea curentă și se resetează la reîncărcarea aplicației.</Text>
    </ScrollView>
  );
}
export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  page: { padding: 22, flexGrow: 1, width: '100%', maxWidth: 780, alignSelf: 'center' },
  hero: { paddingVertical: 24 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#5D756E', marginTop: 20, letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#173D35', marginVertical: 12 },
  description: { color: '#5D6D67', fontSize: 16, lineHeight: 25 },
  stats: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  stat: { flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 30, fontWeight: '800', color: '#174A43' },
  label: { fontSize: 12, color: '#65756F', marginTop: 8, textAlign: 'center' },
  primary: { backgroundColor: '#174A43', borderRadius: 12, padding: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondary: { backgroundColor: '#E1EDE8', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  secondaryText: { color: '#174A43', fontWeight: '700', fontSize: 16 },
  note: { color: '#6B7973', fontSize: 12, lineHeight: 19, marginTop: 22 },
  errorBox: { marginBottom: 20 },
  error: { color: '#AD332D', lineHeight: 22 },
});
