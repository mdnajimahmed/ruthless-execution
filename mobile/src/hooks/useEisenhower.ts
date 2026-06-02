import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEisenhowerTasks,
  createEisenhowerTask,
  updateEisenhowerTask,
  completeEisenhowerTask,
  uncompleteEisenhowerTask,
  moveEisenhowerTask,
  deleteEisenhowerTask,
} from '@/api/eisenhower';
import type { Quadrant, CreateEisenhowerTaskRequest, UpdateEisenhowerTaskRequest } from '@/types/eisenhower';

export const EISENHOWER_KEY = 'eisenhower';

export function useEisenhowerTasks(quadrant?: Quadrant, completed?: boolean) {
  return useQuery({
    queryKey: [EISENHOWER_KEY, { quadrant, completed }],
    queryFn: () => getEisenhowerTasks({ quadrant, completed }),
  });
}

export function useCreateEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEisenhowerTaskRequest) => createEisenhowerTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}

export function useUpdateEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEisenhowerTaskRequest }) =>
      updateEisenhowerTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}

export function useCompleteEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeEisenhowerTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}

export function useUncompleteEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uncompleteEisenhowerTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}

export function useMoveEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quadrant }: { id: string; quadrant: Quadrant }) =>
      moveEisenhowerTask(id, quadrant),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}

export function useDeleteEisenhowerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEisenhowerTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EISENHOWER_KEY] }),
  });
}
