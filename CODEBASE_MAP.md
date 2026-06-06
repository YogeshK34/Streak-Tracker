# Habit Tracker Codebase Map

## Overview
A Next.js + TypeScript + shadcn/ui + Supabase application with two main features:
1. **Habit Tracker** — Calendar-style UI for daily habit tracking with streak calculations
2. **LeetCode Problem Tracker** — Store solved problems with history, tags, difficulty, and confidence levels

---

## Main Routes/Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Main authenticated dashboard |
| `/auth` | `app/auth/page.tsx` | Authentication (signup/signin) |

---

## Supabase Database Schema

### Core Habit Tables

#### `habit_entries`
Tracks daily habit completion
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `tracked_date` (date)
- `completion_hour` (int, 0-23)
- `created_at` (timestamptz)
- Unique constraint: (user_id, tracked_date)

#### `streak_history`
Records historical streak data
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `start_date` (date)
- `end_date` (date)
- `length` (int)
- `created_at` (timestamptz)
- Index: (user_id, end_date DESC)

#### `habit_completion_times`
Tracks hour of day habits are marked
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `habit_date` (date)
- `completion_hour` (int, 0-23)
- `created_at` (timestamptz)
- Unique constraint: (user_id, habit_date)

#### `achievements`
User badges and milestones
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `badge_type` (text)
- `achieved_date` (timestamptz)
- `created_at` (timestamptz)
- Unique constraint: (user_id, badge_type)

### LeetCode & DS Notes Tables

#### `leetcode_problems`
Stores solved problems with notes
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `problem_date` (date)
- `problem_name` (text)
- `description` (text, nullable)
- `data_structure` (text, nullable)
- `technique` (text[], array, nullable) — Migrated from single text to array
- `created_at` (timestamptz)
- Indexes: (user_id), (user_id, problem_date DESC)
- **RLS Enabled:** Full CRUD policies per user_id

#### `ds_notes`
Learning notes for data structure concepts
- `id` (bigint, PK)
- `user_id` (uuid, FK → auth.users)
- `ds_name` (text)
- `concept_name` (text)
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Indexes: (user_id), (user_id, ds_name)
- **RLS Enabled:** Full CRUD policies per user_id

---

## State Management

### Context API
- **AuthContext** (`lib/auth-context.tsx`)
  - User state
  - Loading state
  - Auth methods: signUp, signIn, signOut
  - Error handling
  - Listener for auth state changes

- **ThemeContext** (`lib/theme-provider.tsx`)
  - Theme switching (light/dark mode)

### React State (Local)
Used in HabitTracker component:
- `currentMonth` — Current month being viewed
- `markedDays` — Dictionary of marked habit days
- `isLoaded` — Data loading status
- `error` — Error messages
- `activeTab` — Current tab (CalendarTab, StreakHistoryTab, LeetCodeTab, DSNotesTab)
- `exporting` — Export operation status

---

## API Routes

All routes located in `app/api/` and use Bearer token authentication.

### Habits API

**GET/POST `/api/habits`**
- GET: Fetch all habit entries for authenticated user
- POST: Create new habit entry
- Auth: Bearer token verified via service-role key

**GET `/api/habits/weekly`**
- Return weekly completion stats

**GET `/api/habits/history`**
- Return streak history

**GET `/api/habits/time-analysis`**
- Return completion hour distribution

**GET `/api/habits/achievements`**
- Return user achievements/badges

**GET `/api/habits/export`**
- Export habit data (likely Excel/CSV)

### LeetCode API

**GET/POST `/api/leetcode`**
- GET: Fetch all LeetCode problems for user
- POST: Create new problem entry
- Fields: problem_date, problem_name, description, data_structure, technique[]
- Auth: Bearer token verified via service-role key

**GET `/api/leetcode/export`**
- Export problems data

### DS Notes API

**GET/POST `/api/dsnotes`**
- GET: Fetch all DS notes for user
- POST: Create new DS note
- Fields: ds_name, concept_name, notes
- Auth: Bearer token verified via service-role key

**GET `/api/dsnotes/export`**
- Export notes data

---

## Component Structure

### Page Component
```
app/page.tsx (Home)
├── Auth check & redirect to /auth if unauthenticated
├── Sign out button
└── HabitTracker
```

### Main Container Component
```
HabitTracker (app/components/HabitTracker.tsx)
├── State: currentMonth, markedDays, activeTab, error, exporting
├── Tabs Container
│   ├── CalendarTab
│   │   └── Calendar grid with day marking
│   │   └── Monthly navigation
│   │
│   ├── StreakHistoryTab
│   │   └── StreakTimeline component
│   │   └── WeeklyStats component
│   │   └── TimeAnalysis component
│   │
│   ├── LeetCodeTab
│   │   └── MemoizedLeetCodeTracker component
│   │
│   └── DSNotesTab
│       └── DSNotesTracker component
│
└── Achievements component (visible across tabs)
```

### Supporting Components

**`StreakTimeline.tsx`**
- Displays historical streak data
- Visual timeline representation

**`LeetCodeTracker.tsx`**
- Problem entry form
- Problem list display
- Delete/edit functionality
- Memoized for performance

**`DSNotesTracker.tsx`**
- Notes entry/management
- Data structure selector
- Concept organization
- RenderNotesWithCode integration

**`Achievements.tsx`**
- Badge/milestone display
- Achievement tracking UI

