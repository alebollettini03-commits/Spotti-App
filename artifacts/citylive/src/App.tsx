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
  signInWithRedirect,
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
  Globe,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { firestore, auth, googleProvider } from './lib/firebase';
import L from 'leaflet';

type Language = 'it' | 'en';

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

const translations = {
  it: {
    explore: 'Esplora',
    events: 'Eventi',
    bookings: 'Prenotazioni',
    signIn: 'Accedi',
    myBookings: 'Le mie prenotazioni',
    logout: 'Esci',
    searchPlaceholder: 'Cerca un locale o indirizzo',
    showingIn: 'a',
    allSpots: 'Tutti i locali',
    bars: 'Bar',
    restaurants: 'Ristoranti',
    clubs: 'Club',
    noVenues: 'Nessun locale disponibile',
    noVenuesSub: 'I locali Firestore appariranno qui in tempo reale.',
    seeEvents: 'Vedi eventi',
    takeMeThere: 'Portami qui',
    plansWithPulse: 'La città prende vita.',
    datedThings: 'Eventi e appuntamenti da non perdere in città.',
    today: 'Oggi',
    browseMap: 'Mappa',
    noEvents: 'Nessun evento disponibile.',
    noEventsSub: 'Gli eventi appariranno qui in tempo reale.',
    quieterDate: 'Nessun evento.',
    quieterDateSub: 'Non c\'è nulla in programma per questa data.',
    details: 'Dettagli',
    editorialTitle: 'Vivi la serata giusta.',
    editorialCopy: 'Scegli il tavolo o la pista da ballo perfetta per la tua serata.',
    bookingEditorialTitle: 'I tuoi piani in un solo posto.',
    bookingEditorialCopy: 'Gestisci le tue prenotazioni e organizza al meglio le tue prossime uscite.',
    localiConnected: 'locali connessi',
    eventsAvailable: 'eventi disponibili',
    bookThisEvent: 'Prenota questo evento',
    notInVenues: 'Il locale non è presente nella collezione venues.',
    plansInMotion: 'Le tue prenotazioni.',
    plansInMotionCopy: 'Tutti i tuoi tavoli e appuntamenti confermati.',
    noPlans: 'Nessuna prenotazione.',
    noPlansSub: 'Trova subito un tavolo o una serata speciale.',
    exploreTonight: 'Esplora stasera',
    cancelBooking: 'Cancella prenotazione',
    bookingConfirmed: 'Prenotazione confermata.',
    guest: 'persona',
    guests: 'persone',
    reserveSpot: 'Prenota il tuo posto',
    makePlan: 'Fai una prenotazione',
    eventStart: 'Inizio evento',
    chooseTime: 'Scegli orario',
    firstName: 'Nome',
    lastName: 'Cognome',
    date: 'Data',
    time: 'Orario',
    arrivalTime: 'Orario di arrivo',
    partySize: 'Numero di persone',
    notTonight: 'Annulla',
    confirmBooking: 'Conferma prenotazione',
    invalidTime: 'Orario non valido. L\'evento inizia alle',
    invalidTimeSub: 'e non sono accettate prenotazioni precedenti.',
  },
  en: {
    explore: 'Explore',
    events: 'Events',
    bookings: 'Bookings',
    signIn: 'Sign in',
    myBookings: 'My bookings',
    logout: 'Log out',
    searchPlaceholder: 'Search a place or address',
    showingIn: 'in',
    allSpots: 'All spots',
    bars: 'Bars',
    restaurants: 'Restaurants',
    clubs: 'Clubs',
    noVenues: 'No venues available',
    noVenuesSub: 'Firestore venues will appear here in real time.',
    seeEvents: 'See events',
    takeMeThere: 'Get directions',
    plansWithPulse: 'Plans with a pulse.',
    datedThings: 'Dated things worth leaving the house for.',
    today: 'Today',
    browseMap: 'Browse map',
    noEvents: 'No events available.',
    noEventsSub: 'Firestore events will appear here in real time.',
    quieterDate: 'A quieter date.',
    quieterDateSub: 'Nothing is listed for this day yet.',
    details: 'Details',
    editorialTitle: 'Do one thing properly tonight.',
    editorialCopy: 'Pick a room, a table or a dance floor that feels right.',
    bookingEditorialTitle: 'All your plans in one place.',
    bookingEditorialCopy: 'Manage your active reservations and plan your next night out.',
    localiConnected: 'connected venues',
    eventsAvailable: 'available events',
    bookThisEvent: 'Book this event',
    notInVenues: 'Venue not found in database.',
    plansInMotion: 'Plans in motion.',
    plansInMotionCopy: 'Your confirmed tables and reservations.',
    noPlans: 'No plans yet.',
    noPlansSub: 'Your next good night is one short walk away.',
    exploreTonight: 'Explore tonight',
    cancelBooking: 'Cancel booking',
    bookingConfirmed: 'Booking confirmed.',
    guest: 'guest',
    guests: 'guests',
    reserveSpot: 'Reserve your spot',
    makePlan: 'Make a plan',
    eventStart: 'Event start',
    chooseTime: 'Choose your time',
    firstName: 'First Name',
    lastName: 'Last Name',
    date: 'Date',
    time: 'Time',
    arrivalTime: 'Arrival Time',
    partySize: 'Party size',
    notTonight: 'Cancel',
    confirmBooking: 'Confirm booking',
    invalidTime: 'Invalid time. The event starts at',
    invalidTimeSub: 'and earlier bookings are not allowed.',
  }
};

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

