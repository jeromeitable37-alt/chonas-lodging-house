create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  capacity integer not null default 2 check (capacity > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id),
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  email text not null,
  phone text,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1 check (guests > 0),
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  constraint booking_dates_valid check (check_out > check_in),
  constraint booking_guest_count_valid check (guests <= 20)
);

create index if not exists bookings_room_dates_idx on public.bookings(room_id, check_in, check_out);
create index if not exists bookings_email_idx on public.bookings(lower(email));
create index if not exists bookings_status_idx on public.bookings(status);

alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Anyone can view active rooms" on public.rooms;
create policy "Anyone can view active rooms" on public.rooms for select using (is_active = true);

drop policy if exists "Guests can submit reservation requests" on public.bookings;
create policy "Guests can submit reservation requests" on public.bookings for insert to anon, authenticated with check (
  status = 'pending'
  and check_out > check_in
  and length(trim(guest_name)) > 0
  and length(trim(email)) > 3
  and guests > 0
);

drop policy if exists "Guests can view their own reservations" on public.bookings;
create policy "Guests can view their own reservations" on public.bookings for select to authenticated using (user_id = auth.uid());

insert into public.rooms (id,name,description,price,capacity,image_url,is_active)
values
 ('standard','Standard Room','A comfortable, simple room for a relaxing stay.',850,2,null,true),
 ('deluxe','Deluxe Room','Extra space and comfort for couples or small families.',1250,3,null,true),
 ('family','Family Room','Room to settle in together with your family.',1800,5,null,true)
on conflict (id) do nothing;
