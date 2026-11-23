import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

export function useLivePosition(enabled, onPosition, onError) {
  const callbacks = useRef({ onPosition, onError });
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => { callbacks.current = { onPosition, onError }; }, [onPosition, onError]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !foreground) return;
    let cancelled = false;
    let subscription = null;
    const fail = reason => {
      if (!cancelled) callbacks.current.onError?.(typeof reason === 'string' ? reason : reason.message);
    };
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
      location => {
        if (!cancelled) callbacks.current.onPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          simulated: false,
        });
      },
      fail
    ).then(result => {
      if (cancelled) result.remove();
      else subscription = result;
    }).catch(fail);
    return () => { cancelled = true; subscription?.remove(); };
  }, [enabled, foreground]);
}
