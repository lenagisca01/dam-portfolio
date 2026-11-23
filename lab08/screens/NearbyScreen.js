import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapPanel from '../components/MapPanel';
import { generateDemoCafes, TEST_POSITION } from '../data/demoCafes';
import { fetchCafes } from '../api/overpass';
import { formatDistance, isCoordinate, sortByDistance } from '../utils/distance';
import { useLivePosition } from '../hooks/useLivePosition';

function Button({ title, onPress, disabled = false, secondary = false }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

async function currentPosition() {
  let timer;
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Poziția nu a fost obținută în 20 de secunde. Verifică GPS-ul.')), 20000);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

export default function NearbyScreen() {
  const [status, setStatus] = useState('idle');
  const [position, setPosition] = useState(null);
  const [rawCafes, setRawCafes] = useState([]);
  const [source, setSource] = useState('demo');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [follow, setFollow] = useState(false);
  const [message, setMessage] = useState(null);
  const [notice, setNotice] = useState(null);
  const [osmUsed, setOsmUsed] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const controllerRef = useRef(null);
  const osmCalled = useRef(false);

  const cafes = useMemo(() => position ? sortByDistance(position, rawCafes) : [], [position, rawCafes]);
  const selected = cafes.find(cafe => cafe.id === selectedId);
  const loading = status === 'locating';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      controllerRef.current?.abort();
    };
  }, []);

  const receivePosition = useCallback(next => {
    if (isCoordinate(next)) setPosition(next);
  }, []);
  const watchError = useCallback(reason => {
    setFollow(false);
    setNotice(`Urmărirea poziției a fost oprită: ${reason || 'eroare de locație'}`);
  }, []);

  useLivePosition(follow && status === 'ready' && !position?.simulated, receivePosition, watchError);

  const showDemoWithoutGps = () => {
    if (busy.current) return;
    generation.current += 1;
    controllerRef.current?.abort();
    setFollow(false);
    const here = { ...TEST_POSITION };
    const list = generateDemoCafes(here);
    setPosition(here);
    setRawCafes(list);
    setSource('demo');
    setSelectedId(sortByDistance(here, list)[0]?.id || null);
    setMessage(null);
    setNotice('Mod de test: poziție simulată lângă Cahul. Nu a fost accesată locația ta. Cafenelele sunt fictive.');
    setStatus('ready');
  };

  const search = async (wantedSource = 'demo') => {
    if (busy.current || (wantedSource === 'osm' && osmCalled.current)) return;
    busy.current = true;
    const version = ++generation.current;
    const active = () => mounted.current && generation.current === version;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setFollow(false);
    setStatus('locating');
    setMessage(null);
    setNotice(null);
    try {
      let here;
      // Pentru testarea serviciului offline putem refolosi poziția reală deja obținută.
      if (wantedSource === 'osm' && position && !position.simulated) {
        here = position;
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active()) return;
        if (!permission.granted) {
          setStatus(permission.canAskAgain ? 'denied' : 'blocked');
          return;
        }
        const location = await currentPosition();
        if (!active()) return;
        here = { latitude: location.coords.latitude, longitude: location.coords.longitude,
          accuracy: location.coords.accuracy, simulated: false };
      }
      if (!isCoordinate(here)) throw new Error('Dispozitivul a întors coordonate invalide.');
      let list;
      let actualSource = wantedSource;
      if (wantedSource === 'osm') {
        osmCalled.current = true;
        setOsmUsed(true);
        try {
          list = await fetchCafes(here, 1500, controller.signal);
          if (!active()) return;
          if (list.length === 0) {
            list = generateDemoCafes(here);
            actualSource = 'demo';
            setNotice('Nu există noduri cafe în OpenStreetMap la 1,5 km. Afișăm cafenele demo, fictive.');
          }
        } catch (error) {
          if (!active()) return;
          list = generateDemoCafes(here);
          actualSource = 'demo';
          setNotice(`Serviciul real nu este disponibil: ${error.message}. Afișăm date demo.`);
        }
      } else {
        list = generateDemoCafes(here);
      }
      if (!active()) return;
      setPosition(here);
      setRawCafes(list);
      setSource(actualSource);
      setSelectedId(sortByDistance(here, list)[0]?.id || null);
      setStatus('ready');
    } catch (error) {
      if (active()) { setMessage(error.message || 'Nu am putut obține locația.'); setStatus('error'); }
    } finally {
      if (active()) { busy.current = false; controllerRef.current = null; }
    }
  };

  const openSettings = async () => {
    if (Platform.OS === 'web') {
      setMessage('În browser, folosește pictograma din stânga adresei site-ului pentru a permite locația, apoi reîncearcă.');
      return;
    }
    try { await Linking.openSettings(); }
    catch (error) { setMessage(`Deschide manual setările Expo Go: ${error.message}`); }
  };

  const openDirections = async cafe => {
    try {
      const destination = encodeURIComponent(`${cafe.latitude},${cafe.longitude}`);
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
    } catch (error) { setNotice(`Navigarea nu a putut fi deschisă: ${error.message}`); }
  };

  const sourceButtons = <View style={styles.sourceButtons}>
    <View style={styles.flex}><Button title={position ? 'Actualizează / demo' : 'Găsește cafenele demo'} onPress={() => search('demo')} disabled={loading} /></View>
    <View style={styles.flex}><Button title={osmUsed ? 'Cerere OSM folosită' : 'Cafenele reale (OSM)'} onPress={() => search('osm')} disabled={loading || osmUsed} secondary /></View>
  </View>;

  if (status !== 'ready') return (
    <View style={styles.initial}>
      <Text style={styles.eyebrow}>LABORATORUL 8</Text>
      <Text style={styles.title}>Cafenele în apropiere</Text>
      <Text style={styles.description}>Găsește cea mai apropiată cafenea și compară distanțele în linie dreaptă.</Text>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#174A43" /><Text style={styles.muted}>Se obține poziția sau se interoghează serviciul...</Text></View> : <>
        {status === 'denied' && <Text style={styles.notice}>Locația a fost refuzată. Poți încerca din nou sau poți testa fără GPS.</Text>}
        {status === 'blocked' && <><Text style={styles.notice}>Permisiunea de locație este blocată.</Text><Button title={Platform.OS === 'web' ? 'Cum permit locația în browser?' : 'Deschide setările'} onPress={openSettings} secondary /></>}
        {!!message && <Text style={styles.error}>{message}</Text>}
        {sourceButtons}
        <Button title="Testează fără GPS (poziție simulată)" onPress={showDemoWithoutGps} secondary />
        <Text style={styles.note}>Demo: locația rămâne în aplicație. OSM: la apăsarea butonului, coordonatele sunt trimise serviciului Overpass pentru căutarea cafenelelor. Cel mult o cerere reală pe sesiune.</Text>
      </>}
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LABORATORUL 8 · {position.simulated ? 'POZIȚIE SIMULATĂ' : 'LOCAȚIE REALĂ'}</Text>
        <Text style={styles.readyTitle}>Cafenele în apropiere</Text>
        <Text style={styles.coordinates}>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          {Number.isFinite(position.accuracy) ? ` · precizie ±${Math.round(position.accuracy)} m` : ''}</Text>
      </View>
      {sourceButtons}
      <Text style={styles.source}>Sursă: {source === 'osm' ? 'OpenStreetMap · © contribuitorii OpenStreetMap' : 'Demo · cafenele fictive'} · {cafes.length} locuri</Text>
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
      <View style={styles.controls}>
        <View style={styles.tabs}>{['list', 'map'].map(id => <Pressable key={id} accessibilityRole="tab"
          accessibilityState={{ selected: view === id }} onPress={() => setView(id)} style={[styles.tab, view === id && styles.activeTab]}>
          <Text style={[styles.tabText, view === id && styles.white]}>{id === 'list' ? 'Listă' : 'Hartă'}</Text>
        </Pressable>)}</View>
        <View style={styles.follow}><Text style={styles.followText}>Urmărește poziția</Text><Switch value={follow} disabled={position.simulated} onValueChange={setFollow} trackColor={{ false: '#CEDBD1', true: '#58957D' }} /></View>
      </View>
      <View style={styles.body}>
        {view === 'map' ? <MapPanel position={position} cafes={cafes} selectedId={selectedId} onSelect={setSelectedId} /> :
          <FlatList data={cafes} keyExtractor={item => item.id} extraData={selectedId} contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.muted}>Nicio cafenea disponibilă.</Text>}
            renderItem={({ item, index }) => <Pressable accessibilityRole="button" onPress={() => setSelectedId(item.id)}
              style={[styles.card, index === 0 && styles.nearestCard, item.id === selectedId && styles.selectedCard]}>
              <View style={styles.cardText}>{index === 0 && <Text style={styles.badge}>CEA MAI APROPIATĂ</Text>}<Text style={styles.cafeName}>{item.name}</Text>
                {!!item.openingHours && <Text style={styles.hours}>Program OSM: {item.openingHours}</Text>}</View>
              <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
            </Pressable>} />}
      </View>
      {!!selected && <View style={styles.selectedBar}><View style={styles.flex}><Text style={styles.selectedName}>{selected.name}</Text><Text style={styles.muted}>{formatDistance(selected.distance)} · în linie dreaptă</Text></View><Button title="Navighează" onPress={() => openDirections(selected)} /></View>}
      <Text style={styles.footer}>OSM: coordonatele sunt trimise doar la cererea ta. Urmărirea recalculează local distanțele.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' },
  initial: { flex: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 700, alignSelf: 'center', gap: 14 },
  eyebrow: { fontSize: 10, color: '#6E8775', fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 31, fontWeight: '800', color: '#173D35' },
  description: { fontSize: 15, color: '#6B8272', lineHeight: 24 },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  readyTitle: { fontSize: 25, fontWeight: '800', color: '#173D35', marginTop: 8 },
  coordinates: { color: '#7B8E80', fontSize: 11, marginTop: 7 },
  sourceButtons: { flexDirection: 'row', gap: 10, marginHorizontal: 18, marginVertical: 8 },
  flex: { flex: 1 },
  button: { backgroundColor: '#174A43', paddingHorizontal: 13, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: '#E1EBE4' },
  buttonText: { color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  secondaryText: { color: '#174A43' },
  disabled: { opacity: 0.45 },
  source: { color: '#78907E', fontSize: 10, paddingHorizontal: 19, paddingVertical: 6 },
  notice: { color: '#82643C', backgroundColor: '#F7EFD9', padding: 12, borderRadius: 10, marginHorizontal: 18, marginVertical: 7, fontSize: 12, lineHeight: 19 },
  error: { color: '#A43D32', lineHeight: 22, textAlign: 'center' },
  note: { color: '#819487', fontSize: 11, lineHeight: 19, marginTop: 10 },
  loading: { alignItems: 'center', padding: 30, gap: 16 },
  muted: { fontSize: 12, lineHeight: 20, color: '#7B8E80' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingVertical: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#E1EAE3', borderRadius: 9, padding: 3 },
  tab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 7 },
  activeTab: { backgroundColor: '#174A43' },
  tabText: { color: '#557761', fontWeight: '700', fontSize: 12 },
  white: { color: 'white' },
  follow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  followText: { color: '#6A8272', fontSize: 11 },
  body: { flex: 1, marginHorizontal: 18, minHeight: 130, borderRadius: 14, overflow: 'hidden' },
  listContent: { paddingBottom: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 9, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 },
  nearestCard: { backgroundColor: '#E4EFE6' },
  selectedCard: { borderColor: '#4A8C6F' },
  cardText: { flex: 1 },
  badge: { color: '#528264', fontSize: 9, fontWeight: '800', marginBottom: 7, letterSpacing: 0.5 },
  cafeName: { color: '#244B36', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  hours: { fontSize: 11, color: '#85968A', marginTop: 6 },
  distance: { color: '#174A43', fontWeight: '800', fontSize: 17 },
  selectedBar: { marginHorizontal: 18, marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: '#DCEADF', flexDirection: 'row', gap: 14, alignItems: 'center' },
  selectedName: { fontSize: 13, fontWeight: '700', color: '#315A44', marginBottom: 5 },
  footer: { fontSize: 9, color: '#8B9B8F', padding: 10, textAlign: 'center', lineHeight: 15 },
});
