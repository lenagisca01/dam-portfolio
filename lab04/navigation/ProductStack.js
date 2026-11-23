import React, { useCallback, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

const Stack = createNativeStackNavigator();
const LIST_URL = 'https://dummyjson.com/products?limit=0&select=title,price,thumbnail,category&sortBy=title&order=asc';

export default function ProductStack() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [attempt, setAttempt] = useState(0);

  // La pornire și la reîncercare: o singură cerere pentru întregul catalog.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(LIST_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Eroare server: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error('Răspuns invalid de la server.');
        if (active) setProducts(data.products);
      } catch (err) {
        if (active) setError(err.message || 'Failed to fetch');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const toggleFavorite = useCallback((id) => {
    setFavoriteIds(ids => ids.includes(id)
      ? ids.filter(value => value !== id)
      : [...ids, id]);
  }, []);

  const shared = { products, loading, error, favoriteIds, toggleFavorite, retry };
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{
      headerStyle: { backgroundColor: '#174A43' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: '#F3F6F5' },
    }}>
      <Stack.Screen name="Home" options={{ title: 'Acasă' }}>
        {props => <HomeScreen {...props} productCount={products.length}
          favoriteCount={favoriteIds.length} loading={loading} error={error} retry={retry} />}
      </Stack.Screen>
      <Stack.Screen name="ProductList" options={{ title: 'Catalog de produse' }}>
        {props => <ProductListScreen {...props} {...shared} />}
      </Stack.Screen>
      <Stack.Screen name="Favorites" options={{ title: 'Favorite' }}>
        {props => <FavoritesScreen {...props} {...shared} />}
      </Stack.Screen>
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen}
        options={{ title: 'Detalii produs' }} />
    </Stack.Navigator>
  );
}
