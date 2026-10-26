# Chona’s Lodging House Reservation System

A responsive room-browsing and lodging reservation website built with React, Vite, Supabase Authentication, PostgreSQL, and Row Level Security.

## Current features

- Photo-based homepage, responsive room cards, room details, search, and room-type filters.
- Login, registration, email confirmation, logout, show/hide password, and password reset/update flow.
- Shared reservations stored in Supabase instead of browser-only storage.
- Booking price calculated from the current database room rate.
- Server-side room locking and overlapping-date checks to prevent double booking for active pending/confirmed/in-house reservations.
- Customer reservation list and admin reservation management.
- Supabase Row Level Security for profile, room, and booking access.
- Admin role is read from the protected profile record, not from a client-side email constant.

## Configure Supabase

1. Create a Supabase project.
2. In Supabase SQL Editor, run supabase/migrations/202610260002_secure_reservations.sql.
3. In Supabase Authentication URL Configuration, add the Vercel website URL to Site URL and Redirect URLs. Include localhost while developing.
4. Register your intended staff/admin account through the website after the environment variables are set.
5. In Supabase SQL Editor, promote that already-registered account to admin by replacing the sample email with the exact account email:

   update public.profiles
   set role = 'admin'
   where lower(email) = lower('replace-with-admin-email@example.com');

Run this only for trusted staff. Never let guests choose their own role. Role updates are not granted to normal authenticated users.

## Local development

1. Install Node.js 20 or newer.
2. Copy .env.example to .env and enter your Supabase project URL and public anon/publishable key.
3. Run npm install.
4. Run npm run dev.
5. Optional TypeScript check: npm run typecheck.
6. Build: npm run build.

## Deploy to Vercel

1. Import this repository into Vercel.
2. In Project Settings → Environment Variables, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
3. Redeploy after setting the variables.
4. Confirm the Supabase URL configuration includes the Vercel domain and password-reset redirects.

The build can succeed without Supabase variables, but authentication and online reservations remain disabled until valid variables and the SQL migration are configured.

## Security and scope notes

- Never put a Supabase service_role or secret key in VITE_* variables, frontend code, or GitHub.
- Guests can only read their own booking records; admin actions are enforced by RLS in the database.
- Reservations are inserted through the create_booking SQL function. It locks the room record before checking date overlap and inserting a booking, so concurrent requests for the same room are serialized.
- Payments, automated email/SMS notifications, identity verification, and hosting/payment-provider operational checks are not included. Do not accept real payments until the entire production workflow has been reviewed and tested.
- If Supabase is not configured, the UI displays sample rooms for preview only; online sign-in and reservation creation are disabled.
