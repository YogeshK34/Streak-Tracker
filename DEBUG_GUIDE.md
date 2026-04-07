# Debugging Guide - Check What's Happening

## Step-by-Step Testing

### 1. Open Console & Network Tab
```
Press F12 → Console tab (and Network tab side-by-side for requests)
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Go to App & Sign In
- Go to `http://localhost:3000`
- Sign in with your email

### 4. Check Console for Auth
You should see in the Console:
```
✅ Got auth token for user: <uuid>
📥 Fetching habit days...
✅ Fetched habits: 0 days
```

If you see:
```
❌ Auth error: ...
❌ Token validation failed: ...
```
→ **Auth is broken**, contact support

### 5. Click a Day to Mark
Click on today or any past date.

**Console should show:**
```
🖱️ Clicked 2024-04-07, setting to true
📤 Saving ✓ for 2024-04-07...
✅ Saved successfully: {data: {date: "2024-04-07", marked: true}}
```

**Network tab should show:**
- POST to `/api/habits` with status **200**
- Request has `Authorization: Bearer <token>` header

If you see:
- Status **401** → Token is invalid
- Status **500** → Server error (check terminal)
- **No** network request → Auth token fetch failed

### 6. Refresh Page
Console should show:
```
📥 Fetching habit days...
✅ Fetched habits: 1 days
```

And the day you marked should **still be marked**.

### 7. Check Server Terminal
The `npm run dev` terminal should also log:
```
✅ Auth verified for user: <uuid>
📝 POST request: user=<uuid>, date=2024-04-07, marked=true
✏️ Upserting: user_id=<uuid>, tracked_date=2024-04-07
✅ Upserted successfully: [...]
```

## Common Issues

| Issue | Check |
|-------|-------|
| Data not saving | Network tab shows **401** → Token is invalid |
| Data not showing after refresh | Check if GET request returns data in Network Response |
| "Schema Issue" message | Run SQL migration in Supabase |
| Auth errors in console | Check `.env` has correct Supabase keys |

## Report What You See

When you click a day, tell me:
1. ✅ or ❌ in Console after marking?
2. Network tab status code?
3. Any error messages?
4. Server terminal output?

This will tell us exactly where it's failing!
