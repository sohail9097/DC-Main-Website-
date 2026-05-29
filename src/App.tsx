import { motion, AnimatePresence, useScroll, useTransform, useTime } from 'motion/react';
import { Camera, Play, ChevronLeft, ChevronRight, Menu, X, Rocket, Moon, ShieldCheck, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, useEffect, useRef, FC } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import FilmsPage from './pages/FilmsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { initSiteSync } from './lib/siteSync';

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

export const DEFAULT_ORBIT_IMAGES = [
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

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', path: '/' },
    { name: 'Films', to: '/films', path: '/films' },
    { name: 'About Us', to: '/about', path: '/about' },
    { name: 'Contact Us', to: '/contact', path: '/contact' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/40 backdrop-blur-xl py-4' : 'bg-transparent py-10'}`}>
      <div className="max-w-[1920px] mx-auto px-6 md:px-24 lg:px-40 flex justify-between items-center">
        <Link to="/">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 md:gap-4"
          >
            <span className="text-2xl md:text-4xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
            <span className="text-xs md:text-lg font-bold tracking-[0.2em] text-white hidden sm:block">DREAMCATCHERS</span>
          </motion.div>
        </Link>

        <div className="hidden lg:flex items-center gap-14">
          {navLinks.map((link) => (
            link.to ? (
              <Link 
                key={link.name} 
                to={link.to} 
                className={`text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isActive(link.path) ? 'text-orange-500' : 'text-white/70 hover:text-orange-400'}`}
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                className={`text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 text-white/70 hover:text-orange-400`}
              >
                {link.name}
              </a>
            )
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
              link.to ? (
                <Link 
                  key={link.name} 
                  to={link.to} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-bold uppercase tracking-widest text-white/60 hover:text-orange-500 transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-bold uppercase tracking-widest text-white/60 hover:text-orange-500 transition-colors"
                >
                  {link.name}
                </a>
              )
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [titles, setTitles] = useState<{ line1: string, line2: string }[]>([
    { line1: "VISUAL", line2: "POETRY" },
    { line1: "CINEMATIC", line2: "WIZARDRY" },
    { line1: "DIGITAL", line2: "RENAISSANCE" },
  ]);
  const [showreelUrl, setShowreelUrl] = useState('');
  const [showreelOpen, setShowreelOpen] = useState(false);

  const loadHomeHeroConfigs = () => {
    const savedShowreel = localStorage.getItem('home_showreel_url') || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
    setShowreelUrl(savedShowreel);

    const t1_l1 = localStorage.getItem('home_title1_l1') || 'VISUAL';
    const t1_l2 = localStorage.getItem('home_title1_l2') || 'POETRY';
    const t2_l1 = localStorage.getItem('home_title2_l1') || 'CINEMATIC';
    const t2_l2 = localStorage.getItem('home_title2_l2') || 'WIZARDRY';
    const t3_l1 = localStorage.getItem('home_title3_l1') || 'DIGITAL';
    const t3_l2 = localStorage.getItem('home_title3_l2') || 'RENAISSANCE';

    setTitles([
      { line1: t1_l1, line2: t1_l2 },
      { line1: t2_l1, line2: t2_l2 },
      { line1: t3_l1, line2: t3_l2 },
    ]);
  };

  useEffect(() => {
    loadHomeHeroConfigs();
    window.addEventListener('storage_updated_home_hero', loadHomeHeroConfigs);
    window.addEventListener('storage', loadHomeHeroConfigs);
    return () => {
      window.removeEventListener('storage_updated_home_hero', loadHomeHeroConfigs);
      window.removeEventListener('storage', loadHomeHeroConfigs);
    };
  }, []);

  const [index, setIndex] = useState(0);
  const { scrollY } = useScroll();
  
  // Fade content as next sections overlap
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    if (titles.length === 0) return;
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
          className="text-white/80 text-[10px] sm:text-xs uppercase tracking-[0.5em] mb-4 md:mb-8 animate-pulse text-orange-500"
        >
          Creators + Films + Documentaries
        </motion.p>
        
        <div className="relative h-[8rem] md:h-[13rem] flex flex-col justify-center items-center overflow-hidden mb-8 md:mb-12 w-full">
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
              <h1 className="text-3xl md:text-[6.5rem] font-black text-white tracking-tighter leading-none whitespace-nowrap uppercase">
                {titles[index]?.line1}
              </h1>
              <h1 className="text-3xl md:text-[6.5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-orange-500 tracking-tighter leading-none whitespace-nowrap uppercase">
                {titles[index]?.line2}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4 md:gap-8"
        >
          <button 
            type="button"
            onClick={() => setShowreelOpen(true)}
            className="group flex items-center gap-3 px-6 md:px-10 py-3 md:py-5 bg-white hover:bg-orange-500 hover:text-white text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full hover:scale-105 transition-all shadow-xl pointer-events-auto cursor-pointer"
          >
            <Play size={10} className="fill-current md:w-[14px]" />
            Play Showreel
          </button>
          <button 
            type="button"
            onClick={() => navigate('/contact')}
            className="px-6 md:px-10 py-3 md:py-5 border border-white/20 text-white hover:border-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full hover:border-orange-500/50 hover:bg-white/5 transition-all pointer-events-auto cursor-pointer"
          >
            Contact Us
          </button>
        </motion.div>
 
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce">
           <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        </div>
      </motion.div>

      {/* Cinematic Modal Player Block */}
      <AnimatePresence>
        {showreelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl pointer-events-auto"
          >
            <button 
              type="button"
              onClick={() => setShowreelOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all border border-white/10"
            >
              <X size={24} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
            >
              {showreelUrl.includes('youtube.com') || showreelUrl.includes('youtu.be') ? (
                <iframe 
                  src={showreelUrl.replace('watch?v=', 'embed/').split('&')[0] + "?autoplay=1"} 
                  title="Showreel Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              ) : showreelUrl.includes('vimeo.com') ? (
                <iframe 
                  src={showreelUrl.includes('player.vimeo.com') ? `${showreelUrl}?autoplay=1` : `https://player.vimeo.com/video/${showreelUrl.split('/').pop()}?autoplay=1`} 
                  title="Showreel Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              ) : (
                <video 
                  src={showreelUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const DEFAULT_FILMS_LIST = [
  { id: '1', title: 'Boat x Netflix Stream Edition', category: 'Branded Commercials', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '2', title: 'Marvel x Guardians of the Galaxy', category: 'OTT', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '3', title: 'Netflix Dhamaka Mood Promo', category: 'OTT', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '4', title: 'Coke Studio Global | Afroto | 7ALA', category: 'Music Video', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4a8a?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '5', title: 'Directors Cut | Green Vibes Festival', category: 'Unscripted', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '6', title: 'Bumble x Kindness is sexy ft. ARK', category: 'Branded Commercials', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '7', title: 'Maleficent', category: 'OTT', img: 'https://images.unsplash.com/photo-1606503825008-909a67e74360?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '8', title: 'Shaitaan', category: 'OTT', img: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '9', title: 'Deadpool & Wolverine', category: 'OTT', img: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '10', title: 'Spider-Man: No Way Home', category: 'OTT', img: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '11', title: 'Padmaavat', category: 'OTT', img: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '12', title: 'Beauty and the Beast', category: 'OTT', img: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '13', title: 'Black Panther', category: 'OTT', img: 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '14', title: 'Interstellar', category: 'OTT', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '15', title: 'Dune: Part Two', category: 'OTT', img: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '16', title: 'Inception', category: 'OTT', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '17', title: 'Joker', category: 'OTT', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '18', title: 'The Batman', category: 'OTT', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '19', title: 'Blade Runner 2049', category: 'OTT', img: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '20', title: 'The Revenant', category: 'OTT', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4a8a?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '21', title: 'Doctor Strange', category: 'OTT', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '22', title: 'Avatar: Way of Water', category: 'OTT', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '23', title: 'Jurassic World', category: 'OTT', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '24', title: 'Thor: Love and Thunder', category: 'OTT', img: 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '25', title: 'The Matrix Resurrections', category: 'OTT', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '26', title: 'Wonder Woman 1984', category: 'OTT', img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '27', title: 'Guardians of the Galaxy Vol. 3', category: 'OTT', img: 'https://images.unsplash.com/photo-1485098262243-ea7631fec367?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '28', title: 'Oppenheimer', category: 'OTT', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '29', title: 'Barbie', category: 'OTT', img: 'https://images.unsplash.com/photo-1531259683007-01397e899182?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '30', title: 'Top Gun: Maverick', category: 'OTT', img: 'https://images.unsplash.com/photo-1598897135853-90d56621252e?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '31', title: 'Mission Impossible', category: 'OTT', img: 'https://images.unsplash.com/photo-1525498128445-66d4825950dc?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '32', title: 'John Wick: Chapter 4', category: 'OTT', img: 'https://images.unsplash.com/photo-1550101617-dc139a028670?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '33', title: 'Mad Max: Fury Road', category: 'OTT', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' }
];

export const FILMS = DEFAULT_FILMS_LIST;

export interface ClientItem {
  id: string;
  name: string;
  color: string;
  size?: 'small' | 'medium' | 'large' | string;
  logoUrl?: string;
}

export const DEFAULT_CLIENTS_LIST: ClientItem[] = [
  { id: '1', name: 'NETFLIX', color: '#E50914', size: 'large', logoUrl: '' },
  { id: '2', name: "D'DECOR", color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '3', name: 'amazon prime', color: '#FFFFFF', size: 'large', logoUrl: '' },
  { id: '4', name: 'Disney+ hotstar', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '5', name: 'asics', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '6', name: "L'ORÉAL", color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '7', name: 'Pernod Ricard', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '8', name: 'YouTube', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '9', name: 'JAMESON', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '10', name: 'ASUS', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '11', name: 'LIONSGATE PLAY', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '12', name: 'MARVEL STUDIOS', color: '#ED1D24', size: 'medium', logoUrl: '' },
  { id: '13', name: 'ABSOLUT.', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '14', name: 'Coke STUDIO', color: '#FE001A', size: 'medium', logoUrl: '' },
  { id: '15', name: 'SKECHERS', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '16', name: 'Bumble', color: '#FFC629', size: 'small', logoUrl: '' },
  { id: '17', name: 'Mi', color: '#FF6700', size: 'small', logoUrl: '' },
  { id: '18', name: 'Signature', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '19', name: 'IndiGo', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '20', name: 'Top Ramen', color: '#FF0000', size: 'small', logoUrl: '' },
  { id: '21', name: 'Boost', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '22', name: 'Myntra', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '23', name: 'boat', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '24', name: 'TOSHIBA', color: '#FFFFFF', size: 'medium', logoUrl: '' },
  { id: '25', name: 'LAKMÉ', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '26', name: 'BRITANNIA', color: '#ED1D24', size: 'small', logoUrl: '' },
  { id: '27', name: 'Vedanta', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '28', name: 'Tecno', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '29', name: 'Star Sports', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '30', name: 'Sony', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '31', name: 'NPCL', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '32', name: 'NDTV', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '33', name: 'KPMG', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '34', name: 'FIFA', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '35', name: 'Adani', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '36', name: 'Zee', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '37', name: 'Vivo', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '38', name: 'Swachh Bharat', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '39', name: 'Pearl Academy', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '40', name: 'Larsen & Toubro', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '41', name: 'Indian Air Force', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '42', name: 'Indian Army', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '43', name: 'Jakson', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '44', name: 'Seven', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '45', name: 'Gujarat Tourism', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '46', name: 'Food Food', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '47', name: 'Experion', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '48', name: 'Discovery', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '49', name: 'Cairn', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '50', name: 'DLF', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '51', name: 'Denso', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '52', name: 'Balaji Wafers', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '53', name: 'GMR', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '54', name: 'Land Ports Authority', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '55', name: 'FIH', color: '#FFFFFF', size: 'small', logoUrl: '' },
  { id: '56', name: 'The Leela', color: '#FFFFFF', size: 'small', logoUrl: '' },
];

function Clients() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);

  useEffect(() => {
    const fetchClients = () => {
      const stored = localStorage.getItem('dc_clients');
      if (stored) {
        try {
          setClients(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing clients:', e);
          setClients(DEFAULT_CLIENTS_LIST);
        }
      } else {
        setClients(DEFAULT_CLIENTS_LIST);
      }
    };

    fetchClients();

    window.addEventListener('storage', fetchClients);
    window.addEventListener('storage_updated_clients', fetchClients);

    return () => {
      window.removeEventListener('storage', fetchClients);
      window.removeEventListener('storage_updated_clients', fetchClients);
    };
  }, []);

  if (clients.length === 0) return null;
  
  return (
    <section 
      id="clients" 
      className="pt-10 md:pt-24 pb-0 md:pb-4 bg-transparent overflow-hidden relative" 
      ref={containerRef}
    >
      <div className="max-w-[1600px] mx-auto px-0 flex flex-col items-start relative z-20">
        <div className="text-left mb-8 md:mb-20 px-6 md:px-0">
            <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl md:text-6xl font-black tracking-tighter text-orange-500 uppercase italic mb-6"
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
              {[...clients, ...clients].map((client, i) => (
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
              {[...clients.slice().reverse(), ...clients].map((client, i) => (
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
  client: ClientItem;
}

const ClientLogo: FC<ClientLogoProps> = ({ client }) => {
  const [imgError, setImgError] = useState(false);
  const hasLogoUrl = client.logoUrl && client.logoUrl.trim().length > 0 && !imgError;

  return (
    <div className="flex items-center gap-2 md:gap-4 px-4 md:px-6 py-2 md:py-3 bg-zinc-900/30 backdrop-blur-sm rounded-full border border-white/5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-default group">
      <div 
        className="w-8 h-8 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-xl shadow-lg ring-1 ring-white/10 overflow-hidden" 
        style={{ 
          backgroundColor: client.color || '#333333',
          backgroundImage: hasLogoUrl ? 'none' : `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)`
        }}
      >
        {hasLogoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={client.name} 
            className="w-full h-full object-contain p-1.5"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{client.name ? client.name.substring(0, 1).toUpperCase() : 'C'}</span>
        )}
      </div>
      <span className="text-base md:text-3xl font-bold text-zinc-400 tracking-tight transition-colors group-hover:text-white">
        {client.name}
      </span>
    </div>
  );
};

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  mediaType?: 'image' | 'video';
}

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: 'Vikram Singh', role: 'Founder & Director', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600', mediaType: 'image' },
  { id: 2, name: 'Ananya Sharma', role: 'Creative Producer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600', mediaType: 'image' },
  { id: 3, name: 'Rahul Mehra', role: 'Post-Production', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600', mediaType: 'image' },
  { id: 4, name: 'Zoya Akhtar', role: 'Cinematographer', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600', mediaType: 'image' },
];

function DreamTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadTeamMembers = () => {
      const stored = localStorage.getItem('dream_team');
      if (stored) {
        try {
          setTeamMembers(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error parsing team members from localStorage:', e);
        }
      }
      setTeamMembers(DEFAULT_TEAM_MEMBERS);
    };

    loadTeamMembers();
    
    // Listen for custom simple internal storage-updating triggers
    window.addEventListener('storage_updated_team', loadTeamMembers);
    window.addEventListener('storage', loadTeamMembers); // Multi-tab or general sync
    return () => {
      window.removeEventListener('storage_updated_team', loadTeamMembers);
      window.removeEventListener('storage', loadTeamMembers);
    };
  }, []);

  useEffect(() => {
    if (teamMembers.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
    }, 5000); // Slightly slower for better readability
    return () => clearInterval(timer);
  }, [teamMembers]);

  if (teamMembers.length === 0) {
    return (
      <section id="team" className="pt-8 md:pt-16 pb-24 md:pb-48 relative overflow-hidden bg-black/20">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-white/50">
          Loading team members...
        </div>
      </section>
    );
  }

  return (
    <section id="team" className="pt-8 md:pt-16 pb-24 md:pb-48 relative overflow-hidden bg-black/20">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="text-left mb-12 md:mb-16">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-orange-500 text-xs font-black uppercase tracking-[0.5em] mb-4 block"
          >
            The Visionaries
          </motion.span>
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none"
          >
            Dream <span className="text-orange-500">Team</span>
          </motion.h3>
        </div>        {/* Sliding Carousel */}
        <div className="relative h-[550px] md:h-[700px] flex items-center justify-center">
          {(() => {
            const isMobile = windowWidth < 768;
            
            // Generous design gap offsets (center-to-center)
            const innerOffset = isMobile ? 210 : 490; 
            const outerOffset = innerOffset + (isMobile ? 120 : 320);
            
            // Position arrows outside of the outermost profile, but adjust dynamically to fit the viewport nicely
            const maxArrowOffset = (windowWidth / 2) - (isMobile ? 32 : 64);
            const preferredArrowOffset = outerOffset + (isMobile ? 65 : 125);
            const arrowOffset = Math.min(preferredArrowOffset, maxArrowOffset);

            return (
              <>
                {teamMembers.map((member, i) => {
                  // Relative position logic for infinite loop
                  let position = i - currentIndex;
                  const total = teamMembers.length;
                  const half = Math.floor(total / 2);
                  while (position > half) position -= total;
                  while (position < -half) position += total;

                  const isCenter = position === 0;
                  const isInnerSide = Math.abs(position) === 1; // Profiles 2 and 4
                  const isOuterSide = Math.abs(position) === 2; // Profiles 1 and 5
                  const isVisible = Math.abs(position) <= 2;

                  let xOffset = 0;
                  if (position === 1) xOffset = innerOffset;
                  else if (position === -1) xOffset = -innerOffset;
                  else if (position === 2) xOffset = outerOffset;
                  else if (position === -2) xOffset = -outerOffset;

                  return (
                    <motion.div
                      key={member.id}
                      layout
                      initial={false}
                      animate={{
                        opacity: isVisible ? (isCenter ? 1 : isInnerSide ? 0.8 : 0.4) : 0,
                        x: xOffset,
                        scale: isCenter ? 1 : isInnerSide ? 0.82 : 0.65,
                        zIndex: isCenter ? 50 : 20 - Math.abs(position),
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 80,
                        damping: 20,
                        mass: 1
                      }}
                      className="absolute will-change-transform"
                    >
                      {/* Member Container - Using layout for smooth morphing */}
                      <motion.div
                        layout
                        className={`relative flex flex-col items-center overflow-hidden h-fit ${
                          isCenter 
                            ? 'w-[280px] md:w-[440px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.7)]' 
                            : isInnerSide
                              ? 'w-28 h-28 md:w-60 md:h-60 bg-white/5 backdrop-blur-md border-2 border-white/20 shadow-lg'
                              : 'w-20 h-20 md:w-48 md:h-48 bg-white/5 backdrop-blur-md border-2 border-white/20 shadow-md'
                        }`}
                        style={{
                          borderRadius: isCenter ? '3rem' : '50%'
                        }}
                      >
                        {/* Photo container */}
                        <motion.div
                          layout
                          className={`relative overflow-hidden w-full ${
                            isCenter ? 'aspect-square' : 'h-full'
                          }`}
                        >
                          {member.mediaType === 'video' || (member.image && (member.image.endsWith('.mp4') || member.image.includes('video') || member.image.includes('.mov'))) ? (
                            <video 
                              key={member.id}
                              src={member.image} 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <motion.img 
                              layout
                              src={member.image} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Name Overlay - Only for center */}
                          <AnimatePresence>
                            {isCenter && (
                              <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                              >
                                <motion.h4 
                                   layout
                                  className="text-xl md:text-4xl font-black italic text-white uppercase tracking-tighter text-left"
                                >
                                  {member.name}
                                </motion.h4>
                                <motion.p 
                                  layout
                                  className="text-orange-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] mt-1 text-left"
                                >
                                  {member.role}
                                </motion.p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                })}

                {/* Left Slide Button - precisely positioned to the left of leftmost profile */}
                <button 
                  type="button"
                  onClick={handlePrev}
                  className="absolute z-[60] w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-black border border-white/10 hover:border-orange-500/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer group backdrop-blur-md"
                  aria-label="Previous Team Member"
                  id="team-btn-prev"
                  style={{
                    left: `calc(50% - ${arrowOffset}px)`,
                    transform: 'translateY(-50%)',
                    top: '50%'
                  }}
                >
                  <ChevronLeft className="w-5 h-5 md:w-8 md:h-8 transition-transform group-hover:-translate-x-0.5" />
                </button>

                {/* Right Slide Button - precisely positioned to the right of rightmost profile */}
                <button 
                  type="button"
                  onClick={handleNext}
                  className="absolute z-[60] w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-black border border-white/10 hover:border-orange-500/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer group backdrop-blur-md"
                  aria-label="Next Team Member"
                  id="team-btn-next"
                  style={{
                    right: `calc(50% - ${arrowOffset}px)`,
                    transform: 'translateY(-50%)',
                    top: '50%'
                  }}
                >
                  <ChevronRight className="w-5 h-5 md:w-8 md:h-8 transition-transform group-hover:translate-x-0.5" />
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </section>
  );
}


function Portfolio() {
  const [activeTab, setActiveTab] = useState('All');
  const [films, setFilms] = useState<any[]>([]);
  const [title, setTitle] = useState('Films');
  const [visible, setVisible] = useState(true);
  const [showCats, setShowCats] = useState(true);
  const [limit, setLimit] = useState('6');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      // 1. Load configuration
      setVisible(localStorage.getItem('home_films_visible') !== 'false');
      setTitle(localStorage.getItem('home_films_title') || 'Films');
      setShowCats(localStorage.getItem('home_films_show_cats') !== 'false');
      setLimit(localStorage.getItem('home_films_limit') || '6');

      // 2. Load catalogue films
      const stored = localStorage.getItem('dc_films');
      if (stored) {
        try {
          setFilms(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error loading films on home page:', e);
        }
      }
      setFilms(FILMS);
    };

    loadData();
    window.addEventListener('storage_updated_films', loadData);
    window.addEventListener('storage_updated_home_films', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage_updated_films', loadData);
      window.removeEventListener('storage_updated_home_films', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  if (!visible) return null;

  // Derive active dynamic categories from the current films array
  const availableCategories = ['All', ...Array.from(new Set(films.map(f => f.category || 'OTT')))];

  let filteredFilms = activeTab === 'All' 
    ? films 
    : films.filter(f => f.category === activeTab);

  if (limit !== 'All') {
    const maxEntries = parseInt(limit, 10) || 6;
    filteredFilms = filteredFilms.slice(0, maxEntries);
  }

  return (
    <section id="films" className="pt-12 md:pt-20 pb-12 md:pb-24">
      <div className="max-w-[1600px] mx-auto px-6 md:px-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
          <div className="relative">
              <motion.h3 
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl md:text-6xl font-[1000] text-orange-500 tracking-[-0.05em] uppercase italic leading-none drop-shadow-[0_0_60px_rgba(249,115,22,0.2)] pointer-events-none select-none text-left pr-4"
              >
                {title}
              </motion.h3>
          </div>
          
          {showCats && (
            <div className="flex flex-wrap gap-2 pb-1 lg:justify-end">
              {availableCategories.map((cat, i) => (
                <motion.button 
                  key={cat} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-500 border-2 ${
                    activeTab === cat 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
                    : 'bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
          {filteredFilms.map((film, idx) => (
            <motion.div 
              key={film.id || idx}
              initial={{ opacity: 0, y: 100, scale: 0.6, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: (idx % 3) * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: false, margin: "-100px" }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelectedVideo(film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761')}
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
                    <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {film.category || 'OTT'}
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

      {/* Dynamic Lightbox Video Modal overlay */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          >
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full border border-white/10 hover:border-white/30 text-white flex items-center justify-center bg-black hover:text-orange-500 transition-all font-sans"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="relative w-full max-w-5xl aspect-video bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
                <iframe 
                  src={selectedVideo.replace('watch?v=', 'embed/').split('&')[0] + "?autoplay=1"} 
                  className="w-full h-full border-none" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen 
                />
              ) : selectedVideo.includes('vimeo.com') ? (
                <iframe 
                  src={selectedVideo.includes('player.vimeo.com') ? `${selectedVideo}?autoplay=1` : `https://player.vimeo.com/video/${selectedVideo.split('/').pop()}?autoplay=1`} 
                  className="w-full h-full border-none" 
                  allow="autoplay; fullscreen" 
                  allowFullScreen 
                />
              ) : (
                <video 
                  src={selectedVideo} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function InteractiveOptions() {
  const navigate = useNavigate();
  const options = [
    { name: 'FILMS', to: '/films' },
    { name: 'ABOUT US', to: '/about' },
    { name: 'CONTACT US', to: '/contact' },
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
              if (option.to) {
                navigate(option.to);
              }
            }}
            className="group relative h-28 md:h-56 flex items-center justify-center cursor-pointer overflow-hidden border-b border-white/10 last:border-b-0"
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
                className="text-3xl md:text-8xl font-black italic tracking-tighter uppercase leading-none"
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
  const { user, isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <footer className="py-8 md:py-12 bg-zinc-950/20 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-[1800px] mx-auto px-6 md:px-48 lg:px-56">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6 md:mb-10">
              <span className="text-3xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
              <span className="text-xl md:text-4xl font-black tracking-tighter text-white uppercase italic">Dreamcatchers</span>
            </div>
            <p className="text-white/40 leading-relaxed max-w-md text-xs md:text-sm font-medium tracking-tight">
              A high-end creative studio for brands, agencies & OTT platforms to increase visibility through advertising, films, and creative adaptations.
            </p>
          </div>
          
          <div id="contact">
            <h5 className="text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10">Inquiries</h5>
            <div className="space-y-4 md:space-y-6">
              <a href="mailto:hello@dreamcatchers.com" className="block text-lg md:text-xl font-bold text-white hover:text-orange-400 transition-all tracking-tight">hello@dreamcatchers.com</a>
              <p className="text-white/30 text-sm italic">Lower Parel, Mumbai, India</p>
              
              <div className="pt-6 border-t border-white/5">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                      <div>
                        <p className="text-white text-xs font-bold">{user.displayName}</p>
                        <button onClick={logout} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">Logout</button>
                      </div>
                    </div>
                    {isAdmin && (
                      <Link 
                        to="/admin"
                        className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-all group"
                      >
                        <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin Panel</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={login}
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
            <h5 className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10">Social</h5>
            <div className="flex flex-wrap gap-6 md:gap-8">
              {[
                { name: 'Instagram', icon: <Instagram size={18} />, color: 'hover:text-[#E4405F]' },
                { name: 'Facebook', icon: <Facebook size={18} />, color: 'hover:text-[#1877F2]' },
                { name: 'Youtube', icon: <Youtube size={18} />, color: 'hover:text-[#FF0000]' },
                { name: 'Twitter', icon: <Twitter size={18} />, color: 'hover:text-[#1DA1F2]' }
              ].map(social => (
                <a 
                  key={social.name} 
                  href="#" 
                  className={`text-white/40 transition-all duration-300 hover:scale-125 ${social.color}`}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 pt-12 md:pt-16 border-t border-white/5">
          <p className="text-white/20 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">© 2026 Dreamcatchers Production.</p>
          <div className="flex gap-8 md:gap-12">
            <a href="#" className="text-white/10 hover:text-white text-[8px] md:text-[10px] uppercase tracking-widest transition-all font-bold">Privacy</a>
            <a href="#" className="text-white/10 hover:text-white text-[8px] md:text-[10px] uppercase tracking-widest transition-all font-bold">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Intro() {
  const [orbitImages, setOrbitImages] = useState<string[]>([]);

  useEffect(() => {
    const loadOrbitImages = () => {
      const stored = localStorage.getItem('orbit_images');
      if (stored) {
        try {
          setOrbitImages(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error parsing orbit images from localStorage:', e);
        }
      }
      setOrbitImages(DEFAULT_ORBIT_IMAGES);
    };

    loadOrbitImages();
    window.addEventListener('storage_updated_orbit', loadOrbitImages);
    window.addEventListener('storage', loadOrbitImages);
    return () => {
      window.removeEventListener('storage_updated_orbit', loadOrbitImages);
      window.removeEventListener('storage', loadOrbitImages);
    };
  }, []);

  const activeOrbitImages = orbitImages.length > 0 ? orbitImages : DEFAULT_ORBIT_IMAGES;

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
    <section className="pt-12 md:pt-24 pb-0 md:pb-0 overflow-hidden">
      <div className="w-full px-6 md:px-56">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          className="flex flex-col lg:flex-row justify-between items-center mb-8 md:mb-16"
        >
          <div className="flex-1 w-full text-center md:text-left">
            <div className="overflow-hidden mb-1 md:mb-2 text-center md:text-left">
              <motion.h2 variants={lineVariants} className="text-xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                Dreamcatchers is a
              </motion.h2>
            </div>
            <div className="overflow-hidden flex items-center justify-center md:justify-start gap-4 md:gap-6 flex-wrap mb-1 md:mb-2">
              <motion.div 
                variants={lineVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 md:w-36 h-8 md:h-24 rounded-full bg-zinc-800 overflow-hidden shadow-2xl border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.div>
              <motion.h2 variants={lineVariants} className="text-xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                Creative Studio That
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.h2 variants={lineVariants} className="text-xl md:text-[3.8rem] font-black text-white tracking-tighter leading-[0.8] uppercase italic">
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
                className="inline-block w-8 md:w-12 h-5 md:h-7 rounded-full bg-orange-500/20 overflow-hidden border border-orange-500/30"
              >
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              advertising,
            </motion.span>
            <motion.span whileHover={{ y: -5 }} className="flex items-center gap-3">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="inline-block w-8 md:w-12 h-5 md:h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              films,
            </motion.span>
            <motion.span whileHover={{ y: -5 }} className="flex items-center gap-3">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block w-8 md:w-12 h-5 md:h-7 rounded-full bg-orange-500 overflow-hidden shadow-lg shadow-orange-500/20"
              >
                <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              events,
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.2, rotate: 5 }}
              className="inline-block w-10 md:w-16 h-6 md:h-8 rounded-full bg-zinc-800 overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
            </motion.span>
            and <span className="flex items-center gap-3 text-orange-500 underline decoration-white/20 underline-offset-8">
              <motion.span 
                whileHover={{ scale: 1.1, rotate: -3 }}
                className="inline-block w-8 md:w-12 h-5 md:h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="" />
              </motion.span>
              Documentaries.
            </span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center pt-16 pb-16 md:pb-24 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            className="group relative flex flex-col items-center justify-center h-[280px] md:h-[700px] bg-transparent transition-all duration-700"
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
                      className="text-[6rem] md:text-[18rem] font-black italic tracking-tighter text-white/5 transition-all duration-700 group-hover:text-orange-500 group-hover:drop-shadow-[0_0_80px_rgba(249,115,22,0.5)] cursor-default select-none block leading-none relative z-20"
                      whileHover={{ scale: 1.02 }}
                    >
                      DC
                    </motion.span>
                </div>

                {/* Orbiting Planets - Now in the same container for unified stacking context */}
                {activeOrbitImages.map((img, i) => (
                  <OrbitingFrame key={i} index={i} total={activeOrbitImages.length} img={img} />
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
                 className="text-xl md:text-4xl text-orange-500 font-black leading-[1] tracking-tight uppercase italic flex flex-wrap"
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
               className="text-base md:text-xl text-orange-500/60 leading-relaxed max-w-2xl font-medium border-l-2 border-orange-500/20 pl-6 md:pl-10"
             >
               As more clients showed faith in us, our tribe grew, and here we are today! We&apos;re a happy bunch of people pushing the creative envelope.
             </motion.p>
             <motion.button 
               variants={itemVariants}
               whileHover={{ x: 10, backgroundColor: "#f97316", color: "#fff" }}
               className="group flex items-center gap-6 px-8 md:px-12 py-4 md:py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full transition-all shadow-2xl"
             >
               Explore Our Story
               <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
             </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  const { scrollY } = useScroll();
  const starOpacity = useTransform(scrollY, [100, 700], [0, 1]);
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);

  const [backdropType, setBackdropType] = useState<'image' | 'video'>('video');
  const [backdropUrl, setBackdropUrl] = useState('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071');

  const loadConfigs = () => {
    setBackdropType((localStorage.getItem('home_hero_bg_type') || 'video') as 'image' | 'video');
    setBackdropUrl(localStorage.getItem('home_hero_bg_url') || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071');
  };

  useEffect(() => {
    loadConfigs();
    window.addEventListener('storage_updated_home_hero', loadConfigs);
    window.addEventListener('storage', loadConfigs);
    return () => {
      window.removeEventListener('storage_updated_home_hero', loadConfigs);
      window.removeEventListener('storage', loadConfigs);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-orange-500 selection:text-white">
      {/* Global Transitioned Fixed Background Layer */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        
        {/* Layer 1: The Hero Cinematic Image or Video Loop (Stays fixed, fades slowly) */}
        <motion.div 
          style={{ opacity: heroImgOpacity }}
          className="absolute inset-0"
        >
          {backdropType === 'video' ? (
            <video 
              key={backdropUrl}
              src={backdropUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <img 
              src={backdropUrl} 
              alt="Cinematic Background" 
              className="w-full h-full object-cover opacity-80"
            />
          )}
          {/* Transition overlays */}
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />
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
          <DreamTeam />
          <section id="about" className="py-12 md:py-24">
            <div className="w-full px-6 md:px-56">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center text-center lg:text-left">
                <div className="relative group max-w-[280px] md:max-w-md mx-auto lg:mx-0">
                  <div className="aspect-[4/5] overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-white/10">
                    <img src="https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072" alt="Behind the scenes" className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" />
                  </div>
                  <div className="absolute -bottom-6 md:-bottom-10 -right-6 md:-right-10 w-32 h-32 md:w-56 md:h-56 bg-orange-500 rounded-full p-4 md:p-8 flex flex-col items-center justify-center text-center shadow-2xl rotate-12" style={{ transform: 'rotate(12deg)' }}>
                    <span className="text-2xl md:text-5xl font-black text-white italic">14+</span>
                    <p className="text-white/90 text-[7px] md:text-[9px] font-black uppercase tracking-widest mt-1 md:mt-2">Years on Set</p>
                  </div>
                </div>
                <div>
                  <span className="text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-4 md:mb-6 block">Our Story</span>
                  <h3 className="text-2xl md:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-6 md:mb-10 uppercase italic">Crafting <br />Legends</h3>
                  <p className="text-white/50 leading-relaxed mb-8 md:mb-12 text-sm md:text-base font-medium tracking-tight px-4 md:px-0">
                    Dreamcatchers is a new age creative studio specializing in visual storytelling that moves people. We don't just shoot films; we engineer experiences that bridge the gap between imagination and reality.
                  </p>
                  <button className="flex items-center gap-4 text-white font-black uppercase tracking-[0.3em] text-[10px] md:text-xs group mx-auto lg:mx-0">
                    Find more about us 
                    <div className="w-8 h-8 md:w-10 md:h-10 border border-white/20 rounded-full flex items-center justify-center group-hover:border-orange-500 group-hover:bg-orange-500 transition-all">
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5" />
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  useEffect(() => {
    const unsub = initSiteSync();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/films" element={<FilmsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
