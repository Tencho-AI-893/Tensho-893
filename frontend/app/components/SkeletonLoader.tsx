import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonItem: React.FC<SkeletonProps> = ({ 
  width: itemWidth = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)'],
  });

  return (
    <Animated.View
      style={[
        {
          width: itemWidth,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// Card Skeleton for Festival/Profile screens
export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <SkeletonItem width="100%" height={200} borderRadius={16} />
    <View style={styles.cardContent}>
      <SkeletonItem width="80%" height={24} borderRadius={4} />
      <SkeletonItem width="60%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonItem width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonItem width="70%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  </View>
);

// List Item Skeleton for NFT/Profile lists
export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItemSkeleton}>
    <SkeletonItem width={60} height={60} borderRadius={8} />
    <View style={styles.listItemContent}>
      <SkeletonItem width="70%" height={18} borderRadius={4} />
      <SkeletonItem width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
    <SkeletonItem width={24} height={24} borderRadius={12} />
  </View>
);

// Grid Item Skeleton for NFT gallery
export const GridItemSkeleton: React.FC = () => {
  const itemWidth = (width - 60) / 2;
  
  return (
    <View style={[styles.gridItemSkeleton, { width: itemWidth }]}>
      <SkeletonItem width="100%" height={itemWidth} borderRadius={12} />
      <View style={styles.gridItemContent}>
        <SkeletonItem width="90%" height={16} borderRadius={4} />
        <SkeletonItem width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Philosophy Card Skeleton for Home screen
export const PhilosophyCardSkeleton: React.FC = () => (
  <View style={styles.philosophyCardSkeleton}>
    <SkeletonItem width={60} height={60} borderRadius={30} style={{ alignSelf: 'center' }} />
    <SkeletonItem width="80%" height={20} borderRadius={4} style={{ marginTop: 15, alignSelf: 'center' }} />
    <SkeletonItem width="100%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
    <SkeletonItem width="90%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
  </View>
);

// Timeline Item Skeleton for Profile screen
export const TimelineItemSkeleton: React.FC = () => (
  <View style={styles.timelineItemSkeleton}>
    <View style={styles.timelineDot} />
    <View style={styles.timelineContent}>
      <SkeletonItem width="40%" height={18} borderRadius={4} />
      <SkeletonItem width="90%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      <SkeletonItem width="70%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    marginTop: 15,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  gridItemSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 15,
  },
  gridItemContent: {
    padding: 12,
  },
  philosophyCardSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingLeft: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 5,
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
});