import { motion, AnimatePresence, useScroll, useTransform, useTime } from 'motion/react';
import { Camera, Play, ChevronRight, Menu, X, Rocket, Moon } from 'lucide-react';
import { useState, useEffect, useRef, FC } from 'react';
import { auth, signInWithGoogle, signOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// --- Components ---

// --- 3D Orbiting Planet Frames ---

const StarField: FC<{ count?: number }> = ({ count = 250 }) => {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number; driftX: number; driftY: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.3,
      duration: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 80,
      driftY: (Math.random() - 0.5) * 80,
    }));
    setStars(newStars);
  }, [count]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          animate={{
            opacity: [0, 1, 0.3, 1, 0.2, 0.8, 0],
            scale: [0.8, 1.2, 0.9, 1.1, 0.8],
            x: [0, star.driftX],
            y: [0, star.driftY],
          }}
          transition={{
            duration: star.duration * 1.5,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: 'white',
            borderRadius: '50%',
            boxShadow: star.size > 1 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.4)` : 'none',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};

const ORBIT_IMAGES = [
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=500',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500',
  'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=500',
];

const OrbitingFrame: FC<{ index: number; total: number; img: string }> = ({ index, total, img }) => {
  const time = useTime();
  
  // Continuous 360 degree rotation
  const angle = useTransform(time, t => (t / 6000) + (index * (2 * Math.PI / total)));
  
  // Responsive Orbit Radius
  const radiusX = typeof window !== 'undefined' ? (window.innerWidth > 768 ? 420 : 140) : 420;
  const radiusZ = window.innerWidth > 768 ? 150 : 80; // Depth of the orbit
  
  const x = useTransform(angle, a => Math.sin(a) * radiusX);
  const z = useTransform(angle, a => Math.cos(a) * radiusZ);
  const y = useTransform(angle, a => Math.sin(a * 1.5) * 15); // Subtle vertical waving
  
  // Depth-based visual adjustments
  const scale = useTransform(z, [-150, 150], [0.45, 1.15]);
  const opacity = useTransform(z, [-150, 150], [0.25, 1]);
  const zIndex = useTransform(z, latest => (latest > 0 ? 40 : 10));

  return (
    <motion.div
      style={{
        position: 'absolute',
        x,
        y,
        z,
        zIndex,
        scale,
        opacity,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      } as any}
      className="w-16 h-16 md:w-44 md:h-44 group cursor-pointer pointer-events-auto"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Planet Atmosphere / Glow */}
        <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-700" />
        
        {/* The "Planet" Frame */}
        <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-700 group-hover:scale-105 group-hover:border-white/30">
          <img 
            src={img} 
            className="w-full h-full object-cover rounded-full transition-all duration-1000 grayscale-[0.5] group-hover:grayscale-0 group-hover:rotate-6" 
            alt="Orbiting project" 
          />
          {/* Cinematic reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* Orbit Ring Light Streak (Decorative) */}
        <div className="absolute -inset-4 border border-white/5 rounded-full pointer-events-none group-hover:border-orange-500/20 transition-colors duration-700" />
      </div>
    </motion.div>
  );
};

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Films', href: '#films' },
    { name: 'Events', href: '#events' },
    { name: 'About Us', href: '#about' },
    { name: 'Our Backyard', href: '#backyard' },
    { name: 'Contact Us', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/40 backdrop-blur-xl py-4' : 'bg-transparent py-10'}`}>
      <div className="max-w-[1920px] mx-auto px-10 md:px-24 lg:px-40 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <span className="text-4xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
          <span className="text-xl font-bold tracking-[0.2em] text-white hidden sm:block">DREAMCATCHERS</span>
        </motion.div>

        <div className="hidden lg:flex items-center gap-14">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${link.name === 'Home' ? 'text-orange-500' : 'text-white/70 hover:text-orange-400'}`}
            >
              {link.name}
            </a>
          ))}
        </div>

        <button className="lg:hidden text-white p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 w-full bg-zinc-950 p-10 border-b border-white/10 lg:hidden shadow-2xl"
        >
          <div className="flex justify-between items-center mb-12">
            <span className="text-lg font-bold tracking-widest">DREAMCATCHERS</span>
            <button onClick={() => setIsMenuOpen(false)}><X /></button>
          </div>
          <div className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-bold uppercase tracking-widest text-white/60 hover:text-orange-500 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function Hero() {
  const titles = [
    { line1: "VISUAL", line2: "POETRY" },
    { line1: "CINEMATIC", line2: "WIZARDRY" },
    { line1: "DIGITAL", line2: "RENAISSANCE" },
    { line1: "CREATIVE", line2: "EUPHORIA" },
    { line1: "TIMELESS", line2: "CHRONICLES" },
  ];

  const [index, setIndex] = useState(0);
  const { scrollY } = useScroll();
  
  // Fade content as next sections overlap
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [titles.length]);

  return (
    <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden pointer-events-none">
      <motion.div 
        style={{ 
          opacity,
          y: useTransform(scrollY, [0, 500], [0, -100]) 
        }}
        className="relative z-20 h-full flex flex-col justify-center items-center text-center px-12 md:px-32 lg:px-56 pointer-events-auto"
      >
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white/80 text-[10px] sm:text-xs uppercase tracking-[0.5em] mb-8"
        >
          Creators + Films + Live Events
        </motion.p>
        
        <div className="relative h-[12rem] md:h-[13rem] flex flex-col justify-center items-center overflow-hidden mb-12 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="absolute flex flex-col items-center"
            >
              <h1 className="text-5xl md:text-[6.5rem] font-black text-white tracking-tighter leading-none whitespace-nowrap">
                {titles[index].line1}
              </h1>
              <h1 className="text-5xl md:text-[6.5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-orange-500 tracking-tighter leading-none whitespace-nowrap">
                {titles[index].line2}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-8"
        >
          <button className="group flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-full hover:scale-105 transition-all shadow-xl">
            <Play size={14} className="fill-current" />
            Play Showreel
          </button>
          <button className="px-10 py-5 border border-white/20 text-white font-black uppercase tracking-[0.2em] text-xs rounded-full hover:border-orange-500/50 hover:bg-white/5 transition-all">
            Contact Us
          </button>
        </motion.div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce">
           <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

const FILMS = [
  { id: '1', title: 'Boat x Netflix Stream Edition', category: 'Branded Commercials', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2070' },
  { id: '2', title: 'Marvel x Guardians of the Galaxy', category: 'OTT', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070' },
  { id: '3', title: 'Netflix Dhamaka Mood Promo', category: 'OTT', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070' },
  { id: '4', title: 'Coke Studio Global | Afroto | 7ALA', category: 'Music Video', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4a8a?auto=format&fit=crop&q=80&w=2069' },
  { id: '5', title: 'Directors Cut | Green Vibes Festival', category: 'Unscripted', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071' },
  { id: '6', title: 'Bumble x Kindness is sexy ft. ARK', category: 'Branded Commercials', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2070' },
];

const CLIENTS = [
  { name: 'NETFLIX', color: '#E50914', size: 'large' },
  { name: "D'DECOR", color: '#FFFFFF', size: 'medium' },
  { name: 'amazon prime', color: '#FFFFFF', size: 'large' },
  { name: 'Disney+ hotstar', color: '#FFFFFF', size: 'small' },
  { name: 'asics', color: '#FFFFFF', size: 'medium' },
  { name: "L'ORÉAL", color: '#FFFFFF', size: 'medium' },
  { name: 'Pernod Ricard', color: '#FFFFFF', size: 'small' },
  { name: 'YouTube', color: '#FFFFFF', size: 'small' },
  { name: 'JAMESON', color: '#FFFFFF', size: 'medium' },
  { name: 'ASUS', color: '#FFFFFF', size: 'medium' },
  { name: 'LIONSGATE PLAY', color: '#FFFFFF', size: 'medium' },
  { name: 'MARVEL STUDIOS', color: '#ED1D24', size: 'medium' },
  { name: 'ABSOLUT.', color: '#FFFFFF', size: 'medium' },
  { name: 'Coke STUDIO', color: '#FE001A', size: 'medium' },
  { name: 'SKECHERS', color: '#FFFFFF', size: 'small' },
  { name: 'Bumble', color: '#FFC629', size: 'small' },
  { name: 'Mi', color: '#FF6700', size: 'small' },
  { name: 'Signature', color: '#FFFFFF', size: 'medium' },
  { name: 'IndiGo', color: '#FFFFFF', size: 'small' },
  { name: 'Top Ramen', color: '#FF0000', size: 'small' },
  { name: 'Boost', color: '#FFFFFF', size: 'small' },
  { name: 'Myntra', color: '#FFFFFF', size: 'small' },
  { name: 'boat', color: '#FFFFFF', size: 'small' },
  { name: 'TOSHIBA', color: '#FFFFFF', size: 'medium' },
  { name: 'LAKMÉ', color: '#FFFFFF', size: 'small' },
  { name: 'BRITANNIA', color: '#ED1D24', size: 'small' },
  { name: 'Vedanta', color: '#FFFFFF', size: 'small' },
  { name: 'Tecno', color: '#FFFFFF', size: 'small' },
  { name: 'Star Sports', color: '#FFFFFF', size: 'small' },
  { name: 'Sony', color: '#FFFFFF', size: 'small' },
  { name: 'NPCL', color: '#FFFFFF', size: 'small' },
  { name: 'NDTV', color: '#FFFFFF', size: 'small' },
  { name: 'KPMG', color: '#FFFFFF', size: 'small' },
  { name: 'FIFA', color: '#FFFFFF', size: 'small' },
  { name: 'Adani', color: '#FFFFFF', size: 'small' },
  { name: 'Zee', color: '#FFFFFF', size: 'small' },
  { name: 'Vivo', color: '#FFFFFF', size: 'small' },
  { name: 'Swachh Bharat', color: '#FFFFFF', size: 'small' },
  { name: 'Pearl Academy', color: '#FFFFFF', size: 'small' },
  { name: 'Larsen & Toubro', color: '#FFFFFF', size: 'small' },
  { name: 'Indian Air Force', color: '#FFFFFF', size: 'small' },
  { name: 'Indian Army', color: '#FFFFFF', size: 'small' },
  { name: 'Jakson', color: '#FFFFFF', size: 'small' },
  { name: 'Seven', color: '#FFFFFF', size: 'small' },
  { name: 'Gujarat Tourism', color: '#FFFFFF', size: 'small' },
  { name: 'Food Food', color: '#FFFFFF', size: 'small' },
  { name: 'Experion', color: '#FFFFFF', size: 'small' },
  { name: 'Discovery', color: '#FFFFFF', size: 'small' },
  { name: 'Cairn', color: '#FFFFFF', size: 'small' },
  { name: 'DLF', color: '#FFFFFF', size: 'small' },
  { name: 'Denso', color: '#FFFFFF', size: 'small' },
  { name: 'Balaji Wafers', color: '#FFFFFF', size: 'small' },
  { name: 'GMR', color: '#FFFFFF', size: 'small' },
  { name: 'Land Ports Authority', color: '#FFFFFF', size: 'small' },
  { name: 'FIH', color: '#FFFFFF', size: 'small' },
  { name: 'The Leela', color: '#FFFFFF', size: 'small' },
];

function Clients() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <section 
      id="clients" 
      className="py-20 md:py-24 bg-transparent overflow-hidden relative" 
      ref={containerRef}
    >
      <div className="max-w-[1600px] mx-auto px-0 flex flex-col items-start relative z-20">
        <div className="text-left mb-16 md:mb-20">
            <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-orange-500 uppercase italic mb-6"
          >
            Our Clients
          </motion.h3>
        </div>

        {/* Scrolling Marquees */}
        <div className="w-full space-y-12">
          {/* Top Row - Scrolling Left */}
          <div className="flex overflow-hidden group">
            <motion.div 
              animate={{ x: [0, -1920] }}
              transition={{ 
                duration: 40, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex whitespace-nowrap gap-12 py-4"
            >
              {[...CLIENTS, ...CLIENTS].map((client, i) => (
                <ClientLogo key={`${client.name}-r1-${i}`} client={client} />
              ))}
            </motion.div>
          </div>

          {/* Bottom Row - Scrolling Right */}
          <div className="flex overflow-hidden group">
            <motion.div 
              animate={{ x: [-1920, 0] }}
              transition={{ 
                duration: 50, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex whitespace-nowrap gap-12 py-4"
            >
              {[...CLIENTS.slice().reverse(), ...CLIENTS].map((client, i) => (
                <ClientLogo key={`${client.name}-r2-${i}`} client={client} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ClientLogoProps {
  client: typeof CLIENTS[0];
}

const ClientLogo: FC<ClientLogoProps> = ({ client }) => {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900/30 backdrop-blur-sm rounded-full border border-white/5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-default group">
      <div 
        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-1 ring-white/10" 
        style={{ 
          backgroundColor: client.color,
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)`
        }}
      >
        {client.name.substring(0, 1).toUpperCase()}
      </div>
      <span className="text-2xl md:text-3xl font-bold text-zinc-400 tracking-tight transition-colors group-hover:text-white">
        {client.name}
      </span>
    </div>
  );
}

