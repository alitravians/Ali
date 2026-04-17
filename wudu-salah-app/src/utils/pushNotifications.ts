// Push Notifications utility
// Uses Capacitor Push Notifications plugin with Firebase Cloud Messaging (FCM)

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping push notifications');
    return;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    console.log('[Push] Permission result:', permResult.receive);

    if (permResult.receive === 'granted') {
      // Register with FCM
      await PushNotifications.register();
      console.log('[Push] Registered for push notifications');
    } else {
      console.log('[Push] Permission not granted');
    }

    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('[Push] FCM Token:', token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    // Listen for push notifications received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notification received:', notification.title, notification.body);
    });

    // Listen for push notification action (user tapped on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification action:', action.notification.title);
    });
  } catch (error) {
    console.error('[Push] Init error:', error);
  }
}
