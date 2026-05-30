import { useState } from 'react';
import { EisenhowerQuadrant, QUADRANT_CONFIG } from '@/types/eisenhower';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddEisenhowerTaskDialogProps {
  quadrant: EisenhowerQuadrant;
  onAdd: (task: { title: string; description?: string; quadrant: EisenhowerQuadrant; delegateTo?: string }) => void;
}

export const AddEisenhowerTaskDialog = ({ quadrant, onAdd }: AddEisenhowerTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const config = QUADRANT_CONFIG[quadrant];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      quadrant,
      delegateTo: delegateTo.trim() || undefined,
    });
    setTitle('');
    setDescription('');
    setDelegateTo('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 w-full border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50">
          <Plus className="h-3 w-3" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>{config.icon}</span>
            Add to {config.label}
            <span className="text-xs font-normal text-muted-foreground">({config.subtitle})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="eisenhower-title">Task</Label>
            <Input
              id="eisenhower-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eisenhower-desc">Details (optional)</Label>
            <Textarea
              id="eisenhower-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context..."
              className="min-h-[60px]"
            />
          </div>
          {quadrant === 'delegate' && (
            <div className="space-y-2">
              <Label htmlFor="eisenhower-delegate">Delegate to</Label>
              <Input
                id="eisenhower-delegate"
                value={delegateTo}
                onChange={(e) => setDelegateTo(e.target.value)}
                placeholder="Who should handle this?"
              />
            </div>
          )}
          <Button onClick={handleSubmit} disabled={!title.trim()} className="w-full">
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
