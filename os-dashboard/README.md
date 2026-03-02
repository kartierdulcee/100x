# First Class Head Quarters (OS Dashboard)

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

## Supabase Setup (Auth + Data)

1. Run `supabase_schema_v2.sql` in Supabase SQL editor.
2. In Supabase Auth, enable Email/Password provider.
3. Create `.env` from `.env.example` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run app and create/login account.

## Import/Export

Use Export/Import buttons for backup or migration.

## Next (for full autonomy)

Wire the sync endpoint to:
1. store JSON in a DB (Supabase/Firebase/Postgres)
2. run scheduled jobs for reminders/reviews
3. push updates back to Discord/OpenClaw via automation
