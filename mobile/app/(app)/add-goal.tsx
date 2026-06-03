import { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, RADIUS, SHADOWS } from '@/config/designTokens';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useCreateGoal } from '@/hooks/useGoals';

type Scope = 'both' | 'weekday' | 'weekend';

function extractApiError(err: unknown): string {
  if (!err) return 'Failed to create goal. Please try again.';
  const e = err as any;
  return (
    e?.response?.data?.error ||
    e?.message ||
    'Failed to create goal. Please try again.'
  );
}

function isValidTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}

function isValidDate(d: string): boolean {
  if (!d) return true; // optional
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:30');
  const [scope, setScope] = useState<Scope>('both');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutateAsync: createGoal, isPending } = useCreateGoal();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Goal title is required';
    }
    if (!isValidTime(startTime)) {
      errors.startTime = 'Use HH:MM format (e.g. 07:00)';
    }
    if (!isValidTime(endTime)) {
      errors.endTime = 'Use HH:MM format (e.g. 07:30)';
    }
    if (isValidTime(startTime) && isValidTime(endTime)) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if ((eh * 60 + em) - (sh * 60 + sm) <= 0) {
        errors.endTime = 'End time must be after start time';
      }
    }
    if (targetEndDate && !isValidDate(targetEndDate)) {
      errors.targetEndDate = 'Use YYYY-MM-DD format (e.g. 2026-07-01)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const allocatedMinutes = (eh * 60 + em) - (sh * 60 + sm);

    setApiError(null);

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        allocatedMinutes,
        tags: [],
        isWeekdayGoal: scope === 'weekday',
        isWeekendGoal: scope === 'weekend',
        targetEndDate: targetEndDate.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: SPACING.s4 + insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.neutral0} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW GOAL</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>TITLE <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, fieldErrors.title ? styles.inputError : null]}
            placeholder="e.g., Morning workout, Read technical docs…"
            placeholderTextColor={COLORS.neutral400}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
            }}
            autoFocus
            editable={!isPending}
          />
          {!!fieldErrors.title && <Text style={styles.fieldError}>{fieldErrors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>DESCRIPTION <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="What is this goal about? Why does it matter?"
            placeholderTextColor={COLORS.neutral400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!isPending}
          />
        </View>

        {/* Times */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: SPACING.s3 }]}>
            <Text style={styles.label}>START TIME <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.mono, fieldErrors.startTime ? styles.inputError : null]}
              placeholder="07:00"
              placeholderTextColor={COLORS.neutral400}
              value={startTime}
              onChangeText={(v) => {
                setStartTime(v);
                if (fieldErrors.startTime) setFieldErrors((p) => ({ ...p, startTime: '' }));
              }}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              editable={!isPending}
            />
            {!!fieldErrors.startTime && <Text style={styles.fieldError}>{fieldErrors.startTime}</Text>}
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>END TIME <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.mono, fieldErrors.endTime ? styles.inputError : null]}
              placeholder="07:30"
              placeholderTextColor={COLORS.neutral400}
              value={endTime}
              onChangeText={(v) => {
                setEndTime(v);
                if (fieldErrors.endTime) setFieldErrors((p) => ({ ...p, endTime: '' }));
              }}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              editable={!isPending}
            />
            {!!fieldErrors.endTime && <Text style={styles.fieldError}>{fieldErrors.endTime}</Text>}
          </View>
        </View>

        {/* Scope */}
        <View style={styles.field}>
          <Text style={styles.label}>GOAL SCOPE</Text>
          <View style={styles.scopeRow}>
            {(['both', 'weekday', 'weekend'] as Scope[]).map((s) => {
              const labels: Record<Scope, string> = {
                both: 'Every Day',
                weekday: 'Mon–Fri',
                weekend: 'Sat–Sun',
              };
              const selected = scope === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setScope(s)}
                  style={[styles.scopeBtn, selected && styles.scopeBtnActive]}
                  disabled={isPending}
                >
                  <Text style={[styles.scopeLabel, selected && styles.scopeLabelActive]}>
                    {labels[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Target End Date */}
        <View style={styles.field}>
          <Text style={styles.label}>TARGET END DATE <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.mono, fieldErrors.targetEndDate ? styles.inputError : null]}
            placeholder="YYYY-MM-DD, e.g. 2026-07-01"
            placeholderTextColor={COLORS.neutral400}
            value={targetEndDate}
            onChangeText={(v) => {
              setTargetEndDate(v);
              if (fieldErrors.targetEndDate) setFieldErrors((p) => ({ ...p, targetEndDate: '' }));
            }}
            keyboardType="numbers-and-punctuation"
            editable={!isPending}
          />
          {!!fieldErrors.targetEndDate && (
            <Text style={styles.fieldError}>{fieldErrors.targetEndDate}</Text>
          )}
          <Text style={styles.hint}>When do you want to complete this goal?</Text>
        </View>

        {/* API error */}
        {!!apiError && (
          <View style={styles.apiErrorBox}>
            <Text style={styles.apiErrorText}>{apiError}</Text>
          </View>
        )}

        <PrimaryButton
          label={isPending ? 'Creating…' : 'Create Goal'}
          onPress={handleSubmit}
          fullWidth
          loading={isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.teal50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal700,
    paddingHorizontal: SPACING.s4,
    paddingBottom: SPACING.s4,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.s3,
  },
  headerTitle: { ...TYPE.label, color: COLORS.neutral0, fontSize: 14 },
  scroll: { padding: SPACING.s4, paddingBottom: SPACING.s16 },
  row: { flexDirection: 'row' },
  field: { marginBottom: SPACING.s5 },
  label: { ...TYPE.label, color: COLORS.teal600, marginBottom: 6, fontSize: 11 },
  required: { color: COLORS.errorText },
  optional: { color: COLORS.neutral400, fontWeight: '400' },
  input: {
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.s3,
    paddingVertical: SPACING.s3,
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.teal900,
    minHeight: 44,
  },
  inputError: {
    borderColor: COLORS.errorText,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  mono: { fontVariant: ['tabular-nums'] },
  fieldError: { ...TYPE.caption, color: COLORS.errorText, marginTop: 4 },
  hint: { ...TYPE.caption, color: COLORS.neutral400, marginTop: 4 },
  scopeRow: { flexDirection: 'row', gap: SPACING.s2 },
  scopeBtn: {
    flex: 1,
    paddingVertical: SPACING.s3,
    alignItems: 'center',
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    backgroundColor: COLORS.neutral0,
  },
  scopeBtnActive: {
    backgroundColor: COLORS.teal50,
    borderColor: COLORS.teal700,
  },
  scopeLabel: { ...TYPE.label, fontSize: 11, color: COLORS.neutral400 },
  scopeLabelActive: { color: COLORS.teal700 },
  apiErrorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorText,
    borderRadius: RADIUS.card,
    padding: SPACING.s3,
    marginBottom: SPACING.s4,
  },
  apiErrorText: { ...TYPE.small, color: COLORS.errorText },
});
