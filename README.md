# Chona’s Lodging House Reservation System

A responsive React + Vite reservation website with a room list, reservation request form, animated styling, Supabase integration, and a SQL schema.

## Run locally

1. Install Node.js 20 or newer.
2. Clone this repository and run `npm install`.
3. Copy `.env.example` to `.env`.
4. Create a Supabase project and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
5. Run the SQL in `supabase/migrations/202610260001_initial_schema.sql` using the Supabase SQL Editor.
6. Start the website with `npm run dev`.

If Supabase is not configured, the site shows sample rooms and the reservation form will explain that it is in demo mode. Reservation requests are stored in Supabase only after configuration and migration are complete.

## Deploy to Vercel

1. Import `jeromeitable37-alt/chonas-lodging-house` into Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings → Environment Variables.
3. Deploy or redeploy the project. Vercel uses `npm run build` and the `dist` output directory.

## Important security and functionality notes

- Use only the Supabase project URL and public anon/publishable key in frontend environment variables. Never expose a Supabase service-role key in browser code or commit secrets to GitHub.
- Row Level Security is enabled in the supplied migration. Review the policies before public launch.
- This version submits reservation requests, but it does not yet provide an admin dashboard, payment processing, email/SMS notifications, or automatic prevention of overlapping bookings. Add and test those workflows before using it for real paid reservations.
