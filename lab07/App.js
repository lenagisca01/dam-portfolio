import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import JournalScreen from './screens/JournalScreen';
import ScannerScreen from './screens/ScannerScreen';

export default function App() {
  const [tab, setTab] = useState('journal');

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F3F6F4"
      />

      <View style={styles.header}>
        <Text style={styles.label}>LABORATORUL 7</Text>
        <Text style={styles.title}>Jurnal foto</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{
            selected: tab === 'journal',
          }}
          style={[
            styles.tab,
            tab === 'journal' && styles.activeTab,
          ]}
          onPress={() => setTab('journal')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'journal' && styles.activeText,
            ]}
          >
            Jurnal
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{
            selected: tab === 'scanner',
          }}
          style={[
            styles.tab,
            tab === 'scanner' && styles.activeTab,
          ]}
          onPress={() => setTab('scanner')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'scanner' && styles.activeText,
            ]}
          >
            Scanner QR
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {tab === 'journal' ? (
          <JournalScreen />
        ) : (
          <ScannerScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#F3F6F4',
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight || 0
        : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  label: {
    color: '#6F8274',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#173D35',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 7,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E2EAE4',
    padding: 4,
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: '#174A43',
  },
  tabText: {
    color: '#557261',
    fontSize: 14,
    fontWeight: '700',
  },
  activeText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});