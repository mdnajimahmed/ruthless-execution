import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';

const KEYS = {
  goals: 'rex-bg-goals',
  entries: 'rex-bg-entries',
  activeTaskId: 'rex-bg-activeTaskId',
} as const;

export async function persistGoalsForBackground(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.goals, JSON.stringify(goals));
}

export async function persistEntriesForBackground(entries: DayEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.entries, JSON.stringify(entries));
}

export async function persistActiveTaskIdForBackground(id: string | null): Promise<void> {
  await AsyncStorage.setItem(KEYS.activeTaskId, id ?? '');
}

export async function readGoalsFromStorage(): Promise<Goal[]> {
  const raw = await AsyncStorage.getItem(KEYS.goals);
  return raw ? JSON.parse(raw) : [];
}

export async function readEntriesFromStorage(): Promise<DayEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.entries);
  return raw ? JSON.parse(raw) : [];
}

export async function readActiveTaskIdFromStorage(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(KEYS.activeTaskId);
  return raw || null;
}
