import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface DJProfile {
  id: string;
  name: string;
  stage_name: string;
  location: string;
  music_styles: string[];
  career_start: number;
  bio: string;
  philosophy: {
    meditation: {
      title: string;
      description: string;
      icon: string;
    };
    awareness: {
      title: string;
      description: string;
      icon: string;
    };
    permanence: {
      title: string;
      description: string;
      icon: string;
    };
  };
  timeline: Array<{
    year: number | string;
    event: string;
  }>;
  social_links: {
    soundcloud: string;
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDJProfile();
  }, []);

  const fetchDJProfile = async () => {
    try {
      const response = await axios.get(`${EXPO_BACKEND_URL}/api/dj-profile`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching DJ profile:', error);
      Alert.alert('エラー', 'プロフィール情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLink = async (platform: string, link: string) => {
    let url = '';
    switch (platform) {
      case 'soundcloud':
        url = `https://soundcloud.com/${link}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${link}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${link}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${link}`;
        break;
      default:
        url = link;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('エラー', 'リンクを開けませんでした');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>プロフィール情報が見つかりません</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDJProfile}>
          <Text style={styles.retryText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Text style={styles.stageName}>{profile.stage_name}</Text>
          <Text style={styles.realName}>{profile.name}</Text>
          
          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color="#f87171" />
              <Text style={styles.infoText}>拠点：{profile.location}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="musical-notes" size={16} color="#60a5fa" />
              <Text style={styles.infoText}>
                {profile.music_styles.join(', ')}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color="#34d399" />
              <Text style={styles.infoText}>
                活動歴：{new Date().getFullYear() - profile.career_start}年以上（{profile.career_start}年〜）
              </Text>
            </View>
          </View>

          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        {/* Music Styles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎧 音楽スタイル</Text>
          <View style={styles.stylesContainer}>
            {profile.music_styles.map((style, index) => (
              <View key={index} style={styles.styleTag}>
                <Text style={styles.styleText}>{style}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Philosophy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>哲学 PHILOSOPHY</Text>
          
          <View style={styles.philosophyGrid}>
            <View style={[styles.glassCard, styles.cardBlue]}>
              <Text style={styles.cardIcon}>{profile.philosophy.meditation.icon}</Text>
              <Text style={styles.cardTitle}>{profile.philosophy.meditation.title}</Text>
              <Text style={styles.cardDescription}>{profile.philosophy.meditation.description}</Text>
            </View>
            
            <View style={[styles.glassCard, styles.cardGreen]}>
              <Text style={styles.cardIcon}>{profile.philosophy.awareness.icon}</Text>
              <Text style={styles.cardTitle}>{profile.philosophy.awareness.title}</Text>
              <Text style={styles.cardDescription}>{profile.philosophy.awareness.description}</Text>
            </View>
            
            <View style={[styles.glassCard, styles.cardPurple]}>
              <Text style={styles.cardIcon}>{profile.philosophy.permanence.icon}</Text>
              <Text style={styles.cardTitle}>{profile.philosophy.permanence.title}</Text>
              <Text style={styles.cardDescription}>{profile.philosophy.permanence.description}</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DJ活動の軌跡</Text>
          
          <View style={styles.timeline}>
            {profile.timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>{item.year}</Text>
                  <Text style={styles.timelineEvent}>{item.event}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 ソーシャルリンク</Text>
          
          <View style={styles.socialGrid}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLink('soundcloud', profile.social_links.soundcloud)}
            >
              <Ionicons name="cloud" size={24} color="#fff" />
              <Text style={styles.socialText}>SoundCloud</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLink('instagram', profile.social_links.instagram)}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLink('facebook', profile.social_links.facebook)}
            >
              <Ionicons name="logo-facebook" size={24} color="#fff" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLink('twitter', profile.social_links.twitter)}
            >
              <Ionicons name="logo-twitter" size={24} color="#fff" />
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryCTA}>
            <Text style={styles.ctaText}>お問い合わせ</Text>
            <Ionicons name="mail" size={24} color="#000" />
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  stageName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  realName: {
    fontSize: 20,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
  },
  basicInfo: {
    width: '100%',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bio: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
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
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleTag: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  styleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  philosophyGrid: {
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
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginTop: 5,
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
  timelineYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  timelineEvent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
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
});