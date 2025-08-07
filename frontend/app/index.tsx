import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const SoundWave = () => {
  return (
    <View style={styles.soundWave}>
      {[15, 25, 20, 35, 28, 18, 30].map((height, index) => (
        <View
          key={index}
          style={[
            styles.wave,
            { height },
            { animationDelay: `${index * 0.1}s` }
          ]}
        />
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();

  const navigateToFestival = () => {
    router.push('/festival');
  };

  const navigateToNFT = () => {
    router.push('/nft');
  };

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
            <View style={[styles.glassCard, styles.cardBlue]}>
              <Text style={styles.cardIcon}>🧘</Text>
              <Text style={styles.cardTitle}>瞑想的体験</Text>
              <Text style={styles.cardDescription}>
                音楽を通じて深い集中状態へと導き、内なる平静を見つける
              </Text>
            </View>
            
            <View style={[styles.glassCard, styles.cardGreen]}>
              <Text style={styles.cardIcon}>👁️</Text>
              <Text style={styles.cardTitle}>瞬間の認識</Text>
              <Text style={styles.cardDescription}>
                今この瞬間の価値を意識し、時間の流れに敏感になる
              </Text>
            </View>
            
            <View style={[styles.glassCard, styles.cardPurple]}>
              <Text style={styles.cardIcon}>♾️</Text>
              <Text style={styles.cardTitle}>永続的価値</Text>
              <Text style={styles.cardDescription}>
                一瞬の体験をNFTとして記録し、未来へと継承する
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>体験する EXPERIENCE</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToFestival}>
            <Ionicons name="musical-notes" size={24} color="#000" />
            <Text style={styles.primaryButtonText}>Moment Festival 2025</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToNFT}>
            <Ionicons name="diamond-outline" size={24} color="#fff" />
            <Text style={styles.secondaryButtonText}>NFT Collection</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Navigation Menu */}
        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>メニュー MENU</Text>
          
          <TouchableOpacity style={styles.navButton} onPress={navigateToFestival}>
            <Ionicons name="musical-notes" size={24} color="#fff" />
            <Text style={styles.navButtonText}>フェスティバル情報</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={24} color="#fff" />
            <Text style={styles.navButtonText}>DJ プロフィール</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={navigateToNFT}>
            <Ionicons name="diamond" size={24} color="#fff" />
            <Text style={styles.navButtonText}>NFT ギャラリー</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
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
    height: height * 0.8,
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
  navSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 15,
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
  primaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 15,
    marginBottom: 12,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
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