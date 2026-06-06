# AI Insights Streaming Issue — Debugging Report

## The Error

**Symptom:** The `/api/ai/insights` endpoint returns HTTP 200 with a successful stream response, but the frontend (`AIInsights.tsx` component) displays nothing. No text appears in the UI, no error is shown, the component just stays blank after the loading skeleton disappears.

**Server logs show success:**
```
✅ [insights] streamText returned successfully
🔄 [insights] Converting to text stream response...
POST /api/ai/insights 200 in 1376ms (next.js: 4ms, application-code: 1372ms)
```

**Frontend behavior:**
- Button click triggers the request
- Loading skeleton appears briefly
- Then blank card, no insights text displayed
- No error message shown
- No browser console errors logged (yet)

---

## Fixes Attempted

### Fix #1: Add Bearer Token to Request
**Problem:** Initial auth header was missing.  
**Solution:** Modified `AIInsights.tsx` to fetch auth token on mount and pass it via `headers` in `useCompletion` options.  
**Result:** ✅ Resolved 401 error, now getting 200.

### Fix #2: Use `toTextStreamResponse()` Instead of `new NextResponse(result.textStream)`
**Problem:** Stream wasn't being properly formatted for the client hook.  
**Solution:** Changed `/api/ai/insights/route.ts` to return `result.toTextStreamResponse()` instead of manually wrapping in `NextResponse`.  
**Result:** ⚠️ Still no visible output on frontend, but server returns 200 (not 400/500).

### Fix #3: Add Client-Side Debug Logging
**Problem:** Unknown where the stream breaks (server? browser? hook parsing?).  
**Solution:** Added `useEffect` watchers to log when `completion` or `error` states change, plus debug info panel in UI.  
**Result:** ⚠️ Debug panel appears but no logs fire (no "Completion received" message, no errors either).

---

## Root Cause Analysis

### Most Likely Cause: Hook/Stream Format Mismatch
The `@ai-sdk/react` `useCompletion` hook expects a specific response format. `toTextStreamResponse()` returns a proper Server-Sent Events (SSE) stream, BUT:

1. **The hook may not be parsing the response correctly** — `useCompletion` might expect plain text chunks, not SSE format with event markers like `"data: [chunk]"`
2. **OR the stream is arriving but completion state never updates** — The hook reads the stream but doesn't fire the `completion` state update, leaving `completion` empty string instead of populated text

### Evidence:
- Server successfully calls `streamText` ✅
- Server successfully converts to stream response ✅
- HTTP 200 returned ✅
- BUT no "Completion received" console log fires on frontend ❌
- AND no error logged either ❌

This suggests the stream is being sent, but the client-side `useCompletion` hook is silently not parsing it or not updating state.

### Secondary Possibility: Wrong API Response Format
The Vercel AI SDK's `toTextStreamResponse()` may expect the response to be sent to a **different endpoint format** or the `useCompletion` hook may need a different configuration:
- Maybe the hook expects `multiline` mode enabled
- Maybe the response needs custom `Content-Type` headers
- Maybe streaming from a custom server requires different hook options than the default

### Tertiary Possibility: Version Mismatch
Installed versions:
- `ai@6.0.197`
- `@ai-sdk/react@3.0.199`

These versions may have incompatible streaming APIs. The `toTextStreamResponse()` method might expect a different client-side hook configuration.

---

## Debugging Next Steps (Recommendations for AI Agent)

1. **Check actual HTTP response in browser DevTools** — Network tab, look at the response body/headers to confirm the stream is actually arriving
2. **Try alternative streaming approach** — Instead of `toTextStreamResponse()`, manually format response as proper text/event-stream with `event: completion` markers
3. **Verify useCompletion hook options** — Check @ai-sdk/react docs for `streamMode` or `format` options that might need to be set
4. **Test with simpler streaming endpoint** — Create a minimal `/api/test-stream` that just returns `"hello world"` to verify useCompletion works at all
5. **Compare with working streaming example** — The Vercel AI SDK docs likely have an example repo; compare that repo's endpoint + frontend code directly
6. **Check if completion state is updating at all** — Add `console.log(completion, isLoading)` directly in render to see raw values, not just when they change

---

## Files Involved
- `/app/api/ai/insights/route.ts` — Server-side streaming endpoint
- `/app/components/AIInsights.tsx` — Client-side useCompletion hook consumer
- `/app/components/HabitTracker.tsx` — Parent component (just renders AIInsights in tab)

---

## Environment
- Next.js: 16.2.1
- React: 19.2.4
- ai: 6.0.197
- @ai-sdk/react: 3.0.199
- @ai-sdk/groq: 3.0.39
- GROQ_API_KEY: ✅ Present and valid
