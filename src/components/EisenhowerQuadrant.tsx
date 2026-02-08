import { useState, useRef } from 'react';
import { EisenhowerQuadrant, EisenhowerTask, QUADRANT_CONFIG } from '@/types/eisenhower';
import { EisenhowerTaskCard } from './EisenhowerTaskCard';
import { AddEisenhowerTaskDialog } from './AddEisenhowerTaskDialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EisenhowerQuadrantProps {
  quadrant: EisenhowerQuadrant;
  tasks: EisenhowerTask[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<EisenhowerTask, 'id' | 'createdAt'>>) => void;
  onAdd: (task: { title: string; description?: string; quadrant: EisenhowerQuadrant; delegateTo?: string }) => void;
  onDragStart: (e: React.DragEvent, task: EisenhowerTask) => void;
  onDrop: (e: React.DragEvent, quadrant: EisenhowerQuadrant) => void;
}

export const EisenhowerQuadrantComponent = ({
  quadrant,
  tasks,
  onComplete,
  onDelete,
  onUpdate,
  onAdd,
  onDragStart,
  onDrop,
}: EisenhowerQuadrantProps) => {
  const [dragOver, setDragOver] = useState(false);
  const config = QUADRANT_CONFIG[quadrant];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(e, quadrant);
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border-2 transition-all duration-200 overflow-hidden',
        config.borderClass,
        config.bgClass,
        dragOver && 'ring-2 ring-primary/40 scale-[1.01] shadow-lg'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Quadrant header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            <p className="text-[10px] text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', config.badgeClass)}>
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2 min-h-[120px]">
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-[100px] text-xs text-muted-foreground/60">
              {dragOver ? 'Drop here!' : 'No tasks'}
            </div>
          )}
          {tasks.map((task) => (
            <EisenhowerTaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Add task footer */}
      <div className="p-3 pt-0">
        <AddEisenhowerTaskDialog quadrant={quadrant} onAdd={onAdd} />
      </div>
    </div>
  );
};
