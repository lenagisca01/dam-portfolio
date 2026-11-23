import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function FavoritesScreen({ navigation, products, loading, error, favoriteIds, toggleFavorite, retry }) {
  const favorites = products.filter(product => favoriteIds.includes(product.id));
  const total = favorites.reduce((sum, product) => sum + product.price, 0);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#174A43" /><Text style={styles.empty}>Se încarcă catalogul...</Text></View>;
  if (error) return <View style={styles.center}>
    <Text style={styles.error}>Eroare: {error}</Text>
    <Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Reîncearcă</Text></Pressable>
  </View>;
  return (
    <View style={styles.page}>
      <View style={styles.summary}>
        <Text style={styles.heading}>Favorite ({favorites.length})</Text>
        <Text style={styles.total}>Preț total: ${total.toFixed(2)}</Text>
      </View>
      <FlatList data={favorites} keyExtractor={item => String(item.id)} extraData={favoriteIds}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<View style={styles.emptyBox}>
          <Ionicons name="heart-outline" size={48} color="#AD332D" />
          <Text style={styles.empty}>Nu ai produse favorite. Apasă inima de lângă un produs pentru a-l adăuga aici.</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => navigation.navigate('ProductList')}><Text style={styles.buttonText}>Vezi produsele</Text></Pressable>
        </View>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable accessibilityRole="button" style={styles.product} onPress={() => navigation.navigate('ProductDetails', { id: item.id })}>
              <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="contain" />
              <View style={styles.info}><Text style={styles.title}>{item.title}</Text><Text style={styles.price}>${item.price.toFixed(2)}</Text></View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Elimină din favorite: ${item.title}`} hitSlop={10} style={styles.heart} onPress={() => toggleFavorite(item.id)}>
              <Ionicons name="heart" size={24} color="#AD332D" />
            </Pressable>
          </View>
        )} />
    </View>
  );
}
export default React.memo(FavoritesScreen);

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, width: '100%', maxWidth: 900, alignSelf: 'center' },
  summary: { padding: 20, backgroundColor: '#E2EDE7', borderRadius: 16, marginBottom: 18 },
  heading: { fontSize: 23, color: '#173D35', fontWeight: '800' },
  total: { color: '#355D50', fontSize: 16, marginTop: 10, fontWeight: '600' },
  content: { paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, marginBottom: 10 },
  product: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, minWidth: 0 },
  image: { width: 72, height: 78, backgroundColor: '#F7F9F7', borderRadius: 8 },
  info: { flex: 1, marginLeft: 13 },
  title: { color: '#203F35', fontWeight: '700', fontSize: 15, lineHeight: 21 },
  price: { color: '#174A43', fontWeight: '800', fontSize: 16, marginTop: 8 },
  heart: { padding: 13, marginRight: 3 },
  emptyBox: { alignItems: 'center', padding: 24 },
  empty: { textAlign: 'center', color: '#68796F', lineHeight: 24, marginVertical: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#AD332D', textAlign: 'center' },
  button: { backgroundColor: '#174A43', padding: 15, borderRadius: 10, marginTop: 14 },
  buttonText: { color: 'white', fontWeight: '700' },
});
