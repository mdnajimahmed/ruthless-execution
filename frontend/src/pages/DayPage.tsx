import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { DailyDetailView } from '@/components/DailyDetailView';

const DayPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  // Validate date format
  const parsedDate = date ? parseISO(date) : null;
  const isValidDate = parsedDate && isValid(parsedDate);

  if (!isValidDate) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GT</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Goal Tracker</h1>
              <p className="text-xs text-muted-foreground">Invalid date</p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Invalid date format. Please use YYYY-MM-DD.</p>
        </main>
      </div>
    );
  }

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
            <p className="text-xs text-muted-foreground">Daily Details</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <DailyDetailView 
          selectedDate={date!}
          onBack={() => navigate('/')}
        />
      </main>
    </div>
  );
};

export default DayPage;
