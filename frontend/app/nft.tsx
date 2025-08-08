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
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';
import { GridItemSkeleton } from './components/SkeletonLoader';

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
  minted?: boolean;
  transaction_hash?: string;
  token_id?: string;
  blockchain?: string;
}

interface MintStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  transactionHash?: string;
  tokenId?: string;
}

const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const ALCHEMY_RPC = process.env.EXPO_PUBLIC_ALCHEMY_RPC;
const WALLETCONNECT_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID;

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

const MOCK_NFTS_KEY = 'mock_minted_nfts';

export default function NFTScreen() {
  const [nfts, setNfts] = useState<NFTMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTMoment | null>(null);
  const [mintModalVisible, setMintModalVisible] = useState(false);
  const [mintStatus, setMintStatus] = useState<MintStatus>({ status: 'idle' });
  const [mintForm, setMintForm] = useState({
    title: '',
    description: '',
    location: '',
    genre: '',
  });
  
  const { showToast } = useToast();
  const { isLoading, debouncedAction } = useLoading();

  const isBlockchainMode = Boolean(ALCHEMY_RPC && WALLETCONNECT_PROJECT_ID);

  useEffect(() => {
    fetchNFTMoments();
  }, []);

  const fetchNFTMoments = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Get API NFTs
      const response = await axios.get(`${EXPO_BACKEND_URL}/api/nft-moments`);
      let allNfts = [...response.data];
      
      // Add mock minted NFTs if in mock mode
      if (!isBlockchainMode) {
        const mockNfts = await getMockMintedNFTs();
        allNfts = [...allNfts, ...mockNfts];
      }
      
      setNfts(allNfts);
    } catch (error) {
      console.error('Error fetching NFT moments:', error);
      showToast('error', 'NFTデータの取得に失敗しました');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNFTMoments(true);
  };

  const getMockMintedNFTs = async (): Promise<NFTMoment[]> => {
    try {
      const stored = await AsyncStorage.getItem(MOCK_NFTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading mock NFTs:', error);
      return [];
    }
  };

  const saveMockMintedNFT = async (nft: NFTMoment) => {
    try {
      const existing = await getMockMintedNFTs();
      const updated = [...existing, nft];
      await AsyncStorage.setItem(MOCK_NFTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving mock NFT:', error);
    }
  };

  const generateMockImage = (title: string): string => {
    // Generate a simple SVG-based image as base64
    const svgContent = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <circle cx="150" cy="150" r="80" fill="rgba(255,255,255,0.2)"/>
        <text x="150" y="160" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${title.substring(0, 20)}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  const mockMintNFT = debouncedAction(
    'mock-mint',
    async () => {
      if (!mintForm.title || !mintForm.description) {
        throw new Error('タイトルと説明を入力してください');
      }

      setMintStatus({ status: 'pending', message: 'モックNFTをミント中...' });
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newNFT: NFTMoment = {
        id: `mock_${Date.now()}`,
        title: mintForm.title,
        description: mintForm.description,
        image_base64: generateMockImage(mintForm.title),
        moment_timestamp: new Date().toISOString(),
        rarity: 'common',
        attributes: {
          location: mintForm.location || 'デモ会場',
          genre: mintForm.genre || 'Electronic',
          time: new Date().toLocaleTimeString('ja-JP'),
        },
        minted: true,
        transaction_hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        token_id: Math.floor(Math.random() * 10000).toString(),
        blockchain: 'Mock Chain',
      };

      await saveMockMintedNFT(newNFT);
      setMintStatus({
        status: 'success',
        message: 'モックNFTのミントが完了しました！',
        transactionHash: newNFT.transaction_hash,
        tokenId: newNFT.token_id,
      });

      // Refresh gallery
      await fetchNFTMoments();
      
      // Reset form
      setMintForm({ title: '', description: '', location: '', genre: '' });
    },
    {
      loadingMessage: 'NFTをミント中...',
      successMessage: 'NFTミントが完了しました！',
      errorMessage: 'NFTミントに失敗しました',
      delay: 500,
    }
  );

  const blockchainMintNFT = debouncedAction(
    'blockchain-mint',
    async () => {
      if (!mintForm.title || !mintForm.description) {
        throw new Error('タイトルと説明を入力してください');
      }

      setMintStatus({ status: 'pending', message: 'Polygon Amoyでミント中...' });
      
      try {
        // In a real implementation, this would connect to WalletConnect
        // and interact with the smart contract
        showToast('info', 'ウォレット接続が必要です');
        
        // Simulate the blockchain interaction
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // For now, create a mock successful transaction
        const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
        const tokenId = Math.floor(Math.random() * 10000).toString();
        
        setMintStatus({
          status: 'success',
          message: 'Polygon AmoyでのNFTミントが完了しました！',
          transactionHash: txHash,
          tokenId: tokenId,
        });

        // In real implementation, you would save this to your backend
        const newNFT: NFTMoment = {
          id: `polygon_${Date.now()}`,
          title: mintForm.title,
          description: mintForm.description,
          image_base64: generateMockImage(mintForm.title),
          moment_timestamp: new Date().toISOString(),
          rarity: 'rare',
          attributes: {
            location: mintForm.location || 'Polygon Amoy',
            genre: mintForm.genre || 'Electronic',
            time: new Date().toLocaleTimeString('ja-JP'),
          },
          minted: true,
          transaction_hash: txHash,
          token_id: tokenId,
          blockchain: 'Polygon Amoy',
        };

        // Save to mock storage for demo purposes
        await saveMockMintedNFT(newNFT);
        await fetchNFTMoments();
        
        setMintForm({ title: '', description: '', location: '', genre: '' });
        
      } catch (error) {
        setMintStatus({
          status: 'error',
          message: `ブロックチェーンミントエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        throw error;
      }
    },
    {
      loadingMessage: 'ブロックチェーンでNFTをミント中...',
      successMessage: 'ブロックチェーンNFTミントが完了しました！',
      errorMessage: 'ブロックチェーンNFTミントに失敗しました',
      delay: 500,
    }
  );

  const openMintModal = debouncedAction(
    'open-mint-modal',
    async () => {
      setMintModalVisible(true);
      setMintStatus({ status: 'idle' });
    },
    {
      delay: 300,
    }
  );

  const closeMintModal = () => {
    setMintModalVisible(false);
    setMintForm({ title: '', description: '', location: '', genre: '' });
    setMintStatus({ status: 'idle' });
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

  const renderNFTItem = ({ item }: { item: NFTMoment }) => (
    <TouchableOpacity 
      style={[styles.nftCard, item.minted && styles.mintedCard]}
      onPress={() => handleNFTPress(item)}
    >
      <Image 
        source={{ uri: item.image_base64 }}
        style={styles.nftImage}
        resizeMode="cover"
      />
      {item.minted && (
        <View style={styles.mintedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
          <Text style={styles.mintedText}>Minted</Text>
        </View>
      )}
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
        {item.blockchain && (
          <Text style={styles.blockchainText}>⛓️ {item.blockchain}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MOMENT NFT</Text>
            <Text style={styles.headerSubtitle}>Loading...</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.nftGrid}>
              <GridItemSkeleton />
              <GridItemSkeleton />
              <GridItemSkeleton />
              <GridItemSkeleton />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
            colors={['#fff']}
            progressBackgroundColor="#333"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MOMENT NFT</Text>
          <Text style={styles.headerSubtitle}>瞬間の永続的所有</Text>
          <Text style={styles.headerDescription}>
            音楽体験をブロックチェーン上に永続保存。{'\n'}
            あなたの感動の瞬間を、唯一無二のデジタル資産として。
          </Text>
        </View>

        {/* Mode Indicator */}
        <View style={styles.section}>
          <View style={[styles.modeCard, isBlockchainMode ? styles.blockchainMode : styles.mockMode]}>
            <Ionicons 
              name={isBlockchainMode ? "link" : "flask"} 
              size={20} 
              color={isBlockchainMode ? "#4ade80" : "#fbbf24"} 
            />
            <Text style={styles.modeText}>
              {isBlockchainMode ? 'Polygon Amoy Testnet モード' : 'モックモード'}
            </Text>
            {!isBlockchainMode && (
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle" size={16} color="#fbbf24" />
              </TouchableOpacity>
            )}
          </View>
          
          {!isBlockchainMode && (
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>📋 ブロックチェーン統合に必要な環境変数:</Text>
              <Text style={styles.requirementItem}>• EXPO_PUBLIC_ALCHEMY_RPC</Text>
              <Text style={styles.requirementItem}>• EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID</Text>
              <Text style={styles.requirementsNote}>
                これらを設定すると Polygon Amoy Testnet での実際のNFTミントが有効になります。
              </Text>
            </View>
          )}
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
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>🎨 モーメント・ギャラリー</Text>
            <TouchableOpacity 
              style={[styles.mintButton, (isLoading('open-mint-modal') || isLoading('mock-mint') || isLoading('blockchain-mint')) && styles.mintButtonDisabled]}
              onPress={openMintModal}
              disabled={isLoading('open-mint-modal') || isLoading('mock-mint') || isLoading('blockchain-mint')}
            >
              {isLoading('open-mint-modal') ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#000" />
                  <Text style={styles.mintButtonText}>Mint</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            これまでのフェスティバルで生まれた特別な瞬間をNFTとして記録
          </Text>
          
          <View style={styles.nftGrid}>
            {nfts.map((nft) => renderNFTItem({ item: nft }))}
          </View>
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
              {selectedNFT.minted && (
                <View style={styles.mintedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                  <Text style={styles.mintedIndicatorText}>Minted</Text>
                </View>
              )}
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
              {selectedNFT.transaction_hash && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeKey}>Transaction:</Text>
                  <Text style={styles.attributeValue} numberOfLines={1}>
                    {selectedNFT.transaction_hash}
                  </Text>
                </View>
              )}
              {selectedNFT.token_id && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeKey}>Token ID:</Text>
                  <Text style={styles.attributeValue}>{selectedNFT.token_id}</Text>
                </View>
              )}
              {selectedNFT.blockchain && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeKey}>Blockchain:</Text>
                  <Text style={styles.attributeValue}>{selectedNFT.blockchain}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Mint Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mintModalVisible}
        onRequestClose={closeMintModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mintModalContent}>
            <View style={styles.mintModalHeader}>
              <Text style={styles.mintModalTitle}>NFT ミント</Text>
              <TouchableOpacity onPress={closeMintModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.mintForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>タイトル *</Text>
                <TextInput
                  style={styles.formInput}
                  value={mintForm.title}
                  onChangeText={(text) => setMintForm(prev => ({ ...prev, title: text }))}
                  placeholder="例: 夜明けの瞬間"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>説明 *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={mintForm.description}
                  onChangeText={(text) => setMintForm(prev => ({ ...prev, description: text }))}
                  placeholder="この瞬間の特別な体験を記述してください"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>場所</Text>
                <TextInput
                  style={styles.formInput}
                  value={mintForm.location}
                  onChangeText={(text) => setMintForm(prev => ({ ...prev, location: text }))}
                  placeholder="例: 天川村フォレスト・イン洞川"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ジャンル</Text>
                <TextInput
                  style={styles.formInput}
                  value={mintForm.genre}
                  onChangeText={(text) => setMintForm(prev => ({ ...prev, genre: text }))}
                  placeholder="例: Psytrance"
                  placeholderTextColor="#666"
                />
              </View>

              {mintStatus.status !== 'idle' && (
                <View style={[styles.statusCard, styles[`status${mintStatus.status.charAt(0).toUpperCase() + mintStatus.status.slice(1)}`]]}>
                  {mintStatus.status === 'pending' && <ActivityIndicator size="small" color="#60a5fa" />}
                  {mintStatus.status === 'success' && <Ionicons name="checkmark-circle" size={20} color="#4ade80" />}
                  {mintStatus.status === 'error' && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                  <Text style={styles.statusMessage}>{mintStatus.message}</Text>
                </View>
              )}

              <View style={styles.mintActions}>
                {isBlockchainMode ? (
                  <TouchableOpacity
                    style={[styles.mintActionButton, styles.blockchainButton]}
                    onPress={blockchainMintNFT}
                    disabled={isLoading('blockchain-mint') || mintStatus.status === 'pending'}
                  >
                    {isLoading('blockchain-mint') ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="link" size={20} color="#000" />
                        <Text style={styles.mintActionText}>Polygon Amoy でミント</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.mintActionButton, styles.mockButton]}
                    onPress={mockMintNFT}
                    disabled={isLoading('mock-mint') || mintStatus.status === 'pending'}
                  >
                    {isLoading('mock-mint') ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="flask" size={20} color="#000" />
                        <Text style={styles.mintActionText}>モックミント</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
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
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  blockchainMode: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  mockMode: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  requirementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  requirementsTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  requirementItem: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  requirementsNote: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
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
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mintButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  mintButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  mintButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
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
    position: 'relative',
  },
  mintedCard: {
    borderColor: 'rgba(74, 222, 128, 0.5)',
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  nftImage: {
    width: '100%',
    height: itemWidth,
  },
  mintedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mintedText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
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
  blockchainText: {
    fontSize: 10,
    color: '#60a5fa',
    marginTop: 4,
    fontWeight: '600',
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
    flexWrap: 'wrap',
  },
  modalRarityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    marginRight: 10,
  },
  mintedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mintedIndicatorText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    flex: 1,
    textAlign: 'right',
  },
  // Mint Modal Styles
  mintModalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mintModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  mintModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  mintForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  statusSuccess: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusMessage: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  mintActions: {
    gap: 15,
  },
  mintActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  blockchainButton: {
    backgroundColor: '#4ade80',
  },
  mockButton: {
    backgroundColor: '#fbbf24',
  },
  mintActionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});