import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { initialState, notesReducer } from './notesReducer';
import { loadNotes, saveNotes } from '../storage/notesStorage';

const NotesStateContext = createContext(null);
const NotesActionsContext = createContext(null);

export function NotesProvider({ children }) {
  const { user } = useAuth();
  // O stare nouă pentru fiecare cont: datele contului vechi nu pot fi salvate la cel nou.
  return <NotesSession key={user?.id ?? 'guest'} userId={user?.id ?? null}>{children}</NotesSession>;
}

function NotesSession({ userId, children }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const [readError, setReadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [readAttempt, setReadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const latest = useRef(state);
  const sequence = useRef(0);
  latest.current = state;

  useEffect(() => {
    if (userId === null) { dispatch({ type: 'reset' }); return; }
    let cancelled = false;
    setReadError(null);
    loadNotes(userId).then(notes => {
      if (!cancelled) dispatch({ type: 'loaded', notes });
    }).catch(error => {
      if (!cancelled) setReadError(error.message || 'Citirea a eșuat.');
    });
    return () => { cancelled = true; };
  }, [userId, readAttempt]);

  useEffect(() => {
    if (userId === null || !state.loaded || !state.dirty) return;
    let cancelled = false;
    setSaving(true);
    setSaveError(null);
    saveNotes(userId, state.notes).then(() => {
      if (!cancelled) setSaving(false);
    }).catch(error => {
      if (!cancelled) {
        setSaving(false);
        setSaveError(error.message || 'Salvarea a eșuat.');
      }
    });
    return () => { cancelled = true; };
  }, [userId, state.notes, state.loaded, state.dirty, saveAttempt]);

  // Obiectul nu se schimbă la adăugarea/ștergerea unei notițe.
  const actions = useMemo(() => ({
    addNote(text) {
      const trimmed = text.trim();
      if (userId === null || !latest.current.loaded || !trimmed) return;
      const note = {
        id: `${Date.now()}-${++sequence.current}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmed, createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'added', note });
    },
    deleteNote(id) { dispatch({ type: 'removed', id }); },
    retryLoad() { setReadAttempt(n => n + 1); },
    retrySave() { setSaveAttempt(n => n + 1); },
    async flushNotes() {
      const current = latest.current;
      if (userId !== null && current.loaded && current.dirty) {
        await saveNotes(userId, current.notes);
      }
    },
  }), [userId]);

  const value = useMemo(() => ({ notes: state.notes, loaded: state.loaded,
    readError, saveError, saving }), [state.notes, state.loaded, readError, saveError, saving]);
  return (
    <NotesStateContext.Provider value={value}>
      <NotesActionsContext.Provider value={actions}>{children}</NotesActionsContext.Provider>
    </NotesStateContext.Provider>
  );
}

export function useNotes() {
  const value = useContext(NotesStateContext);
  if (value === null) throw new Error('useNotes trebuie folosit în interiorul unui NotesProvider');
  return value;
}

export function useNotesActions() {
  const value = useContext(NotesActionsContext);
  if (value === null) throw new Error('useNotesActions trebuie folosit în interiorul unui NotesProvider');
  return value;
}
