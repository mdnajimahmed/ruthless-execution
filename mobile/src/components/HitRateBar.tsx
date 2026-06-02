import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/config/designTokens';

export type HitStatus = 'hit' | 'partial' | 'miss' | 'none';

export interface HitRateBarProps {
  entries: HitStatus[];
}

const COLOR: Record<HitStatus, string> = {
  hit:     COLORS.teal600,
  partial: COLORS.warningDefault,
  miss:    COLORS.errorDefault,
  none:    COLORS.neutral200,
};

export function HitRateBar({ entries }: HitRateBarProps) {
  return (
    <View style={styles.row}>
      {entries.map((status, i) => (
        <View
          key={i}
          style={[styles.square, { backgroundColor: COLOR[status] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.s1,
  },
  square: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
