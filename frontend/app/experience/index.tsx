import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MeditationExperienceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={styles.backText}>戻る</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.mainTitle}>瞑想的体験詳細</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧘 瞑想への導き</Text>
            <Text style={styles.description}>
              DJ Senohが創り出すMoment Music Experienceは、単なる音楽体験を超えた瞑想的な状態へとあなたを導きます。
              自然の音と電子音楽の融合により、意識の深層へとアクセスし、真の静寂を見つけることができます。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌊 音の波動</Text>
            <Text style={styles.description}>
              低周波から高周波まで、計算された音の波動が脳波をアルファ波状態に導きます。
              この状態では、時間の概念が薄れ、純粋な「今」の瞬間への集中が可能になります。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ 内なる平静</Text>
            <Text style={styles.description}>
              音楽を通じて、日常の雑念から解放され、内なる平静へと到達します。
              この体験は一時的なものではなく、日常生活においても持続する深い変化をもたらします。
            </Text>
          </View>

          <View style={styles.experienceCard}>
            <Text style={styles.experienceTitle}>体験の流れ</Text>
            <View style={styles.stepList}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>01</Text>
                <Text style={styles.stepText}>呼吸法による準備（5分）</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>02</Text>
                <Text style={styles.stepText}>環境音とのシンクロ（10分）</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>03</Text>
                <Text style={styles.stepText}>電子音楽への移行（15分）</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>04</Text>
                <Text style={styles.stepText}>瞑想状態の維持（20分）</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>05</Text>
                <Text style={styles.stepText}>意識の統合（10分）</Text>
              </View>
            </View>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>💡 体験のヒント</Text>
            <Text style={styles.noteText}>
              最初は5-10分の短時間から始めることをおすすめします。
              快適な座位を見つけ、目を閉じて音に身を委ねてください。
              思考が浮かんでも、それをジャッジせず、ただ観察してください。
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  experienceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginBottom: 25,
  },
  experienceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60a5fa',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepList: {
    gap: 15,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 15,
    minWidth: 40,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  noteSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});