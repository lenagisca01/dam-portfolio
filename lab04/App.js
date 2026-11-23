import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProductStack from './navigation/ProductStack';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ProductStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
