/* eslint-disable react-native/no-unused-styles */
import React, { useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotes, useNotesActions } from '../context/NotesContext';

function NotesScreen() {
  // Temporar: console.log('render NotesScreen');
  const { notes, loaded, saving, saveError, readError } = useNotes();
  const { addNote: onAdd, deleteNote: onDelete, retryLoad: onRetryLoad, retrySave: onRetrySave } = useNotesActions();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const disabled = false;
  const [text, setText] = useState('');
  const canAdd = loaded && text.trim().length > 0 && !disabled;
  const add = () => {
    if (!canAdd) return;
    onAdd(text);
    setText('');
  };

  if (!loaded) return (
    <View style={styles.center}>
      {readError ? <>
        <Text style={styles.error}>Notițele nu au putut fi citite: {readError}</Text>
        <Pressable accessibilityRole="button" style={styles.primary} onPress={onRetryLoad}><Text style={styles.primaryText}>Reîncearcă</Text></Pressable>
      </> : <><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>Se încarcă notițele...</Text></>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.title}>Notițele mele</Text>
        <Text style={styles.subtitle}>{notes.length} notițe · cele mai noi apar primele</Text>
      </View>
      <View style={styles.form}>
        <TextInput accessibilityLabel="Textul notiței" style={styles.input} value={text} onChangeText={setText}
          placeholder="Scrie o notiță..." placeholderTextColor={colors.muted} multiline textAlignVertical="top" editable={!disabled} />
        <Pressable accessibilityRole="button" disabled={!canAdd} style={[styles.primary, !canAdd && styles.disabled]} onPress={add}>
          <Text style={styles.primaryText}>Adaugă notița</Text>
        </Pressable>
      </View>
      <View style={styles.saveLine}>
        {saving && <ActivityIndicator size="small" color={colors.primary} />}
        <Text style={styles.saveText}>{saving ? 'Se salvează...' : saveError ? 'Modificările sunt încă nesalvate.' : 'Notițele sunt salvate pe acest dispozitiv.'}</Text>
      </View>
      {!!saveError && <View style={styles.banner}>
        <Text accessibilityRole="alert" style={styles.error}>Salvarea a eșuat: {saveError}</Text>
        <Pressable accessibilityRole="button" disabled={saving || disabled} onPress={onRetrySave} style={styles.retry}><Text style={styles.retryText}>Reîncearcă salvarea</Text></Pressable>
      </View>}
      <FlatList style={styles.list} data={notes} keyExtractor={item => item.id} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Încă nu ai notițe</Text><Text style={styles.muted}>Adaugă prima notiță folosind câmpul de mai sus.</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.note}>
            <Text style={styles.noteText}>{item.text}</Text>
            <View style={styles.noteFooter}>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('ro-RO')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Șterge notița: ${item.text}`} disabled={disabled} hitSlop={8} onPress={() => onDelete(item.id)} style={styles.delete}>
                <Text style={styles.deleteText}>Șterge</Text>
              </Pressable>
            </View>
          </View>
        )} />
    </KeyboardAvoidingView>
  );
}
export default React.memo(NotesScreen);

const makeStyles = colors => StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 780, alignSelf: 'center' },
  header: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 7 },
  form: { marginHorizontal: 18, backgroundColor: colors.card, padding: 16, borderRadius: 14 },
  input: { minHeight: 88, maxHeight: 170, color: colors.text, fontSize: 15, lineHeight: 22, padding: 10, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 9, marginBottom: 12 },
  primary: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.45 },
  saveLine: { paddingHorizontal: 20, paddingVertical: 13, gap: 8, flexDirection: 'row', alignItems: 'center' },
  saveText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 18 },
  banner: { backgroundColor: colors.dangerBg, borderRadius: 10, padding: 14, marginHorizontal: 18, marginBottom: 12 },
  error: { color: colors.danger, lineHeight: 22, textAlign: 'center' },
  retry: { padding: 10, alignItems: 'center', marginTop: 6 },
  retryText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingBottom: 26 },
  note: { padding: 18, backgroundColor: colors.card, borderRadius: 14, marginBottom: 12 },
  noteText: { color: colors.text, fontSize: 15, lineHeight: 24 },
  noteFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 14 },
  date: { color: colors.muted, fontSize: 10 },
  delete: { backgroundColor: colors.dangerBg, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8 },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 12 },
  empty: { padding: 30, alignItems: 'center', gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  muted: { color: colors.muted, textAlign: 'center', lineHeight: 22, fontSize: 13 },
  center: { flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
