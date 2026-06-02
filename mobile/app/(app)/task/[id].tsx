import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, RADIUS, SHADOWS, QUADRANT_COLORS } from '@/config/designTokens';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuadrantBadge } from '@/components/QuadrantBadge';
import {
  useEisenhowerTasks,
  useCreateEisenhowerTask,
  useUpdateEisenhowerTask,
  useCompleteEisenhowerTask,
  useUncompleteEisenhowerTask,
  useMoveEisenhowerTask,
  useDeleteEisenhowerTask,
} from '@/hooks/useEisenhower';
import { useTimerStore } from '@/stores/timerStore';
import type { Quadrant } from '@/types/eisenhower';

type FormValues = {
  title: string;
  description: string;
  quadrant: Quadrant;
  delegateTo: string;
};

const QUADRANTS: Quadrant[] = ['do-first', 'schedule', 'delegate', 'eliminate'];

export default function TaskDetailScreen() {
  const { id, quadrant: defaultQuadrant } = useLocalSearchParams<{
    id: string;
    quadrant?: Quadrant;
  }>();
  const isNew = id === 'new';

  const { data: tasks } = useEisenhowerTasks();
  const task = tasks?.find((t) => t.id === id);

  const { mutate: create, isPending: creating } = useCreateEisenhowerTask();
  const { mutate: update, isPending: updating } = useUpdateEisenhowerTask();
  const { mutate: complete } = useCompleteEisenhowerTask();
  const { mutate: uncomplete } = useUncompleteEisenhowerTask();
  const { mutate: move } = useMoveEisenhowerTask();
  const { mutate: remove } = useDeleteEisenhowerTask();
  const timerStore = useTimerStore();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      quadrant: (task?.quadrant ?? defaultQuadrant ?? 'do-first') as Quadrant,
      delegateTo: task?.delegateTo ?? '',
    },
  });

  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description ?? '');
      setValue('quadrant', task.quadrant);
      setValue('delegateTo', task.delegateTo ?? '');
    }
  }, [task]);

  const watchedQuadrant = watch('quadrant');
  const isDelegate = watchedQuadrant === 'delegate';

  const onSubmit = (data: FormValues) => {
    if (isNew) {
      create(
        { title: data.title, description: data.description || undefined, quadrant: data.quadrant, delegateTo: data.delegateTo || undefined },
        { onSuccess: () => router.back() },
      );
    } else if (task) {
      update(
        { id: task.id, data: { title: data.title, description: data.description || undefined, delegateTo: data.delegateTo || undefined } },
        {
          onSuccess: () => {
            if (data.quadrant !== task.quadrant) {
              move({ id: task.id, quadrant: data.quadrant });
            }
            router.back();
          },
        },
      );
    }
  };

  const handleFocus = () => {
    if (!task) return;
    timerStore.start({
      taskId: task.id,
      taskType: 'eisenhower',
      taskTitle: task.title,
      allocatedMinutes: null,
    });
    router.push('/(app)/timer');
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert('Delete Task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        remove(task.id, { onSuccess: () => router.back() });
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.neutral0} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? 'NEW TASK' : 'TASK'}</Text>
        {!isNew && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            accessibilityLabel="Delete task"
          >
            <Trash2 size={18} color={COLORS.errorDefault} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>TITLE *</Text>
          <Controller
            control={control}
            name="title"
            rules={{ required: 'Title is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="What needs to be done?"
                placeholderTextColor={COLORS.neutral400}
                onChangeText={onChange}
                value={value}
                multiline
                accessibilityLabel="Task title"
              />
            )}
          />
          {errors.title && <Text style={styles.fieldError}>⚠ {errors.title.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Optional details..."
                placeholderTextColor={COLORS.neutral400}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
                accessibilityLabel="Task description"
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>QUADRANT</Text>
          <View style={styles.quadrantGrid}>
            {QUADRANTS.map((q) => {
              const isSelected = watchedQuadrant === q;
              const color = QUADRANT_COLORS[q];
              return (
                <TouchableOpacity
                  key={q}
                  onPress={() => setValue('quadrant', q)}
                  style={[
                    styles.quadrantOption,
                    isSelected && { backgroundColor: color.badgeBg, borderColor: color.border },
                  ]}
                  accessibilityLabel={`Select ${color.label} quadrant`}
                >
                  <Text style={[
                    styles.quadrantOptionLabel,
                    { color: isSelected ? color.badgeText : COLORS.neutral400 },
                  ]}>
                    {color.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isDelegate && (
          <View style={styles.field}>
            <Text style={styles.label}>DELEGATE TO</Text>
            <Controller
              control={control}
              name="delegateTo"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Person's name"
                  placeholderTextColor={COLORS.neutral400}
                  onChangeText={onChange}
                  value={value}
                  accessibilityLabel="Delegate to"
                />
              )}
            />
          </View>
        )}

        {!isNew && task && !task.completedAt && (
          <PrimaryButton
            label="▶  Start Focus Timer"
            onPress={handleFocus}
            variant="secondary"
            fullWidth
          />
        )}

        {!isNew && task && (
          <View style={styles.completeRow}>
            <PrimaryButton
              label={task.completedAt ? '↩ Mark Incomplete' : '✓ Mark Complete'}
              onPress={() => task.completedAt ? uncomplete(task.id) : complete(task.id)}
              variant={task.completedAt ? 'ghost' : 'primary'}
              fullWidth
            />
          </View>
        )}

        <View style={styles.saveRow}>
          <PrimaryButton
            label={isNew ? 'Create Task' : 'Save Changes'}
            onPress={handleSubmit(onSubmit)}
            fullWidth
            loading={creating || updating}
          />
        </View>
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
    paddingVertical: SPACING.s4,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.s3,
  },
  headerTitle: { ...TYPE.label, color: COLORS.neutral0, fontSize: 14, flex: 1 },
  deleteBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: SPACING.s4, paddingBottom: SPACING.s16 },
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
  inputError: { borderColor: COLORS.errorBorder },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  fieldError: { ...TYPE.caption, color: COLORS.errorText, marginTop: 4 },
  quadrantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s2,
  },
  quadrantOption: {
    paddingVertical: SPACING.s2,
    paddingHorizontal: SPACING.s3,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    backgroundColor: COLORS.neutral0,
  },
  quadrantOptionLabel: { ...TYPE.label, fontSize: 10 },
  completeRow: { marginBottom: SPACING.s3 },
  saveRow: { marginTop: SPACING.s2 },
});
