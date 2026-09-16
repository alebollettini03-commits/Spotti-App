import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Globe, 
  Trash2, 
  Compass, 
  Ticket, 
  CheckCircle2, 
  GlassWater, 
  Map as MapIcon, 
  Utensils, 
  Beer, 
  Sparkles,
  Plus,
  Minus
} from 'lucide-react';

// --- LOGO ANIMATO "S" DI SPOTTI ---
const SpottiLogo = () => (
  <div className="relative flex items-center justify-center w-10 h-10 bg-[#1e4d40] rounded-xl overflow-hidden shadow-md group cursor-pointer">
    <style>{`
      @keyframes logoPulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.08); opacity: 1; }
      }
      @keyframes dashRotate {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 24; }
      }
      .animate-s-path {
        stroke-dasharray: 6, 3;
        animation: dashRotate 2s linear infinite;
      }
      .animate-logo-container {
        animation: logoPulse 3s ease-in-out infinite;
      }
    `}</style>
    <svg 
      viewBox="0 0 100 100" 
      className="w-7 h-7 animate-logo-container transition-transform duration-300 group-hover:scale-110"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="42" stroke="#22c55e" strokeWidth="4" strokeOpacity="0.2" />
      <path 
        d="M 68 32 C 68 22, 32 22, 32 40 C 32 60, 68 40, 68 62 C 68 78, 32 78, 32 68" 
        stroke="#22c55e" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M 68 32 C 68 22, 32 22, 32 40 C 32 60, 68 40, 68 62 C 68 78, 32 78, 32 68" 
        stroke="#ffffff" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="animate-s-path"
      />
      <circle cx="68" cy="32" r="3" fill="#ffffff" />
      <circle cx="32" cy="68" r="3" fill="#22c55e" />
    </svg>
  </div>
);

// --- TIPO DATI & DIZIONARIO MULTILINGUA ---
type Language = 'IT' | 'EN';

