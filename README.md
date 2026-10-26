# Chona’s Lodging House Reservation System

Responsive React/Vite reservation website using Supabase Authentication and PostgreSQL, retaining the Chona’s green/cream/gold visual style.

## Features

- Responsive room browsing, room details, search and room filters.
- Live date availability search backed by a database RPC that returns available room IDs without exposing other guests' data.
- User registration, email confirmation, login, logout, forgot-password/reset flow.
- Supabase-backed customer reservations and server-side booking price/date/capacity checks.
- Database room locking and overlapping-date prevention.
- Reservation success receipt with reference number, stay dates, guest count, price summary and email status.
- Customer reservation status timeline.
- Admin overview with arrivals, departures, pending requests, recent revenue summary, upcoming arrivals and recent activity.
- Admin month calendar, reservation list/filter/status management, room add/edit/unlist forms, CSV export.
- Database audit activity log and transactional email delivery log.
- Server-side email notifications for new reservation requests and status changes using Resend. Email secrets never go into the browser.

## Supabase database setup

1. Open Supabase → SQL Editor.
2. Apply these migrations in order for a fresh setup:
   - `supabase/migrations/202610260002_secure_reservations.sql`
   - `supabase/migrations/202610260003_availability_notifications_audit.sql`
3. Under Supabase Authentication → URL Configuration, set the Site URL to your Vercel website and add its redirect URL (plus localhost for local development).
4. Register the staff account through the website, then promote only that trusted account to admin in SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('replace-with-admin-email@example.com');

   select full_name, email, role
   from public.profiles
   where lower(email) = lower('replace-with-admin-email@example.com');
   ```

## Vercel environment variables

Frontend values (public project credentials; keep Row Level Security enabled):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable/anon key.

Server-only values for `/api/notify-reservation`:

- `SUPABASE_SERVICE_ROLE_KEY` — secret database key. A supported Supabase secret key can be used as `SUPABASE_SECRET_KEY` instead. Never use a `VITE_` prefix for this value and never commit it to GitHub.
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` — sender on a domain verified with Resend.
- `ADMIN_NOTIFICATION_EMAIL` — staff recipient for new reservation notifications.

Redeploy Vercel after adding/changing environment variables.

## Email setup

1. Create a Resend account and verify a sender domain you control.
2. Create a Resend API key and add it to Vercel as `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to a sender on your verified domain, such as `Chona's Lodging House <bookings@your-verified-domain.example>`, replacing the example domain with your real verified domain.
4. Set the staff recipient in `ADMIN_NOTIFICATION_EMAIL`.
5. Submit a test booking. Inspect Admin → Activity → Email delivery history and check Resend's own logs to confirm final delivery/bounce status.

If email variables are missing, reservations can still be saved and the receipt will clearly state that email is not configured. Do not submit the same booking again just because an email attempt failed.

## Local development

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and enter the public Supabase URL/key.
3. Run `npm install`, then `npm run dev`.
4. Build with `npm run build`. Extra TypeScript checks are available via `npm run typecheck`.

## Security and scope

- Service-role/secret keys must stay server-side and never be placed in frontend code or GitHub.
- Row Level Security restricts customers to their own bookings and limits management actions to admin profiles.
- Availability search only returns room IDs; final booking creation still performs the authoritative conflict check under a room-row lock.
- Email acceptance by Resend is not proof of final inbox delivery; test with a real inbox and inspect provider logs.
- Payments, SMS notifications, housekeeping inventory, and production backups are not included.
