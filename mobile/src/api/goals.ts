import { apiClient } from './client';
import type { Goal, CreateGoalRequest } from '@/types/goal';

export async function getGoals(params?: { completed?: boolean }): Promise<Goal[]> {
  const res = await apiClient.get<Goal[]>('/goals', { params });
  return res.data;
}

export async function getGoal(id: string): Promise<Goal> {
  const res = await apiClient.get<Goal>(`/goals/${id}`);
  return res.data;
}

export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  const res = await apiClient.post<Goal>('/goals', data);
  return res.data;
}

export async function updateGoal(id: string, data: Partial<CreateGoalRequest>): Promise<Goal> {
  const res = await apiClient.put<Goal>(`/goals/${id}`, data);
  return res.data;
}

export async function completeGoal(id: string): Promise<Goal> {
  const res = await apiClient.post<Goal>(`/goals/${id}/complete`);
  return res.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
