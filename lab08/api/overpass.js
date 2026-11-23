import { Platform } from 'react-native';
import { isCoordinate } from '../utils/distance';

const ENDPOINT = 'https://overpass-api.de/api/interpreter';

export async function fetchCafes(position, radius = 1500, signal) {
  if (!isCoordinate(position)) throw new Error('Poziție invalidă.');
  const { latitude, longitude } = position;
  const safeRadius = Math.min(2000, Math.max(100, Math.round(radius)));
  const query = `[out:json][timeout:15];node["amenity"="cafe"]` +
    `(around:${safeRadius},${latitude},${longitude});out;`;
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel);
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 18000);
  try {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (Platform.OS !== 'web') headers['User-Agent'] = 'DAM-curs-laborator-8/1.0';
    const response = await fetch(ENDPOINT, {
      method: 'POST', headers, body: `data=${encodeURIComponent(query)}`, signal: controller.signal,
    });
    if (!response.ok) {
      const pause = [429, 406].includes(response.status) ? ' Așteaptă cel puțin 30 de secunde.' : '';
      throw new Error(`OpenStreetMap / Overpass: HTTP ${response.status}.${pause}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.elements)) throw new Error('Răspuns geografic invalid.');
    const cafes = data.elements.map(element => ({
      id: `osm-${element.id}`, name: element.tags?.name || 'Cafenea fără nume',
      latitude: element.lat, longitude: element.lon,
      openingHours: element.tags?.opening_hours || null,
    })).filter(isCoordinate);
    return [...new Map(cafes.map(cafe => [cafe.id, cafe])).values()];
  } catch (error) {
    if (timedOut) throw new Error('Serviciul nu a răspuns în 18 secunde.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
