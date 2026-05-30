import { useMemo, useState, useEffect } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Goal, DayEntry, DayStatus, isGoalActiveOnDay } from '@/types/goals';
import { useGoalTracker } from '@/hooks/useGoalTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MissedReasonCombobox } from './MissedReasonCombobox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface DailyDetailViewProps {
  selectedDate: string;
  onBack: () => void;
}

const WORK_HOURS_START = 6;
const WORK_HOURS_END = 22;
const SLOTS_PER_HOUR = 4; // 15-min intervals
const TOTAL_SLOTS = (WORK_HOURS_END - WORK_HOURS_START) * SLOTS_PER_HOUR;
const CELL_PX = 24;
const TASK_COLUMN_WIDTH = 220;
const ROW_HEIGHT = 44;
const BAR_HEIGHT = 32;
const RULER_ROW_HEIGHT = 56;

const timelineWidthPx = TOTAL_SLOTS * CELL_PX;

const timeToSlotIndex = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h - WORK_HOURS_START) * SLOTS_PER_HOUR + Math.floor(m / 15);
};

const timeToLeftPx = (time: string) => timeToSlotIndex(time) * CELL_PX;

const durationToWidthPx = (startTime: string, endTime: string) => {
  const startSlots = timeToSlotIndex(startTime);
  const [eh, em] = endTime.split(':').map(Number);
  const endSlots = (eh - WORK_HOURS_START) * SLOTS_PER_HOUR + Math.ceil(em / 15);
  const slots = Math.max(1, endSlots - startSlots);
  return Math.max(slots * CELL_PX, 48); // min 48px for click target
};

