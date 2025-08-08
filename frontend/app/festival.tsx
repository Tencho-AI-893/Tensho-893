import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { useToast } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';
import { CardSkeleton } from './components/SkeletonLoader';

interface Festival {
  id: string;
  name: string;
  year: number;
  location: string;
  date: string;
  description: string;
  venue_info: {
    name: string;
    address: string;
    features: string[];
    access: string;
  };
  sound_system: {
    primary: string;
    secondary: string;
    description: string;
  };
  family_services: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
  ticket_info: {
    early_bird: { price: number; description: string };
    regular: { price: number; description: string };
    vip: { price: number; description: string };
    family: { price: number; description: string };
  };
}

// Use Strapi CMS endpoint or fallback to local backend
const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'https://api.momentmusic.jp';
const STRAPI_TOKEN = process.env.EXPO_PUBLIC_STRAPI_TOKEN;
const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const FESTIVALS_ENDPOINT = `${STRAPI_URL}/api/festivals`;

// Stripe Test Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51234567890abcdef'; // Test key placeholder
const STRIPE_SUCCESS_URL = 'https://moment.success';
const STRIPE_CANCEL_URL = 'https://moment.cancel';

const { width } = Dimensions.get('window');

export default function FestivalScreen() {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Toast and loading context
  const { showToast } = useToast();
  const { isLoading, debouncedAction } = useLoading();
  
  // Ticket Purchase Modal States
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<'general' | 'vip'>('general');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const ticketTypes = {
    general: { name: '一般チケット', price: 3000, description: 'スタンダード入場券' },
    vip: { name: 'VIPチケット', price: 8000, description: 'VIP特典付き入場券' }
  };

  const fetchFestivalData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log(`Fetching from: ${FESTIVALS_ENDPOINT}`);
      
      // First try Strapi CMS
      let response;
      try {
        const headers: any = {
          'Content-Type': 'application/json',
        };
        
        // Add API Token if available
        if (STRAPI_TOKEN && STRAPI_TOKEN.trim() !== '') {
          headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
        }

        response = await axios.get(`${FESTIVALS_ENDPOINT}?populate=*`, {
          timeout: 8000,
          headers
        });
        console.log('✅ Successfully fetched from Strapi CMS');
        console.log('Strapi Response:', response.data);
      } catch (strapiError) {
        console.log('⚠️ Strapi not available, falling back to local backend');
        console.error('Strapi Error:', strapiError);
        // Fallback to local backend
        response = await axios.get(`${EXPO_BACKEND_URL}/api/festivals`, {
          timeout: 5000
        });
        console.log('✅ Successfully fetched from local backend');
      }

      if (response.data) {
        // Handle Strapi response format
        const festivals = response.data.data || response.data;
        const festivalData = Array.isArray(festivals) ? festivals[0] : festivals;
        
        if (festivalData) {
          // Transform Strapi data structure
          let transformedFestival;
          
          if (festivalData.attributes) {
            // Strapi v4 format
            const attrs = festivalData.attributes;
            transformedFestival = {
              id: festivalData.id,
              name: attrs.title || attrs.name || 'Moment Festival',
              year: new Date(attrs.date || attrs.createdAt).getFullYear() || 2025,
              location: attrs.location || '奈良県天川村 フォレスト・イン洞川',
              date: attrs.date || '2025年7月26日-27日',
              description: attrs.description || '自然と電子音楽が織りなす至福の瞬間',
              venue_info: attrs.venue_info || {
                name: 'フォレスト・イン洞川',
                address: '奈良県天川村',
                features: ['神聖な自然環境', '温泉街', 'キャンプ場', '清流'],
                access: '関西からアクセス良好な秘境の地'
              },
              sound_system: attrs.sound_system || {
                primary: 'Alcons Audio',
                secondary: 'Function One',
                description: 'プロ仕様ラインアレイスピーカーによる圧倒的な音質体験'
              },
              family_services: attrs.family_services || [
                { name: 'キッズエリア', description: '安全に配慮した専用エリア', icon: '👶' },
                { name: 'こどもごはん', description: '栄養バランスを考慮したメニュー', icon: '🍱' },
                { name: '保育士常駐', description: '資格を持つスタッフが常駐', icon: '👩‍⚕️' },
                { name: 'ワークショップ', description: '多彩なアクティビティ', icon: '🎨' }
              ],
              ticket_info: attrs.ticket_info || {
                early_bird: { price: 15000, description: '早割チケット' },
                regular: { price: 18000, description: '一般チケット' },
                vip: { price: 35000, description: 'VIP体験チケット' },
                family: { price: 40000, description: 'ファミリーパック(大人2名+子供2名)' }
              }
            };
          } else {
            // Local backend format or other format
            transformedFestival = {
              ...festivalData,
              id: festivalData.id || festivalData.documentId || String(Date.now())
            };
          }
          
          setFestival(transformedFestival);
        }
      }
    } catch (error) {
      console.error('Error fetching festival data:', error);
      Alert.alert(
        'データ取得エラー', 
        'フェスティバル情報の取得に失敗しました。ネットワーク接続を確認してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '再試行', onPress: () => fetchFestivalData() }
        ]
      );
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFestivalData(true);
  }, []);

  useEffect(() => {
    fetchFestivalData();
  }, []);

  const handleTicketPress = debouncedAction(
    'ticket-press',
    async (ticketType: string, price: number) => {
      showToast('info', `${ticketType}チケットの詳細を表示中...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert(
        'チケット予約',
        `${ticketType}チケット (¥${price.toLocaleString()}) を予約しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '予約する', onPress: () => navigateToTicketForm(ticketType) }
        ]
      );
    },
    {
      loadingMessage: 'チケット情報を読み込み中...',
      delay: 300,
    }
  );

  const navigateToTicketForm = debouncedAction(
    'ticket-form',
    async (ticketType: string) => {
      showToast('info', 'チケット予約フォームは次のバージョンで実装されます');
    },
    {
      delay: 300,
    }
  );

  // Ticket Purchase Functions
  const openTicketModal = () => {
    setTicketModalVisible(true);
  };

  const closeTicketModal = () => {
    setTicketModalVisible(false);
    setSelectedTicketType('general');
    setTicketQuantity(1);
  };

  const adjustQuantity = (change: number) => {
    const newQuantity = ticketQuantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setTicketQuantity(newQuantity);
    }
  };

  const calculateTotal = () => {
    return ticketTypes[selectedTicketType].price * ticketQuantity;
  };

  const handleStripeCheckout = async () => {
    try {
      setPurchaseLoading(true);
      
      const selectedTicket = ticketTypes[selectedTicketType];
      const totalAmount = calculateTotal();
      
      // Create mock Stripe Checkout URL (in real app, this would be from your backend)
      const checkoutData = {
        line_items: [{
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${selectedTicket.name} - Moment Festival 2025`,
              description: selectedTicket.description,
            },
            unit_amount: selectedTicket.price,
          },
          quantity: ticketQuantity,
        }],
        mode: 'payment',
        success_url: `${STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&type=${selectedTicketType}&qty=${ticketQuantity}`,
        cancel_url: STRIPE_CANCEL_URL,
      };
      
      // Simulate Stripe Checkout success after a delay
      console.log('Opening Stripe Checkout with:', checkoutData);
      
      // For demo purposes, we'll simulate the checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful checkout
      await handlePurchaseSuccess();
      
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      Alert.alert('エラー', 'チケット購入処理でエラーが発生しました。もう一度お試しください。');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handlePurchaseSuccess = async () => {
    try {
      closeTicketModal();
      
      // Show success alert
      Alert.alert(
        '購入完了🎫', 
        `${ticketTypes[selectedTicketType].name} × ${ticketQuantity}枚\n合計：¥${calculateTotal().toLocaleString()}\n\nありがとうございました！\nチケットの詳細はメールでお送りします。`,
        [{ 
          text: 'OK',
          onPress: () => {
            console.log('Purchase completed successfully');
          }
        }]
      );
      
      // Optional: Push order to backend
      try {
        const orderData = {
          festival_id: festival?.id || 'moment-festival-2025',
          name: 'Guest User',
          email: 'guest@moment.example',
          phone: '090-0000-0000',
          ticket_type: selectedTicketType,
          quantity: ticketQuantity,
        };
        
        await axios.post(`${EXPO_BACKEND_URL}/api/ticket-reservation`, orderData);
        console.log('✅ Order saved to backend:', orderData);
      } catch (backendError) {
        console.warn('⚠️ Failed to save order to backend:', backendError);
        // Don't show error to user since payment was successful
      }
      
    } catch (error) {
      console.error('Purchase success handling error:', error);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>フェスティバル情報を読み込み中...</Text>
        <Text style={styles.loadingSubtext}>Strapi CMS から取得中</Text>
      </View>
    );
  }

  if (!festival && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>フェスティバル情報が見つかりません</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchFestivalData()}>
          <Text style={styles.retryText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            titleColor="#fff"
            title="更新中..."
            colors={['#fff']}
            progressBackgroundColor="#333"
          />
        }
      >
        {/* Data Source Indicator */}
        <View style={styles.sourceIndicator}>
          <Ionicons name="cloud-done" size={12} color="#4ade80" />
          <Text style={styles.sourceText}>Strapi CMS 連携</Text>
          <Text style={styles.pullRefreshHint}>下に引っ張って更新</Text>
        </View>

        {festival && (
          <>
            {/* Festival Header */}
            <View style={styles.header}>
              <Text style={styles.festivalName}>{festival.name} {festival.year}</Text>
              <Text style={styles.festivalDate}>{festival.date}</Text>
              <Text style={styles.festivalLocation}>
                <Ionicons name="location" size={16} color="#fff" /> {festival.location}
              </Text>
              <Text style={styles.festivalDescription}>{festival.description}</Text>
            </View>

            {/* Venue Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏔️ 会場情報</Text>
              <View style={styles.glassCard}>
                <Text style={styles.venueName}>{festival.venue_info?.name}</Text>
                <Text style={styles.venueAddress}>{festival.venue_info?.address}</Text>
                <Text style={styles.venueAccess}>{festival.venue_info?.access}</Text>
                
                {festival.venue_info?.features && (
                  <View style={styles.featureList}>
                    {festival.venue_info.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Sound System */}
            {festival.sound_system && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔊 音響システム</Text>
                <View style={styles.glassCard}>
                  <Text style={styles.soundSystemTitle}>{festival.sound_system.primary}</Text>
                  <Text style={styles.soundSystemSecondary}>{festival.sound_system.secondary}</Text>
                  <Text style={styles.soundSystemDescription}>{festival.sound_system.description}</Text>
                </View>
              </View>
            )}

            {/* Family Services */}
            {festival.family_services && festival.family_services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 ファミリーサービス</Text>
                <View style={styles.servicesGrid}>
                  {festival.family_services.map((service, index) => (
                    <View key={index} style={styles.serviceCard}>
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ticket Information */}
            {festival.ticket_info && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎫 チケット情報</Text>
                {Object.entries(festival.ticket_info).map(([key, ticket]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.ticketCard}
                    onPress={() => handleTicketPress(ticket.description, ticket.price)}
                  >
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketType}>{ticket.description}</Text>
                      <Text style={styles.ticketPrice}>¥{ticket.price.toLocaleString()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* CTA Section */}
            <View style={styles.ctaSection}>
              <TouchableOpacity 
                style={styles.primaryCTA}
                onPress={openTicketModal}
              >
                <Text style={styles.ctaText}>チケット購入</Text>
                <Ionicons name="ticket" size={24} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryCTA}>
                <Text style={styles.secondaryCtaText}>詳細情報を見る</Text>
                <Ionicons name="information-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Ticket Purchase Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ticketModalVisible}
        onRequestClose={closeTicketModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>チケット購入</Text>
              <TouchableOpacity onPress={closeTicketModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Ticket Type Selection */}
            <View style={styles.ticketSection}>
              <Text style={styles.sectionLabel}>チケット種別</Text>
              
              <TouchableOpacity
                style={[
                  styles.ticketOption,
                  selectedTicketType === 'general' && styles.ticketOptionSelected
                ]}
                onPress={() => setSelectedTicketType('general')}
              >
                <View style={styles.ticketOptionContent}>
                  <Text style={styles.ticketOptionName}>一般チケット</Text>
                  <Text style={styles.ticketOptionDescription}>スタンダード入場券</Text>
                </View>
                <Text style={styles.ticketOptionPrice}>¥3,000</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ticketOption,
                  selectedTicketType === 'vip' && styles.ticketOptionSelected
                ]}
                onPress={() => setSelectedTicketType('vip')}
              >
                <View style={styles.ticketOptionContent}>
                  <Text style={styles.ticketOptionName}>VIPチケット</Text>
                  <Text style={styles.ticketOptionDescription}>VIP特典付き入場券</Text>
                </View>
                <Text style={styles.ticketOptionPrice}>¥8,000</Text>
              </TouchableOpacity>
            </View>

            {/* Quantity Selection */}
            <View style={styles.ticketSection}>
              <Text style={styles.sectionLabel}>枚数</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(-1)}
                  disabled={ticketQuantity <= 1}
                >
                  <Ionicons name="remove" size={20} color={ticketQuantity <= 1 ? '#666' : '#fff'} />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{ticketQuantity}</Text>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(1)}
                  disabled={ticketQuantity >= 10}
                >
                  <Ionicons name="add" size={20} color={ticketQuantity >= 10 ? '#666' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {ticketTypes[selectedTicketType].name} × {ticketQuantity}
                </Text>
                <Text style={styles.totalAmount}>¥{calculateTotal().toLocaleString()}</Text>
              </View>
            </View>

            {/* Purchase Button */}
            <TouchableOpacity
              style={[styles.purchaseButton, purchaseLoading && styles.purchaseButtonDisabled]}
              onPress={handleStripeCheckout}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.purchaseButtonText}>購入へ進む</Text>
                  <Ionicons name="card" size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.paymentNote}>
              Stripe Checkout で安全にお支払いいただけます
            </Text>
          </View>
        </View>
      </Modal>
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
  loadingSubtext: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  sourceText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  pullRefreshHint: {
    color: '#666',
    fontSize: 10,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  festivalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  festivalDate: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 5,
  },
  festivalLocation: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  festivalDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  venueAddress: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  venueAccess: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#ccc',
  },
  soundSystemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60a5fa',
    marginBottom: 5,
  },
  soundSystemSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34d399',
    marginBottom: 10,
  },
  soundSystemDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  serviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 15,
  },
  primaryCTA: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  secondaryCTA: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
  },
  secondaryCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  ticketOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketOptionSelected: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  ticketOptionContent: {
    flex: 1,
  },
  ticketOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ticketOptionDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  ticketOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 30,
  },
  totalSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  purchaseButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 15,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#666',
  },
  purchaseButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});