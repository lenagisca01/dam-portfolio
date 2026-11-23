export const APP_ID = 'dam-laborator9-reminders';

function integer(text, minimum, maximum, label) {
  const value = String(text).trim();
  if (!/^\d+$/.test(value)) throw new Error(`${label}: introdu un număr întreg.`);
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new Error(`${label}: valoarea trebuie să fie între ${minimum} și ${maximum}.`);
  }
  return number;
}

export function localDateFields(date) {
  const pad = value => String(value).padStart(2, '0');
  return {
    dateText: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    timeText: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function parseCalendar(dateText, timeText) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText).trim());
  const t = /^(\d{2}):(\d{2})$/.exec(String(timeText).trim());
  if (!d || !t) throw new Error('Folosește data AAAA-LL-ZZ și ora HH:MM.');
  const [, year, month, day] = d.map(Number);
  const [, hour, minute] = t.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
    date.getHours() !== hour || date.getMinutes() !== minute) {
    throw new Error('Data sau ora locală nu este validă.');
  }
  return date.getTime();
}

export function buildReminderSpec(form, now = Date.now()) {
  const title = String(form.title || '').trim();
  if (!title) throw new Error('Scrie titlul reminderului.');
  if (title.length > 200) throw new Error('Titlul poate avea cel mult 200 de caractere.');
  const base = { title, kind: form.kind, createdAt: now };
  if (form.kind === 'interval') {
    const seconds = integer(form.seconds, 1, 86400, 'Secunde');
    return { ...base, seconds, fireAt: now + seconds * 1000 };
  }
  if (form.kind === 'daily') {
    return { ...base, hour: integer(form.hour, 0, 23, 'Ora'), minute: integer(form.minute, 0, 59, 'Minutul') };
  }
  if (form.kind === 'once') {
    let fireAt;
    if (form.onceMode === 'calendar') {
      fireAt = parseCalendar(form.dateText, form.timeText);
    } else {
      const value = String(form.minutes).trim().replace(',', '.');
      const minutes = Number(value);
      if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(minutes) || minutes < 1) {
        throw new Error('Introdu cel puțin 1 minut.');
      }
      fireAt = now + minutes * 60000;
    }
    if (!Number.isFinite(fireAt) || !Number.isFinite(new Date(fireAt).getTime()) || fireAt - now < 60000) {
      throw new Error('Alege un moment cu cel puțin un minut în viitor.');
    }
    return { ...base, fireAt };
  }
  throw new Error('Tip de reminder invalid.');
}

export function nextTime(reminder, now = Date.now()) {
  if (reminder.kind !== 'daily') return reminder.fireAt;
  const date = new Date(now);
  date.setHours(reminder.hour, reminder.minute, 0, 0);
  if (date.getTime() <= now) date.setDate(date.getDate() + 1);
  return date.getTime();
}

export function isOwnRequest(request) {
  return request?.content?.data?.appId === APP_ID;
}

export function reconcileReminders(saved, scheduled, deliveredIds = new Set(), now = Date.now()) {
  const old = new Map(saved.map(item => [item.id, item]));
  const kept = [];
  for (const request of scheduled) {
    if (!isOwnRequest(request) || typeof request.identifier !== 'string') continue;
    const data = request.content.data;
    const kind = data.kind;
    if (!['interval', 'once', 'daily'].includes(kind)) continue;
    if (kind !== 'daily' && deliveredIds.has(request.identifier)) continue;
    const previous = old.get(request.identifier) || {};
    const title = data.title || request.content.body || previous.title;
    if (typeof title !== 'string' || !title.trim()) continue;
    const item = { id: request.identifier, title: title.slice(0, 200), kind,
      createdAt: Number.isFinite(data.createdAt) ? data.createdAt : previous.createdAt || now };
    if (kind === 'daily') {
      if (!Number.isInteger(data.hour) || data.hour < 0 || data.hour > 23 ||
        !Number.isInteger(data.minute) || data.minute < 0 || data.minute > 59) continue;
      item.hour = data.hour;
      item.minute = data.minute;
    } else {
      if (!Number.isFinite(data.fireAt)) continue;
      item.fireAt = data.fireAt;
      if (kind === 'interval') item.seconds = data.seconds;
    }
    kept.push(item);
  }
  return [...new Map(kept.map(item => [item.id, item])).values()]
    .sort((a, b) => nextTime(a, now) - nextTime(b, now));
}
