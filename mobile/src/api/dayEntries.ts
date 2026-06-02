import { apiClient } from './client';
import type { DayEntry, UpsertDayEntryRequest } from '@/types/dayEntry';

export async function getDayEntriesForGoal(goalId: string): Promise<DayEntry[]> {
  const res = await apiClient.get<DayEntry[]>(`/day-entries/goal/${goalId}`);
  return res.data;
}

export async function getDayEntriesByDateRange(
  startDate: string,
  endDate: string,
): Promise<DayEntry[]> {
  const res = await apiClient.get<DayEntry[]>(`/day-entries/date/${startDate}/${endDate}`);
  return res.data;
}

export async function upsertDayEntry(data: UpsertDayEntryRequest): Promise<DayEntry> {
  const res = await apiClient.post<DayEntry>('/day-entries', data);
  return res.data;
}

export async function updateDayEntry(
  id: string,
  data: Partial<UpsertDayEntryRequest>,
): Promise<DayEntry> {
  const res = await apiClient.put<DayEntry>(`/day-entries/${id}`, data);
  return res.data;
}
