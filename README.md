# Habit Tracker 🔥

A minimal habit tracking app with calendar-grid interface to build consistent streaks. Track daily habits, code problems, and learning progress in one place.

## Features

- **Daily Habit Tracking**: Calendar-grid interface with streak calculation
- **Streak History**: View and track current & longest streaks
- **LeetCode Integration**: Track problems solved with techniques, data structures, and notes
- **DS Notes**: Store and organize Data Structures learning concepts
- **User Authentication**: Email/password sign-up via Supabase
- **Dark Mode**: Full dark mode support
- **Data Export**: Export habit and LeetCode data as CSV, JSON, or Excel
- **Cloud Sync**: Real-time data persistence with Supabase

## Tech Stack

- **Frontend**: React, Next.js 16, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **Utilities**: date-fns, XLSX (Excel export)

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment variables
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> .env.local

# Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tabs

1. **Calendar** - Mark daily habits, track streaks
2. **Streak History** - View past streaks and milestones
3. **LeetCode** - Log problems with techniques, data structures, notes, and filters
4. **DS Notes** - Document Data Structures concepts and learning

## Setup

### Database Schema
Run the migrations in your Supabase SQL editor:
- `supabase/migrations/001_initial_schema.sql` - Initial tables
- `supabase/migrations/002_add_technique_array.sql` - Multi-technique support (if upgrading)

See migration files for details on schema structure.
