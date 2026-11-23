/* Run outside Snack: npm install --prefix /tmp/lab10-check @babel/core
   @babel/parser @babel/plugin-transform-modules-commonjs
   @babel/plugin-transform-react-jsx react@19.1.0 react-test-renderer@19.1.0
   NODE_PATH=/tmp/lab10-check/node_modules node tests/check.cjs [path-to-project]
   Storage, HTTP, navigation and native controls are mocked. No device delivery/UI claim. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const assert = require('node:assert/strict');
const Babel = require('@babel/core'), Parser = require('@babel/parser');
const React = require('react'), Renderer = require('react-test-renderer');
const { act } = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const project = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const h = React.createElement;
const tick = () => new Promise(resolve => setImmediate(resolve));

function runtime(root, disk = new Map()) {
  const cache = new Map();
  let tokenValid = true, navig;
  const storage = {
    async getItem(key) { return disk.get(key) ?? null; },
    async setItem(key, value) { disk.set(key, value); },
    async removeItem(key) { disk.delete(key); },
  };
  const NavContext = React.createContext(null);
  const nav = {
    DefaultTheme: { colors: {}, fonts: {} }, DarkTheme: { colors: {}, fonts: {} },
    NavigationContainer: ({ children }) => children,
  };
  function makeStack() {
    const Screen = () => null, Group = () => null;
    function Navigator({ children }) {
      const [name, setName] = React.useState(null);
      const screens = [];
      function walk(nodes) {
        React.Children.forEach(nodes, node => {
          if (!node) return;
          if (node.type === Screen) screens.push(node);
          else if (node.props?.children) walk(node.props.children);
        });
      }
      walk(children);
      const target = screens.find(s => s.props.name === name) || screens[0];
      navig = { navigate: setName, goBack: () => setName(null) };
      if (!target) return null;
      const props = { navigation: navig, route: { name: target.props.name } };
      return h(NavContext.Provider, { value: navig }, target.props.component
        ? h(target.props.component, props) : target.props.children(props));
    }
    return { Screen, Group, Navigator };
  }
  const rn = new Proxy({
    Platform: { OS: 'web' }, StyleSheet: { create: value => value },
    FlatList: props => h('FlatList', null, props.data.length
      ? props.data.map(item => h(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item })))
      : props.ListEmptyComponent),
  }, { get: (obj, key) => obj[key] ?? String(key) });
  const profile = { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'demo@example.com' };
  async function fetchMock(url, opts = {}) {
    if (url.endsWith('/auth/login')) {
      const body = JSON.parse(opts.body);
      if (body.username !== 'emilys' || body.password !== 'emilyspass') {
        return { ok: false, status: 400, json: async () => ({ message: 'Invalid credentials' }) };
      }
      return { ok: true, json: async () => ({ ...profile, accessToken: 'demo-token' }) };
    }
    return { ok: tokenValid, status: 401, json: async () => tokenValid ? profile : { message: 'Token expired' } };
  }
  const mocks = {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'react-native': rn,
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'expo-secure-store': { getItemAsync: storage.getItem, setItemAsync: storage.setItem, deleteItemAsync: storage.removeItem },
    'react-native-safe-area-context': { SafeAreaProvider: ({ children }) => children },
    '@react-navigation/native': nav,
    '@react-navigation/native-stack': { createNativeStackNavigator: makeStack },
  };
  function load(filename) {
    const full = path.resolve(root, filename);
    if (cache.has(full)) return cache.get(full).exports;
    const source = fs.readFileSync(full, 'utf8');
    const code = Babel.transformSync(source, { configFile: false, babelrc: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'] }).code;
    const module = { exports: {} }; cache.set(full, module);
    function req(name) {
      if (name in mocks) return mocks[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(full), name + (path.extname(name) ? '' : '.js')));
      throw Error('Unexpected import: ' + name);
    }
    vm.runInNewContext('(function(require,module,exports){' + code + '\n})', {
      console, setTimeout, clearTimeout, AbortController, fetch: fetchMock,
    }, { filename: full })(req, module, module.exports);
    return module.exports;
  }
  return { load, disk, storage, expire: () => { tokenValid = false; }, navigate: name => navig.navigate(name) };
}
function treeText(node) {
  if (Array.isArray(node)) return node.map(treeText).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return (node?.children || []).map(treeText).join(' ');
}
async function settle(fn) { await act(async () => { if (fn) await fn(); await tick(); }); }
function button(tree, label) {
  const found = tree.root.findAllByType('Pressable').find(b => treeText(b).replace(/\s+/g, ' ').includes(label));
  assert.ok(found, 'Missing button: ' + label); return found;
}
async function press(tree, label) { await settle(() => button(tree, label).props.onPress()); }
async function input(tree, label, value) {
  const field = tree.root.findAllByType('TextInput').find(n => n.props.accessibilityLabel === label);
  assert.ok(field, 'Missing field ' + label); await settle(() => field.props.onChangeText(value));
}
async function regression(folder, withTheme) {
  const r = runtime(folder);
  let tree;
  await settle(() => { tree = Renderer.create(h(r.load('App.js').default)); });
  await input(tree, 'Nume de utilizator', 'wrong'); await input(tree, 'Parolă', 'wrong');
  await press(tree, 'Intră în cont');
  assert.ok(treeText(tree.toJSON()).includes('Invalid credentials'));
  assert.equal(button(tree, 'Intră în cont').props.disabled, false);
  await press(tree, 'Completează contul de test'); await press(tree, 'Intră în cont');
  assert.ok(treeText(tree.toJSON()).includes('Emily'));
  await press(tree, 'Deschide notițele');
  await input(tree, 'Textul notiței', 'Păstrată după reconectare'); await press(tree, 'Adaugă notița');
  await input(tree, 'Textul notiței', 'De șters'); await press(tree, 'Adaugă notița');
  assert.equal(tree.root.findAllByType('Pressable').filter(b => b.props.accessibilityLabel?.startsWith('Șterge notița:')).length, 2);
  const del = tree.root.findAllByType('Pressable').find(b => b.props.accessibilityLabel === 'Șterge notița: De șters');
  await settle(() => del.props.onPress());
  assert.equal(JSON.parse(r.disk.get('notes:1')).length, 1);
  await settle(() => r.navigate('Home'));
  if (withTheme) { await press(tree, 'Schimbă în tema întunecată'); assert.equal(r.disk.get('laborator10.theme'), 'dark'); }
  await press(tree, 'Ieșire din cont');
  assert.equal(r.disk.has('laborator6.authToken'), false);
  await press(tree, 'Completează contul de test'); await press(tree, 'Intră în cont');
  await press(tree, 'Deschide notițele');
  assert.ok(treeText(tree.toJSON()).includes('Păstrată după reconectare'));
  await settle(() => tree.unmount());
  const restored = runtime(folder, r.disk);
  await settle(() => { tree = Renderer.create(h(restored.load('App.js').default)); });
  assert.ok(treeText(tree.toJSON()).includes('Emily'));
  if (withTheme) assert.ok(treeText(tree.toJSON()).includes('Tema:  întunecată'));
  await press(tree, 'Deschide notițele'); assert.ok(treeText(tree.toJSON()).includes('Păstrată după reconectare'));
  await settle(() => tree.unmount());
  restored.expire();
  await settle(() => { tree = Renderer.create(h(restored.load('App.js').default)); });
  assert.ok(treeText(tree.toJSON()).includes('Intră în cont'));
  await settle(() => tree.unmount());
  console.log('PASS login errors, login, restore, notes add/delete/persist, logout/relogin, expired token' + (withTheme ? ', theme switch/restore' : ''));
}
async function units() {
  const r = runtime(project);
  const { initialState, notesReducer } = r.load('context/notesReducer.js');
  const loaded = notesReducer(initialState, { type: 'loaded', notes: [] });
  const note = { id: 'x', text: 'Test', createdAt: '2026-01-01T00:00:00.000Z' };
  const added = notesReducer(loaded, { type: 'added', note });
  assert.equal(added.notes[0], note); assert.equal(loaded.notes.length, 0);
  assert.equal(notesReducer(added, { type: 'removed', id: 'missing' }), added);
  assert.equal(notesReducer(added, { type: 'removed', id: 'x' }).notes.length, 0);
  assert.equal(notesReducer(added, { type: 'reset' }), initialState);
  assert.throws(() => notesReducer(added, { type: 'unknown' }));
  const store = r.load('storage/notesStorage.js');
  r.disk.set('notes:1', 'broken json'); assert.equal((await store.loadNotes(1)).length, 0);
  r.disk.set('notes:1', '{}'); assert.equal((await store.loadNotes(1)).length, 0);
  await Promise.all([store.saveNotes(1, [note]), store.saveNotes(1, []), store.saveNotes(2, [note])]);
  assert.equal((await store.loadNotes(1)).length, 0); assert.equal((await store.loadNotes(2)).length, 1);
  let reject = true; const original = r.storage.setItem;
  r.storage.setItem = async (...args) => { if (reject) throw Error('disk failure'); return original(...args); };
  await assert.rejects(store.saveNotes(1, [note]), /disk failure/);
  reject = false; await store.saveNotes(1, [note]); assert.equal((await store.loadNotes(1)).length, 1);
  const theme = r.load('storage/themeStorage.js');
  await Promise.all([theme.saveTheme('dark'), theme.saveTheme('light'), theme.saveTheme('dark')]);
  assert.equal(await theme.loadTheme(), 'dark');
  console.log('PASS pure reducer, corrupt data, account separation, queued writes, write failure/retry, theme storage');
}
async function contextChecks() {
  const r = runtime(project);
  const { AuthProvider, useAuth } = r.load('context/AuthContext.js');
  const { NotesProvider, useNotes, useNotesActions } = r.load('context/NotesContext.js');
  const { ThemeProvider, useTheme } = r.load('context/ThemeContext.js');
  let auth, actions, notes, theme;
  let actionRenders = 0, stateRenders = 0;
  function AuthProbe() { auth = useAuth(); return null; }
  function ActionsProbe() { actions = useNotesActions(); actionRenders++; return null; }
  function StateProbe() { notes = useNotes(); stateRenders++; return null; }
  function ThemeProbe() { theme = useTheme(); return null; }
  let tree;
  await settle(() => { tree = Renderer.create(h(ThemeProvider, null,
    h(AuthProvider, null, h(NotesProvider, null,
      h(AuthProbe), h(ActionsProbe), h(StateProbe), h(ThemeProbe))))); });
  const signIn = auth.signIn, signOut = auth.signOut;
  await settle(() => auth.signIn('emilys', 'emilyspass'));
  assert.equal(auth.signIn, signIn); assert.equal(auth.signOut, signOut);
  const firstActions = actions, before = actionRenders;
  await settle(() => actions.addNote('Context test'));
  assert.equal(notes.notes.length, 1);
  assert.equal(actions, firstActions); assert.equal(actionRenders, before);
  const beforeTheme = stateRenders;
  await settle(() => theme.toggleTheme());
  assert.equal(stateRenders, beforeTheme);
  await settle(() => actions.flushNotes()); await settle(() => auth.signOut());
  assert.equal(notes.notes.length, 0); assert.equal(notes.loaded, false);
  await settle(() => tree.unmount());
  console.log('PASS stable auth/actions, actions-only consumer skips note changes, notes-only consumer skips theme, logout resets notes');
}

function parseAll(folder) {
  for (const dirent of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, dirent.name);
    if (dirent.isDirectory() && dirent.name !== 'node_modules') parseAll(full);
    else if (full.endsWith('.js')) {
      const ast = Parser.parse(fs.readFileSync(full, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
      for (const item of ast.program.body) if (item.type === 'ImportDeclaration' && item.source.value.startsWith('.')) {
        assert.ok(fs.existsSync(path.resolve(path.dirname(full), item.source.value + '.js')), 'Missing import in ' + full);
      }
    }
  }
}
(async () => {
  parseAll(project); await units(); await contextChecks(); await regression(project, true);
  for (const folder of process.argv.slice(3)) { parseAll(path.resolve(folder)); await regression(path.resolve(folder), false); }
  console.log('ALL CHECKS PASSED (mocked environment; manual Snack/device checklist still required)');
})().catch(e => { console.error(e); process.exitCode = 1; });
