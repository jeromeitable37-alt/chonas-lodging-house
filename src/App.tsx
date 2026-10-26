import { useEffect, useMemo, useState } from 'react';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import {
  BedDouble,
  BarChart3,
  Bell,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coffee,
  DoorOpen,
  Download,
  Filter,
  History,
  House,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Save,

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

  Users,
  X,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

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
  reference: string;
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
  userId: string;
};
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'admin';
};
type AuthMode = 'login' | 'register' | 'reset' | 'updatePassword' | null;
type AuthForm = { name: string; email: string; password: string; confirmPassword: string; };
type BookingReceipt = { reference: string; roomName: string; checkIn: string; checkOut: string; guests: number; total: number; email: string; emailStatus: 'pending' | 'sent' | 'not_configured' | 'failed'; };
type ActivityLog = { id: number; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; details: Record<string, unknown>; created_at: string; };
type EmailDeliveryLog = { id: number; booking_id: string; event_key: string; recipient: string; status: 'pending' | 'sent' | 'failed'; provider_id: string | null; error_message: string | null; created_at: string; sent_at: string | null; };
type RoomEditorForm = {
  id?: number;
  name: string;
  type: string;
  price: string;
  guests: string;
  beds: string;
  description: string;
  image: string;
  amenities: string;
};
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
const nightsBetween = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const sendReservationNotification = async (bookingId: string, event: 'booking_created' | 'status_updated'): Promise<{ configured: boolean; guestSent: boolean; staffSent: boolean }> => {
  if (!supabase) return { configured: false, guestSent: false, staffSent: false };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { configured: false, guestSent: false, staffSent: false };
    const response = await fetch('/api/notify-reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ bookingId, event }),
    });
    const result = await response.json().catch(() => ({}));
    return { configured: result.configured === true, guestSent: result.guestSent === true, staffSent: result.staffSent === true };
  } catch {
    return { configured: false, guestSent: false, staffSent: false };
  }
};

const roomFromRow = (row: any): Room => ({
  id: Number(row.id),
  name: String(row.name),
  type: String(row.type || 'Standard'),
  price: Number(row.price),
  guests: Number(row.guests),
  beds: String(row.beds || '1 bed'),
  description: String(row.description || ''),
  image: String(row.image_url || seedRooms[0].image),
  amenities: Array.isArray(row.amenities) ? row.amenities : [],
  available: row.is_active !== false,
});

const bookingFromRow = (row: any): Booking => ({
  id: String(row.id),
  reference: String(row.reference || String(row.id).slice(0, 8).toUpperCase()),
  roomId: Number(row.room_id),
  roomName: String(row.room_name || 'Lodging room'),
  guest: String(row.guest_name || ''),
  email: String(row.email || ''),
  phone: String(row.phone || ''),
  checkIn: String(row.check_in || ''),
  checkOut: String(row.check_out || ''),
  guests: Number(row.guests || 1),
  total: Number(row.total || 0),
  status: row.status as Booking['status'],
  createdAt: String(row.created_at || new Date().toISOString()),
  userId: String(row.user_id || ''),
});

const profileFromUser = async (user: User): Promise<CurrentUser> => {
  const fallbackName =
    String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim() ||
    (user.email ? user.email.split('@')[0] : 'Guest');
  if (!supabase) {
    return { id: user.id, name: fallbackName, email: user.email || '', role: 'guest' };
  }
  const { data } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  return {
    id: user.id,
    name: String(data?.full_name || fallbackName),
    email: user.email || '',
    role: data?.role === 'admin' ? 'admin' : 'guest',
  };
};

