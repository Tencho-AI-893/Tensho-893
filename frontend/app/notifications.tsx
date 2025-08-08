import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

export default function NotificationsScreen() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const { showToast } = useToast();
  const { debouncedAction } = useLoading();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initializeNotifications();

    // Notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
        showToast('success', 'プッシュ通知を受信しました！');
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('🔔 Notification tapped:', response);
        showToast('info', '通知をタップしました');
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);

      // Get and store project ID
      const detectedProjectId = Constants.expoConfig?.extra?.eas?.projectId || 
        (Constants as any)?.easConfig?.projectId;
      
      setProjectId(detectedProjectId);
      
      if (detectedProjectId) {
        console.log('📱 EAS Project ID detected:', detectedProjectId);
        showToast('success', `EAS プロジェクトに接続しました`);
      } else {
        console.log('⚠️ No EAS Project ID found');
        showToast('info', 'EAS プロジェクト ID が見つかりません');
      }

      // Check if device supports push notifications
      if (!Device.isDevice) {
        setPermissionStatus('simulator');
        showToast('info', 'シミュレータではプッシュ通知は利用できません');
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      setPermissionStatus(existingStatus);
      
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(status);
      }

      if (finalStatus !== 'granted') {
        showToast('error', 'プッシュ通知の許可が必要です');
        return;
      }

      // Get Expo push token
      const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (storedToken) {
        setExpoPushToken(storedToken);
        showToast('success', 'プッシュトークンを復元しました');
      } else if (detectedProjectId) {
        await generatePushToken();
      } else {
        showToast('error', 'プッシュトークン生成にはEAS プロジェクトIDが必要です');
      }
    } catch (error) {
      console.error('Notification initialization error:', error);
      showToast('error', '通知の初期化でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePushToken = async () => {
    try {
      const detectedProjectId = Constants.expoConfig?.extra?.eas?.projectId || 
        (Constants as any)?.easConfig?.projectId;
      
      if (!detectedProjectId) {
        throw new Error('EAS Project ID not found in configuration');
      }

      console.log('📱 Generating push token with project ID:', detectedProjectId);

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: detectedProjectId,
      });
      
      const token = tokenData.data;
      setExpoPushToken(token);
      
      // Store token for future use
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
      
      showToast('success', 'プッシュトークンを生成しました');
      console.log('📱 Expo Push Token generated:', token);
      
      return token;
    } catch (error) {
      console.error('Error generating push token:', error);
      showToast('error', `プッシュトークンの生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleRequestPermissions = debouncedAction(
    'request-permissions',
    async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        await generatePushToken();
      }
    },
    {
      loadingMessage: '通知許可をリクエスト中...',
      successMessage: '通知許可が取得されました！',
      errorMessage: '通知許可の取得に失敗しました',
      delay: 500,
    }
  );

  const sendLocalNotification = debouncedAction(
    'local-notification',
    async () => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "DJ Senoh - Moment Music 🎵",
          body: "ローカル通知のテストです。瞑想的な音楽体験をお楽しみください。",
          data: { screen: 'notifications', type: 'local_test' },
          sound: true,
        },
        trigger: { seconds: 1 },
      });
    },
    {
      loadingMessage: 'ローカル通知を送信中...',
      successMessage: 'ローカル通知を送信しました！',
      errorMessage: 'ローカル通知の送信に失敗しました',
      delay: 300,
    }
  );

  const sendExpoPushNotification = debouncedAction(
    'expo-push',
    async () => {
      if (!expoPushToken) {
        throw new Error('プッシュトークンがありません');
      }

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'DJ Senoh - Moment Music 🎶',
        body: 'Expo Push通知のテストです。音楽と自然の調和を体験してください。',
        data: { screen: 'notifications', type: 'expo_push' },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('📤 Push notification result:', result);

      if (result.data?.[0]?.status === 'error') {
        throw new Error(result.data[0].message || 'プッシュ送信でエラーが発生しました');
      }
    },
    {
      loadingMessage: 'Expo Push通知を送信中...',
      successMessage: 'Push通知を送信しました！数秒でお届けします。',
      errorMessage: 'Push通知の送信に失敗しました',
      delay: 500,
    }
  );

  const copyTokenToClipboard = debouncedAction(
    'copy-token',
    async (type: string, value: string) => {
      if (value) {
        await Clipboard.setStringAsync(value);
      }
    },
    {
      successMessage: 'クリップボードにコピーしました',
      delay: 200,
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return '#4ade80';
      case 'denied': return '#ef4444';
      case 'simulator': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted': return '許可済み';
      case 'denied': return '拒否';
      case 'simulator': return 'シミュレータ';
      case 'undetermined': return '未確認';
      default: return '不明';
    }
  };

  const isWebOrNoToken = Platform.OS === 'web' || !expoPushToken;
  const canSendPush = permissionStatus === 'granted' && expoPushToken && !isWebOrNoToken;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>通知システムを初期化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>プッシュ通知テスト</Text>
          <Text style={styles.subtitle}>
            Expo Push Notifications の動作確認
          </Text>
        </View>

        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 許可状態</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>EAS Project ID:</Text>
              <Text style={[styles.statusValue, !projectId && styles.missingValue]}>
                {projectId || '未設定'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>通知許可:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(permissionStatus) }]}>
                <Text style={styles.statusText}>{getStatusText(permissionStatus)}</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>プラットフォーム:</Text>
              <Text style={styles.statusValue}>{Platform.OS}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>デバイス:</Text>
              <Text style={styles.statusValue}>
                {Device.isDevice ? '実機' : 'シミュレータ'}
              </Text>
            </View>
          </View>

          {permissionStatus !== 'granted' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
            >
              <Ionicons name="notifications" size={20} color="#000" />
              <Text style={styles.permissionButtonText}>通知許可をリクエスト</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* EAS Project Info */}
        {projectId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 EAS プロジェクト情報</Text>
            <View style={styles.tokenCard}>
              <Text style={styles.tokenLabel}>Project ID:</Text>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenText} numberOfLines={2}>
                  {projectId}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyTokenToClipboard('project-id', projectId)}
                >
                  <Ionicons name="copy" size={16} color="#60a5fa" />
                </TouchableOpacity>
              </View>
              <Text style={styles.projectNote}>
                このプロジェクトIDでEAS Build および Push Notifications が利用可能です。
              </Text>
            </View>
          </View>
        )}

        {/* Push Token */}
        {expoPushToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 プッシュトークン</Text>
            <View style={styles.tokenCard}>
              <Text style={styles.tokenLabel}>Expo Push Token:</Text>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenText} numberOfLines={3}>
                  {expoPushToken}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyTokenToClipboard('push-token', expoPushToken)}
                >
                  <Ionicons name="copy" size={16} color="#60a5fa" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tokenNote}>
                このトークンでデバイスに直接プッシュ通知を送信できます。
              </Text>
            </View>
          </View>
        )}

        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 テストアクション</Text>
          
          {/* Local Notification */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={sendLocalNotification}
          >
            <View style={styles.testButtonContent}>
              <Ionicons name="phone-portrait" size={24} color="#4ade80" />
              <View style={styles.testButtonText}>
                <Text style={styles.testButtonTitle}>ローカル通知テスト</Text>
                <Text style={styles.testButtonDescription}>
                  デバイス内で通知を生成（Web対応）
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Expo Push Notification */}
          <TouchableOpacity
            style={[
              styles.testButton,
              !canSendPush && styles.testButtonDisabled
            ]}
            onPress={canSendPush ? sendExpoPushNotification : undefined}
            disabled={!canSendPush}
          >
            <View style={styles.testButtonContent}>
              <Ionicons 
                name="cloud" 
                size={24} 
                color={canSendPush ? "#60a5fa" : "#666"} 
              />
              <View style={styles.testButtonText}>
                <Text style={[
                  styles.testButtonTitle,
                  !canSendPush && styles.disabledText
                ]}>
                  Expo Push通知テスト
                </Text>
                <Text style={[
                  styles.testButtonDescription,
                  !canSendPush && styles.disabledText
                ]}>
                  {isWebOrNoToken 
                    ? 'iOS/Android実機でのみ利用可能' 
                    : 'Expo Push サービス経由で送信'
                  }
                </Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={canSendPush ? "#fff" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        {/* Setup Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 デバイステスト手順</Text>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>実機テスト（推奨）:</Text>
            <Text style={styles.guideStep}>
              1. Expo Go アプリをインストール
            </Text>
            <Text style={styles.guideStep}>
              2. QRコードでアプリを起動
            </Text>
            <Text style={styles.guideStep}>
              3. 通知許可をタップして「許可」
            </Text>
            <Text style={styles.guideStep}>
              4. プッシュトークンが生成されることを確認
            </Text>
            <Text style={styles.guideStep}>
              5. 両方のテストボタンを試す
            </Text>
            
            <Text style={styles.guideTitle}>Web/シミュレータ:</Text>
            <Text style={styles.guideStep}>
              • ローカル通知のみ利用可能
            </Text>
            <Text style={styles.guideStep}>
              • Push通知ボタンは無効化される
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  missingValue: {
    color: '#ef4444',
    fontStyle: 'italic',
  },
  permissionButton: {
    backgroundColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    gap: 8,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  tokenLabel: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenText: {
    flex: 1,
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  copyButton: {
    padding: 8,
    marginLeft: 10,
  },
  projectNote: {
    fontSize: 12,
    color: '#60a5fa',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tokenNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  testButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButtonText: {
    marginLeft: 15,
    flex: 1,
  },
  testButtonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testButtonDescription: {
    color: '#999',
    fontSize: 14,
  },
  disabledText: {
    color: '#666',
  },
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  guideTitle: {
    color: '#ffc107',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  guideStep: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});