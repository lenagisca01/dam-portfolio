import React from 'react';
import { Platform } from 'react-native';
import MapPanelWeb from './MapPanel.web';

// Rezervă pentru editoare care nu rezolvă automat extensiile de platformă.
// Modulul nativ este încărcat numai în ramura Android/iOS.
export default function MapPanel(props) {
  if (Platform.OS === 'web') return <MapPanelWeb {...props} />;
  const NativePanel = require('./MapPanel.native').default;
  return <NativePanel {...props} />;
}
