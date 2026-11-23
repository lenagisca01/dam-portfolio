const BASE_URL = 'https://dummyjson.com';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(BASE_URL + path, { ...options, signal: controller.signal });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(response.ok ? 'Răspuns invalid de la server.' : `Eroare server: ${response.status}`);
    }
    if (!response.ok) {
      const error = new Error(data?.message || `Eroare server: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Serverul nu a răspuns în 15 secunde. Reîncearcă.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, expiresInMins: 60 }),
  });
}

export function getMe(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}

// În state păstrăm numai profilul necesar interfeței, fără parolă sau token.
export function profileFrom(data) {
  if (!Number.isInteger(data?.id) || typeof data.username !== 'string') {
    throw new Error('Profil invalid primit de la server.');
  }
  return {
    id: data.id, username: data.username,
    firstName: data.firstName, lastName: data.lastName,
    email: data.email, image: data.image,
  };
}
