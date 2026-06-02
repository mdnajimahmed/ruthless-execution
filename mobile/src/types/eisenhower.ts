export type Quadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate';

export interface EisenhowerTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  quadrant: Quadrant;
  delegateTo?: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEisenhowerTaskRequest {
  title: string;
  description?: string;
  quadrant: Quadrant;
  delegateTo?: string;
}

export interface UpdateEisenhowerTaskRequest {
  title?: string;
  description?: string;
  quadrant?: Quadrant;
  delegateTo?: string;
}
