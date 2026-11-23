import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ProductListScreen({ navigation, products, loading, error, favoriteIds, toggleFavorite, retry }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('title');

  // Valori derivate: nu există fetch sau state suplimentar pentru filtre.
  const categories = ['all', ...[...new Set(products.map(p => p.category))].sort()];
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(query.trim().toLowerCase()) &&
    (selectedCategory === 'all' || product.category === selectedCategory)
  );
  const visibleProducts = [...filteredProducts].sort((a, b) =>
    sortOrder === 'asc' ? a.price - b.price :
    sortOrder === 'desc' ? b.price - a.price : a.title.localeCompare(b.title)
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#174A43" /><Text style={styles.message}>Se încarcă produsele...</Text></View>;
  if (error) return <View style={styles.center}>
    <Text style={styles.error}>Eroare: {error}</Text>
    <Text style={styles.message}>Verifică adresa API în browser și conexiunea la internet.</Text>
    <Pressable accessibilityRole="button" style={styles.retry} onPress={retry}><Text style={styles.white}>Reîncearcă</Text></Pressable>
  </View>;

  return (
    <View style={styles.page}>
      <View style={styles.toolbar}>
        <Text style={styles.heading}>Produse</Text>
        <Pressable accessibilityRole="button" style={styles.favorites} onPress={() => navigation.navigate('Favorites')}>
          <Ionicons name="heart-outline" size={19} color="#AD332D" />
          <Text style={styles.favoriteText}>Favorite ({favoriteIds.length})</Text>
        </Pressable>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color="#687A73" />
        <TextInput accessibilityLabel="Caută produse după titlu" style={styles.input}
          placeholder="Caută după titlu..." placeholderTextColor="#77857F"
          value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Șterge căutarea" hitSlop={10} onPress={() => setQuery('')}>
          <Ionicons name="close-circle" size={21} color="#687A73" />
        </Pressable>}
      </View>
      <View style={styles.categoryWrapper}>
        <FlatList horizontal data={categories} keyExtractor={item => item}
          showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}
          extraData={selectedCategory} renderItem={({ item }) => (
            <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedCategory === item }}
              onPress={() => setSelectedCategory(item)} style={[styles.chip, selectedCategory === item && styles.selectedChip]}>
              <Text style={[styles.chipText, selectedCategory === item && styles.white]}>{item === 'all' ? 'Toate' : item.replace(/-/g, ' ')}</Text>
            </Pressable>
          )} />
      </View>
      <View style={styles.resultBar}>
        <Text style={styles.muted}>{visibleProducts.length} rezultate</Text>
        <Pressable accessibilityRole="button" onPress={() => setSortOrder(value => value === 'title' ? 'asc' : value === 'asc' ? 'desc' : 'title')}>
          <Text style={styles.sortText}>{sortOrder === 'title' ? 'Sortare: A–Z' : sortOrder === 'asc' ? 'Preț: crescător' : 'Preț: descrescător'}</Text>
        </Pressable>
      </View>
      <FlatList style={styles.list} data={visibleProducts} keyExtractor={item => String(item.id)}
        extraData={favoriteIds} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Nu există produse care corespund filtrelor.</Text>}
        renderItem={({ item }) => {
          const isFavorite = favoriteIds.includes(item.id);
          return (
            <View style={styles.row}>
              <Pressable accessibilityRole="button" style={styles.product} onPress={() => navigation.navigate('ProductDetails', { id: item.id })}>
                <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="contain" />
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.category}>{item.category.replace(/-/g, ' ')}</Text>
                  <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${isFavorite ? 'Elimină din' : 'Adaugă la'} favorite: ${item.title}`}
                accessibilityState={{ selected: isFavorite }} hitSlop={10} style={styles.heart} onPress={() => toggleFavorite(item.id)}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color="#AD332D" />
              </Pressable>
            </View>
          );
        }} />
    </View>
  );
}
export default React.memo(ProductListScreen);

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, width: '100%', maxWidth: 900, alignSelf: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, gap: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#173D35' },
  favorites: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#F5E7E3', padding: 10, borderRadius: 10 },
  favoriteText: { color: '#AD332D', fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#DCE5E0' },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#203F35', minWidth: 0 },
  categoryWrapper: { height: 48, marginTop: 12 },
  categories: { alignItems: 'center', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#E2EBE6' },
  selectedChip: { backgroundColor: '#174A43' },
  chipText: { color: '#355D50', fontSize: 13, fontWeight: '600' },
  white: { color: 'white', fontWeight: '700' },
  resultBar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, gap: 8 },
  muted: { color: '#6D7C75', fontSize: 12 },
  sortText: { color: '#174A43', fontSize: 12, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, marginBottom: 10 },
  product: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, minWidth: 0 },
  image: { width: 72, height: 78, borderRadius: 8, backgroundColor: '#F7F9F7' },
  info: { flex: 1, marginLeft: 13 },
  title: { color: '#203F35', fontWeight: '700', fontSize: 15, lineHeight: 21 },
  category: { color: '#748279', fontSize: 12, marginTop: 4 },
  price: { color: '#174A43', fontWeight: '800', fontSize: 16, marginTop: 7 },
  heart: { padding: 13, marginRight: 3 },
  center: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 12, color: '#68796F', textAlign: 'center', lineHeight: 22 },
  error: { color: '#AD332D', textAlign: 'center', fontSize: 16 },
  retry: { backgroundColor: '#174A43', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 10, marginTop: 20 },
  empty: { textAlign: 'center', color: '#68796F', padding: 30, lineHeight: 23 },
});