function Portfolio() {
  const [activeTab, setActiveTab] = useState('All');
  const categories = ['All', 'OTT', 'Branded Commercials', 'Music Video', 'Unscripted'];

  const filteredFilms = activeTab === 'All' 
    ? FILMS 
    : FILMS.filter(f => f.category === activeTab);

  return (
    <section id="films" className="py-20 md:py-24">
      <div className="max-w-[1600px] mx-auto px-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="relative">
              <motion.h3 
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-6xl font-[1000] text-orange-500 tracking-[-0.05em] uppercase italic leading-none drop-shadow-[0_0_60px_rgba(249,115,22,0.2)] pointer-events-none select-none text-left pr-4"
              >
                Films
              </motion.h3>
          </div>
          <div className="flex flex-wrap gap-2 pb-1 lg:justify-end">
            {categories.map((cat, i) => (
              <motion.button 
                key={cat} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveTab(cat)}
                className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 border-2 ${
                  activeTab === cat 
                  ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
                  : 'bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
          {filteredFilms.map((film, idx) => (
            <motion.div 
              key={film.id}
              initial={{ opacity: 0, y: 100, scale: 0.6, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: (idx % 3) * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: false, margin: "-100px" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative aspect-video overflow-hidden rounded-[2rem] cursor-pointer bg-zinc-900/40 backdrop-blur-sm border border-white/5 shadow-xl"
            >
              <img 
                src={film.img} 
                alt={film.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-30 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80 group-hover:opacity-50 transition-opacity duration-700" />
              
              <div className="absolute inset-x-0 bottom-0 p-8 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-[1.5px] bg-orange-500 hidden group-hover:block transition-all" />
                    <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">
                      {film.category}
                    </span>
                  </div>
                  <h4 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic leading-[1.1]">
                    {film.title}
                  </h4>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-700 border border-white/10">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center transition-transform hover:scale-110">
                  <Play className="w-5 h-5 fill-current translate-x-1" />
                </div>
              </div>

              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-75">
                 <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InteractiveOptions() {
  const options = [
    { name: 'FILMS', id: 'films' },
    { name: 'EVENTS', id: 'events' },
    { name: 'CONTACT US', id: 'contact' },
  ];

  return (
    <section className="bg-transparent border-t border-white/5">
      <div className="flex flex-col">
        {options.map((option) => (
          <motion.div
            key={option.name}
            initial="initial"
            whileHover="hover"
            onClick={() => {
              const el = document.getElementById(option.id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative h-40 md:h-56 flex items-center justify-center cursor-pointer overflow-hidden border-b border-white/10 last:border-b-0"
          >
            {/* Sliding Background */}
            <motion.div
              variants={{
                initial: { x: "-100%" },
                hover: { x: "0%" }
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400"
            />

            {/* Static Content */}
            <div className="relative z-10 flex flex-col items-center">
              <motion.h2
                variants={{
                  initial: { scale: 1, color: "#fff" },
                  hover: { scale: 1.1, color: "#000" }
                }}
                transition={{ duration: 0.4 }}
                className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none"
              >
                {option.name}
              </motion.h2>
              
              <motion.div
                variants={{
                  initial: { opacity: 0, y: 10 },
                  hover: { opacity: 1, y: 0 }
                }}
                className="flex items-center gap-2 mt-4"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/60">Explore more</span>
                <ChevronRight size={14} className="text-black/60" />
              </motion.div>
            </div>

            {/* Decorative Icon */}
            <motion.div
              variants={{
                initial: { opacity: 0, scale: 0, rotate: -45 },
                hover: { opacity: 0.1, scale: 1, rotate: 0 }
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2"
            >
               <Rocket size={120} className="text-black" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <footer className="py-12 bg-zinc-950/20 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-[1800px] mx-auto px-20 md:px-48 lg:px-56">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
              <span className="text-3xl font-black tracking-tighter text-white uppercase italic">Dreamcatchers</span>
            </div>
            <p className="text-white/40 leading-relaxed max-w-md text-sm font-medium tracking-tight">
              A high-end creative studio for brands, agencies & OTT platforms to increase visibility through advertising, films, and creative adaptations.
            </p>
          </div>
          
          <div id="contact">
            <h5 className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Inquiries</h5>
            <div className="space-y-6">
              <a href="mailto:hello@dreamcatchers.com" className="block text-xl font-bold text-white hover:text-orange-400 transition-all tracking-tight">hello@dreamcatchers.com</a>
              <p className="text-white/30 text-sm italic">Lower Parel, Mumbai, India</p>
              
              <div className="pt-6 border-t border-white/5">
                {user ? (
                  <div className="flex items-center gap-4">
                    <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                    <div>
                      <p className="text-white text-xs font-bold">{user.displayName}</p>
                      <button onClick={() => signOut()} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">Logout</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => signInWithGoogle()}
                    className="group flex items-center gap-3 text-white hover:text-orange-500 transition-all"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Sign In</span>
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-orange-500 transition-colors">
                      <ChevronRight size={14} />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div id="backyard">
            <h5 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10">Social</h5>
            <div className="flex flex-wrap gap-6">
              {['Instagram', 'Vimeo', 'LinkedIn'].map(link => (
                <a key={link} href="#" className="text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">{link}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-16 border-t border-white/5">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">© 2026 Dreamcatchers Production.</p>
          <div className="flex gap-12">
            <a href="#" className="text-white/10 hover:text-white text-[10px] uppercase tracking-widest transition-all font-bold">Privacy</a>
            <a href="#" className="text-white/10 hover:text-white text-[10px] uppercase tracking-widest transition-all font-bold">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Intro() {
  const lineVariants = {
    hidden: { y: "150%", rotate: 2, opacity: 0 },
    visible: {
      y: 0,
      rotate: 0,
      opacity: 1,
      transition: { 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="py-20 md:py-24 overflow-hidden">
      <div className="w-full px-20 md:px-56">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          className="flex flex-col lg:flex-row justify-between items-center mb-16"
        >
          <div className="flex-1 w-full">
            <div className="overflow-hidden mb-2">
              <motion.h2 variants={lineVariants} className="text-2xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                Dreamcatchers is a
              </motion.h2>
            </div>
            <div className="overflow-hidden flex items-center gap-6 flex-wrap mb-2">
              <motion.div 
                variants={lineVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 md:w-36 h-9 md:h-24 rounded-full bg-zinc-800 overflow-hidden shadow-2xl border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.div>
              <motion.h2 variants={lineVariants} className="text-2xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                Creative Studio That
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.h2 variants={lineVariants} className="text-2xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                Helps Brands With
              </motion.h2>
            </div>
          </div>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="flex justify-end lg:block w-full lg:w-auto mt-12 lg:mt-0"
          >
            <motion.button 
              variants={{
                hidden: { opacity: 0, scale: 0.5, rotate: -20 },
                visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", damping: 12 } }
              }}
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: "#f97316",
                color: "#fff"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('films')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-24 h-24 md:w-36 md:h-36 rounded-full border-2 border-white/10 flex items-center justify-center shrink-0 group relative z-10 transition-colors duration-500 overflow-hidden"
            >
              <ChevronRight className="w-12 h-12 md:w-20 md:h-20 transition-transform duration-500 group-hover:translate-x-2" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-orange-500/40 rounded-full"
              />
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: false }}
          className="flex flex-col md:flex-row md:justify-between items-center gap-8 mb-16"
        >
          <p className="text-xl md:text-xl font-black text-white/90 tracking-tighter flex items-center flex-wrap justify-center md:justify-start gap-x-10 gap-y-8 uppercase italic">
            <motion.span whileHover={{ y: -5 }} className="flex items-center gap-3">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block w-12 h-7 rounded-full bg-orange-500/20 overflow-hidden border border-orange-500/30"
              >
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              advertising,
            </motion.span>
            <motion.span whileHover={{ y: -5 }} className="flex items-center gap-3">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="inline-block w-12 h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              films,
            </motion.span>
            <motion.span whileHover={{ y: -5 }} className="flex items-center gap-3">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block w-12 h-7 rounded-full bg-orange-500 overflow-hidden shadow-lg shadow-orange-500/20"
              >
                <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              events,
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.2, rotate: 5 }}
              className="inline-block w-16 h-8 rounded-full bg-zinc-800 overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
            </motion.span>
            and <span className="flex items-center gap-3 text-orange-500 underline decoration-white/20 underline-offset-8">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -3 }}
                className="inline-block w-12 h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              Documentaries.
            </span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center pt-16 pb-12 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            className="group relative flex flex-col items-center justify-center h-[400px] md:h-[700px] bg-transparent transition-all duration-700"
            style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
          >
             {/* Background Atmosphere */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-orange-600/5 blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
 
             {/* 3D Scene Container */}
             <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                
                {/* Centered DC Text with Sun Glow */}
                <div className="relative z-20 text-center flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                    {/* Sun Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-orange-500/20 blur-[100px] rounded-full group-hover:bg-orange-500/30 transition-all duration-1000" />
                    
                    <motion.span 
                      className="text-[8rem] md:text-[18rem] font-black italic tracking-tighter text-white/5 transition-all duration-700 group-hover:text-orange-500 group-hover:drop-shadow-[0_0_80px_rgba(249,115,22,0.5)] cursor-default select-none block leading-none relative z-20"
                      whileHover={{ scale: 1.02 }}
                    >
                      DC
                    </motion.span>
                </div>

                {/* Orbiting Planets - Now in the same container for unified stacking context */}
                {ORBIT_IMAGES.map((img, i) => (
                  <OrbitingFrame key={i} index={i} total={ORBIT_IMAGES.length} img={img} />
                ))}
             </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="space-y-12"
          >
             <motion.div variants={itemVariants} className="flex items-center gap-6 group/dc">
                <motion.span 
                  whileHover={{ scale: 1.2, rotate: -5 }}
                  className="text-2xl font-black italic tracking-tighter text-orange-500 leading-none cursor-default drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                  DC
                </motion.span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/50 via-white/10 to-transparent" />
             </motion.div>
             
             <div className="overflow-hidden">
               <motion.p 
                 variants={{
                   hidden: { opacity: 0 },
                   visible: { 
                     opacity: 1,
                     transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                   }
                 }}
                 className="text-3xl md:text-4xl text-orange-500 font-black leading-[1] tracking-tight uppercase italic flex flex-wrap"
               >
                 {"DC, as we love to call it, started producing daily chat shows, weekly travel shows and standalone documentaries.".split(" ").map((word, i) => (
                   <motion.span
                     key={i}
                     variants={{
                       hidden: { opacity: 0, y: 40, rotateX: -90 },
                       visible: { 
                         opacity: 1, 
                         y: 0, 
                         rotateX: 0,
                         transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                       }
                     }}
                     whileHover={{ scale: 1.2, color: "#fff", rotate: i % 2 === 0 ? 5 : -5 }}
                     className="inline-block mr-[0.25em] origin-top cursor-default transition-colors duration-200"
                   >
                     {word}
                   </motion.span>
                 ))}
               </motion.p>
             </div>

             <motion.p 
               variants={{
                 hidden: { opacity: 0, x: -20 },
                 visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.8 } }
               }}
               className="text-lg md:text-xl text-orange-500/60 leading-relaxed max-w-2xl font-medium border-l-2 border-orange-500/20 pl-10"
             >
               As more clients showed faith in us, our tribe grew, and here we are today! We&apos;re a happy bunch of people pushing the creative envelope.
             </motion.p>
             <motion.button 
               variants={itemVariants}
               whileHover={{ x: 10, backgroundColor: "#f97316", color: "#fff" }}
               className="group flex items-center gap-6 px-12 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-full transition-all shadow-2xl"
             >
               Explore Our Story
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const { scrollY } = useScroll();
  const starOpacity = useTransform(scrollY, [100, 700], [0, 1]);
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-orange-500 selection:text-white">
      {/* Global Transitioned Fixed Background Layer */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        
        {/* Layer 1: The Hero Cinematic Image (Stays fixed, fades slowly) */}
        <motion.div 
          style={{ opacity: heroImgOpacity }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071" 
            alt="Cinematic Background" 
            className="w-full h-full object-cover"
          />
          {/* Transition overlays */}
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black via-black/10 to-transparent" />
        </motion.div>

        {/* Layer 2: Main Starry Background Image (Fades in as you scroll) */}
        <motion.div 
          style={{ opacity: starOpacity }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&q=80&w=2070" 
            alt="Global Stars" 
            className="w-full h-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-black/70" />
        </motion.div>

        {/* Global Animated Star Field */}
        <motion.div style={{ opacity: starOpacity }} className="absolute inset-0">
          <StarField count={250} />
        </motion.div>

        {/* Ambient Atmosphere */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/5 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-900/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />
      <main className="relative">
        <Hero />
        <div className="h-screen pointer-events-none" /> {/* Spacer for fixed hero */}
        
        <div className="relative z-10">
          <Intro />
          <Portfolio />
          <Clients />
          <section id="about" className="py-20 md:py-24">
            <div className="w-full px-20 md:px-56">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="relative group max-w-md mx-auto lg:mx-0">
                  <div className="aspect-[4/5] overflow-hidden rounded-[3rem] border border-white/10">
                    <img src="https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072" alt="Behind the scenes" className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-orange-500 rounded-full p-8 hidden md:flex flex-col items-center justify-center text-center shadow-2xl rotate-12" style={{ transform: 'rotate(12deg)' }}>
                    <span className="text-5xl font-black text-white italic">14+</span>
                    <p className="text-white/90 text-[9px] font-black uppercase tracking-widest mt-2">Years on Set</p>
                  </div>
                </div>
                <div>
                  <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Our Story</span>
                  <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-10 uppercase italic">Crafting <br />Legends</h3>
                  <p className="text-white/50 leading-relaxed mb-12 text-base font-medium tracking-tight">
                    Dreamcatchers is a new age creative studio specializing in visual storytelling that moves people. We don't just shoot films; we engineer experiences that bridge the gap between imagination and reality.
                  </p>
                  <button className="flex items-center gap-4 text-white font-black uppercase tracking-[0.3em] text-xs group">
                    Find more about us 
                    <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center group-hover:border-orange-500 group-hover:bg-orange-500 transition-all">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>
          <InteractiveOptions />
        </div>
      </main>
      <Footer />
    </div>
  );
}
