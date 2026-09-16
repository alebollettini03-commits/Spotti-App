import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  CalendarDays,
  Check,
  CircleUserRound,
  Clock3,
  Compass,
  GlassWater,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Ticket,
  Utensils,
  X,
} from 'lucide-react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { firestore, auth, googleProvider } from './lib/firebase';
import L from 'leaflet';

type VenueType = 'bar' | 'restaurant' | 'club';
type Venue = {
  id: string;
  name: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
  type: VenueType;
};
type CityEvent = {
  id: string;
  title: string;
  venueName: string;
  date: string;
  time: string;
  type: string;
  posterUrl?: string;
};
type Booking = {
  id: string;
  venueId: string;
  venueName?: string;
  date: string;
  time: string;
  guests: string;
  status: 'confirmed' | 'requested';
  firstName?: string;
  lastName?: string;
  arrivalTime?: string;
  eventTitle?: string;
};
type User = { uid: string; name: string; email: string; photoURL?: string | null };

const mapCenter: [number, number] = [42.6589, 13.7039];

function isVenueType(value: unknown): value is VenueType {
  return value === 'bar' || value === 'restaurant' || value === 'club';
}

function toDateString(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString().slice(0, 10);
    }
  }
  return '';
}

function readVenue(snapshot: { id: string; data: () => Record<string, unknown> }): Venue | null {
  const data = snapshot.data();
  const name = typeof data.name === 'string' ? data.name : '';
  const address = typeof data.address === 'string' ? data.address : '';
  const hours = typeof data.hours === 'string' ? data.hours : '';
  const type = data.type;
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  if (!name || !address || !hours || !isVenueType(type) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { id: snapshot.id, name, address, hours, lat, lng, type };
}

function readEvent(snapshot: { id: string; data: () => Record<string, unknown> }): CityEvent | null {
  const data = snapshot.data();
  const title = typeof data.title === 'string' ? data.title : '';
  const venueName = typeof data.venueName === 'string' ? data.venueName : '';
  const date = toDateString(data.date);
  const time = typeof data.time === 'string' ? data.time : '';
  const type = typeof data.type === 'string' ? data.type : '';
  const posterUrl = typeof data.posterUrl === 'string' ? data.posterUrl : undefined;
  if (!title || !venueName || !date || !time || !type) return null;
  return { id: snapshot.id, title, venueName, date, time, type, posterUrl };
}

function venueColor(type: VenueType) {
  return type === 'restaurant' ? '#2b7468' : type === 'club' ? '#665e9b' : '#dc7b55';
}

function venueIcon(venue: Venue, selected: boolean) {
  return L.divIcon({
    className: 'citylive-marker',
    html: `<span class="leaflet-pin ${venue.type} ${selected ? 'selected' : ''}" style="--pin-color:${venueColor(venue.type)}"><span></span></span>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
}

function formatEventDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { day: date, month: '', weekday: '' };
  return {
    day: new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(parsed),
    month: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(parsed).toUpperCase(),
    weekday: new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(parsed).toUpperCase(),
  };
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="map-zoom">
      <button className="icon-button" onClick={() => map.zoomIn()} aria-label="Zoom in" data-testid="button-map-zoom-in"><Plus size={16} /></button>
      <button className="icon-button" onClick={() => map.zoomOut()} aria-label="Zoom out" data-testid="button-map-zoom-out"><Minus size={16} /></button>
    </div>
  );
}

function AppShell({ children, user, eventsCount, onSignIn, onSignOut }: { children: React.ReactNode; user: User | null; eventsCount: number; onSignIn: () => void; onSignOut: () => void }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Explore', icon: Compass },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/bookings', label: 'Bookings', icon: Ticket },
  ];
  return <div className="app-shell">
    <header className="app-nav">
      <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark"><Navigation size={17} /></span><span className="brand-name">CityLive</span><span className="brand-sub">Affluenza Locali</span></Link>
      <nav className="nav-links" aria-label="Main navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={14} /> {label}{label === 'Events' && <span className="nav-count">{eventsCount}</span>}</Link>)}</nav>
      {user ? <div className="user-menu-wrap"><button className="user-button" onClick={() => setMenuOpen((open) => !open)} data-testid="button-user-menu"><span className="avatar">{user.name.charAt(0)}</span><span>Ciao, {user.name}</span></button>{menuOpen && <div className="user-menu" role="menu"><div className="user-menu-caption">{user.email}</div><Link href="/bookings" onClick={() => setMenuOpen(false)} role="menuitem"><Ticket size={14} /> Le mie prenotazioni</Link><button onClick={onSignOut} role="menuitem"><X size={14} /> Log out</button></div>}</div> : <button className="outline-button" onClick={onSignIn} data-testid="button-sign-in"><CircleUserRound size={15} /> Sign in</button>}
    </header>
    {children}
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`link-mobile-${label.toLowerCase()}`}><Icon size={16} /><span>{label}</span></Link>)}</nav>
  </div>;
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
  </div>;
}

function SignInModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  return <Modal onClose={onClose} label="Sign in to CityLive"><div className="modal-head"><div><span className="eyebrow">Your night, saved</span><h2>Keep the good plans.</h2><p>Sign in to book tables and keep every reservation in one place.</p></div><button className="icon-button" onClick={onClose} aria-label="Close sign in" data-testid="button-close-signin"><X size={17} /></button></div><div className="modal-body"><div className="signin-box"><Sparkles size={22} /><h3>Continue with Google</h3><p>We use your Google account to make bookings personal. No password to remember, no inbox noise.</p><button className="primary-button" onClick={onSignIn} data-testid="button-google-signin">Continue with Google</button></div></div></Modal>;
}

function BookingModal({ venue, event, onClose, onBooked }: { venue: Venue; event?: CityEvent; onClose: () => void; onBooked: (booking: Booking) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [date, setDate] = useState(event?.date ?? '');
  const [time, setTime] = useState(event?.time ?? '');
  const [guests, setGuests] = useState('2 guests');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onBooked({
      id: `booking-${Date.now()}`,
      venueId: venue.id,
      venueName: venue.name,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || '19:30',
      guests: guests || '2 guests',
      status: 'confirmed',
      firstName: firstName || '',
      lastName: lastName || '',
      arrivalTime: venue.type === 'restaurant' ? (time || '') : '',
      eventTitle: event?.title || ''
    });
  };
  return <Modal onClose={onClose} label={`Book ${venue.name}`}><div className="modal-head"><div><span className="eyebrow">{event ? 'Reserve your spot' : 'Make a plan'}</span><h2>{event ? event.title : venue.name}</h2><p>{venue.address} · {event ? event.time : 'Choose your time'}</p></div><button className="icon-button" onClick={onClose} aria-label="Close booking form" data-testid="button-close-booking"><X size={17} /></button></div><form className="modal-body" onSubmit={submit}><hr className="modal-divider" /><div className="form-grid"><div className="field"><label htmlFor="booking-first-name">Nome</label><input id="booking-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required data-testid="input-booking-first-name" /></div><div className="field"><label htmlFor="booking-last-name">Cognome</label><input id="booking-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required data-testid="input-booking-last-name" /></div><div className="field"><label htmlFor="booking-date">Date</label><input id="booking-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required data-testid="input-booking-date" /></div><div className="field"><label htmlFor="booking-time">{venue.type === 'restaurant' ? 'Orario di arrivo' : 'Time'}</label><input id="booking-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required data-testid="select-booking-time" /></div><div className="field full"><label htmlFor="booking-guests">Party size</label><select id="booking-guests" value={guests} onChange={(e) => setGuests(e.target.value)}><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5 guests</option><option>6 guests</option></select></div></div><div className="form-actions"><button type="button" className="outline-button" onClick={onClose} data-testid="button-cancel-booking">Not tonight</button><button type="submit" className="primary-button" data-testid="button-confirm-booking"><Check size={15} /> Confirm booking</button></div></form></Modal>;
}

function Explore({ venues }: { venues: Venue[] }) {
  const [, setLocation] = useLocation();
  const [activeFilters, setActiveFilters] = useState<VenueType[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Venue | null>(null);
  useEffect(() => {
    setSelected((current) => current && venues.some((venue) => venue.id === current.id) ? current : venues[0] ?? null);
  }, [venues]);
  const filtered = useMemo(() => venues.filter((venue) => (!activeFilters.length || activeFilters.includes(venue.type)) && `${venue.name} ${venue.address}`.toLowerCase().includes(search.toLowerCase())), [activeFilters, search, venues]);
  const filters = [{ key: 'all' as const, label: 'All spots', icon: Sparkles }, { key: 'bar' as const, label: 'Bars', icon: GlassWater }, { key: 'restaurant' as const, label: 'Restaurants', icon: Utensils }, { key: 'club' as const, label: 'Clubs', icon: Ticket }];
  return <main className="map-page">
    <MapContainer center={mapCenter} zoom={14} minZoom={11} maxZoom={18} zoomControl={false} className="map-canvas" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {filtered.map((venue) => <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={venueIcon(venue, selected?.id === venue.id)} eventHandlers={{ click: () => setSelected(venue) }}>
        <Popup>
          <div className="leaflet-popup-content-inner"><strong>{venue.name}</strong><span>{venue.address}</span><span>{venue.hours}</span><a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer"><Navigation size={13} /> Portami qui</a></div>
        </Popup>
      </Marker>)}
      <ZoomControls />
      <div className="map-topbar"><label className="map-search"><Search size={17} color="#2b7468" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a place or address" aria-label="Search venues" data-testid="input-map-search" /><span className="eyebrow" style={{ fontSize: 9 }}>Teramo</span></label><div className="map-note"><LocateFixed size={15} /><span>Showing tonight in <strong>Teramo</strong></span></div></div>
      <div className="filter-rail">{filters.map(({ key, label, icon: Icon }) => { const active = key === 'all' ? !activeFilters.length : activeFilters.includes(key); return <button key={key} className={`filter-chip ${active ? 'active' : ''}`} onClick={() => key === 'all' ? setActiveFilters([]) : setActiveFilters((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} data-testid={`button-filter-${key}`}><Icon size={13} /><span>{label}</span></button>; })}</div>
      {!venues.length && <div className="map-empty"><strong>Nessun locale disponibile</strong><span>I locali Firestore appariranno qui in tempo reale.</span></div>}
    </MapContainer>
    {selected && <section className="map-panel" data-testid={`card-venue-${selected.id}`}><div className="panel-image"><div className="panel-image-text">{selected.type}</div></div><div className="panel-body"><div className="eyebrow">{selected.type}</div><h2>{selected.name}</h2><div className="panel-meta"><span className="meta-item"><MapPin size={12} /> {selected.address}</span><span className="meta-item"><Clock3 size={12} /> {selected.hours}</span></div><div className="panel-actions"><button className="outline-button" onClick={() => setLocation(`/events?venue=${selected.id}`)} data-testid="button-view-venue-events"><CalendarDays size={14} /> See events</button><a className="primary-button" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer" data-testid="button-directions"><Navigation size={14} /> Portami qui</a></div></div></section>}
  </main>;
}

function EventsPage({ events, venues, onBook }: { events: CityEvent[]; venues: Venue[]; onBook: (venue: Venue, event?: CityEvent) => void }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [eventDetail, setEventDetail] = useState<CityEvent | null>(null);
  const dates = useMemo(() => [...new Set(events.map((event) => event.date))].sort(), [events]);
  useEffect(() => {
    if (!dates.length) setSelectedDate('');
    else if (!dates.includes(selectedDate)) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);
  const shown = events.filter((event) => event.date === selectedDate);
  const eventVenue = (event: CityEvent) => venues.find((venue) => venue.name.trim().toLowerCase() === event.venueName.trim().toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  return <main className="page"><div className="page-heading"><div><span className="eyebrow">The city is on</span><h1 className="page-title">Plans with a pulse.</h1><p className="page-copy">Dated things worth leaving the house for, from first aperitivo to last dance.</p></div><div className="heading-actions"><button className="soft-button" onClick={() => setSelectedDate(today)} data-testid="button-today">Oggi</button><Link href="/" className="outline-button" data-testid="link-back-to-map"><MapPin size={14} /> Browse map</Link></div></div>{dates.length ? <div className="date-strip">{dates.map((date) => { const parts = formatEventDate(date); return <button key={date} className={`date-button ${selectedDate === date ? 'active' : ''}`} onClick={() => setSelectedDate(date)} data-testid={`button-date-${date}`}><strong>{parts.day}</strong><span>{parts.weekday} · {parts.month}</span></button>; })}</div> : <div className="empty-state compact-empty"><div><div className="empty-icon"><CalendarDays size={24} /></div><h2>Nessun evento disponibile.</h2><p>Gli eventi Firestore appariranno qui in tempo reale.</p></div></div>}<div className="content-grid"><div className="event-list">{shown.length ? shown.map((event, index) => { const venue = eventVenue(event); const parts = formatEventDate(event.date); return <article className="event-card" key={event.id} style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-event-${event.id}`}><div className={`event-poster ${event.posterUrl ? '' : 'event-poster-empty'}`} style={event.posterUrl ? { backgroundImage: `url(${event.posterUrl})` } : undefined}><span>{event.type}</span></div><div className="event-date"><strong>{parts.day}</strong><span>{parts.month}</span></div><div><span className="event-tag"><Sparkles size={10} /> {event.type}</span><h3>{event.title}</h3><p><strong>{event.venueName}</strong> · {event.time}{venue ? ` · ${venue.address}` : ''}</p></div><button className="primary-button" onClick={() => setEventDetail(event)} data-testid={`button-event-details-${event.id}`}>Details</button></article>; }) : <div className="empty-state"><div><div className="empty-icon"><CalendarDays size={24} /></div><h2>A quieter date.</h2><p>Nothing is listed for this day yet. Try another date.</p></div></div>}</div><aside className="side-feature"><span className="eyebrow" style={{ color: '#e6a47d' }}>CityLive editorial</span><h2>Do one thing properly tonight.</h2><p>Skip the endless scroll. Pick a room, a table or a dance floor that feels like a story already in progress.</p><div className="feature-stat"><div><strong>{venues.length}</strong><span>locali connessi</span></div><div><strong>{events.length}</strong><span>eventi disponibili</span></div></div></aside></div>{eventDetail && <Modal onClose={() => setEventDetail(null)} label={`Event details for ${eventDetail.title}`}><div className="modal-head"><div><span className="eyebrow">{formatEventDate(eventDetail.date).weekday} · {eventDetail.date}</span><h2>{eventDetail.title}</h2><p>{eventDetail.venueName} · {eventDetail.time}</p></div><button className="icon-button" onClick={() => setEventDetail(null)} aria-label="Close event details" data-testid="button-close-event"><X size={17} /></button></div><div className="modal-body"><hr className="modal-divider" /><div className="panel-meta" style={{ marginBottom: 18 }}><span className="meta-item"><MapPin size={13} /> {eventVenue(eventDetail)?.address ?? eventDetail.venueName}</span><span className="meta-item"><Clock3 size={13} /> {eventDetail.time}</span></div>{eventVenue(eventDetail) ? <button className="primary-button" onClick={() => { const venue = eventVenue(eventDetail); if (venue) { setEventDetail(null); onBook(venue, eventDetail); } }} data-testid={`button-book-event-${eventDetail.id}`}><Ticket size={14} /> Book this event</button> : <p className="page-copy">Il locale non è presente nella collezione venues.</p>}</div></Modal>}</main>;
}

