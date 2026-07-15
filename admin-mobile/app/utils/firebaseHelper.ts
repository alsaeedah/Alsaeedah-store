import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function requestUserPermission() {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  // Get the device token
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    
    // In the future, this token will be sent to Supabase to link with the Admin's account
    await SecureStore.setItemAsync('fcm_token', token);
  } catch (error) {
    console.log('Error getting FCM token:', error);
  }
}

export function setupNotificationListeners() {
  // Handle background/killed state notifications
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });

  // Handle foreground notifications
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    Alert.alert('New Notification', remoteMessage.notification?.body || 'New alert in store.');
  });

  return unsubscribe;
}
