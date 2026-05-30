import { useState } from 'react';
import { GoalGrid } from '@/components/GoalGrid';
import { AnalyticsView } from '@/components/AnalyticsView';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { useGoalTracker } from '@/hooks/useGoalTracker';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, BarChart3, Plus } from 'lucide-react';

const Index = () => {
  const { addGoal } = useGoalTracker();
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 px-4 border-b bg-card shrink-0 h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm">Execution</h1>
            <p className="text-xs text-muted-foreground">Daily goal tracking grid</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAddingGoal(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </header>

      <AddGoalDialog
        open={isAddingGoal}
        onOpenChange={setIsAddingGoal}
        onAddGoal={addGoal}
      />

      <Tabs defaultValue="in-progress" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 pt-2 shrink-0 overflow-x-auto">
          <TabsList>
            <TabsTrigger value="in-progress" className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Active</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="in-progress" className="flex-1 overflow-hidden mt-0">
          <GoalGrid showCompleted={false} />
        </TabsContent>

        <TabsContent value="completed" className="flex-1 overflow-hidden mt-0">
          <GoalGrid showCompleted={true} />
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-hidden mt-0">
          <AnalyticsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
