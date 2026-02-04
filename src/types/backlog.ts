export type BacklogCategory = 'certifications' | 'udemy' | 'books' | 'interview' | 'concepts';

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  category: BacklogCategory;
  tentativeStartDate: string; // "2025-03-15" format
  createdAt: string;
}

export const BACKLOG_CATEGORIES: { key: BacklogCategory; label: string }[] = [
  { key: 'certifications', label: 'Certifications' },
  { key: 'udemy', label: 'Udemy Course' },
  { key: 'books', label: 'Books' },
  { key: 'interview', label: 'Interview' },
  { key: 'concepts', label: 'Concepts/Others' },
];
