import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPE } from '@/config/designTokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const BG: Record<ButtonVariant, string> = {
  primary:   COLORS.teal700,
  secondary: 'transparent',
  ghost:     'transparent',
  danger:    COLORS.errorDefault,
};

const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary:   COLORS.neutral0,
  secondary: COLORS.teal700,
  ghost:     COLORS.teal700,
  danger:    COLORS.neutral0,
};

const PADDING_V: Record<ButtonSize, number> = { sm: 6, md: 10, lg: 14 };
const PADDING_H: Record<ButtonSize, number> = { sm: 14, md: 20, lg: 28 };
const FONT_SIZE: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 };

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: isDisabled ? COLORS.neutral200 : BG[variant],
          paddingVertical: PADDING_V[size],
          paddingHorizontal: PADDING_H[size],
          width: fullWidth ? '100%' : undefined,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: variant === 'secondary'
            ? (isDisabled ? COLORS.neutral200 : COLORS.teal500)
            : 'transparent',
        },
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? COLORS.neutral0 : COLORS.teal600}
          style={styles.spinner}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            fontSize: FONT_SIZE[size],
            color: isDisabled ? COLORS.neutral400 : TEXT_COLOR[variant],
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.button,
  },
  label: {
    ...TYPE.button,
  },
  spinner: {
    marginRight: SPACING.s2,
  },
});
