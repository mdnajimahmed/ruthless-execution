import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDayEntriesForGoal,
  getDayEntriesByDateRange,
  upsertDayEntry,
  updateDayEntry,
} from '@/api/dayEntries';
import type { UpsertDayEntryRequest } from '@/types/dayEntry';

export const DAY_ENTRIES_KEY = 'day-entries';

export function useDayEntriesForGoal(goalId: string) {
  return useQuery({
    queryKey: [DAY_ENTRIES_KEY, 'goal', goalId],
    queryFn: () => getDayEntriesForGoal(goalId),
  });
}

export function useDayEntriesByDate(date: string) {
  return useQuery({
    queryKey: [DAY_ENTRIES_KEY, 'range', date],
    queryFn: () => getDayEntriesByDateRange(date, date),
  });
}

export function useUpsertDayEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertDayEntryRequest) => upsertDayEntry(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [DAY_ENTRIES_KEY] });
    },
  });
}

export function useUpdateDayEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpsertDayEntryRequest> }) =>
      updateDayEntry(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DAY_ENTRIES_KEY] }),
  });
}
