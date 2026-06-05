import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import {
  generateToken,
  generateRefreshToken,
  hashRefreshToken,
  authenticateToken,
} from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const REFRESH_TOKEN_TTL_DAYS = 30;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
}

// ── Login ────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashRefreshToken(refreshToken),
        refreshTokenExpiry: refreshTokenExpiry(),
      },
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Refresh access token ─────────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const hashed = hashRefreshToken(refreshToken);
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: hashed,
        refreshTokenExpiry: { gt: new Date() },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: issue new refresh token and extend expiry
    const newAccessToken = generateToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashRefreshToken(newRefreshToken),
        refreshTokenExpiry: refreshTokenExpiry(),
      },
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Logout ───────────────────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  try {
    const body = z.object({ refreshToken: z.string().optional() }).parse(req.body);
    if (body.refreshToken) {
      const hashed = hashRefreshToken(body.refreshToken);
      await prisma.user.updateMany({
        where: { refreshToken: hashed },
        data: { refreshToken: null, refreshTokenExpiry: null },
      });
    }
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // always succeed
  }
});

// ── Register / update push token ─────────────────────────────────────────────

router.post('/push-token', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { token, platform, timezone } = z
      .object({
        token: z.string(),
        platform: z.enum(['ios', 'android']),
        timezone: z.string().default('UTC'),
      })
      .parse(req.body);

    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: req.userId!, platform, timezone },
      create: { userId: req.userId!, token, platform, timezone },
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Push token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Verify token ─────────────────────────────────────────────────────────────

router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { verifyToken } = await import('../middleware/auth.js');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({ user });
});

// ── Password reset ────────────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }

    res.json({ message: 'If the email exists, a password reset token has been generated' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
