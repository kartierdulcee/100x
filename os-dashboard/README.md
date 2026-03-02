# 100x OS Dashboard

Black UI dashboard for:
- Mission tasks + upcoming schedule
- Trading compliance chart
- Outreach volume chart
- Habit streak tracking
- Sync/autonomy controls

Built with React + Tailwind + shadcn-style cards/layout + Recharts.

## Run

```bash
cd os-dashboard
npm install
npm run dev
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).

## Sync

In **Sync + Autonomy Controls** set:
- `Sync endpoint`: your webhook/API URL
- `Sync token`: optional bearer token

`Sync now` sends full dashboard JSON via POST.

## Import/Export

Use Export/Import buttons for backup or migration.

## Next (for full autonomy)

Wire the sync endpoint to:
1. store JSON in a DB (Supabase/Firebase/Postgres)
2. run scheduled jobs for reminders/reviews
3. push updates back to Discord/OpenClaw via automation
