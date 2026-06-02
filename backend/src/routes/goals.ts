import { Router } from 'express';
import prisma from '../config/database.js';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getParam } from '../utils/params.js';

const router = Router();

router.use(authenticateToken);

const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format (e.g. 07:00)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format (e.g. 07:30)'),
  allocatedMinutes: z.number({ invalid_type_error: 'Duration must be a number' }).int().positive('Duration must be greater than 0 minutes'),
  tags: z.array(z.string()).default([]),
  targetEndDate: z.string().optional(),
  isWeekendGoal: z.boolean().default(false),
  isWeekdayGoal: z.boolean().default(false),
});

const updateGoalSchema = goalSchema.partial();

function formatZodError(err: z.ZodError): string {
  const first = err.errors[0];
  if (!first) return 'Validation error';
  const field = first.path.length > 0 ? `${first.path.join('.')}: ` : '';
  return `${field}${first.message}`;
}

// Get all goals
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { completed } = req.query;
    const where: any = { userId: req.userId! };

    if (completed === 'true') {
      where.completedAt = { not: null };
    } else if (completed === 'false') {
      where.completedAt = null;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: completed === 'true'
        ? [{ completedAt: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
      include: {
        dayEntries: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
    res.json(goals);
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get goal by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
      include: {
        dayEntries: {
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error: any) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create goal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const parseResult = goalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: formatZodError(parseResult.error) });
    }

    const goal = await prisma.goal.create({
      data: {
        ...parseResult.data,
        userId: req.userId!,
      },
    });
    res.status(201).json(goal);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'A goal with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create goal. Please try again.' });
  }
});

// Update goal
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const parseResult = updateGoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: formatZodError(parseResult.error) });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: parseResult.data,
    });
    res.json(goal);
  } catch (error: any) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal. Please try again.' });
  }
});

// Complete goal
router.post('/:id/complete', async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: { completedAt: new Date() },
    });
    res.json(goal);
  } catch (error: any) {
    console.error('Error completing goal:', error);
    res.status(500).json({ error: 'Failed to complete goal. Please try again.' });
  }
});

// Uncomplete goal
router.post('/:id/uncomplete', async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: { completedAt: null },
    });
    res.json(goal);
  } catch (error: any) {
    console.error('Error uncompleting goal:', error);
    res.status(500).json({ error: 'Failed to reopen goal. Please try again.' });
  }
});

// Delete goal
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal. Please try again.' });
  }
});

export default router;
