import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useGoalTracker } from '@/hooks/useGoalTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Flame, TrendingUp, CheckCircle2, XCircle, AlertTriangle, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const GoalAnalyticsPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { monthData, calculateGoalAnalytics, getEntry } = useGoalTracker();

  const goal = useMemo(() => {
    return monthData.goals.find((g) => g.id === goalId);
  }, [monthData.goals, goalId]);

  const analytics = useMemo(() => {
    if (!goalId) return null;
    return calculateGoalAnalytics(goalId);
  }, [goalId, calculateGoalAnalytics]);

  // Get daily data for this goal
  const dailyData = useMemo(() => {
    if (!goalId) return [];
    
    const entries = monthData.entries.filter((e) => e.goalId === goalId);
    return entries.map((entry) => ({
      date: format(new Date(entry.date), 'd'),
      fullDate: entry.date,
      status: entry.status,
      actualMinutes: entry.actualMinutes,
      allocatedMinutes: goal?.allocatedMinutes || 0,
      completion: goal?.allocatedMinutes 
        ? Math.min(100, (entry.actualMinutes / goal.allocatedMinutes) * 100) 
        : 0,
    })).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [goalId, monthData.entries, goal]);

  // Get missed reasons for this goal
  const missedReasons = useMemo(() => {
    if (!analytics) return [];
    
    const reasons = Object.entries(analytics.missedReasonBreakdown)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
    
    return reasons;
  }, [analytics]);

  if (!goal || !analytics) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GT</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Goal Tracker</h1>
              <p className="text-xs text-muted-foreground">Goal not found</p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Goal not found.</p>
          <Button onClick={() => navigate('/analytics')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </main>
      </div>
    );
  }

  const ragStatus = analytics.completionRate >= 80 ? 'hit' : 
                    analytics.completionRate >= 50 ? 'partial' : 
                    analytics.completionRate > 0 ? 'miss' : 'pending';

  const statusColor = ragStatus === 'hit' ? 'text-rag-green' : 
                      ragStatus === 'partial' ? 'text-rag-amber' : 
                      ragStatus === 'miss' ? 'text-rag-red' : 'text-muted-foreground';

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* App header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">GT</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm">Goal Tracker</h1>
            <p className="text-xs text-muted-foreground">Goal Analytics</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b bg-card">
            <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold">{goal.title}</h2>
              <p className="text-sm text-muted-foreground font-mono">
                {goal.startTime} - {goal.endTime} ({goal.allocatedMinutes}m allocated)
              </p>
            </div>
            <div className={`text-2xl font-bold ${statusColor}`}>
              {analytics.completionRate.toFixed(0)}%
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statusColor}`}>
                    {analytics.completionRate.toFixed(1)}%
                  </div>
                  <Progress value={analytics.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Flame className="h-4 w-4 text-rag-amber" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{analytics.currentStreak}</div>
                  <p className="text-xs text-muted-foreground">
                    Longest: {analytics.longestStreak} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Days Tracked</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{analytics.totalDays}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.hitDays} hit, {analytics.partialDays} partial, {analytics.missDays} miss
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Stats</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{analytics.totalActualMinutes}m</div>
                  <p className="text-xs text-muted-foreground">
                    of {analytics.totalAllocatedMinutes}m allocated
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily performance chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                        formatter={(value: number) => [`${value.toFixed(0)}%`, 'Completion']}
                      />
                      <Bar
                        dataKey="completion"
                        radius={[2, 2, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-rag-green" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Hit Days</span>
                        <span className="font-mono">{analytics.hitDays}</span>
                      </div>
                      <Progress 
                        value={analytics.totalDays > 0 ? (analytics.hitDays / analytics.totalDays) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-rag-amber" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Partial Days</span>
                        <span className="font-mono">{analytics.partialDays}</span>
                      </div>
                      <Progress 
                        value={analytics.totalDays > 0 ? (analytics.partialDays / analytics.totalDays) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-rag-red" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Missed Days</span>
                        <span className="font-mono">{analytics.missDays}</span>
                      </div>
                      <Progress 
                        value={analytics.totalDays > 0 ? (analytics.missDays / analytics.totalDays) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missed reasons */}
            {missedReasons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rag-amber" />
                    Reasons for Missed Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {missedReasons.map((reason, index) => (
                      <div key={reason.reason} className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{reason.reason}</span>
                            <span className="font-mono text-sm">{reason.count}x</span>
                          </div>
                          <Progress
                            value={(reason.count / missedReasons[0].count) * 100}
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GoalAnalyticsPage;
