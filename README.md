# Chona’s Lodging House Reservation System

A mobile-friendly React + Vite reservation website with Supabase-ready database schema.

## Setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key.
4. Run `npm run dev`.

## Supabase

Run `supabase/migrations/202610260001_initial_schema.sql` in the Supabase SQL Editor. The frontend uses the public anon key only; never put a service-role key in browser code.

## Deployment

Import this repository into Vercel. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Settings → Environment Variables, then redeploy.

Note: the UI is Supabase-ready, but reservation creation is enabled only after valid Supabase credentials are configured and the migration is applied.