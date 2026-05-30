# Multi-User Setup Guide

## Overview

The app has been converted to a multi-user system with JWT-based authentication. Each user can only see and manage their own data.

## Security Features

✅ **100% Data Isolation**: All queries filter by `userId`  
✅ **JWT Authentication**: Token-based auth with 7-day expiry  
✅ **Password Hashing**: bcrypt with salt rounds  
✅ **Authorization Middleware**: All protected routes verify ownership  
✅ **Invite-Only**: Users created via admin script only  

## Database Changes

### New User Model
- `id`: UUID primary key
- `username`: Unique username
- `email`: Optional unique email
- `passwordHash`: Bcrypt hashed password
- `resetToken`: For password reset
- `resetTokenExpiry`: Reset token expiration

### Updated Models
All models now have `userId` foreign key:
- `Goal.userId`
- `EisenhowerTask.userId`
- `BacklogItem.userId`
- `DayEntry` (via Goal relationship)

## Creating Users (Invite-Only)

### Using the Script

```bash
cd backend
npm run create-user <username> <password> [email]
```

**Example:**
```bash
npm run create-user john mypassword123 john@example.com
npm run create-user jane securepass456
```

**Requirements:**
- Username must be unique
- Password must be at least 8 characters
- Email is optional

## API Endpoints

### Public Endpoints (No Auth Required)

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/forgot-password` - Request password reset token
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify` - Verify token (requires Authorization header)
- `GET /api/health` - Health check

### Protected Endpoints (Require JWT Token)

All other endpoints require `Authorization: Bearer <token>` header:

- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create goal (auto-assigned to user)
- `GET /api/day-entries` - Get user's entries
- `GET /api/eisenhower` - Get user's tasks
- `GET /api/backlog` - Get user's backlog items
- etc.

## Frontend Authentication

### Login Flow

1. User enters username/password
2. Frontend calls `/api/auth/login`
3. Backend returns JWT token
4. Token stored in `localStorage` as `auth_token`
5. All API requests include `Authorization: Bearer <token>`

### Protected Routes

- All app routes require authentication
- Unauthenticated users redirected to `/login`
- Token verified on app load
- Auto-logout on 401/403 responses

## Password Reset Flow

1. User requests reset: `POST /api/auth/forgot-password` with username
2. Backend generates reset token (logged to console in dev)
3. User calls: `POST /api/auth/reset-password` with token and new password
4. Password updated, token invalidated

**Note**: In production, implement email sending for reset tokens.

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-change-in-production"
PORT=3002
NODE_ENV=development
```

**Important**: Set a strong `JWT_SECRET` in production!

## Data Isolation Guarantees

### Query Level
- All `findMany` queries include `where: { userId: req.userId }`
- All `findUnique`/`findFirst` verify ownership
- All `create` operations set `userId: req.userId`
- All `update`/`delete` verify ownership first

### Example Protection

```typescript
// ✅ CORRECT - Filters by userId
const goals = await prisma.goal.findMany({
  where: { userId: req.userId! }
});

// ✅ CORRECT - Verifies ownership before update
const existing = await prisma.goal.findFirst({
  where: { id, userId: req.userId! }
});
if (!existing) return 404;
await prisma.goal.update({ where: { id }, data });

// ❌ WRONG - Would allow access to any user's data
const goal = await prisma.goal.findUnique({ where: { id } });
```

## Migration Steps

1. **Update Database Schema**:
   ```bash
   cd backend
   npm run prisma:generate
   npx prisma db push
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Create First User**:
   ```bash
   npm run create-user admin adminpassword123 admin@example.com
   ```

4. **Start Backend**:
   ```bash
   npm run dev
   ```

5. **Start Frontend**:
   ```bash
   npm run dev
   ```

6. **Login**: Navigate to `/login` and use created credentials

## Testing Data Isolation

1. Create two users: `user1` and `user2`
2. Login as `user1`, create some goals/tasks
3. Logout, login as `user2`
4. Verify `user2` sees empty data (no `user1` data)
5. Create data as `user2`
6. Logout, login as `user1` again
7. Verify `user1` only sees their own data

## Security Checklist

- ✅ All routes require authentication (except `/auth/*` and `/health`)
- ✅ All queries filter by `userId`
- ✅ All mutations verify ownership
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens expire after 7 days
- ✅ Reset tokens expire after 1 hour
- ✅ CORS configured correctly
- ✅ Error messages don't leak user existence

## Production Considerations

1. **JWT_SECRET**: Use strong random secret (32+ characters)
2. **Password Reset**: Implement email sending (currently logs to console)
3. **Rate Limiting**: Add rate limiting to login/reset endpoints
4. **HTTPS**: Always use HTTPS in production
5. **Token Refresh**: Consider implementing refresh tokens
6. **Audit Logging**: Log authentication events
7. **Password Policy**: Enforce stronger password requirements
