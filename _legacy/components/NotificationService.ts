import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { days$ } from "../store/days$";
import { activities$ } from "../store/activities$";
import { currentTripId$ } from "../store/currentTrip$";

const NOTIF_KEY = "mk_trip_notifs_enabled";

// Lazy import — expo-notifications crashes on web
let Notifications: typeof import("expo-notifications") | null = null;

async function getNotifModule() {
  if (Platform.OS === "web") return null;
  if (!Notifications) {
    Notifications = await import("expo-notifications");
  }
  return Notifications;
}

/** Request permission + return whether granted */
export async function requestPermission(): Promise<boolean> {
  const mod = await getNotifModule();
  if (!mod) return false;

  const { status: existing } = await mod.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await mod.requestPermissionsAsync();
  return status === "granted";
}

/** Read persisted toggle */
export async function isEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NOTIF_KEY);
  return raw === "true";
}

/** Toggle notifications on/off */
export async function setEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const granted = await requestPermission();
    if (!granted) return false;
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    await scheduleAll();
    return true;
  } else {
    await AsyncStorage.setItem(NOTIF_KEY, "false");
    await cancelAll();
    return true;
  }
}

/** Schedule morning reminders for each trip day (current trip only) */
async function scheduleAll() {
  const mod = await getNotifModule();
  if (!mod) return;

  await mod.cancelAllScheduledNotificationsAsync();

  const tripId = currentTripId$.peek();
  if (!tripId) return;

  const allDays = Object.values((days$ as any).peek() ?? {}) as any[];
  const allActivities = Object.values((activities$ as any).peek() ?? {}) as any[];

  const tripDays = allDays
    .filter((d) => d.trip_id === tripId)
    .sort((a, b) => a.day_number - b.day_number);

  for (const day of tripDays) {
    if (!day.date) continue;
    const [year, month, dayNum] = String(day.date).split("-").map(Number);
    const triggerDate = new Date(year, month - 1, dayNum, 8, 0, 0);

    if (triggerDate <= new Date()) continue;

    const dayActs = allActivities
      .filter((a) => a.day_id === day.id)
      .sort((a, b) => a.position - b.position);
    const firstActivity = dayActs[0];
    const activityCount = dayActs.length;

    await mod.scheduleNotificationAsync({
      content: {
        title: `Jour ${day.day_number} — ${day.theme ?? ""}`,
        body: firstActivity
          ? `${activityCount} activités aujourd'hui. Première : ${firstActivity.title} à ${String(firstActivity.time ?? "").slice(0, 5)}`
          : "Programme du jour disponible dans l'app",
        data: { dayId: day.id },
        sound: true,
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

/** Cancel all scheduled notifications */
async function cancelAll() {
  const mod = await getNotifModule();
  if (!mod) return;
  await mod.cancelAllScheduledNotificationsAsync();
}

/** Init: re-schedule if enabled (call on app start) */
export async function initNotifications() {
  const enabled = await isEnabled();
  if (enabled) {
    await scheduleAll();
  }
}
