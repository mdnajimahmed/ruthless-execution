import { apiClient } from './client';
import type {
  EisenhowerTask,
  Quadrant,
  CreateEisenhowerTaskRequest,
  UpdateEisenhowerTaskRequest,
} from '@/types/eisenhower';

export async function getEisenhowerTasks(params?: {
  quadrant?: Quadrant;
  completed?: boolean;
}): Promise<EisenhowerTask[]> {
  const res = await apiClient.get<EisenhowerTask[]>('/eisenhower', { params });
  return res.data;
}

export async function getEisenhowerTask(id: string): Promise<EisenhowerTask> {
  const res = await apiClient.get<EisenhowerTask>(`/eisenhower/${id}`);
  return res.data;
}

export async function createEisenhowerTask(data: CreateEisenhowerTaskRequest): Promise<EisenhowerTask> {
  const res = await apiClient.post<EisenhowerTask>('/eisenhower', data);
  return res.data;
}

export async function updateEisenhowerTask(
  id: string,
  data: UpdateEisenhowerTaskRequest,
): Promise<EisenhowerTask> {
  const res = await apiClient.put<EisenhowerTask>(`/eisenhower/${id}`, data);
  return res.data;
}

export async function completeEisenhowerTask(id: string): Promise<EisenhowerTask> {
  const res = await apiClient.post<EisenhowerTask>(`/eisenhower/${id}/complete`);
  return res.data;
}

export async function uncompleteEisenhowerTask(id: string): Promise<EisenhowerTask> {
  const res = await apiClient.post<EisenhowerTask>(`/eisenhower/${id}/uncomplete`);
  return res.data;
}

export async function moveEisenhowerTask(id: string, quadrant: Quadrant): Promise<EisenhowerTask> {
  const res = await apiClient.post<EisenhowerTask>(`/eisenhower/${id}/move`, { quadrant });
  return res.data;
}

export async function deleteEisenhowerTask(id: string): Promise<void> {
  await apiClient.delete(`/eisenhower/${id}`);
}
