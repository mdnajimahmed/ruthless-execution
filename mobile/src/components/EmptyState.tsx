import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPE } from '@/config/designTokens';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <View style={styles.actionWrap}>
          <PrimaryButton label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.s12,
    paddingHorizontal: SPACING.s6,
  },
  title: {
    ...TYPE.h3,
    color: COLORS.teal900,
    textAlign: 'center',
    marginBottom: SPACING.s2,
  },
  subtitle: {
    ...TYPE.small,
    color: COLORS.neutral400,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: SPACING.s5,
  },
});
