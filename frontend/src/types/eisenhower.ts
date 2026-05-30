export type EisenhowerQuadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate';

export interface EisenhowerTask {
  id: string;
  title: string;
  description?: string;
  quadrant: EisenhowerQuadrant;
  delegateTo?: string;
  completedAt?: string;
  createdAt: string;
}

export const QUADRANT_CONFIG: Record<EisenhowerQuadrant, {
  label: string;
  subtitle: string;
  icon: string;
  hue: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}> = {
  'do-first': {
    label: 'Do First',
    subtitle: 'Urgent & Important',
    icon: '🔥',
    hue: '0',
    bgClass: 'bg-red-50 dark:bg-red-950/20',
    borderClass: 'border-red-300 dark:border-red-800',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  'schedule': {
    label: 'Schedule',
    subtitle: 'Important, Not Urgent',
    icon: '📅',
    hue: '221',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20',
    borderClass: 'border-blue-300 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  'delegate': {
    label: 'Delegate',
    subtitle: 'Urgent, Not Important',
    icon: '👥',
    hue: '38',
    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
    borderClass: 'border-amber-300 dark:border-amber-800',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  'eliminate': {
    label: 'Eliminate',
    subtitle: 'Not Urgent, Not Important',
    icon: '🗑️',
    hue: '215',
    bgClass: 'bg-gray-50 dark:bg-gray-950/20',
    borderClass: 'border-gray-300 dark:border-gray-700',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400',
  },
};