**`WeeklyStats.tsx`**
- Weekly completion percentages
- Charts/visualizations

**`TimeAnalysis.tsx`**
- Hour-of-day distribution charts
- Using recharts for visualization

**`RenderNotesWithCode.tsx`**
- Code snippet rendering within notes
- Syntax highlighting support

### UI Components (shadcn/ui)
Located in `components/ui/`:
- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `tabs.tsx`
- `select.tsx`
- `input.tsx`
- `label.tsx`
- `alert.tsx`
- `skeleton.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `popover.tsx`
- `tooltip.tsx`
- `switch.tsx`
- `checkbox.tsx`
- `progress.tsx`
- `pagination.tsx`
- `scroll-area.tsx`
- `textarea.tsx`
- `calendar.tsx`
- `confirm-dialog.tsx`

---

## Service Layer

Located in `app/services/`

### `habit.ts`
Service functions for habit operations:
- `getHabitDays()` — Fetch all habit entries
- `setHabitDay(date, hour)` — Mark a day as complete
- `exportHabitData()` — Export habits to file
- Type definitions: HabitDay, StreakHistory, WeeklyStatItem, Achievement, TimeAnalysis

### `leetcode.ts`
Service functions for LeetCode operations:
- `getLeetCodeProblems()` — Fetch all problems
- `addLeetCodeProblem(date, name, description, dataStructure?, technique?)` — Add new problem
- Type definition: LeetCodeProblem with id, problem_date, problem_name, description, data_structure, technique[], created_at

### `dsnotes.ts`
Service functions for DS notes operations:
- Functions for CRUD operations on DS notes
- Type definitions for DS notes

**All services:**
- Use client-side Supabase client for auth token retrieval
- Make authenticated fetch requests to API routes
- Include comprehensive error logging
- Include console logging for debugging

---

## Utility/Library Modules

Located in `lib/`

### `supabase-client.ts`
- Initializes Supabase client with public anon key
- Used client-side by services

### `supabase.ts`
- Server-side Supabase utilities

### `auth-context.tsx`
- React Context for authentication
- Provider component
- useAuth hook for consuming auth context

### `theme-provider.tsx`
- React Context for theme management
- Light/dark mode switching

### `streak-calculator.ts`
- `calculateStreaksBetween(startDate, endDate)` — Calculate streaks in date range
- `calculateCurrentStreak()` — Calculate current active streak
- `detectStreakChange()` — Detect streak changes
- Used by habit API route

### `achievement-checker.ts`
- `checkAchievements()` — Determine unlocked badges/milestones
- Used by habit API route

### `db-debug.ts`
- `checkDatabaseSetup()` — Verify database schema and accessibility
- Used for troubleshooting

### `utils.ts`
- General utility functions

---

## Database Migrations

### `001_initial_schema.sql`
Initial schema with:
- All table definitions
- RLS policies for leetcode_problems and ds_notes
- Indexes for performance

### `002_add_technique_array.sql`
Migration to convert `technique` column:
- From: single `text` field
- To: `text[]` array
- Allows storing multiple techniques per problem
- Zero-downtime migration with temporary column

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.1 | Framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety |
| Supabase | 2.102.1 | Backend (Auth + DB) |
| shadcn/ui | 4.1.2 | Component library |
| Tailwind CSS | ^4 | Styling |
| date-fns | ^4.1.0 | Date manipulation |
| recharts | ^3.8.1 | Charting library |
| xlsx | ^0.18.5 | Excel export |
| Lucide React | ^1.7.0 | Icon library |
| react-day-picker | ^9.14.0 | Calendar component |
| Radix UI | 1.4.3 | Headless UI primitives |

---

## Key Files Reference

**Authentication & Config:**
- `lib/auth-context.tsx` — Auth state & methods
- `lib/supabase-client.ts` — Supabase initialization

**Main App:**
- `app/page.tsx` — Home page
- `app/layout.tsx` — Root layout
- `app/auth/page.tsx` — Auth page

**Components:**
- `app/components/HabitTracker.tsx` — Main container
- `app/components/StreakTimeline.tsx` — Streak visualization
- `app/components/LeetCodeTracker.tsx` — LeetCode UI
- `app/components/DSNotesTracker.tsx` — DS Notes UI
- `app/components/Achievements.tsx` — Badge display

**Services:**
- `app/services/habit.ts` — Habit API calls
- `app/services/leetcode.ts` — LeetCode API calls
- `app/services/dsnotes.ts` — DS Notes API calls

**API Routes:**
- `app/api/habits/route.ts` — Habit CRUD
- `app/api/leetcode/route.ts` — LeetCode CRUD
- `app/api/dsnotes/route.ts` — DS Notes CRUD

**Utilities:**
- `lib/streak-calculator.ts` — Streak logic
- `lib/achievement-checker.ts` — Badge unlocking logic

---

## Architecture Notes

### Authentication Flow
1. User signs in via `/auth` page
2. Supabase Auth issues session token
3. AuthContext stores user state
4. Services retrieve token from session
5. Services make API calls with Bearer token
6. API routes verify token server-side using service-role key

### Data Flow
1. Components call service functions
2. Services fetch auth token
3. Services make API requests to `/api/*` routes
4. API routes verify auth and query Supabase
5. Results returned to components
6. Components update local state

### Security
- Row Level Security (RLS) enabled on sensitive tables
- Server-side token verification for all API routes
- Service-role key used only on backend
- Public anon key used only for auth operations
