import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPE, SHADOWS } from '@/config/designTokens';
import { formatDateLabel } from '@/utils/formatDate';

export interface DateNavHeaderProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

export function DateNavHeader({ date, onPrev, onNext, canGoNext }: DateNavHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: SPACING.s4 + insets.top }]}>
      <TouchableOpacity
        onPress={onPrev}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.arrow}
        accessibilityLabel="Previous day"
      >
        <ChevronLeft size={22} color={COLORS.neutral0} />
      </TouchableOpacity>

      <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canGoNext}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.arrow}
        accessibilityLabel="Next day"
      >
        <ChevronRight size={22} color={canGoNext ? COLORS.neutral0 : COLORS.teal800} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.teal700,
    paddingHorizontal: SPACING.s4,
    paddingBottom: SPACING.s4,
    ...SHADOWS.sm,
  },
  dateLabel: {
    ...TYPE.h3,
    color: COLORS.neutral0,
    flex: 1,
    textAlign: 'center',
  },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