function App() {
  const [rooms, setRooms] = useState<Room[]>(seedRooms);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [view, setView] = useState<'home' | 'rooms' | 'mybookings' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const isAdmin = currentUser?.role === 'admin';
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authForm, setAuthForm] = useState<AuthForm>({ name: '', email: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All rooms');
  const [searchCheckIn, setSearchCheckIn] = useState(today);
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [availabilityQuery, setAvailabilityQuery] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [availableRoomIds, setAvailableRoomIds] = useState<number[] | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingReceipt, setBookingReceipt] = useState<BookingReceipt | null>(null);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'calendar' | 'reservations' | 'rooms' | 'activity'>('overview');
  const [adminMonth, setAdminMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(today);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDeliveryLog[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [guestSearch, setGuestSearch] = useState('');
  const [adminRefreshing, setAdminRefreshing] = useState(false);
  const [roomSaveBusy, setRoomSaveBusy] = useState(false);
  const [roomEditor, setRoomEditor] = useState<RoomEditorForm | null>(null);
  const [form, setForm] = useState({
    guest: '',
    email: '',
    phone: '',
    checkIn: today,
    checkOut: '',
    guests: '2',
  });

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setDataLoading(false);
      return;
    }
    let active = true;
    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        if (active) {
          setCurrentUser(null);
          setBookings([]);
          setAuthReady(true);
        }
        return;
      }
      try {
        const account = await profileFromUser(session.user);
        if (active) setCurrentUser(account);
      } catch {
        if (active) {
          setCurrentUser({
            id: session.user.id,
            name: String(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Guest'),
            email: session.user.email || '',
            role: 'guest',
          });
        }
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setNotice('Could not restore your login session. Please sign in again.');
      void applySession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setAuthForm(previous => ({ ...previous, password: '', confirmPassword: '' }));
        setAuthMode('updatePassword');
      }
      window.setTimeout(() => { void applySession(session); }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDataLoading(false);
      return;
    }
    let active = true;
    setDataLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type, price, guests, beds, description, image_url, amenities, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (!active) return;
      if (error) {
        setRooms([]);
        setNotice('Rooms could not be loaded from the database. Check the Supabase setup.');
      } else if (data) {
        setRooms(data.map(roomFromRow));
      }
      setDataLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase || !currentUser) {
      setBookings([]);
      return;
    }
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        setNotice('Your reservations could not be loaded. Please refresh and sign in again.');
        setBookings([]);
      } else {
        setBookings((data || []).map(bookingFromRow));
      }
    })();
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!supabase || currentUser?.role !== 'admin') {
      setActivityLogs([]);
      setEmailLogs([]);
      return;
    }
    let active = true;
    void (async () => {
      const [activityResult, emailResult] = await Promise.all([
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('email_delivery_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (!active) return;
      if (!activityResult.error) setActivityLogs((activityResult.data || []) as ActivityLog[]);
      if (!emailResult.error) setEmailLogs((emailResult.data || []) as EmailDeliveryLog[]);
    })();
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role]);

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
          (filterType === 'All rooms' || room.type === filterType) &&
          (availableRoomIds === null || availableRoomIds.includes(room.id))
        );
      }),
    [rooms, search, filterType, availableRoomIds]
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

  const myBookings = currentUser
    ? bookings.filter(booking => booking.userId === currentUser.id)
    : [];
  const pendingBookings = bookings.filter(booking => booking.status === 'Pending');
  const todaysArrivals = bookings.filter(booking => booking.checkIn === today && booking.status !== 'Cancelled' && booking.status !== 'Completed');
  const todaysDepartures = bookings.filter(booking => booking.checkOut === today && booking.status !== 'Cancelled' && booking.status !== 'Completed');
  const upcomingBookings = bookings.filter(booking => booking.checkIn >= today && !['Cancelled', 'Completed'].includes(booking.status)).sort((left, right) => left.checkIn.localeCompare(right.checkIn)).slice(0, 6);
  const adminCalendarDays = useMemo(() => {
    const first = new Date(adminMonth.getFullYear(), adminMonth.getMonth(), 1);
    const startOffset = first.getDay();
    return Array.from({ length: 42 }, (_, index) => new Date(adminMonth.getFullYear(), adminMonth.getMonth(), 1 - startOffset + index));
  }, [adminMonth]);
  const selectedDayBookings = bookings.filter(booking => booking.status !== 'Cancelled' && booking.checkIn <= selectedCalendarDay && booking.checkOut > selectedCalendarDay);
  const revenueByMonth = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const month = new Date(adminMonth.getFullYear(), adminMonth.getMonth() - 5 + index, 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const revenue = bookings.filter(booking => booking.checkIn.startsWith(key) && ['Checked in', 'Completed'].includes(booking.status)).reduce((sum, booking) => sum + booking.total, 0);
    return { key, label: month.toLocaleDateString('en-PH', { month: 'short' }), revenue };
  }), [bookings, adminMonth]);
  const maxMonthlyRevenue = Math.max(1, ...revenueByMonth.map(item => item.revenue));

  const refreshBookings = async () => {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setBookings((data || []).map(bookingFromRow));
  };

  const go = (next: typeof view) => {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const findRoomsForDates = async () => {
    setAvailabilityError('');
    if (!searchCheckIn || !searchCheckOut || searchCheckOut <= searchCheckIn || searchCheckIn < today) {
      setAvailabilityError('Choose a valid check-in date and a check-out date at least one day later.');
      return;
    }
    if (!supabase) {
      setAvailabilityError('Live availability requires the database connection. You can still browse the room photos.');
      go('rooms');
      return;
    }
    setAvailabilityBusy(true);
    try {
      const { data, error } = await supabase.rpc('get_available_room_ids', { p_check_in: searchCheckIn, p_check_out: searchCheckOut });
      if (error) throw error;
      const ids = (data || []).map((row: { room_id: number | string }) => Number(row.room_id));
      setAvailableRoomIds(ids);
      setAvailabilityQuery({ checkIn: searchCheckIn, checkOut: searchCheckOut });
      go('rooms');
      setNotice(ids.length ? `${ids.length} room option(s) available for your selected dates.` : 'No rooms are available for those dates. Try another date range.');
    } catch {
      setAvailabilityError('We could not check live availability. Please try again or choose dates in the reservation form.');
    } finally {
      setAvailabilityBusy(false);
    }
  };
  const refreshAdminLogs = async () => {
    if (!supabase || !isAdmin) return;
    const [activityResult, emailResult] = await Promise.all([
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('email_delivery_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (!activityResult.error) setActivityLogs((activityResult.data || []) as ActivityLog[]);
    if (!emailResult.error) setEmailLogs((emailResult.data || []) as EmailDeliveryLog[]);
  };
  const openAuth = (mode: Exclude<AuthMode, null>) => {
    setAuthMode(mode);
    setAuthError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAuthForm({ name: currentUser?.name || '', email: currentUser?.email || '', password: '', confirmPassword: '' });
    setMenuOpen(false);
  };
  const handleLogout = async () => {
    if (!supabase) {
      setNotice('Authentication is not configured yet. Please contact the site administrator.');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice('Could not sign out. Please try again.');
      return;
    }
    setCurrentUser(null);
    setBookings([]);
    go('home');
    setNotice('You have signed out.');
  };
  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authMode) return;
    setAuthError('');
    if (!supabase) {
      setAuthError('Account sign-in is not configured yet. The administrator must set Supabase environment variables and apply the database migration.');
      return;
    }
    const email = authForm.email.trim().toLowerCase();
    const needsEmail = authMode !== 'updatePassword';
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError('Enter a valid email address.');
      return;
    }
    if (authMode === 'register' && !authForm.name.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (authMode === 'register' || authMode === 'updatePassword') {
      if (authForm.password.length < 8) {
        setAuthError('Use a password with at least 8 characters.');
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('The passwords do not match.');
        return;
      }
    } else if (authMode === 'login' && !authForm.password) {
      setAuthError('Enter your password to continue.');
      return;
    }

    setAuthBusy(true);
    try {
      if (authMode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) { setAuthError(error.message); return; }
        setAuthMode(null);
        setNotice('If an account exists for that email, a password reset link has been sent.');
        return;
      }
      if (authMode === 'updatePassword') {
        const { error } = await supabase.auth.updateUser({ password: authForm.password });
        if (error) { setAuthError(error.message); return; }
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
        setAuthMode(null);
        setNotice('Your password has been updated successfully.');
        return;
      }
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authForm.password,
          options: { data: { full_name: authForm.name.trim() } },
        });
        if (error) { setAuthError(error.message); return; }
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
        setAuthMode(null);
        setNotice(data.session
          ? 'Account created successfully. Welcome to Chona’s Lodging House!'
          : 'Account created. Please check your email to confirm your account before signing in.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: authForm.password });
      if (error) {
        setAuthError(error.message === 'Invalid login credentials'
          ? 'Email or password is incorrect. If this is a new account, confirm your email first.'
          : error.message);
        return;
      }
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
      setAuthMode(null);
      setNotice('Signed in successfully. Welcome back!');
    } catch {
      setAuthError('Could not connect to authentication. Check your internet connection and Supabase configuration.');
    } finally {
      setAuthBusy(false);
    }
  };

  const startBooking = (room: Room) => {
    if (!supabase) {
      setNotice('Online reservations are temporarily unavailable until the database is configured.');
      return;
    }
    if (!currentUser) {
      setNotice('Please sign in or create an account before booking a room.');
      openAuth('login');
      return;
    }
    setForm({
      guest: currentUser.name || '',
      email: currentUser.email || '',
      phone: '',
      checkIn: availabilityQuery?.checkIn || today,
      checkOut: availabilityQuery?.checkOut || '',
      guests: String(Math.min(2, room.guests)),
    });
    setBookingRoom(room);
    setDetailRoom(null);
  };
  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nights = nightsBetween(form.checkIn, form.checkOut);
    if (!supabase || !currentUser) {
      setNotice('Please sign in and configure the reservation database before booking.');
      setBookingRoom(null);
      if (supabase && !currentUser) openAuth('login');
      return;
    }
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
      setNotice('Please check your details. Check-out must be after check-in, and guest count must fit the room.');
      return;
    }
    setAuthBusy(true);
    try {
      const { data, error } = await supabase.rpc('create_booking', {
        p_room_id: bookingRoom.id,
        p_guest_name: form.guest.trim(),
        p_email: form.email.trim(),
        p_phone: form.phone.trim(),
        p_check_in: form.checkIn,
        p_check_out: form.checkOut,
        p_guests: Number(form.guests),
        p_notes: null,
      });
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes('not available') || message.includes('overlap')) {
          setNotice('Sorry, that room is no longer available for those dates. Please choose another date or room.');
        } else if (message.includes('capacity') || message.includes('guest')) {
          setNotice('The selected room cannot accommodate that number of guests.');
        } else {
          setNotice('We could not submit the reservation. Please check your details and try again.');
        }
        return;
      }
      const reference = data?.reference ? String(data.reference) : 'submitted';
      const receipt: BookingReceipt = {
        reference, roomName: bookingRoom.name, checkIn: form.checkIn, checkOut: form.checkOut,
        guests: Number(form.guests), total: Number(data?.total ?? selectedTotal),
        email: form.email.trim(), emailStatus: 'pending',
      };
      setBookingRoom(null);
      setBookingReceipt(receipt);
      go('mybookings');
      let emailResult = { configured: false, guestSent: false, staffSent: false };
      if (data?.id) emailResult = await sendReservationNotification(String(data.id), 'booking_created');
      setBookingReceipt(current => current?.reference === reference
        ? { ...current, emailStatus: emailResult.guestSent ? 'sent' : emailResult.configured ? 'failed' : 'not_configured' }
        : current);
      try { await refreshBookings(); } catch { /* Booking was saved; keep the receipt available. */ }
      await refreshAdminLogs();
      setNotice('Reservation request saved. Reference: ' + reference + '. Status: pending confirmation.');
    } catch {
      setNotice('We could not refresh the reservation list. Your request may have been accepted; refresh before trying again.');
    } finally {
      setAuthBusy(false);
    }
  };
  const updateStatus = async (id: string, status: Booking['status']) => {
    if (!supabase || !isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
      await refreshBookings();
      await refreshAdminLogs();
      const emailResult = await sendReservationNotification(id, 'status_updated');
      setNotice(emailResult.guestSent
        ? 'Reservation status updated and guest email sent.'
        : emailResult.configured
          ? 'Reservation status updated, but the guest email could not be sent. Check email delivery logs.'
          : 'Reservation status updated. Email notifications still need to be configured.');
    } catch {
      setNotice('Unable to update reservation. Verify the admin account and try again.');
    }
  };
  const deleteBooking = (id: string) => {
    if (!isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    if (window.confirm('Cancel this reservation? The booking record will be kept for history.')) {
      void updateStatus(id, 'Cancelled');
    }
  };
  const deleteRoom = async (id: number) => {
    if (!supabase || !isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    if (!window.confirm('Remove this room from public listings? Previous reservations will remain in the database.')) return;
    try {
      const { error } = await supabase.from('rooms').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      setRooms(previous => previous.filter(room => room.id !== id));
      setNotice('Room removed from public listings.');
    } catch {
      setNotice('Could not remove this room. Check your admin permissions.');
    }
  };
  const openNewRoom = () => {
    if (!supabase || !isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    setRoomEditor({
      name: '',
      type: 'Standard',
      price: '1000',
      guests: '2',
      beds: '1 double bed',
      description: '',
      image: seedRooms[0].image,
      amenities: 'Wi-Fi, Air conditioning',
    });
  };
  const openEditRoom = (room: Room) => {
    if (!supabase || !isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    setRoomEditor({
      id: room.id,
      name: room.name,
      type: room.type,
      price: String(room.price),
      guests: String(room.guests),
      beds: room.beds,
      description: room.description,
      image: room.image,
      amenities: room.amenities.join(', '),
    });
  };
  const saveRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !isAdmin || !roomEditor) {
      setNotice('Admin access is required.');
      return;
    }
    const price = Number(roomEditor.price);
    const guests = Number(roomEditor.guests);
    if (!roomEditor.name.trim() || !roomEditor.type.trim() || !roomEditor.beds.trim() ||
        !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(guests) || guests < 1 || guests > 20) {
      setNotice('Check the room name, nightly rate, bed details, and guest capacity.');
      return;
    }
    setRoomSaveBusy(true);
    try {
      const payload = {
        name: roomEditor.name.trim(),
        type: roomEditor.type.trim(),
        price,
        guests,
        beds: roomEditor.beds.trim(),
        description: roomEditor.description.trim(),
        image_url: roomEditor.image.trim() || seedRooms[0].image,
        amenities: roomEditor.amenities.split(',').map(item => item.trim()).filter(Boolean),
      };
      if (roomEditor.id !== undefined) {
        const { data, error } = await supabase.from('rooms').update(payload).eq('id', roomEditor.id).select('*').single();
        if (error) throw error;
        setRooms(previous => previous.map(room => room.id === roomEditor.id ? roomFromRow(data) : room));
        setNotice('Room details updated successfully.');
      } else {
        const { data, error } = await supabase.from('rooms').insert({
          ...payload, is_active: true, sort_order: rooms.length + 1,
        }).select('*').single();
        if (error) throw error;
        setRooms(previous => [...previous, roomFromRow(data)]);
        setNotice('New room added to the listings.');
      }
      setRoomEditor(null);
    } catch {
      setNotice('Could not save this room. Check that its name is unique and your admin role is active.');
    } finally {
      setRoomSaveBusy(false);
    }
  };
  const refreshAdminDashboard = async () => {
    if (!supabase || !isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    setAdminRefreshing(true);
    try {
      const [roomResult, bookingResult] = await Promise.all([
        supabase.from('rooms').select('id, name, type, price, guests, beds, description, image_url, amenities, is_active, sort_order')
          .eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      ]);
      if (roomResult.error) throw roomResult.error;
      if (bookingResult.error) throw bookingResult.error;
      setRooms((roomResult.data || []).map(roomFromRow));
      setBookings((bookingResult.data || []).map(bookingFromRow));
      const [activityResult, emailResult] = await Promise.all([
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('email_delivery_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (!activityResult.error) setActivityLogs((activityResult.data || []) as ActivityLog[]);
      if (!emailResult.error) setEmailLogs((emailResult.data || []) as EmailDeliveryLog[]);
      setNotice('Dashboard data refreshed.');
    } catch {
      setNotice('Could not refresh dashboard data. Check the database connection and admin permissions.');
    } finally {
      setAdminRefreshing(false);
    }
  };
  const exportBookings = () => {
    if (!isAdmin) {
      setNotice('Admin access is required.');
      return;
    }
    const columns = ['Reference', 'Guest', 'Email', 'Phone', 'Room', 'Check-in', 'Check-out', 'Guests', 'Total PHP', 'Status', 'Created'];
    const quoteCsv = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const rows = filteredBookings.map(booking => [
      booking.reference, booking.guest, booking.email, booking.phone,
      booking.roomName, booking.checkIn, booking.checkOut, booking.guests,
      booking.total, booking.status, booking.createdAt,
    ]);
    const csv = '\uFEFF' + [columns, ...rows].map(row => row.map(quoteCsv).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chonas-reservations-' + today + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
          {isAdmin && (
            <button
              className={view === 'admin' ? 'nav-link active' : 'nav-link'}
              onClick={() => go('admin')}
            >
              Admin
            </button>
          )}
          {!currentUser ? (
            <button
              className="nav-link auth-nav-link auth-nav-cta"
              onClick={() => openAuth('login')}
              aria-haspopup="dialog"
            >
              <UserRound size={14} /> Log in / Register
            </button>
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
              <label htmlFor="home-checkin">CHECK-IN</label>
              <div><CalendarDays size={16} /><input id="home-checkin" type="date" min={today} value={searchCheckIn} onChange={event => { setSearchCheckIn(event.target.value); setAvailabilityError(''); setAvailableRoomIds(null); }} /></div>
            </div>
            <div className="search-field">
              <label htmlFor="home-checkout">CHECK-OUT</label>
              <div><CalendarDays size={16} /><input id="home-checkout" type="date" min={searchCheckIn || today} value={searchCheckOut} onChange={event => { setSearchCheckOut(event.target.value); setAvailabilityError(''); setAvailableRoomIds(null); }} /></div>
            </div>
            <div className="search-field">
              <label htmlFor="home-type">ROOM TYPE</label>
              <div><BedDouble size={16} /><select id="home-type" value={filterType} onChange={e => setFilterType(e.target.value)}><option>All rooms</option>{Array.from(new Set(rooms.map(r => r.type))).map(type => <option key={type}>{type}</option>)}</select><ChevronDown size={14} /></div>
            </div>
            {availabilityError && <p className="availability-error">{availabilityError}</p>}
            <button className="button button-primary search-submit" onClick={() => void findRoomsForDates()} disabled={availabilityBusy}>
              {availabilityBusy ? 'Checking…' : 'Check availability'} {!availabilityBusy && <ChevronRight size={16} />}
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
          {dataLoading && <div className="rooms-loading" role="status"><span className="loading-spinner" /> Loading available rooms…</div>}
          {availabilityQuery && <div className="availability-result-bar"><span><CalendarRange size={16} /> Showing availability from <strong>{availabilityQuery.checkIn}</strong> to <strong>{availabilityQuery.checkOut}</strong></span><button type="button" onClick={() => { setAvailabilityQuery(null); setAvailableRoomIds(null); setSearchCheckOut(''); }}>Clear dates <X size={13} /></button></div>}
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
            <p>Review your reservation status, reference number, and stay details in one place.</p>
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
                      Reference: <strong>{b.reference}</strong> · {b.guest}
                    </p>
                    <div className="booking-meta">
                      <span><CalendarDays size={14} /> {b.checkIn} → {b.checkOut}</span>
                      <span><Users size={14} /> {b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                    </div>
                    {b.status === 'Cancelled' ? <div className="booking-cancelled-note">This reservation has been cancelled.</div> : (
                      <div className="booking-timeline" aria-label={'Reservation status: ' + b.status}>
                        {(['Pending', 'Confirmed', 'Checked in', 'Completed'] as const).map((stage, index) => {
                          const currentStage = ['Pending', 'Confirmed', 'Checked in', 'Completed'].indexOf(b.status);
                          return <div key={stage} className={index <= currentStage ? 'timeline-stage reached' : 'timeline-stage'}><span>{index < currentStage ? <Check size={10} /> : index + 1}</span><small>{stage}</small></div>;
                        })}
                      </div>
                    )}
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

      {view === 'admin' && isAdmin && (
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
                Manage guest requests, keep room details current, and follow
                every stay from one workspace.
              </p>
            </div>
            <span className="admin-access-badge">
              <ShieldCheck size={15} /> AUTHORIZED STAFF
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
            <div className="admin-tabs admin-tabs-enhanced">
              <button className={adminTab === 'overview' ? 'admin-tab selected' : 'admin-tab'} onClick={() => setAdminTab('overview')}><BarChart3 size={14} /> Overview</button>
              <button className={adminTab === 'calendar' ? 'admin-tab selected' : 'admin-tab'} onClick={() => setAdminTab('calendar')}><CalendarRange size={14} /> Calendar</button>
              <button className={adminTab === 'reservations' ? 'admin-tab selected' : 'admin-tab'} onClick={() => setAdminTab('reservations')}><ClipboardList size={14} /> Reservations <span>{bookings.length}</span>{pendingBookings.length > 0 && <i className="pending-count">{pendingBookings.length}</i>}</button>
              <button className={adminTab === 'rooms' ? 'admin-tab selected' : 'admin-tab'} onClick={() => setAdminTab('rooms')}><BedDouble size={14} /> Rooms <span>{rooms.length}</span></button>
              <button className={adminTab === 'activity' ? 'admin-tab selected' : 'admin-tab'} onClick={() => setAdminTab('activity')}><History size={14} /> Activity</button>
            </div>
            {adminTab === 'overview' ? (
              <section className="admin-overview-panel">
                <div className="admin-today-grid">
                  <article className="admin-today-card"><span className="admin-today-icon"><DoorOpen size={18} /></span><div><small>Arrivals today</small><strong>{todaysArrivals.length}</strong><span>{todaysArrivals.length ? todaysArrivals.map(b => b.guest).slice(0,2).join(', ') : 'No arrivals scheduled'}</span></div></article>
                  <article className="admin-today-card"><span className="admin-today-icon"><CalendarDays size={18} /></span><div><small>Departures today</small><strong>{todaysDepartures.length}</strong><span>{todaysDepartures.length ? todaysDepartures.map(b => b.guest).slice(0,2).join(', ') : 'No departures scheduled'}</span></div></article>
                  <article className="admin-today-card"><span className="admin-today-icon"><Bell size={18} /></span><div><small>Needs attention</small><strong>{pendingBookings.length}</strong><span>Pending reservation requests</span></div></article>
                </div>
                <div className="admin-overview-grid">
                  <section className="admin-panel-card"><div className="admin-panel-heading"><div><span className="eyebrow"><span /> PERFORMANCE</span><h3>Recorded revenue</h3><p>Checked-in and completed reservations</p></div></div>
                    <div className="revenue-chart">{revenueByMonth.map(month => <div className="revenue-column" key={month.key} title={month.key + ': ' + money(month.revenue)}><strong>{month.revenue > 0 ? money(month.revenue) : '—'}</strong><div className="revenue-bar-track"><span style={{height: Math.max(4, month.revenue / maxMonthlyRevenue * 100) + '%'}} /></div><small>{month.label}</small></div>)}</div>
                  </section>
                  <section className="admin-panel-card"><div className="admin-panel-heading"><div><span className="eyebrow"><span /> NEXT UP</span><h3>Upcoming arrivals</h3><p>Your next guest stays</p></div><button className="text-link" type="button" onClick={() => setAdminTab('calendar')}>View calendar <ChevronRight size={14} /></button></div>
                    {upcomingBookings.length ? <div className="upcoming-list">{upcomingBookings.map(booking => <article className="upcoming-row" key={booking.id}><div className="upcoming-date"><strong>{new Date(booking.checkIn + 'T12:00:00').getDate()}</strong><small>{new Date(booking.checkIn + 'T12:00:00').toLocaleDateString('en-PH',{month:'short'})}</small></div><div className="upcoming-details"><strong>{booking.guest}</strong><small>{booking.roomName} · {booking.checkIn} → {booking.checkOut}</small></div><StatusPill status={booking.status} /></article>)}</div> : <div className="admin-mini-empty"><CalendarDays size={20} /><p>No upcoming arrivals yet. New bookings will appear here.</p></div>}
                  </section>
                </div>
                <section className="admin-panel-card recent-activity-card"><div className="admin-panel-heading"><div><span className="eyebrow"><span /> RECENT CHANGES</span><h3>Activity feed</h3></div><button className="text-link" type="button" onClick={() => setAdminTab('activity')}>View activity <ChevronRight size={14} /></button></div>
                  {activityLogs.length ? <div className="activity-list">{activityLogs.slice(0,5).map(item => <article className="activity-row" key={item.id}><span className="activity-icon"><History size={15} /></span><div><strong>{item.action.replaceAll('_',' ')}</strong><small>{String(item.details?.reference || item.details?.room_name || item.entity_type)}</small></div><time>{new Date(item.created_at).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'})}</time></article>)}</div> : <div className="admin-mini-empty"><History size={20} /><p>Actions will appear here as reservations and room details change.</p></div>}
                </section>
              </section>
            ) : adminTab === 'calendar' ? (
              <section className="admin-calendar-panel">
                <div className="calendar-toolbar"><div><span className="eyebrow"><span /> ROOM OCCUPANCY</span><h3>{adminMonth.toLocaleDateString('en-PH',{month:'long',year:'numeric'})}</h3><p>Booked nights are marked on each date. Cancelled requests are excluded.</p></div><div className="calendar-month-controls"><button className="icon-button" type="button" aria-label="Previous month" onClick={() => setAdminMonth(month => new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={16} /></button><button className="icon-button" type="button" aria-label="Next month" onClick={() => setAdminMonth(month => new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={16} /></button><button className="button button-outline" type="button" onClick={() => {const current = new Date();setAdminMonth(new Date(current.getFullYear(),current.getMonth(),1));setSelectedCalendarDay(today);}}>Today</button></div></div>
                <div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}{adminCalendarDays.map(date => { const key = dateKey(date); const dayBookings = bookings.filter(booking => booking.status !== 'Cancelled' && booking.checkIn <= key && booking.checkOut > key); return <button type="button" key={key} className={'calendar-day' + (date.getMonth() === adminMonth.getMonth() ? ' current-month' : ' other-month') + (key === selectedCalendarDay ? ' selected-day' : '') + (key === today ? ' today-day' : '')} onClick={() => setSelectedCalendarDay(key)}><span className="calendar-day-number">{date.getDate()}</span>{dayBookings.slice(0,2).map(booking => <span key={booking.id} className={'calendar-booking-chip status-chip-' + booking.status.toLowerCase().replaceAll(' ','-')} title={booking.guest + ' · ' + booking.roomName}>{booking.guest}</span>)}{dayBookings.length > 2 && <small className="calendar-more">+{dayBookings.length-2} more</small>}</button>; })}</div>
                <div className="calendar-selected-details"><div className="admin-panel-heading"><div><span className="eyebrow"><span /> SELECTED DATE</span><h3>{new Date(selectedCalendarDay + 'T12:00:00').toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</h3></div><span className="result-count">{selectedDayBookings.length} booking(s)</span></div>
                  {selectedDayBookings.length ? selectedDayBookings.map(booking => <article className="calendar-detail-row" key={booking.id}><div><strong>{booking.guest}</strong><small>{booking.reference} · {booking.roomName}</small><small>{booking.checkIn} → {booking.checkOut}</small></div><StatusPill status={booking.status} /><strong>{money(booking.total)}</strong></article>) : <div className="admin-mini-empty"><CalendarDays size={20} /><p>No active reservations covering this date.</p></div>}
                </div>
              </section>
            ) : adminTab === 'reservations' ? (
              <>
                <div className="admin-toolbar"><div className="listing-search"><Search size={16} /><input placeholder="Search guest, email, reference or room..." value={guestSearch} onChange={event => setGuestSearch(event.target.value)} /></div>
                  <select className="status-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>{['All','Pending','Confirmed','Checked in','Completed','Cancelled'].map(status => <option key={status}>{status}</option>)}</select>
                  <div className="admin-toolbar-actions"><button className="button button-outline admin-tool-button" type="button" onClick={() => void refreshAdminDashboard()} disabled={adminRefreshing}><RefreshCw size={14} className={adminRefreshing ? 'spin-icon' : ''} /> {adminRefreshing ? 'Refreshing…' : 'Refresh'}</button><button className="button button-primary admin-tool-button" type="button" onClick={exportBookings} disabled={!filteredBookings.length}><Download size={14} /> Export CSV</button></div>
                </div>
                <div className="table-scroll"><table className="data-table"><thead><tr><th>GUEST / REFERENCE</th><th>ROOM & DATES</th><th>TOTAL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                  <tbody>{filteredBookings.map(booking => <tr key={booking.id}><td><strong>{booking.guest}</strong><small>{booking.reference}</small><small>{booking.email}</small><small>{booking.phone}</small></td><td><strong>{booking.roomName}</strong><small>{booking.checkIn} → {booking.checkOut}</small><small>{booking.guests} guest(s)</small></td><td className="table-total">{money(booking.total)}</td><td><StatusPill status={booking.status} /></td><td><div className="reservation-row-actions">{booking.status === 'Pending' && <button className="button button-primary reservation-quick-action" type="button" onClick={() => void updateStatus(booking.id, 'Confirmed')}><CheckCircle2 size={14} /> Confirm</button>}{booking.status === 'Confirmed' && <button className="button button-primary reservation-quick-action" type="button" onClick={() => void updateStatus(booking.id, 'Checked in')}><DoorOpen size={14} /> Check in</button>}{booking.status === 'Checked in' && <button className="button button-primary reservation-quick-action" type="button" onClick={() => void updateStatus(booking.id, 'Completed')}><Check size={14} /> Complete</button>}<div className="reservation-secondary-actions"><select aria-label={'Update status for ' + booking.reference} className="row-status" value={booking.status} onChange={event => void updateStatus(booking.id,event.target.value as Booking['status'])}>{['Pending','Confirmed','Checked in','Completed','Cancelled'].map(status => <option key={status}>{status}</option>)}</select><button className="icon-button danger" type="button" title="Cancel reservation" aria-label="Cancel reservation" onClick={() => deleteBooking(booking.id)}><X size={16} /></button></div></div></td></tr>)}</tbody>
                </table></div>
                {filteredBookings.length === 0 && <div className="table-empty admin-empty-state"><span className="admin-empty-icon"><ClipboardList size={24} /></span><h3>{bookings.length === 0 ? 'No reservations yet' : 'No matching reservations'}</h3><p>{bookings.length === 0 ? 'New guest requests will appear here. Browse the calendar and room listings while you wait.' : 'Try clearing the guest search or choosing a different booking status.'}</p>{bookings.length === 0 ? <button className="button button-outline" type="button" onClick={() => setAdminTab('rooms')}>Review room listings <ChevronRight size={15} /></button> : <button className="button button-outline" type="button" onClick={() => {setGuestSearch('');setStatusFilter('All');}}>Clear filters</button>}</div>}
              </>
            ) : adminTab === 'rooms' ? (
              <>
                <div className="rooms-admin-toolbar"><p>Room rates are per night. Edit the details guests see before they reserve.</p><button className="button button-primary" type="button" onClick={openNewRoom}><Plus size={15} /> Add room</button></div>
                <div className="room-admin-list">{rooms.map(room => <div className="room-admin-row" key={room.id}><img src={room.image} alt="" /><div><strong>{room.name}</strong><small>{room.type} · up to {room.guests} guest(s)</small></div><strong>{money(room.price)}<small>/night</small></strong><div className="room-admin-actions"><button className="icon-button" type="button" title={'Edit ' + room.name} aria-label={'Edit ' + room.name} onClick={() => openEditRoom(room)}><Pencil size={15} /></button><button className="icon-button danger" type="button" title={'Remove ' + room.name} aria-label={'Remove ' + room.name} onClick={() => deleteRoom(room.id)}><X size={16} /></button></div></div>)}</div>
              </>
            ) : (
              <section className="admin-activity-panel">
                <div className="activity-section-heading"><div><span className="eyebrow"><span /> AUDIT TRAIL</span><h3>Recent activity</h3><p>Room edits and reservation status changes are recorded here.</p></div><button type="button" className="button button-outline admin-tool-button" onClick={() => void refreshAdminDashboard()} disabled={adminRefreshing}><RefreshCw size={14} /> Refresh activity</button></div>
                {activityLogs.length ? <div className="activity-list">{activityLogs.map(item => <article className="activity-row" key={item.id}><span className="activity-icon"><History size={15} /></span><div><strong>{item.action.replaceAll('_',' ')}</strong><small>{String(item.details?.reference || item.details?.room_name || item.entity_id || item.entity_type)}</small></div><time>{new Date(item.created_at).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'})}</time></article>)}</div> : <div className="admin-mini-empty"><History size={20} /><p>No logged actions yet. Reservation and room updates will appear here after the activity migration is applied.</p></div>}
                <div className="activity-section-heading email-log-heading"><div><span className="eyebrow"><span /> TRANSACTIONAL EMAIL</span><h3>Email delivery history</h3><p>Only configured email attempts appear in this log.</p></div></div>
                {emailLogs.length ? <div className="email-log-list">{emailLogs.map(log => <article className="email-log-row" key={log.id}><span className={'email-log-status ' + log.status}><Mail size={15} /></span><div><strong>{log.event_key.replaceAll('_',' ')}</strong><small>To: {log.recipient}</small>{log.error_message && <small className="email-log-error">{log.error_message}</small>}</div><div><StatusPill status={log.status === 'sent' ? 'Completed' : log.status === 'failed' ? 'Cancelled' : 'Pending'} /><small>{new Date(log.created_at).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'})}</small></div></article>)}</div> : <div className="admin-mini-empty"><Mail size={20} /><p>Email delivery status appears here after email configuration and first reservation.</p></div>}
              </section>
            )}

          </div>
          <div className="admin-footer-note">
            <ShieldCheck size={15} />
            <span>Changes are saved to the shared lodging database. Review reservations and room availability regularly.</span>
          </div>
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
      {bookingReceipt && (
        <div className="modal-backdrop receipt-backdrop">
          <section className="modal booking-receipt-modal" role="dialog" aria-modal="true" aria-label="Reservation request confirmation">
            <button className="modal-close" type="button" onClick={() => setBookingReceipt(null)} aria-label="Close confirmation"><X /></button>
            <div className="receipt-success-mark"><CheckCircle2 size={36} /></div>
            <div className="eyebrow receipt-eyebrow"><span /> RESERVATION REQUEST RECEIVED</div>
            <h2>Thank you for your <em>booking request.</em></h2>
            <p className="receipt-intro">Your request is saved. The lodging staff will review it before it is confirmed.</p>
            <div className="receipt-reference"><small>RESERVATION REFERENCE</small><strong>{bookingReceipt.reference}</strong><button type="button" onClick={() => { void navigator.clipboard?.writeText(bookingReceipt.reference); setNotice('Reservation reference copied.'); }}>Copy reference</button></div>
            <div className="receipt-details">
              <div><small>ROOM</small><strong>{bookingReceipt.roomName}</strong></div><div><small>CHECK-IN</small><strong>{bookingReceipt.checkIn}</strong></div><div><small>CHECK-OUT</small><strong>{bookingReceipt.checkOut}</strong></div><div><small>GUESTS</small><strong>{bookingReceipt.guests}</strong></div>
              <div className="receipt-total"><small>ESTIMATED TOTAL</small><strong>{money(bookingReceipt.total)}</strong><span>{nightsBetween(bookingReceipt.checkIn, bookingReceipt.checkOut)} night(s)</span></div>
            </div>
            <div className={'receipt-email-state ' + bookingReceipt.emailStatus}><Mail size={17} /><div><strong>{bookingReceipt.emailStatus === 'sent' ? 'Confirmation email sent' : bookingReceipt.emailStatus === 'pending' ? 'Checking email delivery…' : bookingReceipt.emailStatus === 'failed' ? 'Booking saved; email needs attention' : 'Email confirmation not configured yet'}</strong><small>{bookingReceipt.emailStatus === 'sent' ? 'A request receipt was sent to ' + bookingReceipt.email + '.' : bookingReceipt.emailStatus === 'failed' ? 'Your booking is saved. The lodging staff can still see it; the notification could not be delivered.' : bookingReceipt.emailStatus === 'pending' ? 'We are checking the notification service.' : 'Keep your reservation reference. The booking is saved, but email delivery needs the sending service setup.'}</small></div></div>
            <div className="receipt-actions"><button className="button button-outline" type="button" onClick={() => { setBookingReceipt(null); go('rooms'); }}>Browse rooms</button><button className="button button-primary" type="button" onClick={() => { setBookingReceipt(null); go('mybookings'); }}>View my reservation <ChevronRight size={16} /></button></div>
          </section>
        </div>
      )}
      {roomEditor && (
        <div className="modal-backdrop room-editor-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !roomSaveBusy) setRoomEditor(null); }}>
          <section className="modal room-editor-modal" role="dialog" aria-modal="true" aria-label={roomEditor.id === undefined ? 'Add room' : 'Edit room'}>
            <button className="modal-close" type="button" disabled={roomSaveBusy} onClick={() => setRoomEditor(null)} aria-label="Close room editor"><X /></button>
            <div className="room-editor-heading">
              <div className="eyebrow"><span /> ROOM MANAGEMENT</div>
              <h2>{roomEditor.id === undefined ? 'Add a room.' : 'Edit room details.'}</h2>
              <p>Keep the listing clear for guests. Rates are per night in Philippine pesos.</p>
            </div>
            <form className="room-editor-form" onSubmit={saveRoom}>
              <div className="room-editor-grid">
                <label>Room name
                  <input required maxLength={80} value={roomEditor.name} onChange={event => setRoomEditor({...roomEditor, name: event.target.value})} placeholder="e.g. Deluxe Family Room" />
                </label>
                <label>Room type
                  <select required value={roomEditor.type} onChange={event => setRoomEditor({...roomEditor, type: event.target.value})}>
                    {['Standard', 'Deluxe', 'Family', 'Single', 'Suite', 'Twin', 'Other'].map(type => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label>Nightly rate (PHP)
                  <input required type="number" min="1" step="1" value={roomEditor.price} onChange={event => setRoomEditor({...roomEditor, price: event.target.value})} />
                </label>
                <label>Guest capacity
                  <input required type="number" min="1" max="20" step="1" value={roomEditor.guests} onChange={event => setRoomEditor({...roomEditor, guests: event.target.value})} />
                </label>
                <label className="room-editor-full">Bed details
                  <input required maxLength={120} value={roomEditor.beds} onChange={event => setRoomEditor({...roomEditor, beds: event.target.value})} placeholder="e.g. 2 single beds" />
                </label>
                <label className="room-editor-full">Photo URL
                  <input type="url" value={roomEditor.image} onChange={event => setRoomEditor({...roomEditor, image: event.target.value})} placeholder="https://..." />
                </label>
                <label className="room-editor-full">Description
                  <textarea rows={3} maxLength={500} value={roomEditor.description} onChange={event => setRoomEditor({...roomEditor, description: event.target.value})} placeholder="Describe the room and what makes it comfortable." />
                </label>
                <label className="room-editor-full">Amenities (separate with commas)
                  <input value={roomEditor.amenities} onChange={event => setRoomEditor({...roomEditor, amenities: event.target.value})} placeholder="Wi-Fi, Air conditioning, Private bath" />
                </label>
              </div>
              {roomEditor.image && <div className="room-editor-preview"><img src={roomEditor.image} alt="Room preview" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /><span><Check size={14} /> Image preview</span></div>}
              <div className="room-editor-actions">
                <button className="button button-outline" type="button" disabled={roomSaveBusy} onClick={() => setRoomEditor(null)}>Cancel</button>
                <button className="button button-primary" type="submit" disabled={roomSaveBusy}>
                  {roomSaveBusy ? <><RefreshCw size={14} className="spin-icon" /> Saving…</> : <><Save size={14} /> Save room</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {authMode && (
        <div className="modal-backdrop auth-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAuthMode(null); }}>
          <section className="modal auth-modal auth-modal-showcase" role="dialog" aria-modal="true" aria-label={authMode === 'login' ? 'User login' : authMode === 'register' ? 'User registration' : 'Password recovery'}>
            <button className="modal-close" type="button" onClick={() => setAuthMode(null)} aria-label="Close account form"><X /></button>
            <aside className="auth-side auth-photo-side">
              <div className="auth-side-brand">
                <span className="auth-brand-mark"><House size={25} strokeWidth={1.7} /></span>
                <span className="auth-brand-copy"><strong>Chona’s</strong><small>LODGING HOUSE</small></span>
              </div>
              <div className="auth-side-copy">
                <div className="auth-photo-eyebrow"><Sparkles size={13} /> YOUR COMFORT, OUR PRIORITY</div>
                <h2>A lovely stay <em>starts here.</em></h2>
                <p>Find your room, make a reservation, and keep your stay details in one place.</p>
              </div>
              <div className="auth-side-foot"><ShieldCheck size={17} /><span>Private account · Easy reservations</span></div>
            </aside>

            <div className="auth-panel">
              <div className="auth-panel-heading">
                <div className="auth-welcome-label">WELCOME TO CHONA’S</div>
                <h2>{authMode === 'login' ? 'Welcome back' : authMode === 'register' ? 'Create your account' : authMode === 'reset' ? 'Reset your password' : 'Choose a new password'}</h2>
                <p>{authMode === 'login' ? 'Sign in to manage your reservations and plan your next stay.' : authMode === 'register' ? 'Create an account to keep your reservation details together.' : authMode === 'reset' ? 'We will email you a secure link to reset your password.' : 'Choose a strong new password to secure your account.'}</p>
              </div>

              {(authMode === 'login' || authMode === 'register') && (
                <div className="auth-mode-switch" role="tablist" aria-label="Choose login or registration">
                  <button type="button" role="tab" aria-selected={authMode === 'login'} className={authMode === 'login' ? 'auth-mode-tab active' : 'auth-mode-tab'} onClick={() => { setAuthMode('login'); setAuthError(''); setShowPassword(false); setShowConfirmPassword(false); setAuthForm(previous => ({ ...previous, password: '', confirmPassword: '' })); }}>Log in</button>
                  <button type="button" role="tab" aria-selected={authMode === 'register'} className={authMode === 'register' ? 'auth-mode-tab active' : 'auth-mode-tab'} onClick={() => { setAuthMode('register'); setAuthError(''); setShowPassword(false); setShowConfirmPassword(false); setAuthForm(previous => ({ ...previous, password: '', confirmPassword: '' })); }}>Register</button>
                </div>
              )}

              {!supabase && <p className="auth-error" role="status">Online sign-in is not configured yet. The site administrator must set the Supabase URL and public key, then apply the database migration.</p>}
              <form className="auth-form" onSubmit={submitAuth}>
                {authMode === 'register' && <label>Full name<input required autoComplete="name" value={authForm.name} onChange={event => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your full name" /></label>}
                {authMode !== 'updatePassword' && <label>Email address<input required type="email" autoComplete="email" value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" /></label>}
                {authMode !== 'reset' && (
                  <label>
                    {authMode === 'updatePassword' ? 'New password' : 'Password'}
                    <div className="auth-password-input">
                      <input required type={showPassword ? 'text' : 'password'} minLength={authMode === 'register' || authMode === 'updatePassword' ? 8 : 1} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} placeholder={authMode === 'register' || authMode === 'updatePassword' ? 'At least 8 characters' : 'Your password'} />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </label>
                )}
                {(authMode === 'register' || authMode === 'updatePassword') && (
                  <label>Confirm password
                    <div className="auth-password-input">
                      <input required type={showConfirmPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" value={authForm.confirmPassword} onChange={event => setAuthForm({ ...authForm, confirmPassword: event.target.value })} placeholder="Enter your password again" />
                      <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} title={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </label>
                )}
                {authMode === 'login' && <button type="button" className="auth-forgot" onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthForm(previous => ({ ...previous, password: '', confirmPassword: '' })); }} disabled={authBusy}>Forgot password?</button>}
                {authError && <p className="auth-error" role="alert">{authError}</p>}
                <button className="button button-primary auth-submit" type="submit" disabled={authBusy || !authReady || !supabase}>
                  <span>{authBusy ? 'Please wait…' : authMode === 'login' ? 'Log in to your account' : authMode === 'register' ? 'Create account' : authMode === 'reset' ? 'Send reset link' : 'Update password'}</span>
                  {!authBusy && <ChevronRight size={17} />}
                </button>
              </form>

              {(authMode === 'login' || authMode === 'register') && (
                <>
                  <div className="auth-divider"><span>SAFE & SIMPLE</span></div>
                  <div className="auth-benefits">
                    <div className="auth-benefit"><span className="auth-benefit-icon"><CalendarDays size={17} /></span><div><strong>Manage your bookings</strong><small>See your reservation status anytime.</small></div></div>
                    <div className="auth-benefit"><span className="auth-benefit-icon"><ShieldCheck size={17} /></span><div><strong>Your account stays yours</strong><small>Your bookings stay linked to your sign-in.</small></div></div>
                  </div>
                </>
              )}

              <p className="auth-demo-note">{supabase ? 'Your account is managed securely through Supabase Authentication.' : 'Authentication needs to be configured before guests can create accounts or log in.'}</p>
              {(authMode === 'reset' || authMode === 'updatePassword') && <button type="button" className="auth-switch-button auth-back-to-login" onClick={() => openAuth('login')}>Back to log in</button>}
              <button className="auth-later" type="button" onClick={() => setAuthMode(null)}>Maybe later</button>
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
                  disabled={authBusy}
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
            <Sparkles size={13} /> <span>Featured room</span>
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
