# AI Integration Plan — Habit Tracker App

## Context

This is an existing Next.js + TypeScript + shadcn/ui + Supabase application with:
- A **Habit Tracker** — calendar UI, daily block marking, streak tracking
- A **LeetCode Tracker** — solved problems with tags, data structures, techniques
- A **DS Notes** section — concept notes per data structure

The goal is to add three AI-powered features using the **Vercel AI SDK** with **Groq** as the LLM provider.

---

## Rules Before You Start

- Do **NOT** refactor any existing code
- Do **NOT** modify existing API routes
- Do **NOT** change existing components
- Do **NOT** install LangChain or any other AI framework
- Only add new files unless explicitly told to touch an existing one

---

## Step 1 — Install Packages

```bash
npm install ai @ai-sdk/groq
```

---

## Step 2 — Environment Variable

Add to `.env.local`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get your free API key from: https://console.groq.com

---

## Step 3 — Create `/app/api/ai/insights/route.ts`

**Purpose:** Analyze the user's habit streaks and LeetCode history and return a streamed AI analysis.

- POST route
- Auth: same Bearer token pattern as existing `/app/api/habits/route.ts`
- Query `habit_entries` and `leetcode_problems` from Supabase for this user
- Build a context string from the fetched data
- Use `streamText` from `ai` and `groq()` provider
- Model: `llama-3.3-70b-versatile`
- System prompt to use:

```
You are a productivity coach analyzing a developer's habit tracking and LeetCode data.
Be specific, data-driven, and concise.
Identify patterns in consistency (days of week, streaks, drop-offs).
Highlight underrepresented DSA topics and techniques.
Keep your response under 200 words. Use plain text, no markdown.
```

- Stream the response back to the client

---

## Step 4 — Create `/app/api/ai/suggest/route.ts`

**Purpose:** Suggest the next 3 LeetCode problems based on the user's history.

- POST route with same auth pattern
- Query `leetcode_problems`: fetch `problem_name`, `data_structure`, `technique[]` for the user
- Pass to LLM with this prompt:

```
Based on these solved LeetCode problems, suggest 3 problems to practice next.
Focus on underrepresented techniques and data structures in the user's history.
Return ONLY a valid JSON array. No explanation. No markdown. No backticks.
Format:
[
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" },
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" },
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" }
]
```

- Use `generateText` (not streamed)
- Parse the response as JSON and return it

---

## Step 5 — Create `/app/api/ai/motivation/route.ts`

**Purpose:** Generate a personalized motivational quote on streak milestones.

- POST route
- Accept `{ streakCount: number }` in request body (still verify auth)
- Use `generateText` (not streamed)
- Model: `llama-3.3-70b-versatile`
- Prompt:

```
Generate a short motivational quote (max 2 lines) for a developer 
who just hit a {streakCount} day coding streak.
Make it punchy, specific to the number, and developer-flavored.
No hashtags. No generic advice. Just the quote, nothing else.
```

- Return `{ quote: string }`

---

## Step 6 — Create `app/components/AIInsights.tsx`

**Purpose:** Button that triggers the insights API and streams the response.

- Use `useCompletion` hook from `ai/react`
- API endpoint: `/api/ai/insights`
- UI:
  - A shadcn `Card` component
  - Button labeled **"Analyze my progress"** (use `Button` from shadcn)
  - Show a loading skeleton while streaming (use `Skeleton` from shadcn)
  - Display the streamed text inside the Card once it arrives
- Include basic error handling — show an `Alert` if the call fails

---

## Step 7 — Create `app/components/AISuggest.tsx`

**Purpose:** Fetch and display 3 LeetCode problem suggestions.

- Call `/api/ai/suggest` on button click (no streaming, just fetch)
- UI:
  - Button labeled **"What should I practice next?"**
  - Show loading state while fetching
  - Render 3 shadcn `Card` components, one per suggestion
  - Each card shows: `problem_name`, `reason`, and a `Badge` for `difficulty`
    - Easy → green badge
    - Medium → yellow badge  
    - Hard → red badge
- Include error handling with an `Alert`

---

## Step 8 — Create `app/components/MotivationCard.tsx`

**Purpose:** A visually striking shareable card shown after a streak milestone.

Props:
```typescript
interface MotivationCardProps {
  quote: string;
  streakCount: number;
}
```

UI requirements:
- Dark background card (use `bg-zinc-900` or `bg-slate-900`)
- Large streak number displayed prominently (e.g. `🔥 7 Day Streak`)
- Quote text in large, bold, white font
- Subtle bottom text: `tracked with my habit tracker`
- The card should look **screenshot-worthy** — clean, centered, no clutter
- Use shadcn `Card`, `CardContent` for structure
- Add a **"Close"** button below the card (outside the card itself, so it doesn't appear in screenshots)

---

## Step 9 — Wire `MotivationCard` into `HabitTracker.tsx`

In `app/components/HabitTracker.tsx`, make the following additions only:

1. Add state: `const [motivationQuote, setMotivationQuote] = useState<string | null>(null)`
2. After `setHabitDay()` succeeds in the existing day-marking logic, calculate the current streak
3. If current streak is one of `[1, 3, 7, 14, 21, 30]`, call `/api/ai/motivation` with `{ streakCount: currentStreak }`
4. On success, set `motivationQuote` with the returned quote
5. Render a shadcn `Dialog` that opens when `motivationQuote` is not null
6. Inside the Dialog, render `<MotivationCard quote={motivationQuote} streakCount={currentStreak} />`
7. On Dialog close, reset `motivationQuote` to null

---

## Step 10 — Wire Components into Existing Tabs

These are additive only — place the new components inside existing tab content:

**In `StreakHistoryTab`:**
- Add `<AIInsights />` at the top, above existing streak content

**In `LeetCodeTab` (inside `MemoizedLeetCodeTracker` or just above it):**
- Add `<AISuggest />` at the top, above the problem list

---

## File Summary

New files to create:

```
app/
├── api/
│   └── ai/
│       ├── insights/
│       │   └── route.ts
│       ├── suggest/
│       │   └── route.ts
│       └── motivation/
│           └── route.ts
└── components/
    ├── AIInsights.tsx
    ├── AISuggest.tsx
    └── MotivationCard.tsx
```

Existing files to touch (minimally):
```
app/components/HabitTracker.tsx   ← add Dialog + motivation trigger only
```

---

## Notes

- For the Groq provider, import as: `import { groq } from '@ai-sdk/groq'`
- For streaming, import as: `import { streamText, generateText } from 'ai'`
- For the frontend hook, import as: `import { useCompletion } from 'ai/react'`
- The `GROQ_API_KEY` env variable is automatically picked up by the `@ai-sdk/groq` provider — no manual config needed
- All new API routes must follow the same Bearer token auth pattern as existing routes in `/app/api/habits/route.ts`
