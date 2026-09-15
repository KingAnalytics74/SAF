# SAF
AI-powered rota and staffing platform for care providers. Tracks open shifts, live staffing levels, and rest/fatigue risk, with care-compliance rules gender matching, coordinator-approved swaps, full audit trail built into shift assignment.

See `CLAUDE.md` for the full project brief, schema, and business rules.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Apply the schema to your Supabase project with the SQL in `supabase/migrations/`, then optionally load `supabase/seed.sql` for sample rota data.

The rota view currently renders from mock data in `src/lib/mock-data.ts` (see `src/lib/data/rota.ts`) until it's wired up to live Supabase queries.
