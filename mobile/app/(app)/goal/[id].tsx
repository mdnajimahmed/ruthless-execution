import { useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, RADIUS, SHADOWS } from '@/config/designTokens';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useGoals } from '@/hooks/useGoals';
import { useDayEntriesByDate, useUpsertDayEntry } from '@/hooks/useDayEntries';
import { todayString } from '@/utils/formatDate';
import type { DayEntryStatus } from '@/types/dayEntry';

type FormValues = {
  status: DayEntryStatus;
  actualMinutes: string;
  comment: string;
};

const STATUSES: { value: DayEntryStatus; label: string; color: string; bg: string }[] = [
  { value: 'hit',     label: 'HIT',     color: COLORS.teal700,    bg: COLORS.teal50 },
  { value: 'partial', label: 'PARTIAL', color: COLORS.warningText, bg: COLORS.warningBg },
  { value: 'miss',    label: 'MISS',    color: COLORS.errorText,   bg: COLORS.errorBg },
];

export default function GoalEntryScreen() {
  const insets = useSafeAreaInsets();
  const { id, elapsedMinutes: elapsed } = useLocalSearchParams<{
    id: string;
    elapsedMinutes?: string;
  }>();

  const today = todayString();
  const { data: goals } = useGoals(false);
  const goal = goals?.find((g) => g.id === id);

  const { data: entries } = useDayEntriesByDate(today);
  const existingEntry = entries?.find((e) => e.goalId === id);

  const { mutate: upsert, isPending } = useUpsertDayEntry();

  const elapsedFromTimer = elapsed ? parseInt(elapsed, 10) : 0;
  const currentMinutes = (existingEntry?.actualMinutes ?? 0) + elapsedFromTimer;

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      status: existingEntry?.status ?? 'partial',
      actualMinutes: String(currentMinutes),
      comment: existingEntry?.comment ?? '',
    },
  });

  useEffect(() => {
    if (existingEntry) {
      setValue('status', existingEntry.status);
      setValue('actualMinutes', String(currentMinutes));
      setValue('comment', existingEntry.comment);
    }
  }, [existingEntry]);

  const watchedStatus = watch('status');

  const onSubmit = (data: FormValues) => {
    if (!id) return;
    upsert(
      {
        goalId: id,
        date: today,
        status: data.status,
        actualMinutes: parseInt(data.actualMinutes, 10) || 0,
        comment: data.comment,
      },
      { onSuccess: () => router.back() },
    );
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {goal?.title ?? 'Log Entry'}
          </Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {elapsedFromTimer > 0 && (
          <View style={styles.timerBanner}>
            <Text style={styles.timerBannerText}>
              Timer stopped: {elapsedFromTimer} min added
            </Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>STATUS</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => {
              const isSelected = watchedStatus === s.value;
              return (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setValue('status', s.value)}
                  style={[
                    styles.statusBtn,
                    isSelected && { backgroundColor: s.bg, borderColor: s.color },
                  ]}
                  accessibilityLabel={`Set status to ${s.label}`}
                >
                  <Text style={[styles.statusLabel, { color: isSelected ? s.color : COLORS.neutral400 }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ACTUAL MINUTES</Text>
          <Controller
            control={control}
            name="actualMinutes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Actual minutes"
              />
            )}
          />
          {goal && (
            <Text style={styles.hint}>Allocated: {goal.allocatedMinutes} min</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>COMMENT</Text>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Optional note about this session..."
                placeholderTextColor={COLORS.neutral400}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
                accessibilityLabel="Comment"
              />
            )}
          />
        </View>

        <PrimaryButton
          label="Save"
          onPress={handleSubmit(onSubmit)}
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
  headerInfo: { flex: 1 },
  headerTitle: { ...TYPE.label, color: COLORS.neutral0, fontSize: 14 },
  headerDate: { ...TYPE.caption, color: COLORS.teal300, marginTop: 2 },
  scroll: { padding: SPACING.s4, paddingBottom: SPACING.s16 },
  timerBanner: {
    backgroundColor: COLORS.teal100,
    borderRadius: RADIUS.card,
    padding: SPACING.s3,
    marginBottom: SPACING.s6,
    borderWidth: 1,
    borderColor: COLORS.teal300,
  },
  timerBannerText: { ...TYPE.small, color: COLORS.teal700 },
  field: { marginBottom: SPACING.s6 },
  label: { ...TYPE.label, color: COLORS.teal600, marginBottom: 6 },
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
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  hint: { ...TYPE.caption, color: COLORS.neutral400, marginTop: 4 },
  statusRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: SPACING.s3,
    alignItems: 'center',
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    backgroundColor: COLORS.neutral0,
  },
  statusLabel: { ...TYPE.label, fontSize: 11 },
});