const slotIndexToTime = (slotIndex: number) => {
  const totalMins = WORK_HOURS_START * 60 + slotIndex * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const DailyDetailView = ({ selectedDate, onBack }: DailyDetailViewProps) => {
  const {
    monthData,
    getEntry,
    updateEntry,
    addTimeBlock,
  } = useGoalTracker();

  const dateObj = parseISO(selectedDate);
  const dayOfWeek = dateObj.getDay();
  const formattedDate = format(dateObj, 'EEEE, MMMM d');
  const shortDate = format(dateObj, 'MMM d');

  const goalsForDay = useMemo(() => {
    return monthData.goals
      .filter((g) => !g.completedAt && isGoalActiveOnDay(g, dayOfWeek))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [monthData.goals, dayOfWeek]);

  const dayStatusCounts = useMemo(() => {
    let hit = 0, partial = 0, miss = 0;
    goalsForDay.forEach((g) => {
      const s = getEntry(g.id, selectedDate)?.status ?? 'miss';
      if (s === 'hit') hit++;
      else if (s === 'partial') partial++;
      else miss++;
    });
    return { hit, partial, miss };
  }, [goalsForDay, selectedDate, getEntry]);

  const upcomingGoalId = useMemo(() => {
    const today = startOfDay(new Date());
    const viewingPast = dateObj < today;
    const viewingFuture = dateObj > today;
    if (viewingPast || goalsForDay.length === 0) return null;
    if (viewingFuture) return goalsForDay[0]?.id ?? null;
    const now = format(new Date(), 'HH:mm');
    const inProgress = goalsForDay.find((g) => g.startTime <= now && now < g.endTime);
    if (inProgress) return inProgress.id;
    const next = goalsForDay.find((g) => g.startTime > now);
    return next?.id ?? null;
  }, [dateObj, goalsForDay]);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = selectedGoalId ? goalsForDay.find((g) => g.id === selectedGoalId) : null;
  const selectedEntry = selectedGoal && getEntry(selectedGoal.id, selectedDate);

  const [editStatus, setEditStatus] = useState<DayStatus>('miss');
  const [editActualMinutes, setEditActualMinutes] = useState(0);
  const [editMissedReason, setEditMissedReason] = useState('');
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (!selectedGoalId) return;
    if (selectedEntry) {
      setEditStatus(selectedEntry.status);
      setEditActualMinutes(selectedEntry.actualMinutes ?? 0);
      setEditMissedReason(selectedEntry.missedReason ?? '');
      setEditComment(selectedEntry.comment ?? '');
    } else {
      setEditStatus('miss');
      setEditActualMinutes(0);
      setEditMissedReason('');
      setEditComment('');
    }
  }, [selectedGoalId, selectedEntry]);

  const handleSaveDetails = () => {
    if (!selectedGoal) return;
    updateEntry(selectedGoal.id, selectedDate, {
      status: editStatus,
      actualMinutes: editActualMinutes,
      missedReason: editStatus === 'miss' ? editMissedReason : undefined,
      comment: editComment,
    });
    setSelectedGoalId(null);
  };

  const handleMarkDone = (goal: Goal) => {
    addTimeBlock(goal.id, selectedDate, {
      startTime: goal.startTime,
      endTime: goal.endTime,
      type: 'executed',
      note: 'Completed',
    });
    updateEntry(goal.id, selectedDate, {
      status: 'hit',
      actualMinutes: goal.allocatedMinutes,
    });
    if (selectedGoalId === goal.id) {
      setEditStatus('hit');
      setEditActualMinutes(goal.allocatedMinutes);
    }
  };

  const handleMarkBlocked = (goal: Goal) => {
    addTimeBlock(goal.id, selectedDate, {
      startTime: goal.startTime,
      endTime: goal.endTime,
      type: 'blocked',
      note: 'Blocked',
    });
    updateEntry(goal.id, selectedDate, { status: 'miss' });
    if (selectedGoalId === goal.id) setEditStatus('miss');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0" aria-label="Back to grid">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-lg truncate">{formattedDate}</h1>
          <p className="text-sm text-muted-foreground">
            Gantt · {shortDate} · 15-min · {goalsForDay.length} task{goalsForDay.length === 1 ? '' : 's'}
            {goalsForDay.length > 0 && (dayStatusCounts.hit > 0 || dayStatusCounts.partial > 0 || dayStatusCounts.miss > 0) && (
              <span className="ml-1">
                ·{' '}
                {dayStatusCounts.hit > 0 && <span className="text-rag-green font-medium">{dayStatusCounts.hit} hit</span>}
                {dayStatusCounts.partial > 0 && <>{dayStatusCounts.hit > 0 && ', '}<span className="text-rag-amber font-medium">{dayStatusCounts.partial} partial</span></>}
                {dayStatusCounts.miss > 0 && <>{((dayStatusCounts.hit > 0) || (dayStatusCounts.partial > 0)) && ', '}<span className="text-rag-red font-medium">{dayStatusCounts.miss} todo</span></>}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Gantt grid */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {goalsForDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground px-4">
            <p className="text-sm">No goals scheduled for this day.</p>
            <p className="text-xs">Add goals in the grid view or they may be weekday/weekend-only.</p>
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
          <div className="inline-block min-w-full p-4">
            {/* Time ruler row – vertical labels so they fit without widening */}
            <div
              className="flex border-b-2 border-grid-border bg-muted/40 shrink-0"
              style={{ width: TASK_COLUMN_WIDTH + timelineWidthPx }}
            >
              <div
                className="shrink-0 flex items-center px-3 font-medium text-xs text-muted-foreground border-r border-grid-border"
                style={{ width: TASK_COLUMN_WIDTH, height: RULER_ROW_HEIGHT }}
              >
                Task
              </div>
              <div className="flex shrink-0 relative overflow-hidden" style={{ width: timelineWidthPx, height: RULER_ROW_HEIGHT }}>
                {/* Vertical lines: every 15 min, hour lines bolder */}
                {Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-0 bottom-0 w-px',
                      i % SLOTS_PER_HOUR === 0 ? 'bg-grid-border' : 'bg-grid-border/70'
                    )}
                    style={{ left: i * CELL_PX }}
                  />
                ))}
                {/* 15-min labels: vertical text (writing-mode so they fit) */}
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
                  const mins = (i * 15) % 60;
                  const isHour = mins === 0;
                  const label = mins === 0 ? slotIndexToTime(i) : String(mins).padStart(2, '0');
                  return (
                    <div
                      key={i}
                      className={cn(
                        'absolute flex items-center justify-center font-mono tabular-nums pointer-events-none text-[10px]',
                        isHour ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      )}
                      style={{
                        left: i * CELL_PX,
                        width: CELL_PX,
                        height: RULER_ROW_HEIGHT,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task rows */}
            {goalsForDay.map((goal) => {
              const entry: DayEntry | undefined = getEntry(goal.id, selectedDate);
              const status: DayStatus = entry?.status ?? 'miss';
              const left = timeToLeftPx(goal.startTime);
              const width = durationToWidthPx(goal.startTime, goal.endTime);
              const isUpcoming = goal.id === upcomingGoalId;
              let barColor = 'bg-rag-red/80 hover:bg-rag-red text-white';
              if (status === 'hit') barColor = 'bg-rag-green/90 hover:bg-rag-green text-white';
              else if (status === 'partial') barColor = 'bg-rag-amber/90 hover:bg-rag-amber text-white';

              return (
                <div
                  key={goal.id}
                  className="flex border-b border-grid-border shrink-0 hover:bg-muted/20 transition-colors"
                  style={{ width: TASK_COLUMN_WIDTH + timelineWidthPx, height: ROW_HEIGHT }}
                >
                  {/* Task label – no status icon */}
                  <div
                    className="shrink-0 flex items-center px-3 py-1 border-r border-grid-border bg-card/50"
                    style={{ width: TASK_COLUMN_WIDTH }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{goal.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {goal.startTime} – {goal.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Grid cells + bar */}
                  <div
                    className="relative shrink-0"
                    style={{ width: timelineWidthPx, height: ROW_HEIGHT }}
                  >
                    {/* 15-min grid lines; hour boundaries slightly bolder */}
                    {Array.from({ length: TOTAL_SLOTS - 1 }, (_, i) => {
                      const isHour = (i + 1) % SLOTS_PER_HOUR === 0;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'absolute top-0 bottom-0 w-px',
                            isHour ? 'bg-grid-border' : 'bg-grid-border/70'
                          )}
                          style={{ left: (i + 1) * CELL_PX }}
                        />
                      );
                    })}
                    {/* Task bar (span) – duration on tile, rich tooltip on hover */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => setSelectedGoalId(goal.id)}
                            className={cn(
                              'absolute rounded-md shadow-sm border flex items-center justify-center overflow-hidden transition-colors cursor-pointer',
                              barColor,
                              isUpcoming
                                ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md shadow-primary/20 z-10'
                                : 'border-black/10'
                            )}
                            style={{
                              left,
                              width: Math.min(width, timelineWidthPx - left),
                              minWidth: 48,
                              height: BAR_HEIGHT,
                              top: (ROW_HEIGHT - BAR_HEIGHT) / 2,
                            }}
                          >
                            <span className="font-mono text-[10px] font-semibold truncate px-1.5">
                              {formatDuration(goal.allocatedMinutes)}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] p-3 space-y-1.5 text-left">
                          {isUpcoming && (
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                              {goal.startTime <= format(new Date(), 'HH:mm') && format(new Date(), 'HH:mm') < goal.endTime
                                ? 'In progress'
                                : 'Up next'}
                            </p>
                          )}
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {goal.startTime} – {goal.endTime} · {formatDuration(goal.allocatedMinutes)}
                          </p>
                          <p className="text-xs">
                            {status === 'hit' && 'Hit'}
                            {status === 'partial' && 'Partial'}
                            {status === 'miss' && 'Miss'}
                            {(entry?.actualMinutes ?? 0) > 0 && (
                              <span className="font-mono ml-1">· {entry.actualMinutes}m / {goal.allocatedMinutes}m</span>
                            )}
                          </p>
                          {entry?.comment?.trim() && (
                            <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5 truncate">
                              {entry.comment}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground pt-0.5">Click for details</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
          </TooltipProvider>
        )}
      </div>

      {/* Task detail dialog */}
      <Dialog open={!!selectedGoalId} onOpenChange={(open) => !open && setSelectedGoalId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="font-medium">
                  {selectedGoal.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedDate} · {selectedGoal.startTime} – {selectedGoal.endTime} ({selectedGoal.allocatedMinutes}m)
                </p>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-2">
                    {(['hit', 'partial', 'miss'] as DayStatus[]).map((s) => (
                      <Button
                        key={s}
                        variant={editStatus === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditStatus(s)}
                        className={cn(
                          editStatus === s && s === 'hit' && 'bg-rag-green hover:bg-rag-green/90',
                          editStatus === s && s === 'miss' && 'bg-rag-red hover:bg-rag-red/90',
                          editStatus === s && s === 'partial' && 'bg-rag-amber hover:bg-rag-amber/90'
                        )}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {editStatus !== 'miss' && (
                  <div className="space-y-2">
                    <Label htmlFor="actualMinutes">Actual time (minutes)</Label>
                    <Input
                      id="actualMinutes"
                      type="number"
                      min={0}
                      value={editActualMinutes}
                      onChange={(e) => setEditActualMinutes(Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                )}

                {editStatus === 'miss' && (
                  <div className="space-y-2">
                    <Label>Reason for miss</Label>
                    <MissedReasonCombobox
                      value={editMissedReason}
                      onValueChange={setEditMissedReason}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-rag-green hover:bg-rag-green/90"
                    onClick={() => handleMarkDone(selectedGoal)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Mark done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rag-red border-rag-red/50 hover:bg-rag-red/10"
                    onClick={() => handleMarkBlocked(selectedGoal)}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Mark blocked
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedGoalId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDetails}>Save</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
