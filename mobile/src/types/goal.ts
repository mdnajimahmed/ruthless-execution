export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allocatedMinutes: number;
  tags: string[];
  targetEndDate?: string;
  isWeekendGoal: boolean;
  isWeekdayGoal: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allocatedMinutes: number;
  tags?: string[];
  targetEndDate?: string;
  isWeekendGoal?: boolean;
  isWeekdayGoal?: boolean;
}