function BookingsPage({ bookings, venues, onExplore }: { bookings: Booking[]; venues: Venue[]; onExplore: () => void }) {
  return <main className="page"><div className="page-heading"><div><span className="eyebrow">Your CityLive</span><h1 className="page-title">Plans in motion.</h1><p className="page-copy">Your confirmed tables, rooms and reasons to get out.</p></div></div>{bookings.length ? <div className="booking-grid"><div>{bookings.map((booking, index) => { const venue = venues.find((item) => item.id === booking.venueId); const venueName = venue?.name ?? booking.venueName ?? 'Locale'; const venueType = venue?.type; return <article className="booking-card" key={booking.id} style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-booking-${booking.id}`}><div className="booking-badge">{venueType === 'restaurant' ? <Utensils size={22} /> : venueType === 'club' ? <Ticket size={22} /> : <GlassWater size={22} />}</div><div><span className="eyebrow">{venueType ?? 'booking'}</span><h3>{venueName}</h3><p>{booking.date} · {booking.time}<br />{booking.guests}{venue?.address ? ` · ${venue.address}` : ''}{booking.eventTitle ? <><br />{booking.eventTitle}</> : null}</p></div><span className="status-tag"><Check size={10} /> {booking.status}</span></article>; })}</div><aside className="side-feature"><span className="eyebrow" style={{ color: '#e6a47d' }}>A small nudge</span><h2>Leave room for a little spontaneity.</h2><p>Plans are better when they have somewhere to start. Find a new favorite room for the next one.</p><button className="primary-button" onClick={onExplore} data-testid="button-explore-more"><Compass size={14} /> Explore the city</button></aside></div> : <div className="empty-state"><div><div className="empty-icon"><Ticket size={24} /></div><h2>No plans yet.</h2><p>Your next good night is probably one short walk away. Find a table, a drink or a dance floor.</p><button className="primary-button" onClick={onExplore} data-testid="button-empty-explore"><Compass size={14} /> Explore tonight</button></div></div>}</main>;
}

function RouterContent({ user, venues, events, onSignIn, onSignOut, bookings, onBooking }: { user: User | null; venues: Venue[]; events: CityEvent[]; onSignIn: () => void; onSignOut: () => void; bookings: Booking[]; onBooking: (venue: Venue, event?: CityEvent) => void }) {
  const [, setLocation] = useLocation();
  return <AppShell user={user} eventsCount={events.length} onSignIn={onSignIn} onSignOut={onSignOut}><Switch><Route path="/"><Explore venues={venues} /></Route><Route path="/events"><EventsPage events={events} venues={venues} onBook={onBooking} /></Route><Route path="/bookings"><BookingsPage bookings={bookings} venues={venues} onExplore={() => setLocation('/')} /></Route><Route><div className="page"><div className="empty-state"><div><div className="empty-icon"><Compass size={24} /></div><h2>That street is a little lost.</h2><p>Let’s get you back to the map.</p><Link href="/" className="primary-button" data-testid="link-not-found-home">Back to explore</Link></div></div></div></Route></Switch></AppShell>;
}

function authUser(user: FirebaseUser): User {
  return { uid: user.uid, name: user.displayName ?? user.email?.split('@')[0] ?? 'CityLive user', email: user.email ?? '', photoURL: user.photoURL };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [catalogErrors, setCatalogErrors] = useState({ venues: '', events: '' });
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<{ venue: Venue; event?: CityEvent } | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ venue: Venue; event?: CityEvent } | null>(null);
  const [toast, setToast] = useState('');
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };

  useEffect(() => onAuthStateChanged(auth, (firebaseUser) => setUser(firebaseUser ? authUser(firebaseUser) : null)), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'venues'), (snapshot) => {
      setVenues(snapshot.docs.map(readVenue).filter((venue): venue is Venue => venue !== null));
      setCatalogErrors((current) => ({ ...current, venues: '' }));
    }, () => setCatalogErrors((current) => ({ ...current, venues: 'Impossibile leggere la collezione venues.' })));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'events'), (snapshot) => {
      setEvents(snapshot.docs.map(readEvent).filter((event): event is CityEvent => event !== null));
      setCatalogErrors((current) => ({ ...current, events: '' }));
    }, () => setCatalogErrors((current) => ({ ...current, events: 'Impossibile leggere la collezione events.' })));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) { setBookings([]); return; }
    let cancelled = false;
    const loadBookings = async () => {
      try {
        const snapshot = await getDocs(query(collection(firestore, 'bookings'), where('userId', '==', user.uid)));
        const today = new Date().toISOString().slice(0, 10);
        const active: Booking[] = [];
        await Promise.all(snapshot.docs.map(async (item) => {
          const data = item.data() as Omit<Booking, 'id'>;
          if (data.date && data.date < today) await deleteDoc(doc(firestore, 'bookings', item.id));
          else active.push({ id: item.id, ...data });
        }));
        if (!cancelled) setBookings(active.sort((a, b) => a.date.localeCompare(b.date)));
      } catch {
        if (!cancelled) showToast('Non riesco a caricare le prenotazioni. Controlla le regole Firestore.');
      }
    };
    void loadBookings();
    return () => { cancelled = true; };
  }, [user]);

  const startGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = authUser(result.user);
      setUser(signedInUser);
      setAuthOpen(false);
      if (pendingBooking) { setBookingTarget(pendingBooking); setPendingBooking(null); }
      showToast('Sei entrato. Ora puoi confermare il tuo piano.');
    } catch {
      showToast('Accesso Google non riuscito. Verifica il dominio autorizzato in Firebase.');
    }
  };

  const requestBooking = (venue: Venue, event?: CityEvent) => {
    if (!user) { setPendingBooking({ venue, event }); setAuthOpen(true); return; }
    setBookingTarget({ venue, event });
  };

  const booked = async (booking: Booking) => {
    if (!user) return;
    try {
      // Pulizia dei dati da salvare su Firestore per evitare valori undefined
      const cleanData = {
        userId: user.uid,
        venueId: booking.venueId || '',
        venueName: booking.venueName || '',
        date: booking.date || '',
        time: booking.time || '',
        guests: booking.guests || '',
        status: 'confirmed',
        firstName: booking.firstName || '',
        lastName: booking.lastName || '',
        arrivalTime: booking.arrivalTime || '',
        eventTitle: booking.eventTitle || '',
        createdAt: serverTimestamp()
      };
      
      const created = await addDoc(collection(firestore, 'bookings'), cleanData);
      setBookings((current) => [{ ...booking, id: created.id }, ...current]);
      setBookingTarget(null);
      showToast('Prenotazione confermata. Ci vediamo lì.');
    } catch (err) {
      console.error('Errore Firestore:', err);
      showToast('Prenotazione non salvata. Controlla le regole Firestore e riprova.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setBookings([]);
    showToast('Sei uscito da CityLive.');
  };

  const catalogError = [catalogErrors.venues, catalogErrors.events].filter(Boolean).join(' ');
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RouterContent user={user} venues={venues} events={events} onSignIn={() => setAuthOpen(true)} onSignOut={() => void logout()} bookings={bookings} onBooking={requestBooking} />{authOpen && <SignInModal onClose={() => setAuthOpen(false)} onSignIn={() => void startGoogleSignIn()} />}{bookingTarget && <BookingModal venue={bookingTarget.venue} event={bookingTarget.event} onClose={() => setBookingTarget(null)} onBooked={(booking) => void booked(booking)} />}{catalogError && <div className="toast" role="alert" data-testid="status-catalog-error">{catalogError}</div>}{toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}</WouterRouter>;
}

export default App;