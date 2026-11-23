import React, { useMemo } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NotesScreen from '../screens/NotesScreen';

const Stack = createNativeStackNavigator();
export default function RootNavigator() {
  // Temporar: console.log('render RootNavigator');
  const { user, ready } = useAuth();
  const { mode, colors } = useTheme();
  const theme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, primary: colors.primary,
      background: colors.background, card: colors.card, text: colors.text, border: colors.border } };
  }, [mode, colors]);
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, padding: 24, gap: 16 }}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={{ color: colors.muted }}>Se verifică sesiunea salvată...</Text>
  </View>;
  return <>
    <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        {user ? <Stack.Group navigationKey={`user-${user.id}`}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Profil' }} />
          <Stack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notițele mele' }} />
        </Stack.Group> : <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Autentificare' }} />}
      </Stack.Navigator>
    </NavigationContainer>
  </>;
}
