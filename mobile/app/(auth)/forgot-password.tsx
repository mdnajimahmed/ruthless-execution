import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SPACING, TYPE, RADIUS, SHADOWS } from '@/config/designTokens';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useForgotPassword } from '@/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<{ email: string }>();
  const { mutate: sendReset, isPending, isSuccess } = useForgotPassword();

  const onSubmit = ({ email }: { email: string }) => {
    sendReset(email);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logo}>turinghatch</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reset password</Text>
            <Text style={styles.cardSubtitle}>
              Enter your email and we'll send you a reset link.
            </Text>

            {isSuccess ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>
                  Check your inbox for a reset link.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>EMAIL</Text>
                  <Controller
                    control={control}
                    name="email"
                    rules={{ required: 'Email is required' }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.neutral400}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onChangeText={onChange}
                        value={value}
                        accessibilityLabel="Email address"
                      />
                    )}
                  />
                  {errors.email && (
                    <Text style={styles.fieldError}>⚠ {errors.email.message}</Text>
                  )}
                </View>

                <PrimaryButton
                  label="Send reset link"
                  onPress={handleSubmit(onSubmit)}
                  fullWidth
                  loading={isPending}
                />
              </>
            )}

            <PrimaryButton
              label="Back to sign in"
              onPress={() => router.back()}
              variant="ghost"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.teal700 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.s6,
  },
  brand: {
    alignItems: 'center',
    marginBottom: SPACING.s10,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.teal700,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.neutral0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    padding: SPACING.s6,
    ...SHADOWS.sm,
  },
  cardTitle: {
    ...TYPE.h3,
    color: COLORS.teal900,
    marginBottom: SPACING.s2,
  },
  cardSubtitle: {
    ...TYPE.small,
    color: COLORS.neutral600,
    marginBottom: SPACING.s6,
  },
  field: { marginBottom: SPACING.s6 },
  label: { ...TYPE.label, color: COLORS.teal600, marginBottom: 6 },
  input: {
    height: 44,
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.s3,
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.teal900,
  },
  inputError: { borderColor: COLORS.errorBorder },
  fieldError: { ...TYPE.caption, color: COLORS.errorText, marginTop: 4 },
  successBanner: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 8,
    padding: SPACING.s3,
    marginBottom: SPACING.s4,
  },
  successText: { ...TYPE.small, color: COLORS.successText },
});
