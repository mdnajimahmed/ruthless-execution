# Backend API

Express.js backend API for Month Goal Tracker.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL (using Docker):
   ```bash
   # From project root
   docker-compose up -d
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Sync database schema:
   ```bash
   npx prisma db push
   ```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3002`

## Creating Users

**Important**: Make sure PostgreSQL is running before creating users!

Login is **email + password only**. Create users with:

```bash
# Start database first (from project root)
docker-compose up -d

# Create user (email + password). Password is printed so you can use it to log in.
cd backend
npm run create-user <email> <password>
```

**Examples:**
```bash
npm run create-user najim.ju@gmail.com mypassword123
```

**Requirements:**
- Email: valid email format (e.g. user@example.com)
- Password: minimum 8 characters

The script prints the password so you can log in with the same credentials.

## Test login

After creating a user, verify login works:

```bash
# From backend directory, with backend running
npm run test-login najim.ju@gmail.com mypassword123
```

Or with curl:
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"najim.ju@gmail.com","password":"mypassword123"}'
```

## Building for Lambda

To build for AWS Lambda deployment:
```bash
npm run build:lambda
```

This will:
- Compile TypeScript
- Generate Prisma Client
- Copy necessary files for Lambda

## API Routes

### Authentication (Public)
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify` - Verify token

### Goals (Protected - Requires JWT)
- `GET /api/goals` - List all goals (user's only)
- `POST /api/goals` - Create a goal
- `GET /api/goals/:id` - Get goal by ID
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Day Entries (Protected)
- `GET /api/day-entries/goal/:goalId` - Get entries for a goal
- `GET /api/day-entries/:id` - Get entry by ID
- `GET /api/day-entries/date/:startDate/:endDate` - Get entries by date range
- `POST /api/day-entries` - Create/update entry
- `PUT /api/day-entries/:id` - Update entry
- `DELETE /api/day-entries/:id` - Delete entry

### Eisenhower Tasks (Protected)
- `GET /api/eisenhower` - List tasks (user's only)
- `POST /api/eisenhower` - Create task
- `GET /api/eisenhower/:id` - Get task by ID
- `PUT /api/eisenhower/:id` - Update task
- `POST /api/eisenhower/:id/complete` - Complete task
- `POST /api/eisenhower/:id/uncomplete` - Uncomplete task
- `POST /api/eisenhower/:id/move` - Move task to different quadrant
- `DELETE /api/eisenhower/:id` - Delete task

### Backlog Items (Protected)
- `GET /api/backlog` - List items (user's only)
- `POST /api/backlog` - Create item
- `GET /api/backlog/:id` - Get item by ID
- `PUT /api/backlog/:id` - Update item
- `POST /api/backlog/:id/complete` - Complete item
- `POST /api/backlog/:id/uncomplete` - Uncomplete item
- `DELETE /api/backlog/:id` - Delete item

## Troubleshooting

### Database Connection Error

If you see "Can't reach database server at localhost:5432":

1. **Check if Docker is running:**
   ```bash
   docker ps
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Verify database is ready:**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

4. **Check DATABASE_URL in backend/.env:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goal_tracker?schema=public"
   ```

### Prisma Client Not Generated

If you see Prisma errors:

```bash
npm run prisma:generate
```

### Schema Not Synced

If tables don't exist:

```bash
npx prisma db push
```
