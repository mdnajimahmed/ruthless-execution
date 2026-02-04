import { useState } from 'react';
import { BacklogItem, BACKLOG_CATEGORIES, BacklogCategory } from '@/types/backlog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { differenceInMonths, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BacklogCardProps {
  item: BacklogItem;
  onUpdate: (id: string, updates: Partial<Omit<BacklogItem, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

const getDateStatus = (tentativeStartDate: string): 'green' | 'yellow' | 'red' => {
  const today = new Date();
  const startDate = parseISO(tentativeStartDate);
  
  if (today < startDate) {
    return 'green'; // Future - on track
  }
  
  const monthsOverdue = differenceInMonths(today, startDate);
  
  if (monthsOverdue > 1) {
    return 'yellow'; // More than 1 month overdue
  }
  
  return 'red'; // Overdue but less than 1 month
};

const statusStyles = {
  green: 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20',
  yellow: 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  red: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
};

export const BacklogCard = ({ item, onUpdate, onDelete }: BacklogCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [editDate, setEditDate] = useState(item.tentativeStartDate);
  const [editCategory, setEditCategory] = useState<BacklogCategory>(item.category);

  const status = getDateStatus(item.tentativeStartDate);

  const handleSave = () => {
    onUpdate(item.id, {
      title: editTitle,
      description: editDescription || undefined,
      tentativeStartDate: editDate,
      category: editCategory,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditDate(item.tentativeStartDate);
    setEditCategory(item.category);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-3 space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="text-sm"
          />
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            className="text-sm min-h-[60px]"
          />
          <Input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="text-sm"
          />
          <Select value={editCategory} onValueChange={(v) => setEditCategory(v as BacklogCategory)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.key} value={cat.key}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm hover:shadow-md transition-shadow', statusStyles[status])}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(parseISO(item.tentativeStartDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
