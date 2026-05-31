# Monthly Meeting — Inventory Dashboard

Enterprise SaaS inventory dashboard built with Next.js 15, Supabase, Recharts and Tailwind CSS.

## Features

- 📊 Real-time KPI cards with MoM trends
- 📈 7 interactive charts (donut, line, bar, area)
- 🔍 Multi-select filters (LOC, BD LOC, SKU Type, Category, Month)
- 📋 Full CRUD inventory table — inline edit, bulk delete, export
- 📥 Excel import with column mapping & preview
- ✏️ Manual data entry form
- 👥 User management with role-based access (Admin/Manager/Viewer)
- 🗄️ Database tools — stats, delete by month/LOC
- 📄 Monthly reports with Excel export
- 🌙 Dark mode

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Main dashboard — KPIs, charts, filters |
| `/data-entry` | Manual add record form |
| `/upload` | Import Excel file |
| `/reports` | Monthly reports + export |
| `/manage/inventory` | Full CRUD — edit/add/delete records |
| `/manage/users` | User role management (Admin only) |
| `/manage/database` | DB stats + bulk delete tools (Admin only) |
| `/settings` | Profile settings |

## Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deploy**: Vercel

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy env file and fill in your Supabase keys:
   ```bash
   cp .env.example .env.local
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://ntuswtobbykwliabzqil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get your keys from: https://supabase.com/dashboard/project/ntuswtobbykwliabzqil/settings/api

## Deploy to Vercel

Connected to Vercel via GitHub. Push to `main` branch to auto-deploy.
