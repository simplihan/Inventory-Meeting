# Monthly Meeting Dashboard — Deployment Guide

## Quick Deploy to Vercel

### Step 1 — Get your Supabase keys
1. Go to https://supabase.com/dashboard/project/ntuswtobbykwliabzqil/settings/api
2. Copy: **Project URL** and **anon public** key

### Step 2 — Set environment variables in Vercel
```
NEXT_PUBLIC_SUPABASE_URL=https://ntuswtobbykwliabzqil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 3 — Deploy
Option A — Vercel Dashboard:
1. Go to https://vercel.com/new
2. Upload the project folder or connect GitHub
3. Add env vars above
4. Click Deploy

Option B — Vercel CLI:
```bash
npm i -g vercel
vercel login
cd monthly-meeting
vercel --prod
```

## Pages Built
- `/login` — Auth with forgot password
- `/dashboard` — KPIs, charts, filters, data table
- `/data-entry` — Manual form to add records
- `/upload` — Excel import with preview
- `/reports` — Monthly reports + export
- `/manage/inventory` — Edit/delete/add records inline
- `/manage/users` — User roles management (Admin only)
- `/manage/database` — DB stats + danger zone (Admin only)
- `/settings` — Profile settings
- `/admin` — Admin panel