function formatEventDate(date: string, lang: Language) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { day: date, month: '', weekday: '' };
  const locale = lang === 'it' ? 'it-IT' : 'en-US';
  return {
    day: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(parsed),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(parsed).toUpperCase(),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(parsed).toUpperCase(),
  };
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click: () => {
      onClick();
    },
  });
  return null;
}

function LanguageSelector({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <div className="modal-backdrop" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '420px', textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(43, 116, 104, 0.1)', color: '#2b7468', marginBottom: '16px' }}>
          <Globe size={32} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Seleziona la lingua</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Select your preferred language to enter Spotti</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="primary-button"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}
            onClick={() => onSelect('it')}
          >
            🇮🇹 &nbsp; Italiano
          </button>
          <button
            className="outline-button"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}
            onClick={() => onSelect('en')}
          >
            🇬🇧 &nbsp; English
          </button>
        </div>
      </div>
    </div>
  );
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="map-zoom">
      <button className="icon-button" onClick={() => map.zoomIn()} aria-label="Zoom in"><Plus size={16} /></button>
      <button className="icon-button" onClick={() => map.zoomOut()} aria-label="Zoom out"><Minus size={16} /></button>
    </div>
  );
}

function AppShell({ children, user, eventsCount, lang, onSignIn, onSignOut, onChangeLang }: { children: React.ReactNode; user: User | null; eventsCount: number; lang: Language; onSignIn: () => void; onSignOut: () => void; onChangeLang: () => void }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang];

  const nav = [
    { href: '/', label: t.explore, icon: Compass },
    { href: '/events', label: t.events, icon: CalendarDays },
    { href: '/bookings', label: t.bookings, icon: Ticket },
  ];

  return <div className="app-shell">
    <header className="app-nav">
    <Link href="/" className="brand">
  <span className="brand-mark" style={{ backgroundColor: '#991b1b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: '6px' }}>
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff" /* Bianco per la S */
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 C18 6, 6 4, 6 9 C6 14, 18 10, 18 15 C18 20, 6 18, 6 18" />
    </svg>
  </span>
  <span className="brand-name">Spotti</span>
</Link>
      <nav className="nav-links" aria-label="Main navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`}><Icon size={14} /> {label}{href === '/events' && <span className="nav-count">{eventsCount}</span>}</Link>)}</nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="icon-button" onClick={onChangeLang} title="Cambia lingua / Change language">
          <Globe size={16} />
        </button>
        {user ? <div className="user-menu-wrap"><button className="user-button" onClick={() => setMenuOpen((open) => !open)}><span className="avatar">{user.name.charAt(0)}</span><span>{user.name}</span></button>{menuOpen && <div className="user-menu" role="menu"><div className="user-menu-caption">{user.email}</div><Link href="/bookings" onClick={() => setMenuOpen(false)} role="menuitem"><Ticket size={14} /> {t.myBookings}</Link><button onClick={onSignOut} role="menuitem"><X size={14} /> {t.logout}</button></div>}</div> : <button className="outline-button" onClick={onSignIn}><CircleUserRound size={15} /> {t.signIn}</button>}
      </div>
    </header>
    {children}
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'active' : ''}><Icon size={16} /><span>{label}</span></Link>)}</nav>
  </div>;
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
  </div>;
}

function SignInModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  return <Modal onClose={onClose} label="Sign in to Spotti"><div className="modal-head"><div><span className="eyebrow">Your night, saved</span><h2>Keep the good plans.</h2><p>Sign in to book tables and keep every reservation in one place.</p></div><button className="icon-button" onClick={onClose} aria-label="Close sign in"><X size={17} /></button></div><div className="modal-body"><div className="signin-box"><Sparkles size={22} /><h3>Continue with Google</h3><p>We use your Google account to make bookings personal. No password to remember, no inbox noise.</p><button className="primary-button" onClick={onSignIn}>Continue with Google</button></div></div></Modal>;
}

function BookingModal({ venue, event, lang, onClose, onBooked }: { venue: Venue; event?: CityEvent; lang: Language; onClose: () => void; onBooked: (booking: Booking) => void }) {
  const t = translations[lang];
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [date, setDate] = useState(event?.date ?? '');
  const [time, setTime] = useState(event?.time ? (event.time.match(/\d{2}:\d{2}/)?.[0] ?? event.time) : '');
  const [guests, setGuests] = useState(`2 ${t.guests}`);
  const [errorMessage, setErrorMessage] = useState('');

  const eventStartTime = event?.time?.match(/\d{2}:\d{2}/)?.[0] ?? event?.time;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (eventStartTime && time) {
      if (time < eventStartTime) {
        setErrorMessage(`${t.invalidTime} ${eventStartTime} ${t.invalidTimeSub}`);
        return;
      }
    }

    onBooked({
      id: `booking-${Date.now()}`,
      venueId: venue.id,
      venueName: venue.name,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || '19:30',
      guests: guests || `2 ${t.guests}`,
      status: 'confirmed',
      firstName: firstName || '',
      lastName: lastName || '',
      arrivalTime: venue.type === 'restaurant' ? (time || '') : '',
      eventTitle: event?.title || ''
    });
  };

  return <Modal onClose={onClose} label={`Book ${venue.name}`}><div className="modal-head"><div><span className="eyebrow">{event ? t.reserveSpot : t.makePlan}</span><h2>{event ? event.title : venue.name}</h2><p>{venue.address} · {event ? `${t.eventStart}: ${event.time}` : t.chooseTime}</p></div><button className="icon-button" onClick={onClose} aria-label="Close booking form"><X size={17} /></button></div><form className="modal-body" onSubmit={submit}><hr className="modal-divider" />{errorMessage && <div style={{ color: '#d32f2f', backgroundColor: '#fde8e8', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>{errorMessage}</div>}<div className="form-grid"><div className="field"><label htmlFor="booking-first-name">{t.firstName}</label><input id="booking-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div><div className="field"><label htmlFor="booking-last-name">{t.lastName}</label><input id="booking-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div><div className="field"><label htmlFor="booking-date">{t.date}</label><input id="booking-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div><div className="field"><label htmlFor="booking-time">{venue.type === 'restaurant' ? t.arrivalTime : t.time}</label><input id="booking-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div><div className="field full"><label htmlFor="booking-guests">{t.partySize}</label><select id="booking-guests" value={guests} onChange={(e) => setGuests(e.target.value)}><option>1 {t.guest}</option><option>2 {t.guests}</option><option>3 {t.guests}</option><option>4 {t.guests}</option><option>5 {t.guests}</option><option>6 {t.guests}</option></select></div></div><div className="form-actions"><button type="button" className="outline-button" onClick={onClose}>{t.notTonight}</button><button type="submit" className="primary-button"><Check size={15} /> {t.confirmBooking}</button></div></form></Modal>;
}

function Explore({ venues, lang }: { venues: Venue[]; lang: Language }) {
  const [, setLocation] = useLocation();
  const t = translations[lang];
  const [activeFilters, setActiveFilters] = useState<VenueType[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Venue | null>(null);

  const filtered = useMemo(() => venues.filter((venue) => (!activeFilters.length || activeFilters.includes(venue.type)) && `${venue.name} ${venue.address}`.toLowerCase().includes(search.toLowerCase())), [activeFilters, search, venues]);
  const filters = [{ key: 'all' as const, label: t.allSpots, icon: Sparkles }, { key: 'bar' as const, label: t.bars, icon: GlassWater }, { key: 'restaurant' as const, label: t.restaurants, icon: Utensils }, { key: 'club' as const, label: t.clubs, icon: Ticket }];

  return <main className="map-page">
    <MapContainer center={mapCenter} zoom={14} minZoom={11} maxZoom={18} zoomControl={false} className="map-canvas" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <MapClickHandler onClick={() => setSelected(null)} />

      {filtered.map((venue) => <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={venueIcon(venue, selected?.id === venue.id)} eventHandlers={{ click: () => setSelected(venue) }}>
        <Popup>
          <div className="leaflet-popup-content-inner"><strong>{venue.name}</strong><span>{venue.address}</span><span>{venue.hours}</span><a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer"><Navigation size={13} /> {t.takeMeThere}</a></div>
        </Popup>
      </Marker>)}
      <ZoomControls />
      <div className="map-topbar">
        <label className="map-search"><Search size={17} color="#2b7468" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPlaceholder} aria-label="Search venues" /><span className="eyebrow" style={{ fontSize: 9 }}>Teramo</span></label>
        <div className="map-note"><LocateFixed size={15} /><span>{t.showingIn} <strong>Teramo</strong></span></div>
      </div>
      <div className="filter-rail">{filters.map(({ key, label, icon: Icon }) => { const active = key === 'all' ? !activeFilters.length : activeFilters.includes(key); return <button key={key} className={`filter-chip ${active ? 'active' : ''}`} onClick={() => key === 'all' ? setActiveFilters([]) : setActiveFilters((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}><Icon size={13} /><span>{label}</span></button>; })}</div>
      {!venues.length && <div className="map-empty"><strong>{t.noVenues}</strong><span>{t.noVenuesSub}</span></div>}
    </MapContainer>
    
    {selected && <section className="map-panel"><div className="panel-image"><div className="panel-image-text">{selected.type}</div></div><div className="panel-body"><div className="eyebrow">{selected.type}</div><h2>{selected.name}</h2><div className="panel-meta"><span className="meta-item"><MapPin size={12} /> {selected.address}</span><span className="meta-item"><Clock3 size={12} /> {selected.hours}</span></div><div className="panel-actions"><button className="outline-button" onClick={() => setLocation(`/events?venue=${selected.id}`)}><CalendarDays size={14} /> {t.seeEvents}</button><a className="primary-button" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer"><Navigation size={14} /> {t.takeMeThere}</a></div></div></section>}
  </main>;
}

function EventsPage({ events, venues, lang, onBook }: { events: CityEvent[]; venues: Venue[]; lang: Language; onBook: (venue: Venue, event?: CityEvent) => void }) {
  const t = translations[lang];
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

  return <main className="page"><div className="page-heading"><div><span className="eyebrow">Spotti</span><h1 className="page-title">{t.plansWithPulse}</h1><p className="page-copy">{t.datedThings}</p></div><div className="heading-actions"><button className="soft-button" onClick={() => setSelectedDate(today)}>{t.today}</button><Link href="/" className="outline-button"><MapPin size={14} /> {t.browseMap}</Link></div></div>{dates.length ? <div className="date-strip">{dates.map((date) => { const parts = formatEventDate(date, lang); return <button key={date} className={`date-button ${selectedDate === date ? 'active' : ''}`} onClick={() => setSelectedDate(date)}><strong>{parts.day}</strong><span>{parts.weekday} · {parts.month}</span></button>; })}</div> : <div className="empty-state compact-empty"><div><div className="empty-icon"><CalendarDays size={24} /></div><h2>{t.noEvents}</h2><p>{t.noEventsSub}</p></div></div>}<div className="content-grid"><div className="event-list">{shown.length ? shown.map((event, index) => { const venue = eventVenue(event); const parts = formatEventDate(event.date, lang); return <article className="event-card" key={event.id} style={{ animationDelay: `${index * 70}ms` }}><div className={`event-poster ${event.posterUrl ? '' : 'event-poster-empty'}`} style={event.posterUrl ? { backgroundImage: `url(${event.posterUrl})` } : undefined}><span>{event.type}</span></div><div className="event-date"><strong>{parts.day}</strong><span>{parts.month}</span></div><div><span className="event-tag"><Sparkles size={10} /> {event.type}</span><h3>{event.title}</h3><p><strong>{event.venueName}</strong> · {event.time}{venue ? ` · ${venue.address}` : ''}</p></div><button className="primary-button" onClick={() => setEventDetail(event)}>{t.details}</button></article>; }) : <div className="empty-state"><div><div className="empty-icon"><CalendarDays size={24} /></div><h2>{t.quieterDate}</h2><p>{t.quieterDateSub}</p></div></div>}</div>
  
  <aside className="side-feature">
    <span className="eyebrow" style={{ color: '#e6a47d' }}>Spotti editorial</span>
    <h2>{t.editorialTitle}</h2>
    <p>{t.editorialCopy}</p>
    <div className="feature-stat">
      <div><strong>{venues.length}</strong><span>{t.localiConnected}</span></div>
      <div><strong>{events.length}</strong><span>{t.eventsAvailable}</span></div>
    </div>
  </aside>
  
  </div>{eventDetail && <Modal onClose={() => setEventDetail(null)} label={`Event details for ${eventDetail.title}`}><div className="modal-head"><div><span className="eyebrow">{formatEventDate(eventDetail.date, lang).weekday} · {eventDetail.date}</span><h2>{eventDetail.title}</h2><p>{eventDetail.venueName} · {eventDetail.time}</p></div><button className="icon-button" onClick={() => setEventDetail(null)} aria-label="Close event details"><X size={17} /></button></div><div className="modal-body"><hr className="modal-divider" /><div className="panel-meta" style={{ marginBottom: 18 }}><span className="meta-item"><MapPin size={13} /> {eventVenue(eventDetail)?.address ?? eventDetail.venueName}</span><span className="meta-item"><Clock3 size={13} /> {eventDetail.time}</span></div>{eventVenue(eventDetail) ? <button className="primary-button" onClick={() => { const venue = eventVenue(eventDetail); if (venue) { setEventDetail(null); onBook(venue, eventDetail); } }}><Ticket size={14} /> {t.bookThisEvent}</button> : <p className="page-copy">{t.notInVenues}</p>}</div></Modal>}</main>;
}

function BookingsPage({ bookings, venues, lang, onExplore, onDeleteBooking }: { bookings: Booking[]; venues: Venue[]; lang: Language; onExplore: () => void; onDeleteBooking: (bookingId: string) => void }) {
  const t = translations[lang];
  return <main className="page"><div className="page-heading"><div><span className="eyebrow">Spotti</span><h1 className="page-title">{t.plansInMotion}</h1><p className="page-copy">{t.plansInMotionCopy}</p></div></div>{bookings.length ? <div className="booking-grid"><div>{bookings.map((booking, index) => { const venue = venues.find((item) => item.id === booking.venueId); const venueName = venue?.name ?? booking.venueName ?? 'Locale'; const venueType = venue?.type; return <article className="booking-card" key={booking.id} style={{ animationDelay: `${index * 70}ms` }}><div className="booking-badge">{venueType === 'restaurant' ? <Utensils size={22} /> : venueType === 'club' ? <Ticket size={22} /> : <GlassWater size={22} />}</div><div><span className="eyebrow">{venueType ?? 'booking'}</span><h3>{venueName}</h3><p>{booking.date} · {booking.time}<br />{booking.guests}{venue?.address ? ` · ${venue.address}` : ''}{booking.eventTitle ? <><br />{booking.eventTitle}</> : null}</p></div><div style={{ display: 'flex', items: 'center', gap: '8px' }}><span className="status-tag"><Check size={10} /> {booking.status}</span><button className="icon-button" onClick={() => onDeleteBooking(booking.id)} title={t.cancelBooking} aria-label={t.cancelBooking} style={{ color: '#d32f2f' }}><Trash2 size={16} /></button></div></article>; })}</div>
  
  <aside className="side-feature">
    <span className="eyebrow" style={{ color: '#e6a47d' }}>Spotti</span>
    <h2>{t.bookingEditorialTitle}</h2>
    <p>{t.bookingEditorialCopy}</p>
    <button className="primary-button" onClick={onExplore}><Compass size={14} /> {t.exploreTonight}</button>
  </aside>
  
  </div> : <div className="empty-state"><div><div className="empty-icon"><Ticket size={24} /></div><h2>{t.noPlans}</h2><p>{t.noPlansSub}</p><button className="primary-button" onClick={onExplore}><Compass size={14} /> {t.exploreTonight}</button></div></div>}</main>;
}

function RouterContent({ user, venues, events, lang, onSignIn, onSignOut, onChangeLang, bookings, onBooking, onDeleteBooking }: { user: User | null; venues: Venue[]; events: CityEvent[]; lang: Language; onSignIn: () => void; onSignOut: () => void; onChangeLang: () => void; bookings: Booking[]; onBooking: (venue: Venue, event?: CityEvent) => void; onDeleteBooking: (bookingId: string) => void }) {
  const [, setLocation] = useLocation();
  return <AppShell user={user} eventsCount={events.length} lang={lang} onSignIn={onSignIn} onSignOut={onSignOut} onChangeLang={onChangeLang}><Switch><Route path="/"><Explore venues={venues} lang={lang} /></Route><Route path="/events"><EventsPage events={events} venues={venues} lang={lang} onBook={onBooking} /></Route><Route path="/bookings"><BookingsPage bookings={bookings} venues={venues} lang={lang} onExplore={() => setLocation('/')} onDeleteBooking={onDeleteBooking} /></Route><Route><div className="page"><div className="empty-state"><div><div className="empty-icon"><Compass size={24} /></div><h2>Page not found.</h2><Link href="/" className="primary-button">Back to explore</Link></div></div></div></Route></Switch></AppShell>;
}

function authUser(user: FirebaseUser): User {
  return { uid: user.uid, name: user.displayName ?? user.email?.split('@')[0] ?? 'Spotti user', email: user.email ?? '', photoURL: user.photoURL };
}

export default function App() {
  const [lang, setLang] = useState<Language | null>(() => {
    return (localStorage.getItem('spotti_lang') as Language) || null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [catalogErrors, setCatalogErrors] = useState({ venues: '', events: '' });
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<{ venue: Venue; event?: CityEvent } | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ venue: Venue; event?: CityEvent } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => { 
    setToast(message); 
    window.setTimeout(() => setToast(''), 3200); 
  };

  const handleSelectLanguage = (selectedLang: Language) => {
    setLang(selectedLang);
    localStorage.setItem('spotti_lang', selectedLang);
  };

 const handleSignIn = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (err) {
    console.error('Errore durante l\'autenticazione:', err);
  }
};

  const handleCreateBooking = async (booking: Booking) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(firestore, 'bookings'), {
        ...booking,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setBookings((prev) => [...prev, { ...booking, id: docRef.id }]);
      setBookingTarget(null);
      showToast(translations[lang || 'it'].bookingConfirmed);
    } catch (err) {
      console.error('Errore durante il salvataggio della prenotazione:', err);
    }
  };

  const handleStartBooking = (venue: Venue, event?: CityEvent) => {
    if (!user) {
      setPendingBooking({ venue, event });
      setAuthOpen(true);
      return;
    }
    setBookingTarget({ venue, event });
  };

  useEffect(() => onAuthStateChanged(auth, (firebaseUser) => setUser(firebaseUser ? authUser(firebaseUser) : null)), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'venues'), (snapshot) => {
      setVenues(snapshot.docs.map(readVenue).filter((venue): venue is Venue => venue !== null));
      setCatalogErrors((current) => ({ ...current, venues: '' }));
    }, () => setCatalogErrors((current) => ({ ...current, venues: 'Impossibile leggere la collezione venues.' })));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'events'), async (snapshot) => {
      const today = new Date().toISOString().slice(0, 10);
      const activeEvents: CityEvent[] = [];

      for (const item of snapshot.docs) {
        const parsed = readEvent(item);
        if (parsed) {
          if (parsed.date < today) {
            try {
              await deleteDoc(doc(firestore, 'events', item.id));
            } catch (err) {
              console.error('Errore durante l\'eliminazione dell\'evento scaduto:', err);
            }
          } else {
            activeEvents.push(parsed);
          }
        }
      }

      setEvents(activeEvents);
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
        const activeBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        if (!cancelled) setBookings(activeBookings);
      } catch (err) {
        console.error('Errore caricamento prenotazioni:', err);
      }
    };
    loadBookings();
    return () => { cancelled = true; };
  }, [user]);

  if (!lang) {
    return <LanguageSelector onSelect={handleSelectLanguage} />;
  }

  return (
    <>
      <RouterContent
        user={user}
        venues={venues}
        events={events}
        lang={lang}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={() => signOut(auth)}
        onChangeLang={() => setLang(null)}
        bookings={bookings}
        onBooking={handleStartBooking}
        onDeleteBooking={async (id) => {
          try {
            await deleteDoc(doc(firestore, 'bookings', id));
            setBookings((prev) => prev.filter((b) => b.id !== id));
          } catch (err) {
            console.error('Errore durante la cancellazione:', err);
          }
        }}
      />

      {/* MODALE DI AUTENTICAZIONE GOOGLE */}
      {authOpen && (
        <SignInModal
          onClose={() => setAuthOpen(false)}
          onSignIn={handleSignIn}
        />
      )}

      {/* MODALE DI PRENOTAZIONE */}
      {bookingTarget && (
        <BookingModal
          venue={bookingTarget.venue}
          event={bookingTarget.event}
          lang={lang}
          onClose={() => setBookingTarget(null)}
          onBooked={handleCreateBooking}
        />
      )}

      {/* TOAST NOTIFICA PRENOTAZIONE */}
      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#2b7468', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}
    </>
  );
}