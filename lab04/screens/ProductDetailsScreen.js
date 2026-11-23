import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailsScreen({ route }) {
  const id = route.params?.id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // id este obligatoriu în dependențe. attempt permite reîncercarea cererii.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadProduct() {
      setLoading(true);
      setError(null);
      setProduct(null);
      try {
        if (!Number.isInteger(id) || id < 1) throw new Error('Identificator de produs invalid.');
        const response = await fetch(`https://dummyjson.com/products/${id}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Eroare server: ${response.status}`);
        const data = await response.json();
        if (data.id !== id || typeof data.title !== 'string') throw new Error('Răspuns invalid de la server.');
        if (active) setProduct(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to fetch');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => { active = false; controller.abort(); };
  }, [id, attempt]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#174A43" /><Text style={styles.note}>Se încarcă detaliile...</Text></View>;
  if (error) return <View style={styles.center}>
    <Text style={styles.error}>Eroare: {error}</Text>
    <Text style={styles.note}>Dacă apare „Failed to fetch”, verifică URL-ul în browser și conexiunea. O eroare HTTP, de exemplu 404, înseamnă că serverul a răspuns.</Text>
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => setAttempt(value => value + 1)}><Text style={styles.white}>Reîncearcă</Text></Pressable>
  </View>;
  if (!product) return null;

  const image = product.images?.[0] || product.thumbnail;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      {!!image && <Image source={{ uri: image }} style={styles.image} resizeMode="contain" accessibilityLabel={product.title} />}
      <View style={styles.card}>
        <Text style={styles.category}>{product.category?.replace(/-/g, ' ')}</Text>
        <Text style={styles.title}>{product.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
          <View style={styles.rating}><Ionicons name="star" size={18} color="#B07A21" /><Text style={styles.ratingText}>{product.rating} / 5</Text></View>
        </View>
        <Text style={styles.section}>Descriere</Text>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>Cod produs: {product.id}</Text>
          {!!product.brand && <Text style={styles.metaText}>Brand: {product.brand}</Text>}
          <Text style={styles.metaText}>Stoc: {product.stock} buc.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, width: '100%', maxWidth: 780, alignSelf: 'center' },
  image: { width: '100%', height: 280, backgroundColor: 'white', borderRadius: 18, marginBottom: 16 },
  card: { backgroundColor: 'white', padding: 22, borderRadius: 18 },
  category: { color: '#547466', textTransform: 'uppercase', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#173D35', fontSize: 27, fontWeight: '800', marginVertical: 13, lineHeight: 34 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 25 },
  price: { fontSize: 28, fontWeight: '800', color: '#174A43' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAF0DC', padding: 9, borderRadius: 10 },
  ratingText: { color: '#825D24', fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '700', color: '#203F35', marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 26, color: '#5D6D65' },
  meta: { borderTopWidth: 1, borderTopColor: '#E5EBE7', marginTop: 24, paddingTop: 14, gap: 8 },
  metaText: { fontSize: 13, color: '#748279' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 26 },
  note: { color: '#68796F', textAlign: 'center', lineHeight: 23, marginTop: 15 },
  error: { color: '#AD332D', fontSize: 16, textAlign: 'center' },
  button: { backgroundColor: '#174A43', borderRadius: 10, padding: 15, marginTop: 20 },
  white: { color: 'white', fontWeight: '700' },
});
