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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

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
const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'https://your-strapi';
const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const FESTIVALS_ENDPOINT = `${STRAPI_URL}/api/festivals`;

export default function FestivalScreen() {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFestivalData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log(`Fetching from: ${FESTIVALS_ENDPOINT}`);
      
      // First try Strapi CMS
      let response;
      try {
        response = await axios.get(FESTIVALS_ENDPOINT, {
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('✅ Successfully fetched from Strapi CMS');
      } catch (strapiError) {
        console.log('⚠️ Strapi not available, falling back to local backend');
        // Fallback to local backend
        response = await axios.get(`${EXPO_BACKEND_URL}/api/festivals`, {
          timeout: 5000
        });
        console.log('✅ Successfully fetched from local backend');
      }

      if (response.data) {
        // Handle Strapi response format (usually has a 'data' wrapper)
        const festivals = response.data.data || response.data;
        const festivalData = Array.isArray(festivals) ? festivals[0] : festivals;
        
        if (festivalData) {
          // Transform Strapi data structure if needed
          const transformedFestival = {
            ...festivalData,
            // Handle Strapi attributes structure
            ...(festivalData.attributes || {}),
            id: festivalData.id || festivalData.documentId || festivalData.id
          };
          
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

  const handleTicketPress = (ticketType: string, price: number) => {
    Alert.alert(
      'チケット予約',
      `${ticketType}チケット (¥${price.toLocaleString()}) を予約しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '予約する', onPress: () => navigateToTicketForm(ticketType) }
      ]
    );
  };

  const navigateToTicketForm = (ticketType: string) => {
    Alert.alert('実装予定', 'チケット予約フォームは次のバージョンで実装されます');
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
              <TouchableOpacity style={styles.primaryCTA}>
                <Text style={styles.ctaText}>チケットを予約する</Text>
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
    </SafeAreaView>
  );
}

  const handleTicketPress = (ticketType: string, price: number) => {
    Alert.alert(
      'チケット予約',
      `${ticketType}チケット (¥${price.toLocaleString()}) を予約しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '予約する', onPress: () => navigateToTicketForm(ticketType) }
      ]
    );
  };

  const navigateToTicketForm = (ticketType: string) => {
    Alert.alert('実装予定', 'チケット予約フォームは次のバージョンで実装されます');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>フェスティバル情報を読み込み中...</Text>
      </View>
    );
  }

  if (!festival) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>フェスティバル情報が見つかりません</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFestivalData}>
          <Text style={styles.retryText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.venueName}>{festival.venue_info.name}</Text>
            <Text style={styles.venueAddress}>{festival.venue_info.address}</Text>
            <Text style={styles.venueAccess}>{festival.venue_info.access}</Text>
            
            <View style={styles.featureList}>
              {festival.venue_info.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Sound System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 音響システム</Text>
          <View style={styles.glassCard}>
            <Text style={styles.soundSystemTitle}>{festival.sound_system.primary}</Text>
            <Text style={styles.soundSystemSecondary}>{festival.sound_system.secondary}</Text>
            <Text style={styles.soundSystemDescription}>{festival.sound_system.description}</Text>
          </View>
        </View>

        {/* Family Services */}
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

        {/* Ticket Information */}
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

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryCTA}>
            <Text style={styles.ctaText}>チケットを予約する</Text>
            <Ionicons name="ticket" size={24} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryCTA}>
            <Text style={styles.secondaryCtaText}>詳細情報を見る</Text>
            <Ionicons name="information-circle-outline" size={24} color="#fff" />
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
});