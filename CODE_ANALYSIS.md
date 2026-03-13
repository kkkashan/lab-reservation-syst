# Lab Reservation System - Code Analysis

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Browser (React SPA)               │
│   Port: 5173 (dev) / 80 (prod)      │
└──────────────┬──────────────────────┘
               │ HTTP/JSON
┌──────────────▼──────────────────────┐
│   Nginx (Reverse Proxy)             │
│   - Serves static React files       │
│   - Proxies /api/* to backend       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Express Backend (Node.js)         │
│   Port: 3001                        │
│   - Authentication middleware       │
│   - Rate limiting                   │
│   - CORS & Security headers         │
└──────────────┬──────────────────────┘
               │ SQL
┌──────────────▼──────────────────────┐
│   PostgreSQL 16 Database            │
│   Port: 5432                        │
│   - Tables: User, Session, Server,  │
│             Booking, Activity       │
└─────────────────────────────────────┘
```

## 📁 Project Structure

### Backend (`/backend/src/`)
```
├── server.ts                  # Express app entry point
├── config/
│   ├── database.ts           # Prisma client singleton
│   ├── logger.ts             # Winston logger setup
│   └── constants.ts          # App-wide constants
├── middleware/
│   ├── auth.ts               # JWT + session validation
│   └── errorHandler.ts       # Global error handler
├── routes/                   # Express routers
│   ├── userRoutes.ts         # Auth: login, register, logout
│   ├── serverRoutes.ts       # Server CRUD & status
│   ├── bookingRoutes.ts      # Booking CRUD & actions
│   └── adminRoutes.ts        # Admin-only operations
├── controllers/              # Route handlers
│   ├── userController.ts     # Authentication logic
│   ├── serverController.ts   # Server management
│   ├── bookingController.ts  # Booking operations
│   └── uploadController.ts   # Excel file uploads
└── services/
    ├── scheduler.ts          # Email digest cron job
    └── emailService.ts       # Email template rendering
```

### Prisma Schema (`/backend/prisma/schema.prisma`)
**Models:**
- **User**: email, password (hashed), role (user|admin), tokens
- **Session**: JWT token with 7-day expiry, user reference
- **Server**: name, specs (CPU/RAM), architecture (ARM64/Intel/AMD), status
- **Booking**: server, user, start/end times, status, reason
- **Activity**: Audit trail of all operations

### Frontend (`/src/`)
```
├── components/
│   ├── Dashboard.tsx          # Main landing page
│   ├── ServerList.tsx         # Grid view of available servers
│   ├── ServerDetailsDialog.tsx # Server info & specs
│   ├── BookingDialog.tsx       # Create/extend bookings
│   ├── MyBookings.tsx          # User's reservations
│   ├── AdminPanel.tsx          # Admin tabs:
│   │   ├── Servers mgmt (CRUD + Excel import)
│   │   ├── User mgmt (promote/demote/delete)
│   │   ├── Booking history
│   │   └── Email configuration
│   ├── Communications.tsx      # Send notifications
│   ├── Reports.tsx             # Analytics & charts
│   ├── UserManagement.tsx      # Admin user list
│   ├── LoginForm.tsx           # Auth form
│   └── ui/                     # Shadcn/ui components
├── hooks/
│   └── use-booking-data.ts    # TanStack Query hooks
├── lib/
│   ├── api.ts                 # Type-safe API client
│   ├── types.ts              # Shared TypeScript types
│   └── utilities
├── App.tsx                    # Root routing
└── main.tsx                   # React entry point
```

## 🔐 Authentication & Security

### JWT Flow
1. User logs in with credentials
2. Backend validates and creates:
   - JWT token (signed with JWT_SECRET)
   - Session record in DB (for server-side validation)
3. Frontend stores JWT in localStorage as `auth_token`
4. Subsequent requests include `Authorization: Bearer <token>`

### Session Validation
- Every protected request validates:
  - ✅ JWT signature is valid
  - ✅ Session exists in DB
  - ✅ Session not expired (7 days)
- **Server-side logout**: Deletes session → invalidates token

### Middleware Stack
```
Request
  ↓
Helmet (security headers)
  ↓
CORS validation
  ↓
Rate limiting (15 req/min)
  ↓
if (/api/...)
  ├─ authenticate (JWT + session check)
  └─ optionally: requireAdmin
  ↓
Route handler
  ↓
Error handler (global)
```

## 🔗 API Endpoints

### Authentication (`/api/users/`)
- `POST /register` - Create account
- `POST /login` - Get JWT token
- `POST /logout` - Delete session
- `GET /profile` - Current user info

### Servers (`/api/servers/`)
- `GET /` - List all servers
- `GET /:id` - Get single server
- `POST /` [ADMIN] - Create server
- `PUT /:id` [ADMIN] - Update server
- `DELETE /:id` [ADMIN] - Delete server
- `POST /bulk-upload` [ADMIN] - Upload Excel file

### Bookings (`/api/bookings/`)
- `GET /` - List all (admins see all, users see own)
- `GET /user` - Get current user's bookings
- `POST /` - Create booking
- `PUT /:id` - Extend booking
- `DELETE /:id` - Cancel booking
- `POST /:id/complete` - Mark as completed

### Admin (`/api/admin/`)
- `GET /stats` - Dashboard metrics
- `GET /users` - List all users
- `PUT /users/:id/role` - Promote/demote admin
- `DELETE /users/:id` - Delete user
- `POST /notifications/send` - Send notifications
- `PUT /email-config` - Update digest settings

### Health (`/`)
- `GET /health` - Basic health check (uptime)
- `GET /ready` - Readiness probe (DB connection)

## 🎨 Frontend State Management

### TanStack Query (Server State)
```typescript
// Hooks in use-booking-data.ts
useServers()           // GET /api/servers
useUserBookings()      // GET /api/bookings/user
useAllBookings()       // GET /api/bookings [ADMIN]
useAdminStats()        // GET /api/admin/stats
```

Cache invalidation happens automatically after mutations:
```typescript
mutation.mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['servers'] })
  }
})
```

### Local State
- Auth state: `useCurrentUser()` hook (synced with localStorage)
- Dialog open/close states: React hooks
- Form data: React hook form with Zod validation

## 📊 Key Features Implementation

### 1. Executive Dashboard
- **Components**: Dashboard.tsx + Recharts charts
- **Data**: Admin stats from `/api/admin/stats`
- **Visualizations**:
  - Donut chart: Server status distribution
  - Bar chart: Booking activity timeline
  - Stat cards: Total bookings, overdue, avg duration

### 2. Server Management
- **CRUD**: serverController.ts + serverRoutes.ts
- **Architecture Detection**: Parses CPU specs for ARM64/Intel/AMD/Gen
- **Bulk Import**: ExcelUploadDialog.tsx uploads .xlsx files
- **Status Enum**: available | booked | maintenance | offline

### 3. Booking System
- **Lifecycle**: active → completed | cancelled | pending_renewal
- **Extend Logic**: Updates end_time if within 12 hours
- **Conflict Detection**: Prevents overlapping bookings
- **Database Cascade**: Deleting user/server deletes related bookings

### 4. Weekly Email Digest
- **Scheduler**: node-cron in /services/scheduler.ts
- **Timing**: Monday 08:00 UTC
- **Content**: Booking summary, activity stats, overdue alerts
- **Template**: HTML email templates in /services/

### 5. Rate Limiting
- **Limit**: 15 requests per minute per IP
- **Applies to**: `/api/` only
- **Configuration**: Disabled for `/health` and `/ready`

## 🔄 Data Flow Example: Creating a Booking

```
1. User fills BookingDialog.tsx form
2. SPA calls: POST /api/bookings { serverId, startTime, endTime }
3. Middleware: authenticate() verifies JWT + session
4. Controller: bookingController.ts creates Booking record
   - Validates: No time conflicts, user not over quota
   - Prisma: prisma.booking.create()
5. Response: { id, status: 'active', ... }
6. Frontend: TanStack Query cache invalidated
   - ✅ useUserBookings() refreshes
   - ✅ useServers() refreshes (status may change)
7. UI: Server moves from 'available' → 'booked'
8. Optional: Scheduler sends confirmation email
```

## 🚀 Deployment

### Local Development (Docker Compose)
```bash
docker compose up --build -d
# Frontend: http://localhost
# Backend: http://localhost:3001
# Database: localhost:5432
```

### Production (Azure Container Apps)
- CI/CD: GitHub Actions (`.github/workflows/azure-deploy.yml`)
- Trigger: Push to `main` branch
- Steps:
  1. Build Docker images
  2. Push to Azure Container Registry
  3. Deploy to Azure Container Apps
- Environment: Set via GitHub Secrets + Container env vars

### Health Checks
- **Liveness**: GET /health (responds if process running)
- **Readiness**: GET /ready (checks DB connection)
- **Probe interval**: 10s / timeout: 5s

## 📝 Environment Variables

### Backend (`.env` or container)
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost/lab_booking` |
| `JWT_SECRET` | Token signing key (min 32 chars) | `your-secret-here-min-32-characters-long` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | CORS whitelist | `http://localhost` |
| `DEMO` | Enable demo data seed | `true` |
| `SMTP_*` | Email credentials (optional) | See `.env.example` |

## 🔍 Code Quality

- **Language**: TypeScript (strict mode)
- **Linting**: ESLint configured
- **API Client**: Type-safe wrapper in `lib/api.ts`
- **Error Handling**: Global error handler + AppError class
- **Logging**: Winston logger with levels (debug/info/warn/error)
- **Database Migrations**: Prisma migrations under `backend/prisma/migrations/`

## 🐛 Common Patterns

### Adding a New API Endpoint
1. Create controller method in `controllers/<feature>Controller.ts`
2. Add route in `routes/<feature>Routes.ts`
3. Add API client in `lib/api.ts`
4. Use in component with TanStack Query hook

### Database Schema Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name description`
3. Run `npx prisma generate` to update types
4. Restart backend

### Authorization Patterns
```typescript
// Public route
router.post('/login', userController.login);

// Protected route (users only)
router.get('/bookings', authenticate, bookingController.list);

// Admin-only route
router.post('/servers', authenticate, requireAdmin, serverController.create);
```

## 📦 Core Dependencies

### Backend
- **express**: HTTP server
- **prisma**: ORM + migrations
- **jsonwebtoken**: JWT auth
- **bcryptjs**: Password hashing
- **node-cron**: Scheduled tasks
- **nodemailer**: Email sending
- **winston**: Logging

### Frontend  
- **react**: UI framework
- **typescript**: Type safety
- **vite**: Build tool
- **tailwindcss**: Styling
- **recharts**: Charting
- **@tanstack/react-query**: Server state
- **@radix-ui**: Component primitives
- **shadcn/ui**: Pre-styled components

---

## 🎯 Demo Access

**Application**: http://localhost  
**API**: http://localhost:3001  
**Database**: localhost:5432

Default demo credentials (check `/backend/prisma/seed.ts`):
- Admin user typically seeded on first run
- Check backend logs for initial setup

**Demo Features Enabled**: `DEMO=true` in environment
