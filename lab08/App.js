import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import NearbyScreen from './screens/NearbyScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F6F4" />
      <NearbyScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F3F6F4', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
});
