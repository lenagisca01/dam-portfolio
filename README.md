# Portofoliu — Dezvoltarea aplicațiilor mobile (DAM)

**Autor:** _Nume Prenume, grupa ____
**Tehnologii:** React Native, Expo, React Navigation, AsyncStorage, SecureStore, Context API, EAS Build

Acest depozitoriu conține lucrările de laborator 4–11 la cursul DAM. Pentru fiecare laborator: descriere scurtă, video de demonstrație, link către proiectul Snack Expo și codul sursă (folder + arhivă).

## Cuprins

| Lab | Tema | Video | Snack | Cod |
|-----|------|-------|-------|-----|
| 4 | API public: listă, detalii, căutare, favorite | [video](./videos/lab04.mp4) | [Snack](https://snack.expo.dev/@elana1/lab4_consum_api_public) | [lab04](./lab04) |
| 5 | Reîmprospătare, paginare, progres, cronometru | [video](./videos/lab05.mp4) | [Snack](https://snack.expo.dev/@elana1/lab5_reimprospatare_-incarcare_perechea1) | [lab05](./lab05) |
| 6 | Login și persistență (SecureStore + AsyncStorage) | [video](./videos/lab06.webm) | [Snack](https://snack.expo.dev/@elana1/lab6_aplicatie_cu_login) | [lab06](./lab06) |
| 7 | Cameră și galerie: jurnal foto, scanner QR | [video](./videos/lab07.mp4) | [Snack](https://snack.expo.dev/@elana1/lab7_aplicatie_camera) | [lab07](./lab07) |
| 8 | Hărți și geolocație: cea mai apropiată cafenea | [video](./videos/lab08.webm) | [Snack](https://snack.expo.dev/@elana1/lab8_integare_harta_geolocatie) | [lab08](./lab08) |
| 9 | Notificări locale programate | [video](./videos/lab09.mp4) | [Snack](https://snack.expo.dev/@elana1/lab9_notificari_locale_programate) | [lab09](./lab09) |
| 10 | Refactorizare cu Context API | [video](./videos/lab10.webm) | [Snack](https://snack.expo.dev/@elana1/lab10_refactorizarea_context_api) | [lab10](./lab10) |
| 11 | EAS Build: APK instalabil | [video](./videos/lab11.webm) | [Snack](https://snack.expo.dev/@elana1/e15e18) | [lab11](./lab11) |

---

## Laborator 4 — Consum API public (DummyJSON)
Aplicație cu Stack Navigator: listă de produse cu indicator de încărcare, ecran de detalii cu propria cerere `fetch` (se transmite doar `id`), căutare live locală, filtre pe categorii, favorite cu state ridicat în `ProductStack` (lifting state up) și pagină „Acasă”.
**Concepte:** fetch, stări loading/error, FlatList, `useEffect` cu dependențe, lifting state up.
- Video: [lab04.mp4](./videos/lab04.mp4) · Snack: [link](https://snack.expo.dev/@elana1/lab4_consum_api_public) · Cod: [lab04/](./lab04)

## Laborator 5 — Reîmprospătare, paginare, progres
Catalog încărcat pe pagini (`limit`/`skip`), `RefreshControl`, stări separate (loading / refreshing / loadingMore), trei tratamente de erori (ecran întreg, banner, subsol). Plus bară de progres animată prin stare și cronometru cu `setInterval`.
**Concepte:** `onEndReached`, `ListFooterComponent`, `useCallback`, cleanup în `useEffect`.
- Video: [lab05.mp4](./videos/lab05.mp4) · Snack: [link](https://snack.expo.dev/@elana1/lab5_reimprospatare_-incarcare_perechea1) · Cod: [lab05/](./lab05)

## Laborator 6 — Login și persistență
Autentificare cu DummyJSON, token în SecureStore (AsyncStorage pe Web), restaurarea sesiunii prin `/auth/me`, comutare Login/Home după starea sesiunii. Notițe salvate în AsyncStorage, separat pe utilizator (indicatorii `ready` și `loaded`).
**Concepte:** autentificare, SecureStore, AsyncStorage, randare condiționată a ecranelor.
- Video: [lab06.webm](./videos/lab06.webm) · Snack: [link](https://snack.expo.dev/@elana1/lab6_aplicatie_cu_login) · Cod: [lab06/](./lab06)

## Laborator 7 — Cameră și galerie
Jurnal foto: poze din galerie și de la cameră (cu tratarea refuzului permisiunii), grilă și vizualizare mărită, copiere în folder permanent, metadate în AsyncStorage, ștergere coerentă. Scanner QR cu `expo-camera`; linkurile scanate se deschid doar după confirmare.
**Concepte:** expo-image-picker, expo-camera, expo-file-system, permisiuni.
- Video: [lab07.mp4](./videos/lab07.mp4) · Snack: [link](https://snack.expo.dev/@elana1/lab7_aplicatie_camera) · Cod: [lab07/](./lab07)

## Laborator 8 — Hărți și geolocație
Poziția curentă (stări: idle, locating, denied, blocked, error, ready), distanța Haversine, sortare după distanță, date demo + cafenele reale din OpenStreetMap (Overpass) cu retragere la demo, hartă cu marcaje sincronizată cu lista, urmărirea poziției cu cleanup.
**Concepte:** expo-location, react-native-maps, `useMemo`, fișiere `.native.js`/`.web.js`.
- Video: [lab08.webm](./videos/lab08.webm) · Snack: [link](https://snack.expo.dev/@elana1/lab8_integare_harta_geolocatie) · Cod: [lab08/](./lab08)

## Laborator 9 — Notificări locale
Remindere după interval, la oră exactă și zilnice; canal Android creat înainte de permisiune; listă salvată în AsyncStorage și reconciliată cu notificările programate; reacție la atingerea notificării.
**Concepte:** expo-notifications, handler, trigger-e, reconciliere.
- Video: [lab09.mp4](./videos/lab09.mp4) · Snack: [link](https://snack.expo.dev/@elana1/lab9_notificari_locale_programate) · Cod: [lab09/](./lab09)

## Laborator 10 — Context API
Refactorizare fără schimbarea comportamentului: `AuthContext`, `NotesContext` (useReducer, context separat pentru stare și acțiuni), `ThemeContext` (light/dark, salvat). `App.js` redus la provideri.
**Concepte:** Context, `useReducer`, `useMemo`, `useCallback`, re-randări.
- Video: [lab10.webm](./videos/lab10.webm) · Snack: [link](https://snack.expo.dev/@elana1/lab10_refactorizarea_context_api) · Cod: [lab10/](./lab10)

## Laborator 11 — EAS Build (APK)
Proiect „Informații despre build”, profil `preview` în `eas.json` care produce APK, variabile `EXPO_PUBLIC_*` pe profil, `autoIncrement`, diagnosticare cu `expo-doctor` / `expo export`, gestionarea cheilor de semnare.
**Concepte:** EAS Build, APK vs AAB, versionare, variabile de mediu.
- Video: [lab11.webm](./videos/lab11.webm) · Snack: [link](https://snack.expo.dev/@elana1/e15e18) · APK: [link](APK_LAB11) · Cod: [lab11/](./lab11)

---

## Structura depozitoriului
```
.
├── README.md
├── lab04/      (App.js, navigation/, screens/ ...)
├── lab05/
├── lab06/
├── lab07/
├── lab08/
├── lab09/
├── lab10/
├── lab11/
├── videos/                 (lab04.mp4 ... lab11.webm)
└── archives/               (lab04.zip ... lab11.zip)
```

## Rulare
1. Deschide link-ul Snack al laboratorului (tab-ul **Web** sau **My Device** cu Expo Go).
2. Sau local: `npm install` → `npx expo start`.
