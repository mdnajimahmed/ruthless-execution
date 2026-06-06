import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SPACING, TYPE, RADIUS, SHADOWS } from '@/config/designTokens';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/api/client';
import type { LoginRequest } from '@/types/auth';

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const { mutate: login, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)/today');
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return null;

  const onSubmit = (data: LoginRequest) => {
    login(data, {
      onSuccess: () => router.replace('/(app)/today'),
    });
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
            <Text style={styles.appName}>ruthless-execution</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.apiUrl}>API: {API_URL}</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  {(error as any)?.response?.data?.error
                    ?? (error as any)?.message
                    ?? 'Unknown error'}
                </Text>
              </View>
            )}

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

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordWrap}>
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: 'Password is required' }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.neutral400}
                      secureTextEntry={!showPassword}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel="Password"
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.showHide}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.showHideText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.fieldError}>⚠ {errors.password.message}</Text>
              )}
            </View>

            <PrimaryButton
              label="Sign in"
              onPress={handleSubmit(onSubmit)}
              fullWidth
              loading={isPending}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
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
  appName: {
    ...TYPE.label,
    color: COLORS.teal500,
    marginTop: SPACING.s1,
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
    marginBottom: SPACING.s6,
  },
  field: {
    marginBottom: SPACING.s6,
  },
  label: {
    ...TYPE.label,
    color: COLORS.teal600,
    marginBottom: 6,
  },
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
  inputError: {
    borderColor: COLORS.errorBorder,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 56,
  },
  showHide: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showHideText: {
    ...TYPE.label,
    color: COLORS.teal600,
  },
  fieldError: {
    ...TYPE.caption,
    color: COLORS.errorText,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: RADIUS.card,
    padding: SPACING.s3,
    marginBottom: SPACING.s4,
  },
  errorBannerText: {
    ...TYPE.small,
    color: COLORS.errorText,
  },
  forgotWrap: {
    alignItems: 'center',
    marginTop: SPACING.s4,
    paddingVertical: SPACING.s2,
  },
  forgotText: {
    ...TYPE.small,
    color: COLORS.teal600,
  },
  apiUrl: {
    ...TYPE.caption,
    color: COLORS.neutral400,
    marginBottom: SPACING.s4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
