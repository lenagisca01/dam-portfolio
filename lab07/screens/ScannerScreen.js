import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

function httpUrl(text) {
  if (
    typeof text !== 'string' ||
    text.length > 4096
  ) {
    return null;
  }

  const invalidCharacters = Array.from(text).some(
    char =>
      char.charCodeAt(0) <= 32 ||
      char.charCodeAt(0) === 127
  );

  if (invalidCharacters) {
    return null;
  }

  try {
    const url = new URL(text);

    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export default function ScannerScreen() {
  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(null);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] =
    useState(false);

  const [foreground, setForeground] = useState(
    AppState.currentState === 'active'
  );

  const scanLock = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;

    const listener = AppState.addEventListener(
      'change',
      state => {
        setForeground(state === 'active');
      }
    );

    return () => {
      alive.current = false;
      listener.remove();
    };
  }, []);

  const askPermission = async () => {
    if (requesting) return;

    setRequesting(true);
    setError(null);

    try {
      if (permission?.canAskAgain === false) {
        await Linking.openSettings();
      } else {
        await requestPermission();
      }
    } catch (err) {
      if (alive.current) {
        setError(
          err.message ||
            'Permisiunea nu a putut fi cerută.'
        );
      }
    } finally {
      if (alive.current) {
        setRequesting(false);
      }
    }
  };

  const onScan = result => {
    if (
      scanLock.current ||
      typeof result?.data !== 'string'
    ) {
      return;
    }

    scanLock.current = true;

    const tooLong = result.data.length > 4096;

    setScanned({
      data: tooLong
        ? result.data.slice(0, 2000)
        : result.data,
      type: result.type,
      tooLong,
    });
  };

  const scanAgain = () => {
    scanLock.current = false;
    setScanned(null);
    setError(null);
  };

  const link =
    scanned && !scanned.tooLong
      ? httpUrl(scanned.data)
      : null;

  const openLink = () => {
    if (!link) return;

    Alert.alert(
      'Deschizi linkul?',
      `${link}\n\nVerifică adresa înainte de deschidere.`,
      [
        {
          text: 'Nu',
          style: 'cancel',
        },
        {
          text: 'Da, deschide',
          onPress: async () => {
            try {
              await Linking.openURL(link);
            } catch (err) {
              if (alive.current) {
                setError(
                  `Linkul nu poate fi deschis: ${err.message}`
                );
              }
            }
          },
        },
      ]
    );
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>
          Scanner QR pe dispozitiv
        </Text>

        <Text style={styles.message}>
          Deschide acest Snack în Expo Go pe telefon
          pentru a testa scanarea. În Web poți testa
          galeria din fila Jurnal.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#174A43"
        />

        <Text style={styles.message}>
          Se verifică permisiunea camerei...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>
          Acces la cameră
        </Text>

        <Text style={styles.message}>
          Scanarea codurilor QR necesită acces la
          cameră.
        </Text>

        {!!error && (
          <Text style={styles.error}>
            {error}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={requesting}
          onPress={askPermission}
          style={[
            styles.primary,
            requesting && styles.disabled,
          ]}
        >
          <Text style={styles.white}>
            {requesting
              ? 'Se verifică...'
              : permission.canAskAgain
                ? 'Permite camera'
                : 'Deschide setările'}
          </Text>
        </Pressable>

        {!permission.canAskAgain && (
          <Text style={styles.note}>
            După modificarea permisiunii, revino la
            Jurnal și redeschide Scanner QR.
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
    >
      <Text style={styles.heading}>
        {scanned
          ? 'Cod citit'
          : 'Încadrează un cod QR'}
      </Text>

      <Text style={styles.message}>
        {scanned
          ? 'Conținutul este afișat ca text.'
          : 'După prima citire, scanarea se oprește.'}
      </Text>

      {!scanned && !error && foreground && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={
            scanned ? undefined : onScan
          }
          onMountError={event => {
            setError(
              event.message ||
                'Camera nu poate fi pornită.'
            );
          }}
        />
      )}

      {!foreground && !scanned && (
        <Text style={styles.message}>
          Camera este oprită cât aplicația nu este
          activă.
        </Text>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>
            {error}
          </Text>

          <Pressable
            accessibilityRole="button"
            style={styles.outline}
            onPress={scanAgain}
          >
            <Text style={styles.green}>
              Reîncearcă
            </Text>
          </Pressable>
        </View>
      )}

      {scanned && (
        <View style={styles.result}>
          <Text style={styles.label}>
            CONȚINUT QR · {scanned.type || 'qr'}
          </Text>

          <Text selectable style={styles.data}>
            {scanned.data || '(text gol)'}
          </Text>

          {scanned.tooLong && (
            <Text style={styles.error}>
              Cod prea lung. Sunt afișate primele
              2000 de caractere. Deschiderea este
              dezactivată.
            </Text>
          )}

          {!!link && (
            <>
              <Text style={styles.host}>
                Domeniu: {new URL(link).hostname}
              </Text>

              <Pressable
                accessibilityRole="button"
                style={styles.outline}
                onPress={openLink}
              >
                <Text style={styles.green}>
                  Deschide linkul...
                </Text>
              </Pressable>
            </>
          )}

          {!link && !scanned.tooLong && (
            <Text style={styles.note}>
              Nu este un URL HTTP/HTTPS acceptat.
              Nu se deschide nicio aplicație.
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            style={styles.primary}
            onPress={scanAgain}
          >
            <Text style={styles.white}>
              Scanează din nou
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.note}>
        Linkurile nu se deschid automat. Verifică
        domeniul înainte de confirmare.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 30,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  heading: {
    color: '#173D35',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#6F8576',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginVertical: 14,
  },
  camera: {
    width: '100%',
    height: 330,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 12,
  },
  primary: {
    padding: 15,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#174A43',
    alignItems: 'center',
    marginTop: 14,
  },
  white: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  green: {
    color: '#174A43',
    fontWeight: '700',
    fontSize: 14,
  },
  outline: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ACC1B1',
    alignItems: 'center',
    marginTop: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: '#A43D32',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#F8E8E3',
    padding: 18,
    borderRadius: 12,
    marginTop: 14,
  },
  result: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  label: {
    color: '#708876',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  data: {
    color: '#244B3A',
    fontSize: 16,
    lineHeight: 25,
    marginVertical: 20,
  },
  host: {
    color: '#526F5B',
    fontSize: 13,
    fontWeight: '700',
  },
  note: {
    fontSize: 11,
    color: '#86958A',
    lineHeight: 19,
    marginTop: 18,
    textAlign: 'center',
  },
});