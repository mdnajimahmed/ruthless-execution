import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { COLORS, SHADOWS, SPACING, TYPE } from '@/config/designTokens';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';

export function FloatingTimerPill() {
  const { activeTaskTitle, startedAt, getElapsedSeconds } = useTimerStore();
  const [elapsed, setElapsed] = useState(0);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  const isRunning = !!startedAt;

  useEffect(() => {
    if (isRunning) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    setElapsed(getElapsedSeconds());
    const id = setInterval(() => setElapsed(getElapsedSeconds()), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isRunning) return null;

  const handleLongPress = () => {
    Alert.alert(
      'Stop Timer?',
      `Stop timer for "${activeTaskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => useTimerStore.getState().stop(),
        },
      ],
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.pill}
        onPress={() => router.push('/(app)/timer')}
        onLongPress={handleLongPress}
        activeOpacity={0.85}
        accessibilityLabel={`Timer running for ${activeTaskTitle}. Tap to open, long press to stop.`}
      >
        <Text style={styles.title} numberOfLines={1}>{activeTaskTitle}</Text>
        <Text style={styles.separator}>·</Text>
        <Text style={styles.time}>{formatSeconds(elapsed)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal700,
    paddingVertical: SPACING.s2,
    paddingHorizontal: SPACING.s4,
    borderRadius: 9999,
    gap: SPACING.s2,
    maxWidth: 280,
    ...SHADOWS.md,
  },
  title: {
    ...TYPE.button,
    color: COLORS.neutral0,
    flex: 1,
    maxWidth: 160,
  },
  separator: {
    color: COLORS.teal300,
    fontSize: 16,
  },
  time: {
    ...TYPE.mono,
    color: COLORS.teal200,
    fontSize: 13,
    fontWeight: '700',
  },
});
