import * as Notifications from 'expo-notifications';
import { CHANNEL_ID } from './setup';
import { APP_ID, isOwnRequest } from './model';

export async function scheduleReminder(spec) {
  let trigger;
  const types = Notifications.SchedulableTriggerInputTypes;
  if (spec.kind === 'interval') {
    trigger = { type: types.TIME_INTERVAL, seconds: spec.seconds, repeats: false, channelId: CHANNEL_ID };
  } else if (spec.kind === 'once') {
    trigger = { type: types.DATE, date: new Date(spec.fireAt), channelId: CHANNEL_ID };
  } else if (spec.kind === 'daily') {
    trigger = { type: types.DAILY, hour: spec.hour, minute: spec.minute, channelId: CHANNEL_ID };
  } else {
    throw new Error('Tip de reminder invalid.');
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Reminder', body: spec.title, data: { ...spec, appId: APP_ID } },
    trigger,
  });
  return { ...spec, id };
}

export async function getOwnScheduled() {
  return (await Notifications.getAllScheduledNotificationsAsync()).filter(isOwnRequest);
}

export async function cancelOne(id) {
  const scheduled = await getOwnScheduled();
  if (scheduled.some(request => request.identifier === id)) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export async function cancelAllOwn() {
  const scheduled = await getOwnScheduled();
  // Anulăm numai notificările acestui laborator.
  for (const request of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}
