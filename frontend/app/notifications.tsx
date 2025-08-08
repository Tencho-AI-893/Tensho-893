import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService, FestivalNotifications } from './services/NotificationService';
import * as Device from 'expo-device';

export default function NotificationsScreen() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    initializeNotifications();
    setupNotificationListeners();
  }, []);

  const initializeNotifications = async () => {
    try {
      setInitLoading(true);
      const result = await NotificationService.initializeNotifications();
      
      if (result.success && result.token) {
        setPushToken(result.token);
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
        Alert.alert('通知設定', result.message);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setPermissionStatus('error');
    } finally {
      setInitLoading(false);
    }
  };

  const setupNotificationListeners = () => {
    return NotificationService.setupNotificationListeners();
  };

  const sendTestPush = async () => {
    if (!pushToken) {
      Alert.alert('エラー', 'プッシュトークンが取得できていません');
      return;
    }

    try {
      setLoading(true);
      const success = await NotificationService.sendTestPushNotification(pushToken);
      
      if (success) {
        Alert.alert('送信完了', 'テスト通知を送信しました！');
      } else {
        Alert.alert('送信失敗', '通知の送信に失敗しました');
      }
    } catch (error) {
      console.error('Error sending test push:', error);
      Alert.alert('エラー', '送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const sendLocalNotification = async () => {
    try {
      await NotificationService.sendLocalNotification(
        '🎵 ローカル通知テスト',
        'これはローカル通知のテストです'
      );
      Alert.alert('送信完了', 'ローカル通知を送信しました！');
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const sendTicketConfirmation = async () => {
    if (!pushToken) {
      Alert.alert('エラー', 'プッシュトークンが取得できていません');
      return;
    }

    try {
      setLoading(true);
      const success = await FestivalNotifications.sendTicketPurchaseConfirmation(
        pushToken,
        'VIPチケット',
        2
      );
      
      if (success) {
        Alert.alert('送信完了', 'チケット購入確認通知を送信しました！');
      } else {
        Alert.alert('送信失敗', '通知の送信に失敗しました');
      }
    } catch (error) {
      console.error('Error sending ticket confirmation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFestivalReminder = async () => {
    if (!pushToken) {
      Alert.alert('エラー', 'プッシュトークンが取得できていません');
      return;
    }

    try {
      setLoading(true);
      const success = await FestivalNotifications.sendFestivalReminder(pushToken);
      
      if (success) {
        Alert.alert('送信完了', 'フェスティバルリマインダーを送信しました！');
      } else {
        Alert.alert('送信失敗', '通知の送信に失敗しました');
      }
    } catch (error) {
      console.error('Error sending festival reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearToken = async () => {
    Alert.alert(
      'トークンクリア',
      'プッシュトークンをクリアしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.clearStoredToken();
            setPushToken(null);
            setPermissionStatus('unknown');
            Alert.alert('完了', 'プッシュトークンをクリアしました');
          },
        },
      ]
    );
  };

  const copyTokenToClipboard = () => {
    if (pushToken) {
      // In a real app, you would use @react-native-clipboard/clipboard
      Alert.alert(
        'プッシュトークン',
        pushToken,
        [{ text: 'OK' }]
      );
    }
  };

  if (initLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>通知を初期化中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔔 通知テスト</Text>
          <Text style={styles.headerSubtitle}>プッシュ通知のテスト機能</Text>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 デバイス情報</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>デバイス:</Text>
              <Text style={styles.infoValue}>
                {Device.isDevice ? '実機' : 'シミュレータ'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>プラットフォーム:</Text>
              <Text style={styles.infoValue}>{Platform.OS}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>通知許可:</Text>
              <Text style={[
                styles.infoValue,
                { color: permissionStatus === 'granted' ? '#4ade80' : '#f87171' }
              ]}>
                {permissionStatus === 'granted' ? '許可済み' : '未許可'}
              </Text>
            </View>
          </View>
        </View>

        {/* Push Token */}
        {pushToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 プッシュトークン</Text>
            <TouchableOpacity style={styles.tokenCard} onPress={copyTokenToClipboard}>
              <Text style={styles.tokenText} numberOfLines={3}>
                {pushToken}
              </Text>
              <Ionicons name="copy" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.tokenHint}>タップしてトークンを表示</Text>
          </View>
        )}

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 通知テスト</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.primaryButton]}
            onPress={sendLocalNotification}
            disabled={loading}
          >
            <Ionicons name="phone-portrait" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>ローカル通知テスト</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.secondaryButton]}
            onPress={sendTestPush}
            disabled={loading || !pushToken}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud" size={20} color="#fff" />
            )}
            <Text style={styles.secondaryButtonText}>プッシュ通知テスト</Text>
          </TouchableOpacity>
        </View>

        {/* Festival Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 フェスティバル通知</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.festivalButton]}
            onPress={sendTicketConfirmation}
            disabled={loading || !pushToken}
          >
            <Ionicons name="ticket" size={20} color="#000" />
            <Text style={styles.festivalButtonText}>チケット購入確認</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.reminderButton]}
            onPress={sendFestivalReminder}
            disabled={loading || !pushToken}
          >
            <Ionicons name="calendar" size={20} color="#000" />
            <Text style={styles.reminderButtonText}>フェスリマインダー</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 テスト手順</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionStep}>1. 実機での動作確認が推奨されます</Text>
            <Text style={styles.instructionStep}>2. 通知許可を確認してください</Text>
            <Text style={styles.instructionStep}>3. ローカル通知は即座に표示されます</Text>
            <Text style={styles.instructionStep}>4. プッシュ通知は数秒後に到着します</Text>
            <Text style={styles.instructionStep}>5. バックグラウンドでも受信できます</Text>
          </View>
        </View>

        {/* Debug Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 デバッグ</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.dangerButton]}
            onPress={clearToken}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.dangerButtonText}>トークンをクリア</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.debugButton]}
            onPress={initializeNotifications}
            disabled={initLoading}
          >
            {initLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="settings" size={20} color="#000" />
            )}
            <Text style={styles.debugButtonText}>通知を再初期化</Text>
          </TouchableOpacity>
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
    backgroundColor: '#000',
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
    paddingVertical: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  tokenCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'monospace',
  },
  tokenHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#fff',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  festivalButton: {
    backgroundColor: '#4ade80',
  },
  festivalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reminderButton: {
    backgroundColor: '#60a5fa',
  },
  reminderButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: '#f87171',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  debugButton: {
    backgroundColor: '#fbbf24',
  },
  debugButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionStep: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
});