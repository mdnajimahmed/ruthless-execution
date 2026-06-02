import { View, Text, StyleSheet } from 'react-native';
import { QUADRANT_COLORS, RADIUS, SPACING, TYPE } from '@/config/designTokens';
import type { QuadrantKey } from '@/config/designTokens';

export interface QuadrantBadgeProps {
  quadrant: QuadrantKey;
  size?: 'sm' | 'md';
}

export function QuadrantBadge({ quadrant, size = 'md' }: QuadrantBadgeProps) {
  const colors = QUADRANT_COLORS[quadrant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.badgeBg,
          paddingVertical: isSmall ? 2 : 3,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.badgeText,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {colors.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...TYPE.label,
  },
});
