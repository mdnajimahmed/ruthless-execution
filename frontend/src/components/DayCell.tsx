import { useState } from 'react';
import { Goal, DayEntry, DayStatus } from '@/types/goals';
import { StatusIndicator } from './StatusIndicator';
import { MissedReasonCombobox } from './MissedReasonCombobox';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface DayCellProps {
  goal: Goal;
  day: number;
  date: string;
  entry: DayEntry | undefined;
  isOfficeDay: boolean;
  isToday: boolean;
  isPast: boolean;
  cellClassName?: string;
  onToggleStatus: () => void;
  onUpdateEntry: (updates: Partial<DayEntry>) => void;
}

export const DayCell = ({
  goal,
  day,
  date,
  entry,
  isOfficeDay,
  isToday,
  isPast,
  cellClassName,
  onToggleStatus,
  onUpdateEntry,
}: DayCellProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState(entry?.comment || '');
  const [actualMinutes, setActualMinutes] = useState(entry?.actualMinutes || 0);
  const [missedReason, setMissedReason] = useState(entry?.missedReason || '');

  const status: DayStatus = entry?.status || 'miss';
  const hasComment = entry?.comment && entry.comment.length > 0;

  const handleSaveDetails = () => {
    onUpdateEntry({
      comment,
      actualMinutes,
      missedReason: status === 'miss' ? missedReason : undefined,
    });
    setIsDetailOpen(false);
  };

  const handleStatusChange = (newStatus: DayStatus) => {
    if (newStatus === 'miss') {
      setActualMinutes(0);
      onUpdateEntry({ status: newStatus, actualMinutes: 0 });
    } else {
      onUpdateEntry({ status: newStatus });
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Set status for ${goal.title} on ${date}`}
        className={cn(
          'grid-cell grid-cell-interactive relative flex flex-col cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset w-full border-0 text-left',
          cellClassName ?? 'flex-1 min-w-[24px] sm:min-w-[30px]',
          isOfficeDay ? 'grid-cell-office' : 'grid-cell-nonoffice',
          isToday && 'grid-cell-today today-column-highlight',
          !isPast && 'opacity-70'
        )}
        onClick={onToggleStatus}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsDetailOpen(true);
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <StatusIndicator status={status} size="sm" />
        </span>
        {hasComment && (
          <span className="absolute bottom-1.5 right-1.5 pointer-events-none" aria-hidden>
            <MessageSquare className="h-3 w-3 text-muted-foreground/80" />
          </span>
        )}
      </button>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm text-muted-foreground">
              {goal.title} — {date}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(['hit', 'partial', 'miss'] as DayStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      status === s && s === 'hit' && 'bg-rag-green hover:bg-rag-green/90',
                      status === s && s === 'miss' && 'bg-rag-red hover:bg-rag-red/90',
                      status === s && s === 'partial' && 'bg-rag-amber hover:bg-rag-amber/90'
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {status !== 'miss' && (
              <div className="space-y-2">
                <Label htmlFor="actualMinutes">Actual Time (minutes)</Label>
                <Input
                  id="actualMinutes"
                  type="number"
                  min={0}
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(Number(e.target.value))}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Allocated: {goal.allocatedMinutes} min ({goal.startTime} - {goal.endTime})
                </p>
              </div>
            )}

            {status === 'miss' && (
              <div className="space-y-2">
                <Label>Reason for Miss</Label>
                <MissedReasonCombobox
                  value={missedReason}
                  onValueChange={setMissedReason}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDetails}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
