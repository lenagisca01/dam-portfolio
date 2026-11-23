import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadTheme, saveTheme } from '../storage/themeStorage';

const ThemeContext = createContext(null);
const PALETTES = {
  light: { background: '#F2F6F5', card: '#FFFFFF', text: '#173D35', muted: '#65796F',
    primary: '#174A43', onPrimary: '#FFFFFF', border: '#DAE4DD', input: '#F7F9F7',
    soft: '#E2EDE5', danger: '#A83A30', dangerBg: '#FBE9E4', notice: '#806334', noticeBg: '#F7EED9' },
  dark: { background: '#101C19', card: '#1B2C26', text: '#EDF5F0', muted: '#ACC1B5',
    primary: '#95D6B8', onPrimary: '#102B20', border: '#3C5447', input: '#14231D',
    soft: '#263E31', danger: '#FFAE9F', dangerBg: '#482C29', notice: '#F5D79B', noticeBg: '#3D3525' },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [saveAttempt, setSaveAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadTheme().then(saved => { if (!cancelled) setMode(saved); })
      .catch(() => { if (!cancelled) setStorageError('Tema salvată nu a putut fi citită.'); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    saveTheme(mode).then(() => { if (!cancelled) setStorageError(null); })
      .catch(() => { if (!cancelled) setStorageError('Tema nu a putut fi salvată. Reîncearcă.'); });
    return () => { cancelled = true; };
  }, [mode, loaded, saveAttempt]);
  const toggleTheme = useCallback(() => setMode(m => m === 'light' ? 'dark' : 'light'), []);
  const retrySaveTheme = useCallback(() => setSaveAttempt(n => n + 1), []);
  const value = useMemo(() => ({ mode, colors: PALETTES[mode], toggleTheme, storageError, retrySaveTheme }),
    [mode, toggleTheme, storageError, retrySaveTheme]);
  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error('useTheme trebuie folosit în interiorul unui ThemeProvider');
  return value;
}
