# Instructions for Claude AI

**⚠️ READ THIS FIRST EVERY TIME YOU WORK ON CONTRACT_AGENT ⚠️**

---

## Mandatory Reading Order

When starting ANY session on the contract_agent project:

### 1️⃣ FIRST - Read This File
You're here now. Good!

### 2️⃣ SECOND - Read CODEBASE_OVERVIEW.md
```
File: .claude_cache/CODEBASE_OVERVIEW.md
Contains: Complete project structure, tech stack, API routes, data flows
Time to read: ~2 minutes
```

### 3️⃣ THIRD - Check Recent Sessions
```
Folder: .claude_cache/sessions/
Look for: Most recent date-stamped files
Purpose: See what work was done recently
```

### 4️⃣ FOURTH - Only Then Read Source Files
Only read actual `.ts`/`.tsx` files when you need specific implementation details not covered in the cache.

---

## Cache Benefits

✅ **90% faster** context loading
✅ **Save ~150k tokens** per session
✅ **Instant** project understanding
✅ **Better** continuity between sessions

---

## When to Update Cache

Update `CODEBASE_OVERVIEW.md` when:
- Major features added
- Architecture changes
- New API endpoints
- Significant refactoring

Create new session file when:
- Completing major work
- Making architectural decisions
- Discovering important patterns
- Fixing critical bugs

---

## Session File Template

When creating a new session file:

```markdown
# Session Cache: [Brief Description]

**Date:** YYYY-MM-DD
**Session Type:** [Feature/Bugfix/Analysis/Refactor]
**Duration:** [Approximate time]

## What Was Done
- List changes
- Document decisions
- Note any gotchas

## Files Modified
- path/to/file.ts
- path/to/file2.tsx

## Key Insights
- Important learnings
- Patterns discovered
- Issues resolved

## Next Steps
- [ ] TODO items
- [ ] Follow-up work
```

---

## Quick Reference

### Project Location
`/Users/patmini/Desktop/apps/contract_agent`

### Key Folders
- `app/api/` - API routes
- `components/` - React components
- `lib/` - Utilities & business logic
- `lib/contracts.ts` - 21 contract templates

### Main Tech Stack
- Next.js 16 + React 19
- TypeScript
- Supabase (auth + db)
- Stripe (payments)
- Gemini AI (primary)
- Tailwind + shadcn/ui

---

## Emergency: Cache Invalid?

If cache is outdated or incorrect:

1. Delete `.claude_cache/` folder
2. Re-analyze codebase
3. Regenerate cache files
4. Update this timestamp: **2026-03-15**

---

**Remember:** The cache is your friend. Use it! 🚀