const translations = {
  IT: {
    brandName: "Spotti",
    navEsplora: "Esplora",
    navEventi: "Eventi",
    navPrenotazioni: "Prenotazioni",
    searchPlaceholder: "Cerca un locale o indirizzo",
    filterAll: "Tutti i locali",
    filterBar: "Bar",
    filterRest: "Ristoranti",
    filterClub: "Club",
    eventsTitle: "La città prende vita.",
    eventsSubtitle: "Eventi e appuntamenti da non perdere in città.",
    eventsBadge: "Eventi SPOTT-AT-I",
    eventsBoxTitle: "Vivi la serata giusta.",
    eventsBoxDesc: "Scegli il tavolo o la pista da ballo perfetta per la tua serata.",
    bookingsTitle: "Le tue prenotazioni.",
    bookingsSubtitle: "Tutti i tuoi tavoli e appuntamenti confermati.",
    bookingsBadge: "SPOTTI-tuoi",
    bookingsBoxTitle: "Ti aspettiamo!",
    bookingsBoxDesc: "Il miglior evento della città, a portata di un click",
    exploraStasera: "Esplora stasera",
    localiConnessi: "LOCALI CONNESSI",
    eventiDisponibili: "EVENTI DISPONIBILI",
    confirmed: "CONFERMATO",
    today: "Oggi",
    mapView: "Mappa",
    guests: "ospiti"
  },
  EN: {
    brandName: "Spotti",
    navEsplora: "Explore",
    navEventi: "Events",
    navPrenotazioni: "Bookings",
    searchPlaceholder: "Search venue or address",
    filterAll: "All venues",
    filterBar: "Bars",
    filterRest: "Restaurants",
    filterClub: "Clubs",
    eventsTitle: "The city comes alive.",
    eventsSubtitle: "Events and appointments not to be missed in town.",
    eventsBadge: "SPOTTED Events",
    eventsBoxTitle: "Live the right night.",
    eventsBoxDesc: "Choose the perfect table or dance floor for your evening.",
    bookingsTitle: "Your bookings.",
    bookingsSubtitle: "All your confirmed tables and appointments.",
    bookingsBadge: "YOUR-Spotti",
    bookingsBoxTitle: "We are waiting for you!",
    bookingsBoxDesc: "The best event in town, just a click away",
    exploraStasera: "Explore tonight",
    localiConnessi: "CONNECTED VENUES",
    eventiDisponibili: "AVAILABLE EVENTS",
    confirmed: "CONFIRMED",
    today: "Today",
    mapView: "Map",
    guests: "guests"
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'esplora' | 'eventi' | 'prenotazioni'>('esplora');
  const [lang, setLang] = useState<Language>('IT');
  const [filter, setFilter] = useState('all');

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-gray-800 font-sans flex flex-col">
      
      {/* NAVBAR SUPERIORE */}
      <header className="bg-[#f7f5f0] border-b border-gray-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SpottiLogo />
          <span className="text-2xl font-bold tracking-tight text-gray-900 font-serif">
            {t.brandName}
          </span>
        </div>

        {/* TAB NAVIGAZIONE */}
        <nav className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('esplora')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'esplora' ? 'bg-[#1e4d40] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            {t.navEsplora}
          </button>

          <button 
            onClick={() => setActiveTab('eventi')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === 'eventi' ? 'bg-[#1e4d40] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t.navEventi}
            <span className="bg-orange-600 text-white text-xs px-1.5 py-0.2 rounded-full font-bold ml-1">
              1
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('prenotazioni')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'prenotazioni' ? 'bg-[#1e4d40] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            {t.navPrenotazioni}
          </button>
        </nav>

        {/* SELETTORE LINGUA E PROFILO */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(lang === 'IT' ? 'EN' : 'IT')}
            className="p-2.5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Cambia Lingua"
          >
            <Globe className="w-4 h-4 text-gray-700" />
            <span className="ml-1 text-xs font-semibold">{lang}</span>
          </button>

          <div className="flex items-center gap-2 bg-gray-900 text-white pl-1.5 pr-4 py-1.5 rounded-full shadow-sm">
            <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-sm font-medium">Alessandro Bollettini</span>
          </div>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* VISTA: ESPLORA (MAPPA) */}
        {activeTab === 'esplora' && (
          <div className="relative w-full h-[calc(100vh-65px)] bg-[#e5e3df]">
            {/* Sfondo Mappa Simulato */}
            <div className="absolute inset-0 bg-cover bg-center opacity-80" 
                 style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=Teramo,Italy&zoom=14&size=1200x800&sensor=false')` }}>
            </div>

            {/* BARRA DI RICERCA */}
            <div className="absolute top-6 left-6 z-10 w-96 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-2 border border-white/50 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 ml-2" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* BADGE TERAMO IN ALTO A DESTRA */}
            <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-white/50 flex items-center gap-2 text-xs font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Teramo</span>
            </div>

            {/* FILTRI DI CATEGORIA */}
            <div className="absolute top-22 left-6 z-10 flex flex-col gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  filter === 'all' ? 'bg-[#1e4d40] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t.filterAll}
              </button>
              <button 
                onClick={() => setFilter('bar')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  filter === 'bar' ? 'bg-[#1e4d40] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Beer className="w-4 h-4" />
                {t.filterBar}
              </button>
              <button 
                onClick={() => setFilter('rest')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  filter === 'rest' ? 'bg-[#1e4d40] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Utensils className="w-4 h-4" />
                {t.filterRest}
              </button>
              <button 
                onClick={() => setFilter('club')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  filter === 'club' ? 'bg-[#1e4d40] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GlassWater className="w-4 h-4" />
                {t.filterClub}
              </button>
            </div>

            {/* CONTROLLI ZOOM MAPPA */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <button className="p-2.5 hover:bg-gray-50 border-b border-gray-100 text-gray-600"><Plus className="w-4 h-4" /></button>
              <button className="p-2.5 hover:bg-gray-50 text-gray-600"><Minus className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* VISTA: EVENTI */}
        {activeTab === 'eventi' && (
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">{t.eventsTitle}</h1>
                <p className="text-gray-500 text-sm">{t.eventsSubtitle}</p>
              </div>

              <div className="flex items-center gap-2 bg-gray-200/60 p-1 rounded-xl text-xs font-medium">
                <button className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-gray-800">{t.today}</button>
                <button className="px-3 py-1.5 text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <MapIcon className="w-3.5 h-3.5" />
                  {t.mapView}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LISTA EVENTI */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-6">
                  <div className="bg-[#1e4d40] text-white p-4 rounded-xl text-center min-w-[70px]">
                    <span className="block text-xl font-bold">18</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold">DOM · OTT</span>
                  </div>
                  <div className="flex-1">
                    <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">BAR</span>
                    <h3 className="font-bold text-gray-900 text-base">All you can drink</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Caffè dell'Arco · 20:30 · Circonvallazione Spalato, n° 71, 64100 Teramo TE</p>
                  </div>
                  <button className="bg-[#1e4d40] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#16382f] transition-colors">
                    Dettagli
                  </button>
                </div>
              </div>

              {/* CARD NERA EVENTI */}
              <div className="bg-[#1a1c23] text-white rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
                <div>
                  <span className="text-orange-500 font-bold text-xs tracking-wider uppercase">
                    {t.eventsBadge}
                  </span>
                  <h2 className="text-2xl font-serif font-bold mt-3 mb-2">{t.eventsBoxTitle}</h2>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{t.eventsBoxDesc}</p>
                </div>

                <div className="flex gap-8 mt-6 pt-6 border-t border-gray-800">
                  <div>
                    <span className="text-xl font-bold">2</span>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">{t.localiConnessi}</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold">1</span>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">{t.eventiDisponibili}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA: PRENOTAZIONI */}
        {activeTab === 'prenotazioni' && (
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="mb-8">
              <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">{t.bookingsTitle}</h1>
              <p className="text-gray-500 text-sm">{t.bookingsSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* CARD PRENOTAZIONE CONFERMATA */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/70 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <GlassWater className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">BAR</span>
                    <h3 className="text-lg font-bold text-gray-900">Caffè dell'Arco</h3>
                    <p className="text-xs text-gray-500 mt-1">2026-10-18 · 20:30</p>
                    <p className="text-xs text-gray-400">2 {t.guests} · Circonvallazione Spalato, n° 71, 64100 Teramo TE</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">All you can drink</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.confirmed}
                  </span>
                  <button className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD NERA PRENOTAZIONI AGGIORNATA */}
              <div className="bg-[#1a1c23] text-white rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
                <div>
                  <span className="text-orange-500 font-bold text-xs tracking-wider uppercase">
                    {t.bookingsBadge}
                  </span>
                  <h2 className="text-2xl font-serif font-bold mt-3 mb-2">{t.bookingsBoxTitle}</h2>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{t.bookingsBoxDesc}</p>
                </div>

                <button 
                  onClick={() => setActiveTab('esplora')}
                  className="bg-[#22c55e] hover:bg-[#1eb053] text-gray-950 font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 self-start transition-colors mt-6 shadow-md"
                >
                  <Compass className="w-4 h-4" />
                  {t.exploraStasera}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}