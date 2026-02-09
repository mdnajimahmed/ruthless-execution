import { Router } from 'express';
import goalsRouter from './goals.js';
import dayEntriesRouter from './dayEntries.js';
import eisenhowerRouter from './eisenhower.js';
import backlogRouter from './backlog.js';
import authRouter from './auth.js';

const router = Router();

// Public routes (no auth required)
router.use('/auth', authRouter);

// Health check (public)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes (require authentication)
router.use('/goals', goalsRouter);
router.use('/day-entries', dayEntriesRouter);
router.use('/eisenhower', eisenhowerRouter);
router.use('/backlog', backlogRouter);

export default router;
