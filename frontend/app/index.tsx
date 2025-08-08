import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useToast } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';
import { PhilosophyCardSkeleton } from './components/SkeletonLoader';

const { width, height } = Dimensions.get('window');

interface PhilosophyCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const philosophyCards: PhilosophyCard[] = [
  {
    id: 'meditation',
    icon: '🧘',
    title: '瞑想的体験',
    description: '音楽を通じて深い集中状態へと導き、内なる平静を見つける',
    color: 'rgba(96, 165, 250, 0.3)',
  },
  {
    id: 'awareness',
    icon: '👁️',
    title: '瞬間の認識',
    description: '今この瞬間の価値を意識し、時間の流れに敏感になる',
    color: 'rgba(52, 211, 153, 0.3)',
  },
  {
    id: 'permanence',
    icon: '♾️',
    title: '永続的価値',
    description: '一瞬の体験をNFTとして記録し、未来へと継承する',
    color: 'rgba(167, 139, 250, 0.3)',
  },
];

const SoundWave = () => {
  return (
    <View style={styles.soundWave}>
      {[15, 25, 20, 35, 28, 18, 30].map((height, index) => (
        <View
          key={index}
          style={[
            styles.wave,
            { height },
          ]}
        />
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const { showToast } = useToast();
  const { isLoading, debouncedAction } = useLoading();
  const router = useRouter();

  // Simulate loading cards on mount
  useEffect(() => {
    const loadCards = setTimeout(() => {
      setIsLoadingCards(false);
    }, 2000);

    return () => clearTimeout(loadCards);
  }, []);

  // Debounced card press handler
  const handleCardPress = debouncedAction(
    'philosophy-card',
    async (cardId: string, title: string) => {
      showToast('info', `${title}の詳細画面に移動中...`);
      
      // Simulate navigation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (cardId === 'meditation') {
        // Navigate to meditation experience
        router.push('/experience/index' as any);
      } else {
        showToast('info', `${title}の詳細は次のバージョンで実装されます`);
      }
    },
    {
      loadingMessage: '読み込み中...',
      delay: 300,
    }
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>DJ SENOH</Text>
          <Text style={styles.heroSubtitle}>MOMENT MUSIC EXPERIENCE</Text>
          
          <SoundWave />
          
          <Text style={styles.heroDescription}>
            自然と電子音楽が織りなす至福の瞬間{'\n'}
            <Text style={styles.grayText}>『今、この瞬間』へピントを合わせる</Text>
          </Text>
        </View>

        {/* Philosophy Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>哲学 PHILOSOPHY</Text>
          
          <View style={styles.cardGrid}>
            {isLoadingCards ? (
              // Show skeleton loaders
              <>
                <PhilosophyCardSkeleton />
                <PhilosophyCardSkeleton />
                <PhilosophyCardSkeleton />
              </>
            ) : (
              // Show actual cards
              philosophyCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.glassCard,
                    { borderColor: card.color },
                    isLoading('philosophy-card') && styles.cardDisabled
                  ]}
                  onPress={() => handleCardPress(card.id, card.title)}
                  disabled={isLoading('philosophy-card')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>
                    {card.description}
                  </Text>
                  
                  {isLoading('philosophy-card') && (
                    <View style={styles.cardLoadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Navigation Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ナビゲーション</Text>
          
          <View style={styles.navInfo}>
            <Text style={styles.navText}>
              下部のタブから各セクションをご覧いただけます：
            </Text>
            
            <View style={styles.navList}>
              <View style={styles.navItem}>
                <Ionicons name="musical-notes" size={20} color="#fff" />
                <Text style={styles.navItemText}>フェス - Moment Festival 2025の詳細情報</Text>
              </View>
              
              <View style={styles.navItem}>
                <Ionicons name="person" size={20} color="#fff" />
                <Text style={styles.navItemText}>プロフィール - DJ Senohの経歴と哲学</Text>
              </View>
              
              <View style={styles.navItem}>
                <Ionicons name="diamond" size={20} color="#fff" />
                <Text style={styles.navItemText}>NFT - ミュージックモーメント・ギャラリー</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quote Section */}
        <View style={styles.quoteSection}>
          <Text style={styles.quote}>
            「情報洪水に抗うMomentの哲学。視覚的ノイズを抑制したモノクロームの美学は、
            本質的な音の体験へと導きます。」
          </Text>
          <Text style={styles.quoteAuthor}>- DJ Senoh</Text>
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
  hero: {
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: Math.min(width * 0.15, 60),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: Math.min(width * 0.06, 24),
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
  },
  heroDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  grayText: {
    color: '#666',
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: 40,
    height: 40,
  },
  wave: {
    width: 4,
    backgroundColor: '#fff',
    marginHorizontal: 3,
    borderRadius: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  cardGrid: {
    gap: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBlue: {
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  cardGreen: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  cardPurple: {
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  navInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  navList: {
    gap: 15,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItemText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  quoteSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  quote: {
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
    paddingLeft: 15,
    textAlign: 'left',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontWeight: '600',
  },
});