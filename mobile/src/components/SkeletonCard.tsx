import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/config/designTokens';

export interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 2 }: SkeletonCardProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={[styles.line, styles.lineWide]} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <View key={i} style={[styles.line, styles.lineNarrow]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.neutral0,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.teal200,
    padding: SPACING.s6,
    marginBottom: SPACING.s3,
    ...SHADOWS.sm,
  },
  line: {
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.teal100,
    marginBottom: SPACING.s2,
  },
  lineWide: { width: '75%' },
  lineNarrow: { width: '50%' },
});
