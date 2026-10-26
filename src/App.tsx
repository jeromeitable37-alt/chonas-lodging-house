import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coffee,
  DoorOpen,
  Filter,
  House,

  MapPin,
  Menu,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  UserPlus,
  UserRound,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wifi,
  X,
} from 'lucide-react';

type Room = {
  id: number;
  name: string;
  type: string;
  price: number;
  guests: number;
  beds: string;
  description: string;
  image: string;
  amenities: string[];
  available: boolean;
};
type Booking = {
  id: string;
  roomId: number;
  roomName: string;
  guest: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Checked in' | 'Completed' | 'Cancelled';
  createdAt: string;
  userId?: string;
};
type Account = { id: string; name: string; email: string; salt: string; passwordHash: string; createdAt: string; };
type CurrentUser = Pick<Account, 'id' | 'name' | 'email'>;
type AuthMode = 'login' | 'register' | null;
type AuthForm = { name: string; email: string; password: string; confirmPassword: string; };
const seedRooms: Room[] = [
  {
    id: 1,
    name: 'Garden Standard',
    type: 'Standard',
    price: 850,
    guests: 2,
    beds: '1 double bed',
    description:
      'A cozy, restful room with garden views and all the essentials for a comfortable stay.',
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1100&q=85',
    amenities: ['Wi-Fi', 'Air conditioning', 'Private bath'],
    available: true,
  },
  {
    id: 2,
    name: 'Deluxe Twin Room',
    type: 'Deluxe',
    price: 1250,
    guests: 3,
    beds: '2 single beds',
    description:
      'A bright and spacious room for friends, small families, or travel companions.',
    image:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1100&q=85',
    amenities: ['Wi-Fi', 'Air conditioning', 'Hot shower', 'Desk'],
    available: true,
  },
  {
    id: 3,
    name: 'Family Comfort Suite',
    type: 'Family',
    price: 1850,
    guests: 5,
    beds: '2 beds + daybed',
    description:
      'Extra space for the whole family, with a lounge corner and a relaxed atmosphere.',
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1100&q=85',
    amenities: ['Wi-Fi', 'Air conditioning', 'Hot shower', 'Lounge'],
    available: true,
  },
  {
    id: 4,
    name: 'Quiet Single Room',
    type: 'Single',
    price: 650,
    guests: 1,
    beds: '1 single bed',
    description:
      'Simple, private, and budget-friendly. A comfortable place to recharge after a busy day.',
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1100&q=85',
    amenities: ['Wi-Fi', 'Fan', 'Shared lounge'],
    available: true,
  },
];
const money = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
const nightsBetween = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(salt + ':' + password);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};
const createPasswordSalt = () => Array.from(window.crypto.getRandomValues(new Uint8Array(16))).map(byte => byte.toString(16).padStart(2, '0')).join('');
const today = new Date().toISOString().slice(0, 10);

