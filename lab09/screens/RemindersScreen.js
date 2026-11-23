import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../notifications/setup';
import { cancelAllOwn, cancelOne, getOwnScheduled, scheduleReminder } from '../notifications/scheduler';
import { buildReminderSpec, isOwnRequest, localDateFields, reconcileReminders } from '../notifications/model';
import { loadReminders, saveReminders } from '../storage/remindersStorage';

function Button({ title, onPress, disabled = false, secondary = false }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

function Field({ label, value, onChangeText, disabled, numeric = false, placeholder }) {
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText}
      editable={!disabled} placeholder={placeholder} placeholderTextColor="#97A59B"
      keyboardType={numeric ? 'numeric' : 'default'} autoCapitalize="none" autoCorrect={false} style={styles.input} />
  </View>;
}

function describe(item) {
  if (item.kind === 'daily') return `Zilnic, ${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
  return `${item.kind === 'interval' ? 'Interval' : 'O dată'} · ${new Date(item.fireAt).toLocaleString('ro-RO')}`;
}

export default function RemindersScreen() {
  const initialDate = useMemo(() => localDateFields(new Date(Date.now() + 5 * 60000)), []);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('interval');
  const [seconds, setSeconds] = useState('10');
  const [minutes, setMinutes] = useState('1');
  const [onceMode, setOnceMode] = useState('delay');
  const [dateText, setDateText] = useState(initialDate.dateText);
  const [timeText, setTimeText] = useState(initialDate.timeText);
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('0');
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastReceived, setLastReceived] = useState(null);
  const [opened, setOpened] = useState(null);
  const active = useRef(false);
  const loadedRef = useRef(false);
  const listRef = useRef([]);
  const lock = useRef(false);
  const refreshVersion = useRef(0);
  const deliveredIds = useRef(new Set());
  const lastResponseKey = useRef(null);

  const putList = useCallback(items => {
    listRef.current = items;
    setReminders(items);
  }, []);

  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current;
    if (active.current) { setRefreshing(true); setRefreshError(null); }
    try {
      const saved = loadedRef.current ? listRef.current : await loadReminders();
      const scheduled = await getOwnScheduled();
      if (!active.current || refreshVersion.current !== version) return false;
      const kept = reconcileReminders(saved, scheduled, deliveredIds.current);
      putList(kept);
      loadedRef.current = true;
      setLoaded(true);
      return true;
    } catch (error) {
      if (active.current && refreshVersion.current === version) {
        setRefreshError(error.message || 'Lista nu poate fi citită.');
      }
      return false;
    } finally {
      if (active.current && refreshVersion.current === version) setRefreshing(false);
    }
  }, [putList]);

  useEffect(() => {
    active.current = true;
    refresh();
    const markDelivered = request => {
      if (!isOwnRequest(request)) return;
      if (request.content.data.kind !== 'daily') {
        deliveredIds.current.add(request.identifier);
        if (loadedRef.current) putList(listRef.current.filter(item => item.id !== request.identifier));
      }
    };
    const handleResponse = response => {
      if (!active.current || !response) return;
      const notification = response.notification;
      const request = notification?.request;
      if (!isOwnRequest(request)) return;
      const key = `${request.identifier}:${notification.date}:${response.actionIdentifier}`;
      if (lastResponseKey.current === key) return;
      lastResponseKey.current = key;
      const text = request.content.data.title || request.content.body;
      setOpened(typeof text === 'string' ? text.slice(0, 200) : 'Reminder');
      markDelivered(request);
      refresh();
      if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
        Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    };
    const received = Notifications.addNotificationReceivedListener(notification => {
      if (!active.current || !isOwnRequest(notification.request)) return;
      setLastReceived(notification.request.content.body || 'Reminder');
      markDelivered(notification.request);
      refresh();
    });
    const response = Notifications.addNotificationResponseReceivedListener(handleResponse);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active' && active.current) refresh();
    });
    Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    return () => {
      active.current = false;
      refreshVersion.current += 1;
      received.remove();
      response.remove();
      appState.remove();
    };
  }, [refresh, putList]);

  // loaded oprește scrierea listei [] înainte de citire și reconciliere.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    setSaving(true);
    setSaveError(null);
    saveReminders(reminders).then(() => {
      if (!cancelled) setSaving(false);
    }).catch(error => {
      if (!cancelled) { setSaving(false); setSaveError(error.message || 'Lista nu a fost salvată.'); }
    });
    return () => { cancelled = true; };
  }, [reminders, loaded, saveAttempt]);

  const handleAdd = async () => {
    if (lock.current || !loadedRef.current) return;
    const form = { title, kind, seconds, minutes, onceMode, dateText, timeText, hour, minute };
    setActionError(null);
    setMessage(null);
    try { buildReminderSpec(form); }
    catch (error) { setActionError(error.message); return; }
    lock.current = true;
    refreshVersion.current += 1;
    setBusy(true);
    let created = false;
    try {
      const permission = await ensureNotificationPermission();
      if (!active.current) return;
      if (!permission.allowed) {
        setBlocked(!permission.canAskAgain);
        setActionError('Fără permisiunea pentru notificări, reminderele nu pot fi afișate. Nimic nu a fost programat.');
        return;
      }
      setBlocked(false);
      // Recalculăm momentul după dialogul de permisiune, nu înaintea lui.
      const spec = buildReminderSpec(form);
      const item = await scheduleReminder(spec);
      created = true;
      if (!active.current) return;
      putList([item, ...listRef.current]);
      setTitle('');
      setMessage('Reminder programat. Livrarea poate avea mici întârzieri.');
      await refresh();
    } catch (error) {
      if (active.current) setActionError(`${created ? 'Reminderul a fost programat, dar lista nu s-a actualizat' : 'Programarea a eșuat'}: ${error.message}`);
    } finally {
      lock.current = false;
      if (active.current) { setBusy(false); setRefreshing(false); }
    }
  };

  const handleRemove = async item => {
    if (lock.current) return;
    lock.current = true;
    refreshVersion.current += 1;
    setBusy(true);
    setActionError(null);
    try {
      await cancelOne(item.id);
      if (!active.current) return;
      putList(listRef.current.filter(value => value.id !== item.id));
      setMessage('Reminder anulat.');
      await refresh();
    } catch (error) {
      if (active.current) { setActionError(`Anularea a eșuat: ${error.message}`); await refresh(); }
    } finally {
      lock.current = false;
      if (active.current) { setBusy(false); setRefreshing(false); }
    }
  };

  const cancelAll = async () => {
    if (lock.current) return;
    lock.current = true;
    refreshVersion.current += 1;
    setBusy(true);
    setActionError(null);
    try {
      await cancelAllOwn();
      if (!active.current) return;
      putList([]);
      setMessage('Toate reminderele acestui laborator au fost anulate.');
      await refresh();
    } catch (error) {
      if (active.current) { setActionError(`Unele remindere nu au putut fi anulate: ${error.message}`); await refresh(); }
    } finally {
      lock.current = false;
      if (active.current) { setBusy(false); setRefreshing(false); }
    }
  };

  const confirmCancelAll = () => Alert.alert('Anulezi toate reminderele?', 'Reminderele acestui laborator vor fi eliminate din programarea sistemului.', [
    { text: 'Nu', style: 'cancel' }, { text: 'Da, anulează', style: 'destructive', onPress: cancelAll },
  ]);

  const openSettings = async () => {
    try { await Linking.openSettings(); }
    catch (error) { if (active.current) setActionError(`Deschide manual setările Expo Go: ${error.message}`); }
  };

  const disabled = busy || refreshing || !loaded;

  if (!loaded) return <View style={styles.center}>
    <Text style={styles.title}>Remindere locale</Text>
    {refreshError ? <><Text style={styles.error}>{refreshError}</Text><Button title="Reîncearcă citirea" onPress={refresh} disabled={refreshing} /></> :
      <><ActivityIndicator size="large" color="#174A43" /><Text style={styles.muted}>Se citesc și se verifică reminderele...</Text></>}
  </View>;

  const header = <View>
    <Text style={styles.eyebrow}>LABORATORUL 9</Text>
    <Text style={styles.title}>Remindere locale</Text>
    <Text style={styles.description}>Un interval, un moment ales sau aceeași oră în fiecare zi.</Text>
    <View style={styles.form}>
      <Field label="Titlul reminderului" value={title} onChangeText={setTitle} disabled={disabled} placeholder="De exemplu: Repetă pentru examen" />
      <View style={styles.chips}>{[
        ['interval', 'Interval'], ['once', 'O dată'], ['daily', 'Zilnic'],
      ].map(([id, label]) => <Pressable key={id} accessibilityRole="button" disabled={disabled} onPress={() => setKind(id)}
        style={[styles.chip, kind === id && styles.activeChip]}><Text style={[styles.chipText, kind === id && styles.white]}>{label}</Text></Pressable>)}</View>
      {kind === 'interval' && <View>
        <Text style={styles.fieldLabel}>După cât timp?</Text>
        <View style={styles.chips}>{[['10', '10 s'], ['30', '30 s'], ['60', '1 min'], ['300', '5 min']].map(([value, label]) =>
          <Pressable key={value} accessibilityRole="button" disabled={disabled} onPress={() => setSeconds(value)} style={[styles.smallChip, seconds === value && styles.activeChip]}><Text style={[styles.chipText, seconds === value && styles.white]}>{label}</Text></Pressable>)}</View>
      </View>}
      {kind === 'once' && <View>
        <View style={styles.chips}>{[['delay', 'Peste minute'], ['calendar', 'Dată și oră']].map(([id, label]) =>
          <Pressable key={id} accessibilityRole="button" disabled={disabled} onPress={() => setOnceMode(id)} style={[styles.smallChip, onceMode === id && styles.activeChip]}><Text style={[styles.chipText, onceMode === id && styles.white]}>{label}</Text></Pressable>)}</View>
        {onceMode === 'delay' ? <Field label="Minute până la reminder (minimum 1)" value={minutes} onChangeText={setMinutes} disabled={disabled} numeric /> : <View>
          <Field label="Data locală (AAAA-LL-ZZ)" value={dateText} onChangeText={setDateText} disabled={disabled} placeholder="2026-10-27" />
          <Field label="Ora locală (HH:MM)" value={timeText} onChangeText={setTimeText} disabled={disabled} placeholder="14:30" />
        </View>}
      </View>}
      {kind === 'daily' && <View style={styles.row}>
        <View style={styles.flex}><Field label="Ora (0–23)" value={hour} onChangeText={setHour} disabled={disabled} numeric /></View>
        <View style={styles.flex}><Field label="Minutul (0–59)" value={minute} onChangeText={setMinute} disabled={disabled} numeric /></View>
      </View>}
      <Button title={busy ? 'Se prelucrează...' : 'Programează'} onPress={handleAdd} disabled={disabled || !title.trim()} />
      {busy && <ActivityIndicator style={styles.spinner} color="#174A43" />}
    </View>
    {!!actionError && <Text accessibilityRole="alert" style={styles.errorBanner}>{actionError}</Text>}
    {blocked && <Button title="Deschide setările notificărilor" onPress={openSettings} disabled={busy} secondary />}
    {!!message && <Text style={styles.success}>{message}</Text>}
    {!!lastReceived && <Text style={styles.success}>Primit acum: {lastReceived}</Text>}
    {!!opened && <Text style={styles.opened}>Ai deschis reminderul: {opened}</Text>}
    {!!refreshError && <Text accessibilityRole="alert" style={styles.errorBanner}>Actualizarea listei a eșuat: {refreshError}. Lista existentă a fost păstrată.</Text>}
    {!!saveError && <View style={styles.errorBox}><Text style={styles.error}>Salvarea locală a eșuat: {saveError}. Programarea din sistem rămâne activă.</Text><Button title="Reîncearcă salvarea" secondary onPress={() => setSaveAttempt(value => value + 1)} disabled={saving} /></View>}
    <View style={styles.listHeader}>
      <View style={styles.flex}><Text style={styles.listTitle}>Programate ({reminders.length})</Text><Text style={styles.small}>{saving ? 'Se salvează lista...' : saveError ? 'Lista nu este salvată local' : 'Listă verificată cu sistemul'}</Text></View>
      <Button title={refreshing ? 'Se verifică...' : 'Reîmprospătează'} onPress={refresh} disabled={disabled} secondary />
    </View>
    {reminders.length > 0 && <Button title="Anulează toate" onPress={confirmCancelAll} disabled={disabled} secondary />}
  </View>;

  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={reminders}
    keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" ListHeaderComponent={header}
    ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Nu ai remindere programate</Text><Text style={styles.muted}>Completează titlul și alege momentul primei notificări.</Text></View>}
    ListFooterComponent={<Text style={styles.footer}>Orele sunt locale. Notificările pot întârzia din cauza setărilor sistemului. Reminderele zilnice rămân în listă după declanșare.</Text>}
    renderItem={({ item }) => <View style={styles.card}><View style={styles.flex}><Text style={styles.reminderTitle}>{item.title}</Text><Text style={styles.when}>{describe(item)}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Anulează: ${item.title}`} disabled={disabled} onPress={() => handleRemove(item)} style={styles.delete}><Text style={styles.deleteText}>Anulează</Text></Pressable></View>} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 780, alignSelf: 'center' },
  content: { padding: 20, paddingBottom: 36 },
  center: { flex: 1, padding: 26, justifyContent: 'center', alignItems: 'center', gap: 18 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: '#78917F', letterSpacing: 1, marginTop: 10 },
  title: { color: '#173D35', fontSize: 29, fontWeight: '800', marginTop: 9 },
  description: { color: '#718878', fontSize: 14, lineHeight: 23, marginTop: 9, marginBottom: 22 },
  form: { backgroundColor: 'white', padding: 18, borderRadius: 16, marginBottom: 16 },
  field: { marginBottom: 15 },
  fieldLabel: { color: '#577862', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#DDE7DF', backgroundColor: '#F8FAF8', borderRadius: 9, padding: 13, fontSize: 15, color: '#244B36' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E5EEE7', borderRadius: 9 },
  smallChip: { paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#E5EEE7', borderRadius: 9 },
  activeChip: { backgroundColor: '#174A43' },
  chipText: { color: '#53735E', fontSize: 12, fontWeight: '700' },
  white: { color: 'white' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  button: { backgroundColor: '#174A43', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: '#E1EBE4' },
  secondaryText: { color: '#174A43' },
  disabled: { opacity: 0.45 },
  spinner: { marginTop: 14 },
  errorBanner: { color: '#A53D32', backgroundColor: '#F9E9E3', borderRadius: 10, padding: 13, lineHeight: 21, fontSize: 12, marginBottom: 12 },
  errorBox: { padding: 14, backgroundColor: '#F9E9E3', borderRadius: 10, gap: 12, marginBottom: 12 },
  error: { color: '#A53D32', lineHeight: 22, textAlign: 'center' },
  success: { color: '#547B5F', backgroundColor: '#E6F0E7', borderRadius: 10, padding: 13, lineHeight: 21, fontSize: 12, marginBottom: 10 },
  opened: { color: '#496A8A', backgroundColor: '#E3ECF4', borderRadius: 10, padding: 13, lineHeight: 21, fontSize: 12, marginBottom: 10 },
  listHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 22, marginBottom: 14 },
  listTitle: { fontSize: 19, fontWeight: '800', color: '#315A44' },
  small: { color: '#85998B', fontSize: 10, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, backgroundColor: 'white', borderRadius: 13, marginTop: 12 },
  reminderTitle: { color: '#2A503A', fontWeight: '700', fontSize: 15, lineHeight: 22 },
  when: { color: '#7F9485', fontSize: 11, lineHeight: 19, marginTop: 7 },
  delete: { backgroundColor: '#F7E9E4', borderRadius: 8, padding: 10 },
  deleteText: { color: '#A53D32', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 34, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#567B60', textAlign: 'center' },
  muted: { fontSize: 13, color: '#87998C', lineHeight: 22, textAlign: 'center' },
  footer: { fontSize: 10, color: '#8E9D92', lineHeight: 18, textAlign: 'center', marginTop: 26 },
});
