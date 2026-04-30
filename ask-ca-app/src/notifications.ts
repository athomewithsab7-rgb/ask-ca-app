import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULED_KEY = 'askca_daily_reminder_scheduled';

export async function scheduleDailyReminder() {
  try {
    if (Platform.OS === 'web') return;
    const already = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (already === '1') return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ask CA AI 📚',
        body: 'Aaj ka learning streak maintain karo! 5 min ka lesson ya 1 practice problem try karo.',
        sound: true,
      },
      trigger: {
        hour: 19,
        minute: 0,
        repeats: true,
      } as any,
    });
    await AsyncStorage.setItem(SCHEDULED_KEY, '1');
  } catch {
    // Silently ignore - notifications are best-effort
  }
}