function App() {
  const [rooms, setRooms] = useState<Room[]>(() =>
    readStorage('chona-rooms', seedRooms)
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    readStorage('chona-bookings', [])
  );
  const [view, setView] = useState<'home' | 'rooms' | 'mybookings' | 'admin'>(
    'home'
  );
  const [users, setUsers] = useState<Account[]>(() => readStorage('chona-users', []));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => readStorage('chona-session', null));
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authForm, setAuthForm] = useState<AuthForm>({ name: '', email: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All rooms');
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'reservations' | 'rooms'>(
    'reservations'
  );
  const [statusFilter, setStatusFilter] = useState('All');
  const [guestSearch, setGuestSearch] = useState('');
  const [form, setForm] = useState({
    guest: '',
    email: '',
    phone: '',
    checkIn: today,
    checkOut: '',
    guests: '2',
  });

  useEffect(() => {
    localStorage.setItem('chona-rooms', JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem('chona-bookings', JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => { localStorage.setItem('chona-users', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('chona-session', JSON.stringify(currentUser));
    else localStorage.removeItem('chona-session');
  }, [currentUser]);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(''), 4200);
    return () => window.clearTimeout(id);
  }, [notice]);

  const visibleRooms = useMemo(
    () =>
      rooms.filter(room => {
        const matchesSearch = (
          room.name +
          ' ' +
          room.type +
          ' ' +
          room.description
        )
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch &&
          (filterType === 'All rooms' || room.type === filterType)
        );
      }),
    [rooms, search, filterType]
  );
  const activeBookings = bookings.filter(
    b => !['Cancelled', 'Completed'].includes(b.status)
  );
  const totalRevenue = bookings
    .filter(b => ['Completed', 'Checked in'].includes(b.status))
    .reduce((sum, b) => sum + b.total, 0);
  const selectedNights =
    form.checkIn && form.checkOut
      ? nightsBetween(form.checkIn, form.checkOut)
      : 0;
  const selectedTotal = bookingRoom
    ? bookingRoom.price * Math.max(0, selectedNights)
    : 0;
  const filteredBookings = bookings.filter(
    b =>
      (statusFilter === 'All' || b.status === statusFilter) &&
      (b.guest + ' ' + b.email + ' ' + b.roomName)
        .toLowerCase()
        .includes(guestSearch.toLowerCase())
  );

  const myBookings = currentUser ? bookings.filter(b => b.userId === currentUser.id || (!b.userId && b.email.toLowerCase() === currentUser.email.toLowerCase())) : [];

  const go = (next: typeof view) => {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openAuth = (mode: Exclude<AuthMode, null>) => {
    setAuthMode(mode);
    setAuthError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAuthForm({ name: currentUser?.name || '', email: currentUser?.email || '', password: '', confirmPassword: '' });
    setMenuOpen(false);
  };
  const handleLogout = () => { setCurrentUser(null); setNotice('You have signed out.'); };
  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authMode) return;
    setAuthError('');
    const email = authForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthError('Enter a valid email address.'); return; }
    if (authMode === 'register') {
      if (!authForm.name.trim()) { setAuthError('Please enter your full name.'); return; }
      if (authForm.password.length < 8) { setAuthError('Use a password with at least 8 characters.'); return; }
      if (authForm.password !== authForm.confirmPassword) { setAuthError('The passwords do not match.'); return; }
      if (users.some(user => user.email.toLowerCase() === email)) { setAuthError('An account with this email already exists. Log in instead.'); return; }
    } else if (!authForm.password) { setAuthError('Enter your password to continue.'); return; }
    setAuthBusy(true);
    try {
      if (authMode === 'register') {
        const salt = createPasswordSalt();
        const account: Account = {
          id: 'USER-' + Date.now().toString(36).toUpperCase(),
          name: authForm.name.trim(), email, salt,
          passwordHash: await hashPassword(authForm.password, salt),
          createdAt: new Date().toISOString(),
        };
        setUsers(previous => [...previous, account]);
        setCurrentUser({ id: account.id, name: account.name, email: account.email });
        setAuthMode(null);
        setNotice('Account created. Welcome to Chona’s Lodging House!');
      } else {
        const account = users.find(user => user.email.toLowerCase() === email);
        if (!account) { setAuthError('No account found for that email. Please register first.'); return; }
        const submittedHash = await hashPassword(authForm.password, account.salt);
        if (submittedHash !== account.passwordHash) { setAuthError('Incorrect email or password. Please try again.'); return; }
        setCurrentUser({ id: account.id, name: account.name, email: account.email });
        setAuthMode(null);
        setNotice('Welcome back, ' + account.name.split(' ')[0] + '!');
      }
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch {
      setAuthError('This browser could not securely process the password. Open the site on HTTPS or localhost and try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const startBooking = (room: Room) => {
    setForm({
      guest: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      checkIn: today,
      checkOut: '',
      guests: String(Math.min(2, room.guests)),
    });
    setBookingRoom(room);
    setDetailRoom(null);
  };
  const submitBooking = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nights = nightsBetween(form.checkIn, form.checkOut);
    if (
      !bookingRoom ||
      !form.guest.trim() ||
      !form.email.includes('@') ||
      !form.phone.trim() ||
      nights < 1 ||
      form.checkIn < today ||
      Number(form.guests) < 1 ||
      Number(form.guests) > bookingRoom.guests
    ) {
      setNotice(
        'Please check your details. Checkout must be after check-in and guest count must fit the room.'
      );
      return;
    }
    const booking: Booking = {
      id: 'HH-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      roomId: bookingRoom.id,
      roomName: bookingRoom.name,
      guest: form.guest.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: Number(form.guests),
      total: bookingRoom.price * nights,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      userId: currentUser?.id,
    };
    setBookings(previous => [booking, ...previous]);
    setBookingRoom(null);
    setNotice(
      'Reservation request submitted! Your reference is ' +
        booking.id +
        '. The booking is pending confirmation.'
    );
    go('mybookings');
  };
  const updateStatus = (id: string, status: Booking['status']) =>
    setBookings(previous =>
      previous.map(b => (b.id === id ? { ...b, status } : b))
    );
  const deleteBooking = (id: string) => {
    if (window.confirm('Delete this reservation? This cannot be undone.')) {
      setBookings(previous => previous.filter(b => b.id !== id));
      setNotice('Reservation deleted.');
    }
  };
  const deleteRoom = (id: number) => {
    if (window.confirm('Remove this room from the listings?')) {
      setRooms(previous => previous.filter(r => r.id !== id));
      setNotice('Room removed.');
    }
  };
  const addRoom = () => {
    const name = window.prompt('Room name?');
    if (!name?.trim()) return;
    const priceRaw = window.prompt('Nightly rate in PHP?', '1000');
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 1) {
      setNotice('Please enter a valid room rate.');
      return;
    }
    setRooms(previous => [
      ...previous,
      {
        id: Math.max(0, ...previous.map(r => r.id)) + 1,
        name: name.trim(),
        type: 'Standard',
        price,
        guests: 2,
        beds: '1 double bed',
        description: 'A comfortable room for your stay.',
        image: seedRooms[0].image,
        amenities: ['Wi-Fi', 'Air conditioning'],
        available: true,
      },
    ]);
    setNotice('New room added to listings.');
  };

  return (
    <div className="site-shell">
      <div className="topline">
        <span>
          <MapPin size={13} /> A quiet stay, a warm welcome
        </span>
        <span className="topline-right">
          Reservations welcome <span className="topline-dot">•</span> Open daily
        </span>
      </div>
      <header className="nav-wrap">
        <button
          className="brand"
          onClick={() => go('home')}
          aria-label="Chona’s Lodging House home"
        >
          <span className="brand-mark">
            <House size={22} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong>
              Chona’s<span> Lodging House</span>
            </strong>
            <small>LODGING & RESERVATIONS</small>
          </span>
        </button>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <button
            className={view === 'home' ? 'nav-link active' : 'nav-link'}
            onClick={() => go('home')}
          >
            Home
          </button>
          <button
            className={view === 'rooms' ? 'nav-link active' : 'nav-link'}
            onClick={() => go('rooms')}
          >
            Our rooms
          </button>
          <button
            className={view === 'mybookings' ? 'nav-link active' : 'nav-link'}
            onClick={() => go('mybookings')}
          >
            My reservations
          </button>
          <button
            className={view === 'admin' ? 'nav-link active' : 'nav-link'}
            onClick={() => go('admin')}
          >
            Admin
          </button>
          {!currentUser ? (
            <>
              <button className="nav-link auth-nav-link" onClick={() => openAuth('login')}><LogIn size={14} /> Log in</button>
              <button className="nav-link auth-nav-link auth-nav-register" onClick={() => openAuth('register')}><UserPlus size={14} /> Register</button>
            </>
          ) : (
            <>
              <button className="nav-link auth-nav-link" onClick={() => go('mybookings')} title={currentUser.email}><UserRound size={14} /> {currentUser.name.split(' ')[0]}</button>
              <button className="nav-link auth-nav-link" onClick={handleLogout}><LogOut size={14} /> Log out</button>
            </>
          )}
        </nav>
        <button className="nav-cta" onClick={() => go('rooms')}>
          Book a room <ChevronRight size={16} />
        </button>
      </header>

      {view === 'home' && (
        <main>
          <section className="hero">
            <div className="hero-image" />
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="eyebrow light">
                <span /> YOUR HOME AWAY FROM HOME
              </div>
              <h1>
                Rest easy.
                <br />
                <em>Stay a little longer.</em>
              </h1>
              <p>
                A welcoming place to pause, recharge, and feel at home. Find a
                room that fits your trip and let us take care of the rest.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-light"
                  onClick={() => go('rooms')}
                >
                  Explore our rooms <ChevronRight size={17} />
                </button>
                <span className="hero-rating">
                  <span className="stars"><Sparkles size={14} /></span>
                  <span>Comfort you can count on</span>
                </span>
              </div>
            </div>
            <div className="hero-note">
              <Sparkles size={16} />
              <span>Thoughtful comfort, every stay</span>
            </div>
          </section>
          <section className="search-panel">
            <div className="search-intro">
              <span className="search-icon">
                <CalendarDays size={20} />
              </span>
              <div>
                <strong>Find your stay</strong>
                <small>Start planning your next visit</small>
              </div>
            </div>
            <div className="search-field">
              <label htmlFor="home-search">ROOM OR KEYWORD</label>
              <div>
                <Search size={16} />
                <input
                  id="home-search"
                  placeholder="Try “family” or “deluxe”"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="search-field">
              <label htmlFor="home-type">ROOM TYPE</label>
              <div>
                <BedDouble size={16} />
                <select
                  id="home-type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option>All rooms</option>
                  {Array.from(new Set(rooms.map(r => r.type))).map(type => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <button
              className="button button-primary search-submit"
              onClick={() => go('rooms')}
            >
              Find a room <ChevronRight size={16} />
            </button>
          </section>
          <section className="section section-rooms">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span /> COMFORT FOR EVERY KIND OF TRIP
                </div>
                <h2>
                  Rooms made for <em>rest.</em>
                </h2>
                <p>
                  Thoughtful spaces, honest rates, and the little things that
                  make a stay feel special.
                </p>
              </div>
              <button className="text-link" onClick={() => go('rooms')}>
                View all rooms <ChevronRight size={16} />
              </button>
            </div>
            <div className="room-grid">
              {visibleRooms.slice(0, 3).map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onDetails={() => setDetailRoom(room)}
                  onBook={() => startBooking(room)}
                />
              ))}
            </div>
          </section>
          <section className="promise-band">
            <div className="promise-item">
              <span>
                <ShieldCheck />
              </span>
              <div>
                <strong>A stay you can trust</strong>
                <small>Clear rates and reservation details</small>
              </div>
            </div>
            <div className="promise-item">
              <span>
                <Coffee />
              </span>
              <div>
                <strong>Comfort in the details</strong>
                <small>Simple amenities for a restful stay</small>
              </div>
            </div>
            <div className="promise-item">
              <span>
                <Clock3 />
              </span>
              <div>
                <strong>Easy booking</strong>
                <small>Send your request in just a few steps</small>
              </div>
            </div>
          </section>
          <section className="bottom-cta">
            <div>
              <div className="eyebrow light">
                <span /> YOUR NEXT STAY STARTS HERE
              </div>
              <h2>
                Make room for a <em>good rest.</em>
              </h2>
              <p>
                Browse our rooms and send a reservation request whenever you're
                ready.
              </p>
            </div>
            <button className="button button-light" onClick={() => go('rooms')}>
              Browse rooms <ChevronRight size={17} />
            </button>
          </section>
        </main>
      )}

      {view === 'rooms' && (
        <main className="page-main">
          <div className="page-banner">
            <div className="eyebrow">
              <span /> FIND YOUR PERFECT FIT
            </div>
            <h1>
              Our <em>rooms.</em>
            </h1>
            <p>
              Choose a space that suits your trip, your people, and your budget.
            </p>
          </div>
          <div className="listing-tools">
            <div className="listing-search">
              <Search size={17} />
              <input
                placeholder="Search rooms, amenities, or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-select">
              <Filter size={16} />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option>All rooms</option>
                {Array.from(new Set(rooms.map(r => r.type))).map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <span className="result-count">
              {visibleRooms.length} rooms found
            </span>
          </div>
          {visibleRooms.length ? (
            <div className="room-grid room-grid-full">
              {visibleRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onDetails={() => setDetailRoom(room)}
                  onBook={() => startBooking(room)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BedDouble size={32} />
              <h3>No rooms found</h3>
              <p>Try a different keyword or room type.</p>
              <button
                className="button button-primary"
                onClick={() => {
                  setSearch('');
                  setFilterType('All rooms');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </main>
      )}

      {view === 'mybookings' && (
        <main className="page-main">
          <div className="page-banner">
            <div className="eyebrow">
              <span /> YOUR STAY, AT A GLANCE
            </div>
            <h1>
              My <em>reservations.</em>
            </h1>
            <p>Review reservation requests linked to your account.</p>
          </div>
          {!currentUser ? (
            <div className="empty-state auth-bookings-prompt">
              <UserRound size={34} />
              <h3>Log in to view your reservations</h3>
              <p>Your reservation list is linked to the account you use on this browser.</p>
              <div className="auth-prompt-actions">
                <button className="button button-primary" onClick={() => openAuth('login')}><LogIn size={15} /> Log in</button>
                <button className="button button-outline" onClick={() => openAuth('register')}><UserPlus size={15} /> Register</button>
              </div>
            </div>
          ) : myBookings.length ? (
            <div className="my-booking-list">
              {myBookings.map(b => (
                <article className="booking-card" key={b.id}>
                  <div className="booking-room-icon">
                    <BedDouble />
                  </div>
                  <div className="booking-main">
                    <div className="booking-title-line">
                      <h3>{b.roomName}</h3>
                      <StatusPill status={b.status} />
                    </div>
                    <p>
                      Reference: <strong>{b.id}</strong> · {b.guest}
                    </p>
                    <div className="booking-meta">
                      <span>
                        <CalendarDays size={14} /> {b.checkIn} → {b.checkOut}
                      </span>
                      <span>
                        <Users size={14} /> {b.guests} guest
                        {b.guests > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="booking-total">
                    <small>ESTIMATED TOTAL</small>
                    <strong>{money(b.total)}</strong>
                    <small>
                      {nightsBetween(b.checkIn, b.checkOut)} night(s)
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ClipboardList size={34} />
              <h3>No reservations yet</h3>
              <p>
                Once you send a booking request, its details will appear here.
              </p>
              <button
                className="button button-primary"
                onClick={() => go('rooms')}
              >
                Find a room
              </button>
            </div>
          )}
          <div className="notice-panel">
            <CircleHelp size={18} />
            <p>
              <strong>Need help with a reservation?</strong>
              <br />
              Contact the lodging house for assistance. Requests
              remain pending until staff confirm them.
            </p>
          </div>
        </main>
      )}

      {view === 'admin' && (
        <main className="admin-page">
          <div className="admin-heading">
            <div>
              <div className="eyebrow">
                <span /> PROPERTY MANAGEMENT
              </div>
              <h1>
                Admin <em>dashboard.</em>
              </h1>
              <p>
                Manage room listings and reservation requests for this demo
                property.
              </p>
            </div>
            <span className="admin-demo">
              <ShieldCheck size={15} /> DEMO ADMIN VIEW
            </span>
          </div>
          <div className="stats-grid">
            <StatCard
              label="Total reservations"
              value={bookings.length}
              note="All booking requests"
              icon={<ClipboardList />}
            />
            <StatCard
              label="Awaiting confirmation"
              value={bookings.filter(b => b.status === 'Pending').length}
              note="Needs staff review"
              icon={<Clock3 />}
            />
            <StatCard
              label="Active stays"
              value={
                activeBookings.filter(b => b.status === 'Checked in').length
              }
              note="Currently checked in"
              icon={<DoorOpen />}
            />
            <StatCard
              label="Recorded revenue"
              value={money(totalRevenue)}
              note="Checked-in and completed"
              icon={<span className="peso">₱</span>}
            />
          </div>
          <div className="admin-workspace">
            <div className="admin-tabs">
              <button
                className={
                  adminTab === 'reservations'
                    ? 'admin-tab selected'
                    : 'admin-tab'
                }
                onClick={() => setAdminTab('reservations')}
              >
                Reservations <span>{bookings.length}</span>
              </button>
              <button
                className={
                  adminTab === 'rooms' ? 'admin-tab selected' : 'admin-tab'
                }
                onClick={() => setAdminTab('rooms')}
              >
                Room listings <span>{rooms.length}</span>
              </button>
            </div>
            {adminTab === 'reservations' ? (
              <>
                <div className="admin-toolbar">
                  <div className="listing-search">
                    <Search size={16} />
                    <input
                      placeholder="Search guest or room..."
                      value={guestSearch}
                      onChange={e => setGuestSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="status-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    {[
                      'All',
                      'Pending',
                      'Confirmed',
                      'Checked in',
                      'Completed',
                      'Cancelled',
                    ].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>GUEST / REFERENCE</th>
                        <th>ROOM & DATES</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.guest}</strong>
                            <small>{b.id}</small>
                            <small>{b.email}</small>
                          </td>
                          <td>
                            <strong>{b.roomName}</strong>
                            <small>
                              {b.checkIn} → {b.checkOut}
                            </small>
                            <small>{b.guests} guest(s)</small>
                          </td>
                          <td className="table-total">{money(b.total)}</td>
                          <td>
                            <StatusPill status={b.status} />
                          </td>
                          <td>
                            <select
                              aria-label={'Update status for ' + b.id}
                              className="row-status"
                              value={b.status}
                              onChange={e =>
                                updateStatus(
                                  b.id,
                                  e.target.value as Booking['status']
                                )
                              }
                            >
                              {[
                                'Pending',
                                'Confirmed',
                                'Checked in',
                                'Completed',
                                'Cancelled',
                              ].map(s => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                            <button
                              className="icon-button danger"
                              title="Delete reservation"
                              onClick={() => deleteBooking(b.id)}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredBookings.length === 0 && (
                  <div className="table-empty">
                    No reservations match your filters.
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rooms-admin-toolbar">
                  <p>
                    Room rates are per night. Add a room or remove a listing.
                  </p>
                  <button className="button button-primary" onClick={addRoom}>
                    + Add room
                  </button>
                </div>
                <div className="room-admin-list">
                  {rooms.map(room => (
                    <div className="room-admin-row" key={room.id}>
                      <img src={room.image} alt="" />
                      <div>
                        <strong>{room.name}</strong>
                        <small>
                          {room.type} · up to {room.guests} guest(s)
                        </small>
                      </div>
                      <strong>
                        {money(room.price)}
                        <small>/night</small>
                      </strong>
                      <button
                        className="icon-button danger"
                        title={'Remove ' + room.name}
                        onClick={() => deleteRoom(room.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="demo-disclaimer">
            Demo note: this version stores data in the current browser using
            local storage. It is suitable for a prototype; production use needs
            secure staff login and shared server-side storage.
          </p>
        </main>
      )}

      <footer className="footer">
        <div className="footer-main">
          <div className="brand footer-brand">
            <span className="brand-mark">
              <House size={22} />
            </span>
            <span className="brand-copy">
              <strong>
                Chona’s<span> Lodging House</span>
              </strong>
              <small>LODGING & RESERVATIONS</small>
            </span>
          </div>
          <p>A welcoming place to pause, recharge, and feel at home.</p>
          <div className="footer-contact">
            <span>
              <MapPin size={15} /> Philippines
            </span>
            <span>
              <CalendarDays size={15} /> Send reservation requests online
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Chona’s Lodging House.</span>
          <span>Comfort, care, and a little peace of mind.</span>
        </div>
      </footer>

      {notice && (
        <div className="toast" role="status">
          <span className="toast-check">
            <Check size={16} />
          </span>
          {notice}
          <button
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {authMode && (
        <div className="modal-backdrop auth-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAuthMode(null); }}>
          <section className="modal auth-modal" role="dialog" aria-modal="true" aria-label={authMode === 'login' ? 'User login' : 'User registration'}>
            <button className="modal-close" type="button" onClick={() => setAuthMode(null)} aria-label="Close account form"><X /></button>
            <aside className="auth-side">
              <span className="auth-brand-mark"><House size={26} /></span>
              <div className="auth-side-copy">
                <div className="eyebrow light"><span /> CHONA’S LODGING HOUSE</div>
                <h2>Your next stay starts with a warm <em>welcome.</em></h2>
                <p>Sign in to keep your reservation requests together and make planning your stay easier.</p>
              </div>
              <div className="auth-side-foot"><ShieldCheck size={17} /><span>Made for a more comfortable stay.</span></div>
            </aside>
            <div className="auth-panel">
              <div className="auth-panel-heading">
                <div className="eyebrow"><span /> GUEST ACCOUNT</div>
                <h2>{authMode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
                <p>{authMode === 'login' ? 'Enter your account details to continue.' : 'Create an account to keep track of your reservations.'}</p>
              </div>
              <form className="auth-form" onSubmit={submitAuth}>
                {authMode === 'register' && <label>Full name<input required autoComplete="name" value={authForm.name} onChange={event => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your full name" /></label>}
                <label>Email address<input required type="email" autoComplete="email" value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" /></label>
                <label>
                  Password
                  <div className="auth-password-input">
                    <input required type={showPassword ? 'text' : 'password'} minLength={authMode === 'register' ? 8 : 1} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} placeholder={authMode === 'register' ? 'At least 8 characters' : 'Your password'} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </label>
                {authMode === 'register' && (
                  <label>
                    Confirm password
                    <div className="auth-password-input">
                      <input required type={showConfirmPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" value={authForm.confirmPassword} onChange={event => setAuthForm({ ...authForm, confirmPassword: event.target.value })} placeholder="Enter your password again" />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} title={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </label>
                )}
                {authError && <p className="auth-error" role="alert">{authError}</p>}
                <button className="button button-primary auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'login' ? 'Log in to your account' : 'Create account'}{!authBusy && <ChevronRight size={17} />}</button>
              </form>
              <div className="auth-switch">
                <span>{authMode === 'login' ? 'New here?' : 'Already have an account?'}</span>
                <button type="button" className="auth-switch-button" onClick={() => openAuth(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Register' : 'Log in'}</button>
              </div>
              <p className="auth-demo-note">Demo accounts are stored in this browser only. Use Supabase or a secured server for real production authentication.</p>
            </div>
          </section>
        </div>
      )}
      {detailRoom && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setDetailRoom(null);
          }}
        >
          <section
            className="modal room-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={detailRoom.name}
          >
            <button
              className="modal-close"
              onClick={() => setDetailRoom(null)}
              aria-label="Close"
            >
              <X />
            </button>
            <img
              className="detail-image"
              src={detailRoom.image}
              alt={detailRoom.name}
            />
            <div className="modal-content">
              <div className="eyebrow">
                <span /> {detailRoom.type.toUpperCase()} ROOM
              </div>
              <h2>{detailRoom.name}</h2>
              <p>{detailRoom.description}</p>
              <div className="detail-facts">
                <span>
                  <Users size={16} /> Up to {detailRoom.guests} guests
                </span>
                <span>
                  <BedDouble size={16} /> {detailRoom.beds}
                </span>
              </div>
              <div className="amenity-list">
                {detailRoom.amenities.map(a => (
                  <span key={a}>
                    <Check size={14} /> {a}
                  </span>
                ))}
              </div>
              <div className="modal-bottom">
                <div>
                  <strong>{money(detailRoom.price)}</strong>
                  <small> / night</small>
                </div>
                <button
                  className="button button-primary"
                  onClick={() => startBooking(detailRoom)}
                >
                  Reserve this room <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      {bookingRoom && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setBookingRoom(null);
          }}
        >
          <section
            className="modal booking-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Make a reservation"
          >
            <button
              className="modal-close"
              onClick={() => setBookingRoom(null)}
              aria-label="Close"
            >
              <X />
            </button>
            <div className="modal-content">
              <div className="eyebrow">
                <span /> RESERVATION REQUEST
              </div>
              <h2>
                Let's plan your <em>stay.</em>
              </h2>
              <p className="modal-lede">
                Complete your details below. Your request will be marked pending
                until confirmed by staff.
              </p>
              <div className="selected-room">
                <img src={bookingRoom.image} alt="" />
                <div>
                  <strong>{bookingRoom.name}</strong>
                  <small>
                    {bookingRoom.type} · up to {bookingRoom.guests} guests
                  </small>
                  <b>
                    {money(bookingRoom.price)} <small>/ night</small>
                  </b>
                </div>
              </div>
              <form className="booking-form" onSubmit={submitBooking}>
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      required
                      value={form.guest}
                      onChange={e =>
                        setForm({ ...form, guest: e.target.value })
                      }
                      placeholder="Your full name"
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      required
                      value={form.phone}
                      onChange={e =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="09XX XXX XXXX"
                    />
                  </label>
                  <label>
                    Number of guests
                    <select
                      value={form.guests}
                      onChange={e =>
                        setForm({ ...form, guests: e.target.value })
                      }
                    >
                      {Array.from({ length: bookingRoom.guests }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} guest{i ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Check-in
                    <input
                      required
                      type="date"
                      min={today}
                      value={form.checkIn}
                      onChange={e =>
                        setForm({ ...form, checkIn: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Check-out
                    <input
                      required
                      type="date"
                      min={form.checkIn || today}
                      value={form.checkOut}
                      onChange={e =>
                        setForm({ ...form, checkOut: e.target.value })
                      }
                    />
                  </label>
                </div>
                {selectedNights < 1 && form.checkOut && (
                  <p className="form-error">
                    Check-out must be at least one day after check-in.
                  </p>
                )}
                <div className="estimate-row">
                  <span>
                    {selectedNights > 0
                      ? selectedNights +
                        ' night(s) × ' +
                        money(bookingRoom.price)
                      : 'Select your dates to estimate total'}
                  </span>
                  <strong>
                    {selectedNights > 0 ? money(selectedTotal) : '—'}
                  </strong>
                </div>
                <button
                  className="button button-primary submit-booking"
                  type="submit"
                >
                  Send reservation request <ChevronRight size={17} />
                </button>
                <small className="privacy-note">
                  <ShieldCheck size={13} /> Your details are used for this
                  reservation demo only.
                </small>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function RoomCard({
  room,
  onDetails,
  onBook,
}: {
  room: Room;
  onDetails: () => void;
  onBook: () => void;
}) {
  return (
    <article className="room-card">
      <button
        className="room-image-button"
        onClick={onDetails}
        aria-label={'View details for ' + room.name}
      >
        <img className="room-image" src={room.image} alt={room.name} />
        <span className="room-tag">{room.type}</span>
        <span className="image-arrow">
          <ChevronRight size={17} />
        </span>
      </button>
      <div className="room-card-body">
        <div className="room-card-heading">
          <h3>{room.name}</h3>
          <div className="room-rating">
            <Star size={13} fill="currentColor" /> <span>Room highlight</span>
          </div>
        </div>
        <p>{room.description}</p>
        <div className="room-quickfacts">
          <span>
            <Users size={14} /> {room.guests} guest{room.guests > 1 ? 's' : ''}
          </span>
          <span>
            <BedDouble size={14} /> {room.beds}
          </span>
        </div>
        <div className="room-amenities">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a}>{a}</span>
          ))}
        </div>
        <div className="room-card-bottom">
          <div>
            <strong>{money(room.price)}</strong>
            <small> / night</small>
          </div>
          <button className="button button-outline" onClick={onBook}>
            Reserve <ChevronRight size={15} />
          </button>
        </div>
        <button className="details-link" onClick={onDetails}>
          View room details
        </button>
      </div>
    </article>
  );
}
function StatusPill({ status }: { status: Booking['status'] }) {
  return (
    <span
      className={'status-pill status-' + status.toLowerCase().replace(' ', '-')}
    >
      {status}
    </span>
  );
}
function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
export default App;
