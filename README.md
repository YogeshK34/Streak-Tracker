# Habit Tracker 🔥

A minimal habit tracking app with calendar-grid interface to build consistent streaks.

## Features

- **Habit Tracking**: Calendar-grid interface with streak calculation
- **LeetCode Integration**: Track daily coding practice and submission count
- **Streak Tracking**: Automatic current & longest streak calculation for both habits and LeetCode
- **User Authentication**: Email/password sign-up via Supabase
- **Persistent Storage**: Cloud database backend
- **Visual Feedback**: Cross-off animations for completed activities

## Tech Stack

- React, Next.js 16, shadcn/ui, Tailwind CSS
- Supabase (Authentication & Database)
- date-fns for date utilities

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up with email
2. **Habits**: Click days on the calendar to mark habits complete
3. **LeetCode**: Log problems solved and track your coding streak
4. Watch your streaks grow! 🔥

## Setup Notes

See `DATABASE_MIGRATION.md` for Supabase schema setup.
