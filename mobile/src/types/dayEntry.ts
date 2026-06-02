export type DayEntryStatus = 'hit' | 'miss' | 'partial';

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  type: 'executed' | 'blocked';
  note?: string;
}

export interface DayEntry {
  id: string;
  goalId: string;
  date: string;
  status: DayEntryStatus;
  actualMinutes: number;
  comment: string;
  missedReason?: string;
  timeBlocks: TimeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDayEntryRequest {
  goalId: string;
  date: string;
  status: DayEntryStatus;
  actualMinutes?: number;
  comment?: string;
  missedReason?: string;
}
