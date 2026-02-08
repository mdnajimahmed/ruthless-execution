import { useState, useEffect } from 'react';
import { EisenhowerTask, EisenhowerQuadrant } from '@/types/eisenhower';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ruthless-execution-eisenhower';

const generateSeedData = (): EisenhowerTask[] => {
  return [
    { id: uuidv4(), title: 'Fix production bug on login page', quadrant: 'do-first', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Prepare quarterly report', description: 'Due this Friday', quadrant: 'do-first', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Learn GraphQL fundamentals', quadrant: 'schedule', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Plan team offsite agenda', quadrant: 'schedule', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Reply to vendor emails', quadrant: 'delegate', delegateTo: 'Sarah', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Update meeting notes', quadrant: 'delegate', delegateTo: 'Mike', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Organize old bookmarks', quadrant: 'eliminate', createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Attend optional status meeting', quadrant: 'eliminate', createdAt: new Date().toISOString() },
  ];
};

export const useEisenhower = () => {
  const [tasks, setTasks] = useState<EisenhowerTask[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    } else {
      const seed = generateSeedData();
      setTasks(seed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
  }, []);

  const saveTasks = (newTasks: EisenhowerTask[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };

  const addTask = (task: Omit<EisenhowerTask, 'id' | 'createdAt'>) => {
    const newTask: EisenhowerTask = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    saveTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Omit<EisenhowerTask, 'id' | 'createdAt'>>) => {
    saveTasks(tasks.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const completeTask = (id: string) => {
    saveTasks(tasks.map(t => (t.id === id ? { ...t, completedAt: new Date().toISOString() } : t)));
  };

  const uncompleteTask = (id: string) => {
    saveTasks(tasks.map(t => (t.id === id ? { ...t, completedAt: undefined } : t)));
  };

  const moveTask = (id: string, newQuadrant: EisenhowerQuadrant) => {
    saveTasks(tasks.map(t => (t.id === id ? { ...t, quadrant: newQuadrant } : t)));
  };

  const getTasksByQuadrant = (quadrant: EisenhowerQuadrant) => {
    return tasks.filter(t => t.quadrant === quadrant && !t.completedAt);
  };

  const getCompletedTasks = () => {
    return tasks.filter(t => !!t.completedAt).sort((a, b) => {
      return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime();
    });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    moveTask,
    getTasksByQuadrant,
    getCompletedTasks,
  };
};
