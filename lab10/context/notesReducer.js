export const initialState = { notes: [], loaded: false, dirty: false };

// Funcție pură: id-ul și data sunt generate în acțiune, nu în reducer.
export function notesReducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return { notes: action.notes, loaded: true, dirty: false };
    case 'added':
      if (!state.loaded || !action.note.text.trim()) return state;
      return { ...state, notes: [action.note, ...state.notes], dirty: true };
    case 'removed': {
      if (!state.loaded || !state.notes.some(n => n.id === action.id)) return state;
      return { ...state, notes: state.notes.filter(n => n.id !== action.id), dirty: true };
    }
    case 'reset': return initialState;
    default: throw new Error('Acțiune necunoscută: ' + action.type);
  }
}
