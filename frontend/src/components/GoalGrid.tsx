import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isBefore, startOfDay, subDays, addDays } from 'date-fns';
import { isGoalActiveOnDay } from '@/types/goals';
import { useGoalTracker } from '@/hooks/useGoalTracker';
import { GoalRowHeader } from './GoalRowHeader';
import { DayCell } from './DayCell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarIcon, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/use-mobile';

/* All dates use the user's local timezone (browser). No UTC conversion for display. */
const MIN_CELL_PX = 44;
const MAX_VISIBLE_DAYS = 31;

interface GoalGridProps {
  showCompleted?: boolean; // If true, show only completed goals; if false, show only in-progress
}

export const GoalGrid = ({ showCompleted = false }: GoalGridProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    currentYear,
    currentMonth,
    monthData,
    updateGoal,
    completeGoal,
    uncompleteGoal,
    deleteGoal,
    getEntry,
    updateEntry,
    toggleDayStatus,
    toggleNonOfficeDay,
    goToMonth,
    calculateGoalAnalytics,
  } = useGoalTracker();

  const gridScrollRef = useRef<HTMLDivElement>(null);
  const stickyColRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedGoals = useMemo(() => {
    const list = [...monthData.goals].filter((goal) =>
      showCompleted ? !!goal.completedAt : !goal.completedAt
    );
    list.sort((a, b) => {
      if (showCompleted && a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
      const startCompare = a.startTime.localeCompare(b.startTime);
      if (startCompare !== 0) return startCompare;
      return a.endTime.localeCompare(b.endTime);
    });
    return list;
  }, [monthData.goals, showCompleted]);

  // Measure available width; columns divide it evenly so the grid always fills 100%.
  const [dateColumnsWidth, setDateColumnsWidth] = useState(0);
  useEffect(() => {
    const scrollEl = gridScrollRef.current;
    const stickyEl = stickyColRef.current;
    if (!scrollEl || !stickyEl) return;
    const update = () => {
      const viewportW = scrollEl.clientWidth;
      const firstColW = stickyEl.clientWidth;
      setDateColumnsWidth(Math.max(0, viewportW - firstColW));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [filteredAndSortedGoals.length]);

  // N = as many days as fit (odd for centering today). Column width = space / N so grid fills 100%.
  const { visibleDays, columnWidthPx } = useMemo(() => {
    if (dateColumnsWidth <= 0) return { visibleDays: 7, columnWidthPx: 56 };
    let n = Math.floor(dateColumnsWidth / MIN_CELL_PX);
    n = Math.max(5, Math.min(MAX_VISIBLE_DAYS, n));
    if (n % 2 === 0) n -= 1;
    const w = n > 0 ? dateColumnsWidth / n : 56;
    return { visibleDays: n, columnWidthPx: w };
  }, [dateColumnsWidth]);

  // User's local "today". Window is centered on centerDate.
  const today = startOfDay(new Date());
  const [centerDate, setCenterDate] = useState<Date>(() => startOfDay(new Date()));

  const days = useMemo(() => {
    const half = Math.floor(visibleDays / 2);
    const start = subDays(centerDate, half);
    return Array.from({ length: visibleDays }, (_, i) => addDays(start, i));
  }, [centerDate, visibleDays]);

  const handlePreviousRange = () => {
    setCenterDate((prev) => subDays(prev, visibleDays));
  };

  const handleNextRange = () => {
    setCenterDate((prev) => addDays(prev, visibleDays));
  };

  const handleGoToToday = () => {
    const now = startOfDay(new Date());
    setCenterDate(now);
    goToMonth(now.getFullYear(), now.getMonth());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const atStartOfDay = startOfDay(date);
      setCenterDate(atStartOfDay);
      goToMonth(atStartOfDay.getFullYear(), atStartOfDay.getMonth());
    }
  };

  const handleSelectDay = (date: string) => {
    navigate(`/day/${date}`);
  };

  const getDayInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    const dayNumber = date.getDate();

    const isInCurrentMonth = date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    const isNonOffice = isInCurrentMonth && monthData.nonOfficeDays.includes(dayNumber);

    const isTodayDate = isToday(date);
    const isPast = isBefore(startOfDay(date), startOfDay(today)) || isTodayDate;

    return {
      date: dateStr,
      dayNumber,
      dayOfWeek,
      isOfficeDay: !isNonOffice,
      isToday: isTodayDate,
      isPast,
      dayName: format(date, 'EEE'),
    };
  };

  const startDateFormatted = format(days[0], 'MMM d');
  const endDateFormatted = format(days.at(-1) ?? days[0], isMobile ? 'MMM d' : 'MMM d, yyyy');
  const isViewingToday = days.some((d) => isToday(d));

  return (
    <div className="flex flex-col h-full">
      {/* Header: all dates in user's local timezone */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b bg-card">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousRange}
            className="h-7 w-7 sm:h-8 sm:w-8"
            title="Previous days"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-0 sm:min-w-[200px] justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm px-2 sm:px-4"
              >
                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{startDateFormatted} – {endDateFormatted}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={centerDate}
                onSelect={handleDateSelect}
                defaultMonth={centerDate}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextRange}
            className="h-7 w-7 sm:h-8 sm:w-8"
            title="Next days"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant={isViewingToday ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleGoToToday}
            className="gap-1.5 text-xs"
            title="Jump to today (your local date)"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </Button>
        </div>
      </div>

      {/* Grid: column-based so today gets one continuous highlight; N columns from available width */}
      <div ref={gridScrollRef} className="flex-1 overflow-auto scrollbar-thin">
        {filteredAndSortedGoals.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground px-4">
            <div className="text-center">
              <p className="text-sm">
                {showCompleted ? 'No completed goals yet' : 'No goals yet'}
              </p>
              <p className="text-xs mt-1">
                {showCompleted
                  ? 'Complete a goal to see it here'
                  : 'Click "Add Goal" to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0">
            {/* Sticky first column: header placeholder + goal row headers + add goal */}
            <div
              ref={stickyColRef}
              className="sticky left-0 z-30 flex flex-col border-r border-grid-border bg-card shrink-0 w-[320px] sm:w-[400px] md:w-[480px]"
            >
              <div className="shrink-0 border-b border-grid-border bg-grid-header h-[52px] min-h-[52px]" />
              {filteredAndSortedGoals.map((goal) => (
                <GoalRowHeader
                  key={goal.id}
                  goal={goal}
                  analytics={calculateGoalAnalytics(goal.id)}
                  onUpdate={(updates) => updateGoal(goal.id, updates)}
                  onComplete={() => completeGoal(goal.id)}
                  onUncomplete={() => uncompleteGoal(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onViewAnalytics={() => navigate(`/goal-analytics/${goal.id}`)}
                />
              ))}
            </div>

            {/* Day columns: wrapper = dateColumnsWidth so grid fills viewport; each column = columnWidthPx */}
            <div
              className="flex shrink-0"
              style={{ width: dateColumnsWidth > 0 ? dateColumnsWidth : undefined }}
            >
            {days.map((date) => {
              const info = getDayInfo(date);
              return (
                <div
                  key={info.date}
                  style={{ width: columnWidthPx, minWidth: columnWidthPx }}
                  className={cn(
                    'flex flex-col shrink-0',
                    info.isToday && 'today-column-accent'
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      'sticky top-0 z-20 grid-cell grid-header flex flex-col items-center justify-center gap-0 shrink-0 h-[52px] min-h-[52px] cursor-pointer border-r border-b border-grid-border transition-colors hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset w-full border-0 !py-1',
                      !info.isToday && 'bg-card',
                      !info.isOfficeDay && !info.isToday && 'bg-day-nonoffice',
                      info.isToday && 'today-column-header'
                    )}
                    onClick={() => handleSelectDay(info.date)}
                    onDoubleClick={() => {
                      if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                        toggleNonOfficeDay(info.dayNumber);
                      }
                    }}
                    title="Click to view day details. Double-click to toggle office/non-office day."
                  >
                    <span className="text-[10px] leading-tight text-muted-foreground font-medium tracking-wide shrink-0">{info.dayName}</span>
                    <span className={cn("font-mono font-bold text-sm tabular-nums leading-tight shrink-0", info.isToday && "text-primary")}>{info.dayNumber}</span>
                    {info.isToday && (
                      <span className="text-[8px] font-semibold text-primary uppercase tracking-wider px-1 py-0.5 rounded bg-primary/10 shrink-0 leading-tight">Today</span>
                    )}
                  </button>
                  {filteredAndSortedGoals.map((goal) => {
                    const entry = getEntry(goal.id, info.date);
                    const dayOfWeek = date.getDay();
                    const isDisabledForGoal = !isGoalActiveOnDay(goal, dayOfWeek);
                    if (isDisabledForGoal) {
                      return (
                        <div
                          key={goal.id}
                          className="grid-cell relative flex items-center justify-center h-[52px] min-h-[52px] shrink-0 bg-muted/15 opacity-40 cursor-not-allowed border-r border-b border-grid-border"
                          title={goal.isWeekendGoal ? 'Weekend goal — not active on weekdays' : 'Weekday goal — not active on weekends'}
                          aria-hidden
                        >
                          <span className="text-muted-foreground/80 font-light text-sm" aria-hidden>—</span>
                        </div>
                      );
                    }
                    return (
                      <DayCell
                        key={goal.id}
                        goal={goal}
                        day={info.dayNumber}
                        date={info.date}
                        entry={entry}
                        isOfficeDay={info.isOfficeDay}
                        isToday={info.isToday}
                        isPast={info.isPast}
                        cellClassName="shrink-0 w-full h-[52px] min-h-[52px] border-r border-b border-grid-border"
                        onToggleStatus={() => toggleDayStatus(goal.id, info.date)}
                        onUpdateEntry={(updates) => updateEntry(goal.id, info.date, updates)}
                      />
                    );
                  })}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
