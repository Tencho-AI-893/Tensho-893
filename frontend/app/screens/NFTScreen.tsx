import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface NFTMoment {
  id: string;
  title: string;
  description: string;
  image_base64: string;
  moment_timestamp: string;
  rarity: string;
  attributes: {
    location?: string;
    genre?: string;
    time?: string;
  };
}

const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

export default function NFTScreen() {
  const [nfts, setNfts] = useState<NFTMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTMoment | null>(null);

  useEffect(() => {
    fetchNFTMoments();
  }, []);

  const fetchNFTMoments = async () => {
    try {
      const response = await axios.get(`${EXPO_BACKEND_URL}/api/nft-moments`);
      setNfts(response.data);
    } catch (error) {
      console.error('Error fetching NFT moments:', error);
      Alert.alert('エラー', 'NFTデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleNFTPress = (nft: NFTMoment) => {
    setSelectedNFT(nft);
  };

  const closeModal = () => {
    setSelectedNFT(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '#ffd700';
      case 'rare':
        return '#a78bfa';
      case 'common':
        return '#9ca3af';
      default:
        return '#fff';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '👑';
      case 'rare':
        return '💎';
      case 'common':
        return '🔸';
      default:
        return '⭐';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>NFTコレクションを読み込み中...</Text>
      </View>
    );
  }

  const renderNFTItem = ({ item }: { item: NFTMoment }) => (
    <TouchableOpacity 
      style={styles.nftCard}
      onPress={() => handleNFTPress(item)}
    >
      <Image 
        source={{ uri: item.image_base64 }}
        style={styles.nftImage}
        resizeMode="cover"
      />
      <View style={styles.nftInfo}>
        <Text style={styles.nftTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.rarityContainer}>
          <Text style={styles.rarityIcon}>{getRarityIcon(item.rarity)}</Text>
          <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
            {item.rarity}
          </Text>
        </View>
        <Text style={styles.nftDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MOMENT NFT</Text>
            <Text style={styles.headerSubtitle}>瞬間の永続的所有</Text>
            <Text style={styles.headerDescription}>
              音楽体験をブロックチェーン上に永続保存。{'\n'}
              あなたの感動の瞬間を、唯一無二のデジタル資産として。
            </Text>
          </View>

          {/* NFT Features */}
          <View style={styles.section}>
            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>💿</Text>
                <Text style={styles.featureTitle}>音楽体験の記録</Text>
                <Text style={styles.featureDescription}>独自アルゴリズムで瞬間を捕捉</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureTitle}>改ざん不可能</Text>
                <Text style={styles.featureDescription}>ブロックチェーンで確実に保存</Text>
              </View>
              
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>💎</Text>
                <Text style={styles.featureTitle}>唯一無二の資産</Text>
                <Text style={styles.featureDescription}>時間とともに成長する価値</Text>
              </View>
            </View>
          </View>

          {/* NFT Gallery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 モーメント・ギャラリー</Text>
            <Text style={styles.sectionSubtitle}>
              これまでのフェスティバルで生まれた特別な瞬間をNFTとして記録
            </Text>
            
            <View style={styles.nftGrid}>
              {nfts.map((nft) => renderNFTItem({ item: nft }))}
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <TouchableOpacity style={styles.primaryCTA}>
              <Text style={styles.ctaText}>NFT統合について学ぶ</Text>
              <Ionicons name="school" size={24} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.disclaimerText}>
              * 現在はデモ版です。実際のブロックチェーン統合は今後のアップデートで実装予定です。
            </Text>
          </View>
        </ScrollView>

        {/* NFT Detail Modal */}
        {selectedNFT && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackground}
              onPress={closeModal}
              activeOpacity={1}
            />
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Image 
                source={{ uri: selectedNFT.image_base64 }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              
              <Text style={styles.modalTitle}>{selectedNFT.title}</Text>
              
              <View style={styles.modalRarity}>
                <Text style={styles.rarityIcon}>{getRarityIcon(selectedNFT.rarity)}</Text>
                <Text style={[styles.modalRarityText, { color: getRarityColor(selectedNFT.rarity) }]}>
                  {selectedNFT.rarity.toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.modalDescription}>{selectedNFT.description}</Text>
              
              <View style={styles.attributesList}>
                <Text style={styles.attributesTitle}>属性</Text>
                {Object.entries(selectedNFT.attributes).map(([key, value]) => (
                  <View key={key} style={styles.attributeItem}>
                    <Text style={styles.attributeKey}>{key}:</Text>
                    <Text style={styles.attributeValue}>{value}</Text>
                  </View>
                ))}
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeKey}>記録日時:</Text>
                  <Text style={styles.attributeValue}>{formatTimestamp(selectedNFT.moment_timestamp)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerDescription: {
    fontSize: 16,
    color: '#999',
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
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  nftCard: {
    width: itemWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    height: itemWidth,
  },
  nftInfo: {
    padding: 12,
  },
  nftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rarityIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nftDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  primaryCTA: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    marginBottom: 15,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalRarity: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalRarityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  attributesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  attributesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  attributeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  attributeKey: {
    fontSize: 14,
    color: '#999',
  },
  attributeValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});