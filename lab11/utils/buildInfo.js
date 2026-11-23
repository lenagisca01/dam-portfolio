// Pure functions: no React or native modules.
export function show(value) {
  return value === null || value === undefined ? '—' : String(value);
}

export function runtimeLabel(executionEnvironment) {
  switch (executionEnvironment) {
    case 'storeClient': return 'Expo Go sau development build';
    case 'standalone': return 'Build de release (standalone)';
    case 'bare': return 'Proiect nativ (bare)';
    default: return `Necunoscut: ${executionEnvironment ?? '—'}`;
  }
}

export function formatVersion(version, buildCode) {
  const v = version ? String(version) : '?';
  const hasCode = buildCode !== null && buildCode !== undefined && String(buildCode) !== '';
  return hasCode ? `${v} (${buildCode})` : v;
}

export function envLabel(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return 'nesetat';
  if (['local', 'preview', 'production'].includes(value)) return value;
  return `necunoscut (${raw})`;
}

// Extract the host from an HTTP(S) address, without depending on URL.
// IPv6 hosts remain in brackets. Credentials/whitespace are rejected.
export function hostOf(url) {
  const match = /^https?:\/\/(\[[0-9a-f:]+\]|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::([0-9]{1,5}))?(?:[/?#]|$)/i.exec(String(url ?? '').trim());
  if (!match || (match[2] && Number(match[2]) > 65535)) return null;
  return match[1].toLowerCase();
}
