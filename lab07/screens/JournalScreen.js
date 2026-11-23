import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  persistPhoto,
  removePhoto,
  resolvePhotoUri,
} from '../storage/photoStore';

import {
  loadEntries,
  saveEntries,
} from '../storage/entriesStorage';

const COLUMNS = 3;
const GAP = 8;

function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Photo({ file, style, resizeMode = 'cover' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [file]);

  let uri = null;

  try {
    uri = resolvePhotoUri(file);
  } catch {
    uri = null;
  }

  if (!uri || failed) {
    return (
      <View style={[style, styles.placeholder]}>
        <Text style={styles.placeholderText}>
          Imagine indisponibilă
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}

export default function JournalScreen() {
  const { width } = useWindowDimensions();

  const contentWidth = Math.min(width, 900);

  const tileSize = Math.max(
    1,
    (contentWidth - 36 - GAP * (COLUMNS - 1)) /
      COLUMNS
  );

  const [journal, setJournal] = useState({
    entries: [],
    pendingDeletes: [],
    dirty: false,
  });

  const [caption, setCaption] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const [readError, setReadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [warning, setWarning] = useState(null);

  const [selected, setSelected] = useState(null);
  const [deleteCandidate, setDeleteCandidate] =
    useState(null);

  const [readAttempt, setReadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);

  const alive = useRef(false);
  const picking = useRef(false);
  const sequence = useRef(0);

  const entries = journal.entries;

  const disabled = !loaded || busy || saving;

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
    };
  }, []);

  // Citim înainte de a permite modificarea jurnalului.
  useEffect(() => {
    let cancelled = false;

    setLoaded(false);
    setReadError(null);

    loadEntries()
      .then(snapshot => {
        if (cancelled) return;

        setJournal({
          entries: snapshot.entries,
          pendingDeletes: snapshot.pendingDeletes,
          dirty: false,
        });

        setWarning(snapshot.warning);
        setLoaded(true);
      })
      .catch(error => {
        if (!cancelled) {
          setReadError(
            error.message || 'Jurnalul nu poate fi citit.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [readAttempt]);

  // Nu scriem lista goală înainte de încărcare.
  useEffect(() => {
    if (!loaded || !journal.dirty) return;

    let cancelled = false;

    setSaving(true);
    setSaveError(null);

    saveEntries(
      journal.entries,
      journal.pendingDeletes
    )
      .then(result => {
        if (cancelled) return;

        setWarning(result.warning);
        setSaving(false);
      })
      .catch(error => {
        if (cancelled) return;

        setSaveError(
          error.message || 'Salvarea a eșuat.'
        );

        setSaving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journal, loaded, saveAttempt]);

  const addEntry = async result => {
    if (!result || result.canceled) return;

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      throw new Error(
        'Selectorul nu a returnat o imagine validă.'
      );
    }

    if (!alive.current) return;

    setBusy(true);

    const file = await persistPhoto(asset.uri);

    if (!alive.current) {
      await removePhoto(file);
      return;
    }

    sequence.current += 1;

    const entry = {
      id:
        `${Date.now()}-${sequence.current}-` +
        Math.random().toString(36).slice(2, 9),
      file,
      caption: caption.trim() || 'Fără legendă',
      createdAt: new Date().toISOString(),
    };

    setJournal(previous => ({
      ...previous,
      entries: [entry, ...previous.entries],
      dirty: true,
    }));

    setCaption('');
  };

  const pickFromLibrary = async () => {
    if (disabled || picking.current) return;

    setActionError(null);

    // Unele browsere nu raportează anularea.
    // Pe Web nu blocăm ecranul cât selectorul este deschis.
    if (Platform.OS !== 'web') {
      picking.current = true;
      setBusy(true);
    }

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });

      await addEntry(result);
    } catch (error) {
      if (alive.current) {
        setActionError(
          `Nu am putut adăuga fotografia: ${error.message}`
        );
      }
    } finally {
      picking.current = false;

      if (alive.current) {
        setBusy(false);
      }
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      if (alive.current) {
        setActionError(
          `Deschide manual setările Expo Go: ${error.message}`
        );
      }
    }
  };

  const takePhoto = async () => {
    if (disabled || picking.current) return;

    if (Platform.OS === 'web') {
      setActionError(
        'Camera se verifică în Expo Go pe telefon. În Web folosește galeria.'
      );
      return;
    }

    picking.current = true;
    setBusy(true);
    setActionError(null);

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!alive.current) return;

      if (!permission.granted) {
        Alert.alert(
          'Permisiune necesară',
          'Aplicația are nevoie de cameră pentru fotografii.',
          permission.canAskAgain
            ? [{ text: 'Am înțeles' }]
            : [
                {
                  text: 'Anulează',
                  style: 'cancel',
                },
                {
                  text: 'Deschide setările',
                  onPress: openSettings,
                },
              ]
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });

      await addEntry(result);
    } catch (error) {
      if (alive.current) {
        setActionError(
          `Camera nu poate fi folosită: ${error.message}`
        );
      }
    } finally {
      picking.current = false;

      if (alive.current) {
        setBusy(false);
      }
    }
  };

  const removeEntry = entry => {
    if (disabled) return;

    setJournal(previous => ({
      entries: previous.entries.filter(
        item => item.id !== entry.id
      ),
      pendingDeletes: [
        ...new Set([
          ...previous.pendingDeletes,
          entry.file,
        ]),
      ],
      dirty: true,
    }));

    setSelected(null);
    setDeleteCandidate(null);
  };

  const confirmDelete = entry => {
    if (disabled) return;

    setSelected(null);

    if (Platform.OS === 'web') {
      setDeleteCandidate(entry);
      return;
    }

    Alert.alert(
      'Ștergi fotografia?',
      entry.caption,
      [
        {
          text: 'Nu',
          style: 'cancel',
        },
        {
          text: 'Da, șterge',
          style: 'destructive',
          onPress: () => removeEntry(entry),
        },
      ]
    );
  };

  const retrySave = () => {
    setJournal(previous => ({
      ...previous,
      dirty: true,
    }));

    setSaveAttempt(value => value + 1);
  };

  if (!loaded) {
    return (
      <View style={styles.center}>
        {readError ? (
          <>
            <Text style={styles.error}>
              {readError}
            </Text>

            <Button
              title="Reîncearcă citirea"
              onPress={() =>
                setReadAttempt(value => value + 1)
              }
            />
          </>
        ) : (
          <>
            <ActivityIndicator
              size="large"
              color="#174A43"
            />

            <Text style={styles.muted}>
              Se încarcă jurnalul...
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.page,
        { width: contentWidth },
      ]}
    >
      {Platform.OS === 'web' && (
        <Text style={styles.notice}>
          Web: imaginile sunt temporare. Păstrarea
          fotografiilor după repornire se verifică în
          Expo Go.
        </Text>
      )}

      <View style={styles.form}>
        <TextInput
          accessibilityLabel="Legenda fotografiei"
          value={caption}
          onChangeText={setCaption}
          editable={!disabled}
          placeholder="Legenda următoarei fotografii..."
          placeholderTextColor="#8A998D"
          style={styles.input}
          maxLength={500}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              title="Din galerie"
              disabled={disabled}
              onPress={pickFromLibrary}
            />
          </View>

          <View style={styles.flex}>
            <Button
              title="Cu camera"
              disabled={disabled}
              onPress={takePhoto}
              secondary
            />
          </View>
        </View>
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counter}>
          {entries.length} fotografii
        </Text>

        <View style={styles.status}>
          {(busy || saving) && (
            <ActivityIndicator
              size="small"
              color="#174A43"
            />
          )}

          <Text style={styles.small}>
            {busy
              ? 'Se prelucrează...'
              : saving
                ? 'Se salvează...'
                : saveError
                  ? 'Modificări nesalvate'
                  : 'Jurnal pregătit'}
          </Text>
        </View>
      </View>

      {!!actionError && (
        <Text style={styles.banner}>
          {actionError}
        </Text>
      )}

      {!!saveError && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>
            Salvarea a eșuat: {saveError}
          </Text>

          <Button
            title="Reîncearcă salvarea"
            disabled={saving}
            onPress={retrySave}
            secondary
          />
        </View>
      )}

      {!!warning && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>
            {warning}
          </Text>

          <Button
            title="Reîncearcă ștergerea"
            disabled={saving}
            onPress={retrySave}
            secondary
          />
        </View>
      )}

      <FlatList
        style={styles.list}
        data={entries}
        keyExtractor={item => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Nicio fotografie încă
            </Text>

            <Text style={styles.muted}>
              Adaugă prima fotografie din galerie sau
              folosește camera.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Deschide: ${item.caption}`}
            onPress={() => setSelected(item)}
            onLongPress={() => confirmDelete(item)}
            style={[
              styles.tile,
              { width: tileSize },
            ]}
          >
            <Photo
              file={item.file}
              style={{
                width: tileSize,
                height: tileSize,
              }}
            />

            <Text
              numberOfLines={1}
              style={styles.tileCaption}
            >
              {item.caption}
            </Text>
          </Pressable>
        )}
      />

      <Text style={styles.hint}>
        Atinge pentru vizualizare. Apasă lung pentru
        ștergere.
      </Text>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          {selected && (
            <View style={styles.preview}>
              <Pressable
                onPress={() => setSelected(null)}
              >
                <Photo
                  file={selected.file}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </Pressable>

              <Text style={styles.modalCaption}>
                {selected.caption}
              </Text>

              <Text style={styles.modalDate}>
                {new Date(
                  selected.createdAt
                ).toLocaleString('ro-RO')}
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalButton}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.modalButtonText}>
                    Închide
                  </Text>
                </Pressable>

                <Pressable
                  disabled={disabled}
                  style={styles.modalButton}
                  onPress={() =>
                    confirmDelete(selected)
                  }
                >
                  <Text style={styles.deleteText}>
                    Șterge
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={deleteCandidate !== null}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDeleteCandidate(null)
        }
      >
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.emptyTitle}>
              Ștergi fotografia?
            </Text>

            <Text style={styles.muted}>
              {deleteCandidate?.caption}
            </Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Button
                  title="Nu"
                  onPress={() =>
                    setDeleteCandidate(null)
                  }
                  secondary
                />
              </View>

              <View style={styles.flex}>
                <Button
                  title="Da, șterge"
                  disabled={disabled}
                  onPress={() => {
                    if (deleteCandidate) {
                      removeEntry(deleteCandidate);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  notice: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E6EEE8',
    color: '#64806C',
    fontSize: 11,
    lineHeight: 18,
  },
  form: {
    marginHorizontal: 18,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6DD',
    backgroundColor: '#F7FAF7',
    borderRadius: 8,
    padding: 13,
    fontSize: 14,
    color: '#244B3A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  button: {
    backgroundColor: '#174A43',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#E4EEE7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  secondaryText: {
    color: '#174A43',
  },
  disabled: {
    opacity: 0.45,
  },
  counterRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#315A44',
  },
  status: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  small: {
    fontSize: 11,
    color: '#7B8C80',
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: GAP,
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    overflow: 'hidden',
  },
  tileCaption: {
    paddingHorizontal: 8,
    paddingVertical: 9,
    fontSize: 11,
    color: '#607766',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#DFE6E0',
  },
  placeholderText: {
    fontSize: 11,
    color: '#738378',
    textAlign: 'center',
  },
  empty: {
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#315A44',
    textAlign: 'center',
  },
  muted: {
    fontSize: 13,
    color: '#7B8C80',
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    fontSize: 10,
    color: '#8A998E',
    textAlign: 'center',
    padding: 10,
  },
  banner: {
    padding: 13,
    marginHorizontal: 18,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#F9E9E3',
    color: '#A43D32',
    lineHeight: 20,
    fontSize: 12,
  },
  errorBox: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9E9E3',
    borderRadius: 10,
    gap: 12,
  },
  error: {
    color: '#A43D32',
    lineHeight: 21,
    textAlign: 'center',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,25,19,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  preview: {
    width: '100%',
    maxWidth: 760,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalCaption: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
  },
  modalDate: {
    color: '#A2B9A8',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 9,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  modalButton: {
    padding: 13,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteText: {
    color: '#EEAAA0',
    fontWeight: '700',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    gap: 20,
  },
});