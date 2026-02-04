import { useState, useEffect } from 'react';
import { BacklogItem, BacklogCategory } from '@/types/backlog';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ruthless-execution-backlog';

export const useBacklog = () => {
  const [items, setItems] = useState<BacklogItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  const saveItems = (newItems: BacklogItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const addItem = (item: Omit<BacklogItem, 'id' | 'createdAt'>) => {
    const newItem: BacklogItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    saveItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<Omit<BacklogItem, 'id' | 'createdAt'>>) => {
    saveItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(item => item.id !== id));
  };

  const getItemsByCategory = (category: BacklogCategory) => {
    return items
      .filter(item => item.category === category)
      .sort((a, b) => a.tentativeStartDate.localeCompare(b.tentativeStartDate));
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    getItemsByCategory,
  };
};
