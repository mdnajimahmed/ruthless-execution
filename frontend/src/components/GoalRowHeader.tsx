import { useState } from 'react';
import { Goal, GoalAnalytics } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Flame,
  TrendingUp,
  BarChart3,
  CalendarIcon,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface GoalRowHeaderProps {
  goal: Goal;
  analytics: GoalAnalytics;
  onUpdate: (updates: Partial<Goal>) => Promise<Goal>;
  onComplete?: () => void;
  onUncomplete?: () => void;
  onDelete: () => void;
  onViewAnalytics?: () => void;
}

const formatDuration = (minutes: number) => {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

export const GoalRowHeader = ({
  goal,
  analytics,
  onUpdate,
  onComplete,
  onUncomplete,
  onDelete,
  onViewAnalytics,
}: GoalRowHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editIsWeekendGoal, setEditIsWeekendGoal] = useState(false);
  const [editIsWeekdayGoal, setEditIsWeekdayGoal] = useState(false);
  const [editTargetEndDate, setEditTargetEndDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenEdit = () => {
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? '');
    setEditStartTime(goal.startTime);
    setEditEndTime(goal.endTime);
    setEditIsWeekendGoal(goal.isWeekendGoal || false);
    setEditIsWeekdayGoal(goal.isWeekdayGoal || false);
    setEditTargetEndDate(goal.targetEndDate ? parseISO(goal.targetEndDate) : undefined);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    const [startH, startM] = editStartTime.split(':').map(Number);
    const [endH, endM] = editEndTime.split(':').map(Number);
    const allocatedMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (allocatedMinutes <= 0) {
      setSaveError('End time must be after start time');
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await onUpdate({
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        startTime: editStartTime,
        endTime: editEndTime,
        allocatedMinutes,
        isWeekendGoal: editIsWeekendGoal,
        isWeekdayGoal: editIsWeekdayGoal,
        targetEndDate: editTargetEndDate ? format(editTargetEndDate, 'yyyy-MM-dd') : undefined,
      });
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const ragStatus = analytics.completionRate >= 80 ? 'hit' :
                    analytics.completionRate >= 50 ? 'partial' :
                    analytics.completionRate > 0 ? 'miss' : 'pending';

  const isCompleted = !!goal.completedAt;

  return (
    <div className={cn(
      'sticky left-0 z-10 flex items-center gap-2 border-r border-b border-grid-border px-3 w-[320px] sm:w-[400px] md:w-[480px] shrink-0 min-h-[68px] h-[68px] transition-colors',
      isCompleted ? 'bg-muted/30' : 'bg-card'
    )}>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isCompleted && (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className={cn(
              'font-medium text-xs truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}>{goal.title}</h3>
            {(goal.isWeekendGoal || goal.isWeekdayGoal) && (
              <span className="inline-flex rounded bg-accent px-1 py-0.5 text-[9px] font-medium text-accent-foreground shrink-0">
                {goal.isWeekendGoal ? 'WE' : 'WD'}
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {goal.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono leading-tight">
            <span className="whitespace-nowrap">{goal.startTime}–{goal.endTime}</span>
            {goal.targetEndDate && (
              <span className="whitespace-nowrap inline-flex items-center gap-0.5">
                <CalendarIcon className="h-2.5 w-2.5" />
                {format(parseISO(goal.targetEndDate), 'MMM d')}
              </span>
            )}
            <span className="text-foreground">{formatDuration(goal.allocatedMinutes)}</span>
            <Flame className="h-2.5 w-2.5 text-rag-amber shrink-0" />
            <span>{analytics.currentStreak}</span>
            <TrendingUp className="h-2.5 w-2.5 text-rag-green shrink-0" />
            <span>{analytics.completionRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {onViewAnalytics && (
            <DropdownMenuItem onClick={onViewAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </DropdownMenuItem>
          )}
          {goal.completedAt ? (
            onUncomplete && (
              <DropdownMenuItem onClick={onUncomplete}>
                <Circle className="mr-2 h-4 w-4" />
                Uncomplete
              </DropdownMenuItem>
            )
          ) : (
            onComplete && (
              <DropdownMenuItem onClick={onComplete}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditing} onOpenChange={(open) => { if (!isSaving) setIsEditing(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Goal title"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What is this goal about? Why does it matter?"
                rows={2}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="font-mono"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="font-mono"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Scope</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editWeekdayGoal"
                    checked={editIsWeekdayGoal}
                    onCheckedChange={(checked) => {
                      setEditIsWeekdayGoal(checked === true);
                      if (checked) setEditIsWeekendGoal(false);
                    }}
                    disabled={isSaving}
                  />
                  <label htmlFor="editWeekdayGoal" className="text-sm leading-none">
                    Weekday Only
                  </label>
                  <span className="text-xs text-muted-foreground">(Mon–Fri)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editWeekendGoal"
                    checked={editIsWeekendGoal}
                    onCheckedChange={(checked) => {
                      setEditIsWeekendGoal(checked === true);
                      if (checked) setEditIsWeekdayGoal(false);
                    }}
                    disabled={isSaving}
                  />
                  <label htmlFor="editWeekendGoal" className="text-sm leading-none">
                    Weekend Only
                  </label>
                  <span className="text-xs text-muted-foreground">(Sat & Sun)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editTargetEndDate && 'text-muted-foreground'
                    )}
                    disabled={isSaving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editTargetEndDate ? format(editTargetEndDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editTargetEndDate}
                    onSelect={setEditTargetEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {saveError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editTitle.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
