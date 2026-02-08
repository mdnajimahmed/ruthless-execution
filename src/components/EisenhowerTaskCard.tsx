import { useState } from 'react';
import { EisenhowerTask, EisenhowerQuadrant, QUADRANT_CONFIG } from '@/types/eisenhower';
import { Check, GripVertical, Trash2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EisenhowerTaskCardProps {
  task: EisenhowerTask;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<EisenhowerTask, 'id' | 'createdAt'>>) => void;
  onDragStart: (e: React.DragEvent, task: EisenhowerTask) => void;
}

export const EisenhowerTaskCard = ({
  task,
  onComplete,
  onDelete,
  onUpdate,
  onDragStart,
}: EisenhowerTaskCardProps) => {
  const [editingDelegate, setEditingDelegate] = useState(false);
  const [delegateValue, setDelegateValue] = useState(task.delegateTo || '');
  const config = QUADRANT_CONFIG[task.quadrant];

  const handleDelegateSave = () => {
    onUpdate(task.id, { delegateTo: delegateValue.trim() || undefined });
    setEditingDelegate(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-lg border bg-card shadow-sm cursor-grab active:cursor-grabbing',
        'transition-all duration-150 hover:shadow-md hover:-translate-y-0.5',
        'active:shadow-lg active:scale-[1.02]'
      )}
    >
      <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0" />

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium leading-tight">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Delegate to field - only for delegate quadrant */}
        {task.quadrant === 'delegate' && (
          <div className="mt-1.5">
            {editingDelegate ? (
              <div className="flex items-center gap-1">
                <Input
                  value={delegateValue}
                  onChange={(e) => setDelegateValue(e.target.value)}
                  placeholder="Enter name..."
                  className="h-6 text-xs px-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDelegateSave();
                    if (e.key === 'Escape') setEditingDelegate(false);
                  }}
                />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleDelegateSave}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingDelegate(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingDelegate(true)}
                className={cn(
                  'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full transition-colors',
                  task.delegateTo
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                <User className="h-2.5 w-2.5" />
                {task.delegateTo || 'Assign to...'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-green-600"
          onClick={() => onComplete(task.id)}
          title="Complete"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
