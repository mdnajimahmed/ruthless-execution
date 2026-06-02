import { useState } from 'react';
import { Goal } from '@/types/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
}

export const AddGoalDialog = ({ open, onOpenChange, onAddGoal }: AddGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:30');
  const [isWeekendGoal, setIsWeekendGoal] = useState(false);
  const [isWeekdayGoal, setIsWeekdayGoal] = useState(false);
  const [targetEndDate, setTargetEndDate] = useState<Date | undefined>(addMonths(new Date(), 1));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setStartTime('07:00');
    setEndTime('07:30');
    setIsWeekendGoal(false);
    setIsWeekdayGoal(false);
    setTargetEndDate(addMonths(new Date(), 1));
    setError(null);
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const allocatedMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (allocatedMinutes <= 0) {
      setError('End time must be after start time');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await onAddGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        allocatedMinutes,
        tags: [],
        isWeekendGoal,
        isWeekdayGoal,
        targetEndDate: targetEndDate ? format(targetEndDate, 'yyyy-MM-dd') : undefined,
      });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Morning workout, Read technical docs..."
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this goal about? Why does it matter?"
              rows={2}
              disabled={isLoading}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="font-mono"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="font-mono"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Scope</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekdayGoal"
                  checked={isWeekdayGoal}
                  onCheckedChange={(checked) => {
                    setIsWeekdayGoal(checked === true);
                    if (checked) setIsWeekendGoal(false);
                  }}
                  disabled={isLoading}
                />
                <label
                  htmlFor="weekdayGoal"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Weekday Only
                </label>
                <span className="text-xs text-muted-foreground">(Mon–Fri)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekendGoal"
                  checked={isWeekendGoal}
                  onCheckedChange={(checked) => {
                    setIsWeekendGoal(checked === true);
                    if (checked) setIsWeekdayGoal(false);
                  }}
                  disabled={isLoading}
                />
                <label
                  htmlFor="weekendGoal"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
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
                    !targetEndDate && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetEndDate ? format(targetEndDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetEndDate}
                  onSelect={setTargetEndDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              When do you want to complete this goal?
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!title.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              'Add Goal'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AddGoalButtonProps {
  onClick: () => void;
}

export const AddGoalButton = ({ onClick }: AddGoalButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sticky left-0 z-10 flex items-center gap-2 border-r border-b border-dashed border-grid-border bg-muted/30 px-3 w-[320px] sm:w-[400px] md:w-[480px] shrink-0 h-[52px] min-h-[52px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset"
    >
      <Plus className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">Add goal</span>
    </button>
  );
};
