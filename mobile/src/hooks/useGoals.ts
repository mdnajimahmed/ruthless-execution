import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, createGoal, updateGoal, completeGoal, deleteGoal } from '@/api/goals';
import type { CreateGoalRequest } from '@/types/goal';

export const GOALS_KEY = 'goals';

export function useGoals(completed?: boolean) {
  return useQuery({
    queryKey: [GOALS_KEY, { completed }],
    queryFn: () => getGoals({ completed }),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => createGoal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGoalRequest> }) =>
      updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useCompleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}
