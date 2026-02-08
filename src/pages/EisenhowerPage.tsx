import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEisenhower } from '@/hooks/useEisenhower';
import { EisenhowerQuadrantComponent } from '@/components/EisenhowerQuadrant';
import { EisenhowerQuadrant, EisenhowerTask, QUADRANT_CONFIG } from '@/types/eisenhower';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const QUADRANTS: EisenhowerQuadrant[] = ['do-first', 'schedule', 'delegate', 'eliminate'];

const EisenhowerPage = () => {
  const { addTask, updateTask, deleteTask, completeTask, moveTask, getTasksByQuadrant } = useEisenhower();
  const [draggedTask, setDraggedTask] = useState<EisenhowerTask | null>(null);

  const handleDragStart = (e: React.DragEvent, task: EisenhowerTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    // Make the drag ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      setTimeout(() => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '1';
        }
      }, 0);
    }
  };

  const handleDrop = (_e: React.DragEvent, quadrant: EisenhowerQuadrant) => {
    if (draggedTask && draggedTask.quadrant !== quadrant) {
      moveTask(draggedTask.id, quadrant);
    }
    setDraggedTask(null);
  };

  const handleAdd = (task: { title: string; description?: string; quadrant: EisenhowerQuadrant; delegateTo?: string }) => {
    addTask(task);
  };

  // Calculate summary stats
  const stats = QUADRANTS.map((q) => ({
    quadrant: q,
    count: getTasksByQuadrant(q).length,
    config: QUADRANT_CONFIG[q],
  }));
  const totalActive = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-sm flex items-center gap-2">
              Eisenhower Matrix
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Prioritize tasks by urgency and importance. Drag tasks between quadrants to re-prioritize.
                </TooltipContent>
              </Tooltip>
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalActive} active tasks across {stats.filter(s => s.count > 0).length} quadrants
            </p>
          </div>
        </div>

        {/* Mini stat pills */}
        <div className="flex items-center gap-1.5">
          {stats.map((s) => (
            <div
              key={s.quadrant}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full"
              style={{
                backgroundColor: `hsl(${s.config.hue} 70% 95%)`,
                color: `hsl(${s.config.hue} 70% 35%)`,
              }}
            >
              <span>{s.config.icon}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Axis labels */}
      <div className="relative flex-1 overflow-hidden">
        {/* Urgency axis label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span className="text-destructive">← Urgent</span>
          <span className="w-px h-3 bg-border" />
          <span className="text-muted-foreground/50">Not Urgent →</span>
        </div>

        {/* Importance axis label */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
            <span className="text-primary rotate-180">← Important</span>
            <span className="w-3 h-px bg-border" />
            <span className="text-muted-foreground/50 rotate-180">Not Important →</span>
          </div>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3 p-4 pl-8 pt-8 h-full">
          {QUADRANTS.map((q) => (
            <EisenhowerQuadrantComponent
              key={q}
              quadrant={q}
              tasks={getTasksByQuadrant(q)}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onAdd={handleAdd}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EisenhowerPage;
