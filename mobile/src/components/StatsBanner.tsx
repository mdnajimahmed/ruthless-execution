import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPE } from '@/config/designTokens';

export interface StatsBannerProps {
  hit: number;
  partial: number;
  miss: number;
  minutesFocused: number;
}

export function StatsBanner({ hit, partial, miss, minutesFocused }: StatsBannerProps) {
  const total = hit + partial + miss;
  const focusLabel = minutesFocused >= 60
    ? `${Math.floor(minutesFocused / 60)}h ${minutesFocused % 60}m`
    : `${minutesFocused}m`;

  return (
    <View style={styles.container}>
      <Stat value={String(hit)} label="HIT" color={COLORS.teal600} />
      <View style={styles.divider} />
      <Stat value={String(partial)} label="PARTIAL" color={COLORS.warningText} />
      <View style={styles.divider} />
      <Stat value={String(miss)} label="MISS" color={COLORS.errorText} />
      <View style={styles.divider} />
      <Stat value={focusLabel} label="FOCUSED" color={COLORS.teal700} />
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal50,
    paddingVertical: SPACING.s3,
    paddingHorizontal: SPACING.s4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.teal100,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  label: {
    ...TYPE.label,
    color: COLORS.neutral400,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.teal100,
  },
});
