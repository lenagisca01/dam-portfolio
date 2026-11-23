import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { login, getMe, profileFrom } from '../api/auth';
import { saveToken, loadToken, clearToken } from '../storage/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const token = await loadToken();
        if (cancelled) return;
        if (token) {
          const profile = profileFrom(await getMe(token));
          if (!cancelled) setUser(profile);
        }
      } catch {
        if (cancelled) return;
        try {
          await clearToken();
          if (!cancelled) setSessionMessage('Sesiunea nu a putut fi restaurată. Autentifică-te din nou.');
        } catch {
          if (!cancelled) setSessionMessage('Sesiunea nu a putut fi citită sau ștearsă. Verifică accesul la stocare.');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (username, password) => {
    if (busy.current) throw new Error('O cerere de autentificare este deja în curs.');
    busy.current = true;
    try {
      const data = await login(username, password);
      const profile = profileFrom(data);
      await saveToken(data.accessToken);
      setSessionMessage(null);
      setUser(profile);
    } finally { busy.current = false; }
  }, []);

  const signOut = useCallback(async () => {
    if (busy.current) throw new Error('O cerere de autentificare este deja în curs.');
    busy.current = true;
    try {
      await clearToken();
      setUser(null);
    } finally { busy.current = false; }
  }, []);

  const value = useMemo(() => ({ user, ready, sessionMessage, signIn, signOut }),
    [user, ready, sessionMessage, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
  return value;
}
