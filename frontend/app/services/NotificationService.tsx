import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'expo_push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async getPushToken(): Promise<string | null> {
    try {
      // Check if we already have a stored token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken) {
        console.log('Using stored push token:', storedToken);
        return storedToken;
      }

      // Get new token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'default-project-id';
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Store token for future use
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
      console.log('Generated new push token:', token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async initializeNotifications(): Promise<{
    success: boolean;
    token: string | null;
    message: string;
  }> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        return {
          success: false,
          token: null,
          message: '通知の許可が必要です',
        };
      }

      const token = await this.getPushToken();
      
      if (!token) {
        return {
          success: false,
          token: null,
          message: 'プッシュトークンの取得に失敗しました',
        };
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return {
        success: true,
        token,
        message: 'プッシュ通知の設定が完了しました',
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return {
        success: false,
        token: null,
        message: '初期化エラーが発生しました',
      };
    }
  }

  static async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  static async sendTestPushNotification(token: string): Promise<boolean> {
    try {
      const message = {
        to: token,
        sound: 'default',
        title: '🎫 Moment Festival テスト通知',
        body: 'プッシュ通知が正常に動作しています！',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseData = await response.json();
      console.log('Push notification response:', responseData);
      
      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  static setupNotificationListeners() {
    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'festival') {
        // Navigate to festival screen
        console.log('Navigate to festival screen');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  static async clearStoredToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      console.log('Push token cleared');
    } catch (error) {
      console.error('Error clearing push token:', error);
    }
  }
}

// Festival-specific notification functions
export const FestivalNotifications = {
  async sendTicketPurchaseConfirmation(token: string, ticketType: string, quantity: number): Promise<boolean> {
    try {
      const message = {
        to: token,
        sound: 'default',
        title: '🎫 チケット購入完了',
        body: `${ticketType} × ${quantity}枚の購入が完了しました`,
        data: {
          type: 'ticket_confirmation',
          ticketType,
          quantity,
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending ticket confirmation:', error);
      return false;
    }
  },

  async sendFestivalReminder(token: string): Promise<boolean> {
    try {
      const message = {
        to: token,
        sound: 'default',
        title: '🎵 Moment Festival 開催間近！',
        body: '明日はいよいよフェスティバル当日です。忘れ物はありませんか？',
        data: {
          type: 'festival_reminder',
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending festival reminder:', error);
      return false;
    }
  },
};