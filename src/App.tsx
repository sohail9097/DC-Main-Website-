import { motion, AnimatePresence, useScroll, useTransform, useTime } from 'motion/react';
import { Camera, Play, ChevronLeft, ChevronRight, Menu, X, Rocket, Moon, ShieldCheck, Instagram, Facebook, Youtube, Twitter, ArrowLeft, Sparkles, Globe, Tv, Heart, Compass } from 'lucide-react';
import { useState, useEffect, useRef, FC } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import FilmsPage from './pages/FilmsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BrandPage from './pages/BrandPage';
import { initSiteSync } from './lib/siteSync';

// --- Components ---

// --- 3D Orbiting Planet Frames ---

const StarField: FC<{ count?: number }> = ({ count = 250 }) => {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number; driftX: number; driftY: number }[]>([]);

  useEffect(() => {
    const optimizedCount = Math.min(count, 85);
    const newStars = Array.from({ length: optimizedCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 1.6 + 0.4,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * -10, // Negative delay to prevent bulk fade-ins on load
      driftX: (Math.random() - 0.5) * 40,
      driftY: (Math.random() - 0.5) * 40,
    }));
    setStars(newStars);
  }, [count]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes starTwinkleDrift {
          0% {
            opacity: 0.15;
            transform: translate3d(0px, 0px, 0) scale(0.8);
          }
          50% {
            opacity: 0.95;
            transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.15);
          }
          100% {
            opacity: 0.15;
            transform: translate3d(0px, 0px, 0) scale(0.8);
          }
        }
      `}</style>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: 'white',
            borderRadius: '50%',
            opacity: 0.3,
            boxShadow: star.size > 1 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.4)` : 'none',
            '--drift-x': `${star.driftX}px`,
            '--drift-y': `${star.driftY}px`,
            animation: `starTwinkleDrift ${star.duration}s infinite ease-in-out`,
            animationDelay: `${star.delay}s`,
            willChange: 'transform, opacity',
          } as any}
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
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500',
];

const OrbitingFrame: FC<{ index: number; total: number; item: any }> = ({ index, total, item }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const element = containerRef.current;
    if (!element) return;

    // Cache radiusX outside requestAnimationFrame loop to prevent layout thrashing
    let radiusX = typeof window !== 'undefined' ? (window.innerWidth > 768 ? 465 : 210) : 465;
    
    const handleResize = () => {
      radiusX = window.innerWidth > 768 ? 465 : 210;
    };
    window.addEventListener('resize', handleResize);

    const radiusZ = 170;

    const update = (time: number) => {
      // Map time to angle
      const angle = (time / 6000) + (index * (2 * Math.PI / total));
      
      const x = Math.sin(angle) * radiusX;
      const z = Math.cos(angle) * radiusZ;
      const y = Math.sin(angle * 1.5) * 20;

      // Normalizing Z between -170 and 170 to range 0 and 1
      const normalizedZ = (z + 170) / 340;
      const scale = 0.45 + normalizedZ * (1.35 - 0.45);
      const opacity = 0.25 + normalizedZ * (1 - 0.25);
      const zIndex = z > 0 ? 40 : 10;

      element.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
      element.style.opacity = `${opacity}`;
      element.style.zIndex = `${zIndex}`;

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [index, total]);

  let imgUrl = '';
  let mediaType: 'image' | 'video' = 'image';

  if (typeof item === 'string') {
    imgUrl = item;
    const lower = item.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || (lower.includes('drive.google.com/file/d/') && (lower.includes('video') || lower.includes('playback') || lower.includes('mp4')))) {
      mediaType = 'video';
    }
  } else if (item && typeof item === 'object') {
    imgUrl = item.url || '';
    mediaType = item.type === 'video' ? 'video' : 'image';
  }

  const transformedUrl = transformGoogleDriveUrl(imgUrl, mediaType);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      }}
      className="w-[75px] h-[75px] md:w-[172px] md:h-[172px] group cursor-pointer pointer-events-auto"
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {/* Planet Atmosphere / Glow */}
        <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-700" />
        
        {/* The "Planet" Frame */}
        <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-700 group-hover:scale-105 group-hover:border-white/30 pointer-events-auto">
          {mediaType === 'video' ? (
            <video
              src={transformedUrl}
              className="w-full h-full object-cover rounded-full transition-all duration-1000 grayscale-[0.5] group-hover:grayscale-0 group-hover:rotate-6"
              autoPlay
              loop
              muted
              playsInline
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={transformedUrl} 
              className="w-full h-full object-cover rounded-full transition-all duration-1000 grayscale-[0.5] group-hover:grayscale-0 group-hover:rotate-6" 
              alt="Orbiting project" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=500';
              }}
            />
          )}
          {/* Cinematic reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* Orbit Ring Light Streak (Decorative) */}
        <div className="absolute -inset-4 border border-white/5 rounded-full pointer-events-none group-hover:border-orange-500/20 transition-colors duration-700" />
      </div>
    </div>
  );
};

export function transformGoogleDriveUrl(url: string, type: 'image' | 'video' = 'image'): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Extract file ID from google drive share link
  const fileIdRegex = /(?:\/file\/d\/|id=)([^/?#]+)/;
  const match = trimmed.match(fileIdRegex);
  if (match && match[1]) {
    const fileId = match[1];
    if (type === 'video') {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return trimmed;
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoTextShort, setLogoTextShort] = useState('DC');
  const [logoTextFull, setLogoTextFull] = useState('DREAMCATCHERS');
  const [logoImageUrl, setLogoImageUrl] = useState('');

  const loadLogoConfigs = () => {
    setLogoType((localStorage.getItem('nav_logo_type') as 'text' | 'image') || 'text');
    setLogoTextShort(localStorage.getItem('nav_logo_text_short') || 'DC');
    setLogoTextFull(localStorage.getItem('nav_logo_text_full') || 'DREAMCATCHERS');
    setLogoImageUrl(localStorage.getItem('nav_logo_image_url') || '');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    loadLogoConfigs();
    window.addEventListener('storage', loadLogoConfigs);
    window.addEventListener('storage_updated_home_hero', loadLogoConfigs);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', loadLogoConfigs);
      window.removeEventListener('storage_updated_home_hero', loadLogoConfigs);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', path: '/' },
    { name: 'Content', to: '/films', path: '/films' },
    { name: 'Brand', to: '/brand', path: '/brand' },
    { name: 'About Us', to: '/about', path: '/about' },
    { name: 'Contact Us', to: '/contact', path: '/contact' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/' && location.pathname === '/') return true;
    const cleanPath = path.split('#')[0];
    if (cleanPath !== '/' && location.pathname.startsWith(cleanPath)) {
      if (path.includes('#')) {
        return location.hash === '#' + path.split('#')[1];
      }
      return !location.hash; // only main content page active when no hash
    }
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
            {logoType === 'image' && logoImageUrl ? (
              <img 
                src={transformGoogleDriveUrl(logoImageUrl)} 
                alt={logoTextFull} 
                className="h-10 sm:h-12 md:h-14 object-contain max-w-[200px]" 
                referrerPolicy="no-referrer"
                onError={() => {
                  setLogoType('text');
                }}
              />
            ) : (
              <>
                <span className="text-2xl md:text-4xl font-black italic tracking-tighter text-orange-500 leading-none">{logoTextShort}</span>
                <span className="text-xs md:text-lg font-bold tracking-[0.2em] text-white hidden sm:block">{logoTextFull}</span>
              </>
            )}
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
            {logoType === 'image' && logoImageUrl ? (
              <img 
                src={transformGoogleDriveUrl(logoImageUrl)} 
                alt={logoTextFull} 
                className="h-8 max-w-[150px] object-contain" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-lg font-bold tracking-widest">{logoTextFull}</span>
            )}
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
    const bgType = localStorage.getItem('home_hero_bg_type') || 'video';
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    const savedShowreel = localStorage.getItem('home_showreel_url') || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
    
    // If background is video and populated, use it. Otherwise, use stored/default showreel.
    if (bgType === 'video' && bgUrl) {
      setShowreelUrl(bgUrl);
    } else {
      setShowreelUrl(savedShowreel);
    }

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
  const transformY = useTransform(scrollY, [0, 500], [0, -100]);

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
          y: transformY
        }}
        className="relative z-20 h-full flex flex-col justify-center items-center text-center px-12 md:px-32 lg:px-56 pointer-events-auto"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 md:gap-8"
        >
          <button 
            type="button"
            onClick={() => navigate('/showreel')}
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
    </div>
  );
}

export const DEFAULT_FILMS_LIST = [
  { id: '1', title: 'Boat x Netflix Stream Edition', category: 'Branded Content', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '2', title: 'Marvel x Guardians of the Galaxy', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '3', title: 'Netflix Dhamaka Mood Promo', category: 'Branded Content', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '4', title: 'Coke Studio Global | Afroto | 7ALA', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4a8a?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '5', title: 'Directors Cut | Green Vibes Festival', category: 'Travel', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '6', title: 'Bumble x Kindness is sexy ft. ARK', category: 'Corporate', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '7', title: 'Maleficent', category: 'Sports', img: 'https://images.unsplash.com/photo-1606503825008-909a67e74360?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '8', title: 'Shaitaan', category: 'Lifestyle', img: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '9', title: 'Deadpool & Wolverine', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '10', title: 'Spider-Man: No Way Home', category: 'Sports', img: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '11', title: 'Padmaavat', category: 'Lifestyle', img: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '12', title: 'Beauty and the Beast', category: 'Lifestyle', img: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '13', title: 'Black Panther', category: 'Corporate', img: 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '14', title: 'Interstellar', category: 'Corporate', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '15', title: 'Dune: Part Two', category: 'Travel', img: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '16', title: 'Inception', category: 'Corporate', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '17', title: 'Joker', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '18', title: 'The Batman', category: 'Sports', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '19', title: 'Blade Runner 2049', category: 'Corporate', img: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '20', title: 'The Revenant', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4a8a?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '21', title: 'Doctor Strange', category: 'Travel', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '22', title: 'Avatar: Way of Water', category: 'Travel', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '23', title: 'Jurassic World', category: 'Sports', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '24', title: 'Thor: Love and Thunder', category: 'Sports', img: 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '25', title: 'The Matrix Resurrections', category: 'Corporate', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '26', title: 'Wonder Woman 1984', category: 'Lifestyle', img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '27', title: 'Guardians of the Galaxy Vol. 3', category: 'Corporate', img: 'https://images.unsplash.com/photo-1485098262243-ea7631fec367?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '28', title: 'Oppenheimer', category: 'Documentaries', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '29', title: 'Barbie', category: 'Lifestyle', img: 'https://images.unsplash.com/photo-1531259683007-01397e899182?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '30', title: 'Top Gun: Maverick', category: 'Sports', img: 'https://images.unsplash.com/photo-1598897135853-90d56621252e?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '31', title: 'Mission Impossible', category: 'Travel', img: 'https://images.unsplash.com/photo-1525498128445-66d4825950dc?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '32', title: 'John Wick: Chapter 4', category: 'Sports', img: 'https://images.unsplash.com/photo-1550101617-dc139a028670?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' },
  { id: '33', title: 'Mad Max: Fury Road', category: 'Sports', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761' }
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
  
  // Quadruple the items to make sure it covers even very wide screen widths without gaps
  const itemsRow1 = [...clients, ...clients, ...clients, ...clients];
  const itemsRow2 = [...clients.slice().reverse(), ...clients.slice().reverse(), ...clients.slice().reverse(), ...clients.slice().reverse()];

  return (
    <section 
      id="clients" 
      className="pt-12 md:pt-28 pb-10 md:pb-16 bg-transparent overflow-hidden relative" 
      ref={containerRef}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex flex-col items-start relative z-20">
        <div className="text-left mb-8 md:mb-14">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl md:text-6xl font-black tracking-tighter text-orange-500 uppercase italic mb-2"
          >
            Our Clients
          </motion.h3>
          <p className="text-xs md:text-sm text-zinc-400 font-medium tracking-wide uppercase">
            Trusted by the world's most progressive brands & organizations
          </p>
        </div>

        {/* Scrolling Marquees */}
        <div className="w-full space-y-6 md:space-y-8">
          {/* Top Row - Scrolling Left to Right (animate x from -1920 to 0) */}
          <div className="flex overflow-hidden relative w-full mask-gradient py-4 md:py-6">
            <motion.div 
              animate={{ x: [-1920, 0] }}
              transition={{ 
                duration: 35, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex whitespace-nowrap gap-0 py-1"
            >
              {itemsRow1.map((client, i) => (
                <ClientLogo key={`${client.name}-r1-${i}`} client={client} />
              ))}
            </motion.div>
          </div>

          {/* Bottom Row - Scrolling Right to Left (animate x from 0 to -1920) */}
          <div className="flex overflow-hidden relative w-full mask-gradient py-4 md:py-6">
            <motion.div 
              animate={{ x: [0, -1920] }}
              transition={{ 
                duration: 38, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex whitespace-nowrap gap-0 py-1"
            >
              {itemsRow2.map((client, i) => (
                <ClientLogo key={`${client.name}-r2-${i}`} client={client} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Styled inline mask for smooth fade edges on the marquee views */}
      <style>{`
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
        }
      `}</style>
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
    <div 
      className="flex items-center justify-center px-8 md:px-14 h-12 md:h-18 flex-shrink-0 relative overflow-hidden select-none cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
    >
      {hasLogoUrl ? (
        <img 
          src={client.logoUrl} 
          alt={client.name} 
          className="max-h-full max-w-[140px] md:max-w-[220px] object-contain pointer-events-none"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center justify-center text-center">
          <span 
            className="text-sm md:text-xl font-bold uppercase tracking-widest text-zinc-100 font-sans block hover:text-orange-500 transition-colors"
          >
            {client.name}
          </span>
        </div>
      )}
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

                  const carouselTransition = {
                    type: 'spring',
                    stiffness: 300,
                    damping: 26,
                    mass: 0.55
                  };

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
                      transition={carouselTransition}
                      className="absolute will-change-transform"
                    >
                      {/* Member Container - Using layout with optimized transition for smooth rapid morphing */}
                      <motion.div
                        layout
                        transition={carouselTransition}
                        className={`relative flex flex-col items-center overflow-hidden h-fit ${
                          isCenter 
                            ? 'w-[230px] md:w-[360px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.7)]' 
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
                          transition={carouselTransition}
                          className={`relative overflow-hidden w-full ${
                            isCenter ? 'aspect-[3/4]' : 'h-full'
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
                              transition={carouselTransition}
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
                                transition={carouselTransition}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                              >
                                <motion.h4 
                                   layout
                                   transition={carouselTransition}
                                  className="text-xl md:text-4xl font-black italic text-white uppercase tracking-tighter text-left"
                                >
                                  {member.name}
                                </motion.h4>
                                <motion.p 
                                  layout
                                  transition={carouselTransition}
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


const HOME_CATEGORIES = [
  {
    name: "Branded Content",
    desc: "Premium commercial campaigns & brand stories",
    img: "https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(249, 115, 22, 0.4)"
  },
  {
    name: "Documentaries",
    desc: "Real-world narratives & raw human storytelling",
    img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(59, 130, 246, 0.4)"
  },
  {
    name: "Travel",
    desc: "Cinematic adventures across global horizons",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(16, 185, 129, 0.4)"
  },
  {
    name: "Corporate",
    desc: "Polished workspace narratives & corporate messaging",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(236, 72, 153, 0.4)"
  },
  {
    name: "Sports",
    desc: "Adrenaline-fueled athletic motion & dynamics",
    img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(245, 158, 11, 0.4)"
  },
  {
    name: "Lifestyle",
    desc: "Cozy spaces, curated travel, luxury & foods",
    img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(139, 92, 246, 0.4)"
  }
];

function Portfolio() {
  const navigate = useNavigate();
  const [films, setFilms] = useState<any[]>([]);
  const [title, setTitle] = useState('Films');
  const [visible, setVisible] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  useEffect(() => {
    const loadData = () => {
      // 1. Load configuration
      setVisible(localStorage.getItem('home_films_visible') !== 'false');
      setTitle(localStorage.getItem('home_films_title') || 'Films');

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

  return (
    <section id="films" className="pt-12 md:pt-20 pb-12 md:pb-24">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="text-left mb-16 md:mb-20">
          <div className="relative mb-2">
              <motion.h3 
                initial={{ x: -25, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-7xl font-[1000] text-orange-500 tracking-[-0.05em] uppercase italic leading-none drop-shadow-[0_0_60px_rgba(249,115,22,0.2)] pointer-events-none select-none"
              >
                {title}
              </motion.h3>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1.2 }}
            className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.3em] font-mono"
          >
            Select a cinematic category underneath to immerse yourself in our craft
          </motion.p>
        </div>

        {/* Single SVG Definition for high-performance orange glow, declared once rather than inside loop */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <defs>
            <linearGradient id="orangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14 lg:gap-16 pb-12">
          {HOME_CATEGORIES.map((category, idx) => (
            <motion.div 
              key={category.name}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: true }}
              onClick={() => {
                const sectionId = category.name.toLowerCase().replace(/\s+/g, '-');
                navigate(`/films#${sectionId}`);
              }}
              className="flex flex-col items-center justify-center cursor-pointer group text-center"
            >
              {/* Giant Outer Orbit Ring - Animating with GPU-accelerated CSS floats */}
              <div 
                className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center ${
                  idx === 0 ? 'animate-float-gentle' : idx === 1 ? 'animate-scale-gentle' : 'animate-pulse-glow'
                }`}
              >
                {/* Floating translucent interactive bubbles - optimized count of 3 to diminish CPU painting loops */}
                {[...Array(3)].map((_, bIdx) => {
                  const size = 6 + (bIdx * 4); // 6px to 14px
                  const startX = 25 + (bIdx * 25); // 25% to 75%
                  const duration = 4.5 + (bIdx * 1.5); 
                  const delay = bIdx * 0.8;
                  return (
                    <motion.div
                      key={bIdx}
                      className="absolute rounded-full pointer-events-none z-10"
                      style={{
                        width: size,
                        height: size,
                        left: `${startX}%`,
                        bottom: "8%",
                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(249,115,22,0.1) 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 10px rgba(249,115,22,0.05)",
                      }}
                      animate={{
                        y: [0, -160],
                        x: [0, Math.sin(bIdx) * 10, Math.cos(bIdx) * -10, 0],
                        opacity: [0, 0.6, 0.6, 0],
                      }}
                      transition={{
                        duration: duration,
                        repeat: Infinity,
                        delay: delay,
                        ease: "easeOut"
                      }}
                    />
                  );
                })}

                {/* Double Ring / Rotating Lens Boundary - Rotates smoothly at 60fps utilizing standard CSS transforms */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none animate-spin-slow" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="47" 
                    fill="transparent" 
                    stroke="rgba(255,255,255,0.03)" 
                    strokeWidth="1.5"
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="47" 
                    fill="transparent" 
                    stroke="url(#orangeGlow)" 
                    strokeWidth="1.5"
                    strokeDasharray="30 15 10 5"
                  />
                </svg>

                {/* Outer spinning dash border on hover */}
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-orange-500/0 group-hover:border-orange-500/40 group-hover:rotate-180 transition-all duration-[2000ms] pointer-events-none" />

                {/* Colored glowing halo behind the frame */}
                <div 
                  className="absolute inset-4 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                  style={{ backgroundColor: category.glow }}
                />

                {/* Inner continuous frame outline */}
                <div className="absolute inset-3 rounded-full border border-white/5 group-hover:border-orange-500/25 transition-all duration-500 pointer-events-none" />

                {/* Centered Circle Mask for category artwork */}
                <div className="absolute inset-[15px] rounded-full overflow-hidden border-[4px] border-black group-hover:border-orange-500 transition-all duration-500 z-10 shadow-2xl">
                  <img 
                    src={category.img} 
                    alt={category.name} 
                    className="w-full h-full object-cover grayscale brightness-[0.7] group-hover:grayscale-0 group-hover:scale-110 group-hover:brightness-100 transition-all duration-700 ease-out" 
                  />
                  {/* Atmospheric dark radial vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-all duration-500" />

                  {/* Category name inside frame */}
                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 group-hover:bg-black/10 transition-all duration-500">
                    <h4 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter text-white uppercase text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] group-hover:text-orange-500 group-hover:scale-105 transition-all duration-500 font-sans pointer-events-none select-none">
                      {category.name}
                    </h4>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Films Grid Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl"
            onClick={() => setSelectedCategory(null)}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full border border-white/10 hover:border-white/30 text-white flex items-center justify-center bg-black hover:text-orange-500 transition-all z-10 font-sans"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="relative w-full max-w-6xl max-h-[85vh] bg-zinc-950/90 border border-white/5 rounded-[2.5rem] p-6 md:p-12 overflow-y-auto shadow-2xl custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-8 md:mb-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="w-8 h-[1.5px] bg-orange-500" />
                  <span className="text-xs text-orange-500 font-black uppercase tracking-[0.4em]">Cinematic Universe</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic text-white leading-none">
                  {selectedCategory.name}
                </h3>
                <p className="text-white/40 text-xs md:text-sm mt-3 max-w-2xl font-medium leading-relaxed">
                  {selectedCategory.desc}
                </p>
              </div>

              {films.filter(film => film.category === selectedCategory.name).length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-white/30 text-sm font-black uppercase tracking-widest">No cinematic works added yet under this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {films.filter(film => film.category === selectedCategory.name).map((film, idx) => (
                    <motion.div
                      key={film.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        setSelectedVideo(film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761');
                      }}
                      className="group relative aspect-video overflow-hidden rounded-2xl cursor-pointer bg-zinc-950 border border-white/5 shadow-lg"
                    >
                      <img
                        src={film.img}
                        alt={film.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />
                      
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <h5 className="text-lg font-black text-white uppercase italic leading-none truncate group-hover:text-orange-500 transition-colors">
                          {film.title}
                        </h5>
                      </div>

                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-300">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 fill-current translate-x-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {isEmbedUrl(selectedVideo) ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo, false)} 
                  className="w-full h-full border-none" 
                  allow="autoplay; encrypted-media; fullscreen" 
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
    { name: 'CONTENT', to: '/films' },
    { name: 'BRAND', to: '/brand' },
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

  const [instagram, setInstagram] = useState('#');
  const [facebook, setFacebook] = useState('#');
  const [youtube, setYoutube] = useState('#');
  const [twitter, setTwitter] = useState('#');

  const loadSocials = () => {
    setInstagram(localStorage.getItem('social_instagram') || '#');
    setFacebook(localStorage.getItem('social_facebook') || '#');
    setYoutube(localStorage.getItem('social_youtube') || '#');
    setTwitter(localStorage.getItem('social_twitter') || '#');
  };

  useEffect(() => {
    loadSocials();
    window.addEventListener('storage', loadSocials);
    window.addEventListener('storage_updated_socials', loadSocials);
    return () => {
      window.removeEventListener('storage', loadSocials);
      window.removeEventListener('storage_updated_socials', loadSocials);
    };
  }, []);

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
                { name: 'Instagram', icon: <Instagram size={18} />, color: 'hover:text-[#E4405F]', url: instagram },
                { name: 'Facebook', icon: <Facebook size={18} />, color: 'hover:text-[#1877F2]', url: facebook },
                { name: 'Youtube', icon: <Youtube size={18} />, color: 'hover:text-[#FF0000]', url: youtube },
                { name: 'Twitter', icon: <Twitter size={18} />, color: 'hover:text-[#1DA1F2]', url: twitter }
              ].map(social => (
                <a 
                  key={social.name} 
                  href={social.url === '#' ? undefined : social.url} 
                  target={social.url !== '#' ? "_blank" : undefined}
                  rel={social.url !== '#' ? "noopener noreferrer" : undefined}
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
  const navigate = useNavigate();
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

  const cosmicVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
        mass: 1.1
      }
    }
  };

  return (
    <section className="pt-12 md:pt-24 pb-0 md:pb-0 overflow-hidden">
      <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 max-w-[1800px] mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          className="w-full pb-16 md:pb-24 font-sans select-none"
        >
          {/* Three Paragraphs Layout - Styled elegantly with uppercase, italic, slightly smaller but heroic typography */}
          <div className="w-full space-y-12 md:space-y-16">
            {/* Paragraph 1 - Left Aligned */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              whileHover={{ scale: 1.01, y: -2 }}
              viewport={{ once: false, amount: 0.15 }}
              className="w-full max-w-5xl text-left origin-left cursor-default p-4 rounded-xl transition-colors duration-300 hover:bg-white/[0.01]"
              variants={{
                hidden: { opacity: 0, x: 200 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 45,
                    damping: 15,
                    staggerChildren: 0.12,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              <h2 className="tracking-tighter uppercase leading-[1.3] flex flex-wrap items-center gap-y-3 overflow-hidden">
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-cinzel text-orange-500 text-xl sm:text-2xl md:text-[2.0rem] lg:text-[2.4rem] font-bold tracking-wider inline-block align-middle mr-2"
                >
                  DREAMCATCHERS FILMS PVT. LTD.
                </motion.span>
                
                {/* Frame 1: Vertical Portrait Film Negative Gel Slide */}
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0, scale: 0.8 },
                    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.15, rotate: 3, zIndex: 10, boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}
                  className="inline-block mx-2 align-middle shrink-0 cursor-pointer"
                >
                  <div className="w-[3rem] h-[4rem] sm:w-[4.2rem] sm:h-[5.5rem] md:w-[5.2rem] md:h-[6.8rem] rounded-md overflow-hidden border-2 border-white/20 bg-neutral-950 shadow-[0_4px_15px_rgba(0,0,0,0.6)] relative group animate-float-gentle">
                    <img 
                      src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=200" 
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-x-0 top-1 flex justify-between px-1 opacity-50 text-[5px] font-mono text-white pointer-events-none">
                      <span>▲</span><span>KODAK</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />
                  </div>
                </motion.span>

                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-courier italic lowercase font-normal text-white/50 text-base sm:text-xl md:text-[1.3rem] lg:text-[1.5rem] leading-snug align-middle mx-1"
                >
                  is an award-winning
                </motion.span>

                {/* Frame 2: Panoramic 2.39:1 Anamorphic Widescreen Strip */}
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0, scale: 0.8 },
                    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.15, rotate: -2, zIndex: 10, boxShadow: "0 0 25px rgba(249,115,22,0.25)" }}
                  className="inline-block mx-2 align-middle shrink-0 cursor-pointer"
                >
                  <div className="w-[4.5rem] h-[1.9rem] sm:w-[6.4rem] sm:h-[2.7rem] md:w-[8.2rem] md:h-[3.5rem] rounded-sm overflow-hidden border-y-2 border-orange-500/50 bg-neutral-900 shadow-[0_4px_15px_rgba(0,0,0,0.6)] relative group animate-scale-gentle">
                    <img 
                      src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=240" 
                      className="w-full h-full object-cover contrast-125 brightness-90 group-hover:brightness-100 group-hover:scale-110 transition-all duration-750" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-orange-500/10 mix-blend-color group-hover:opacity-0 transition-opacity duration-300" />
                    <div className="absolute inset-x-0 bottom-0.5 flex justify-center text-[4px] font-mono text-orange-400 opacity-60 pointer-events-none">
                      2.39:1 CINEMASCOPE
                    </div>
                  </div>
                </motion.span>

                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-syne font-extrabold text-white/80 text-lg sm:text-xl md:text-[1.5rem] lg:text-[1.8rem] tracking-tight leading-snug align-middle ml-1"
                >
                  CREATIVE AGENCY HEADQUARTERED IN INDIA
                </motion.span>
              </h2>
            </motion.div>

            {/* Paragraph 2 - Right Aligned (staggered slightly) */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              whileHover={{ scale: 1.01, y: -2 }}
              viewport={{ once: false, amount: 0.15 }}
              className="w-full flex justify-end origin-right cursor-default p-4 rounded-xl transition-colors duration-300 hover:bg-white/[0.01]"
              variants={{
                hidden: { opacity: 0, x: -200 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 45,
                    damping: 15,
                    staggerChildren: 0.12,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              <div className="w-full max-w-5xl text-right">
                <h2 className="tracking-tighter uppercase leading-[1.3] flex flex-wrap items-center justify-end gap-y-3 overflow-hidden">
                  <motion.span 
                    variants={{
                      hidden: { y: 60, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="font-space text-white/80 text-sm sm:text-lg md:text-[1.2rem] lg:text-[1.4rem] font-bold leading-snug align-middle mr-1"
                  >
                    AGENCY HEADQUARTERED IN INDIA.
                  </motion.span>

                  <motion.span 
                    variants={{
                      hidden: { y: 60, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="font-playfair italic lowercase font-normal text-white/50 text-sm sm:text-lg md:text-[1.3rem] lg:text-[1.5rem] leading-snug align-middle mx-1"
                  >
                    with offices in Delhi, Mumbai, Goa, as well as
                  </motion.span>

                  {/* Frame 4: Circular Camera Lens / Aperture ring */}
                  <motion.span 
                    variants={{
                      hidden: { y: 60, opacity: 0, scale: 0.8 },
                      visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    whileHover={{ scale: 1.25, rotate: 15, zIndex: 10 }}
                    className="inline-block mx-2 align-middle shrink-0 cursor-pointer"
                  >
                    <div className="w-[3.2rem] h-[3.2rem] sm:w-[4.4rem] sm:h-[4.4rem] md:w-[5.8rem] md:h-[5.8rem] rounded-full overflow-hidden border-2 border-orange-500/60 p-[3px] bg-neutral-950 shadow-[0_0_20px_rgba(249,115,22,0.3)] relative group animate-spin-slow">
                      <div className="w-full h-full rounded-full overflow-hidden relative">
                        <img 
                          src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=200" 
                          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500" 
                          alt="" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 border-[3px] border-black/30 rounded-full" />
                        <div className="absolute inset-0 bg-radial from-transparent to-black/80 group-hover:to-black/30 transition-all duration-300" />
                      </div>
                    </div>
                  </motion.span>

                  <motion.span 
                    variants={{
                      hidden: { y: 60, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="font-bebas text-orange-500 text-xl sm:text-3xl md:text-[2.2rem] lg:text-[2.6rem] tracking-wider inline-block align-middle ml-1"
                  >
                    DUBAI AND NAIROBI.
                  </motion.span>
                </h2>
              </div>
            </motion.div>

            {/* Paragraph 3 - Left Aligned */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              whileHover={{ scale: 1.01, y: -2 }}
              viewport={{ once: false, amount: 0.15 }}
              className="w-full max-w-5xl text-left origin-left cursor-default p-4 rounded-xl transition-colors duration-300 hover:bg-white/[0.01]"
              variants={{
                hidden: { opacity: 0, x: 200 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 45,
                    damping: 15,
                    staggerChildren: 0.12,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              <h2 className="tracking-tighter uppercase leading-[1.3] flex flex-wrap items-center gap-y-3 overflow-hidden">
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-playfair italic lowercase font-bold text-orange-500 text-lg sm:text-2xl md:text-[2.0rem] lg:text-[2.3rem] inline-block align-middle mr-2"
                >
                  for over two decades,
                </motion.span>

                {/* Frame 5: Parallelogram Skewed Film Panel */}
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0, scale: 0.8 },
                    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.15, skewX: 0, rotate: 2, zIndex: 10, boxShadow: "0 0 20px rgba(255,255,255,0.25)" }}
                  className="inline-block mx-2 align-middle shrink-0 cursor-pointer"
                >
                  <div className="w-[3.5rem] h-[2.2rem] sm:w-[5.2rem] sm:h-[3.2rem] md:w-[6.8rem] md:h-[4.2rem] rounded-md overflow-hidden border border-white/20 bg-neutral-900 shadow-[0_4px_15px_rgba(0,0,0,0.6)] relative group animate-skew-gentle">
                    <div className="w-full h-full skew-x-[12deg] scale-[1.3] group-hover:scale-[1.1] group-hover:skew-x-0 transition-all duration-500">
                      <img 
                        src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200" 
                        className="w-full h-full object-cover" 
                        alt="" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                </motion.span>

                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-bebas text-white/70 text-base sm:text-xl md:text-[1.5rem] lg:text-[1.8rem] tracking-wider leading-snug align-middle mx-1"
                >
                  WE HAVE PRODUCED CONTENT ACROSS FORMATS FOR
                </motion.span>

                {/* Frame 6: Retro Curved TV/CRT Glass Frame */}
                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0, scale: 0.8 },
                    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.15, rotate: -4, zIndex: 10, boxShadow: "0 0 25px rgba(249,115,22,0.4)" }}
                  className="inline-block mx-2 align-middle shrink-0 cursor-pointer"
                >
                  <div className="w-[3.5rem] h-[2.2rem] sm:w-[5.2rem] sm:h-[3.2rem] md:w-[6.8rem] md:h-[4.2rem] rounded-tl-[1.8rem] rounded-br-[1.8rem] rounded-tr-[0.4rem] rounded-bl-[0.4rem] overflow-hidden border border-white/25 bg-neutral-900 shadow-[0_4px_15px_rgba(0,0,0,0.6)] relative group animate-pulse-glow">
                    <img 
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200" 
                      className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-500" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay" />
                    <div className="absolute inset-0 border-[3px] border-black/40 rounded-tl-[1.8rem] rounded-br-[1.8rem] rounded-tr-[0.4rem] rounded-bl-[0.4rem]" />
                  </div>
                </motion.span>

                <motion.span 
                  variants={{
                    hidden: { y: 60, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                  }}
                  className="font-courier text-white/80 text-sm sm:text-lg md:text-[1.3rem] lg:text-[1.5rem] font-bold leading-snug align-middle ml-1"
                >
                  LEADING BRANDS AND CHANNEL PARTNERS,
                </motion.span>
              </h2>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-36 xl:gap-44 items-center pt-16 pb-16 md:pb-24 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            className="group relative flex flex-col items-center justify-center h-[500px] md:h-[700px] bg-transparent transition-all duration-700"
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

                {/* Visual Orbit Path Line */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    width: typeof window !== 'undefined' ? (window.innerWidth > 768 ? '930px' : '420px') : '930px',
                    height: '210px', // Slightly deeper path for expanded Z depth
                    transform: 'rotateX(78deg) translateY(10px)',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{
                    opacity: [0.12, 0.40, 0.12],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Outer Dashed Orbit Ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-orange-500/25 group-hover:border-orange-500/40 transition-colors duration-1000 shadow-[0_0_60px_rgba(249,115,22,0.1)]" />
                  
                  {/* Inner Accent Ring */}
                  <div className="absolute inset-[12px] rounded-full border border-white/5" />
                  
                  {/* Atmospheric Glow */}
                  <div className="absolute inset-[-16px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03)_0%,transparent_70%)]" />
                </motion.div>

                {/* Orbiting Planets - Now in the same container for unified stacking context */}
                {activeOrbitImages.map((img, i) => (
                  <OrbitingFrame key={i} index={i} total={activeOrbitImages.length} item={img} />
                ))}
             </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="space-y-10 flex flex-col items-start text-left w-full lg:pl-10 xl:pl-16"
          >
             <motion.div variants={itemVariants} className="flex items-center gap-6 group/dc w-full justify-start">
                <motion.span 
                  whileHover={{ scale: 1.2, rotate: -5 }}
                  className="text-2xl font-black italic tracking-tighter text-orange-500 leading-none cursor-default drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                  DC
                </motion.span>
                <div className="h-[1px] w-36 sm:w-64 md:w-96 lg:w-[28rem] bg-gradient-to-r from-orange-500/50 via-white/10 to-transparent" />
             </motion.div>
             
             <div className="overflow-hidden w-full flex justify-start">
               <motion.p 
                 variants={{
                   hidden: { opacity: 0 },
                   visible: { 
                     opacity: 1,
                     transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                   }
                 }}
                 className="text-xl md:text-3xl lg:text-[2.5rem] text-orange-500 font-extrabold leading-[1.15] tracking-tight uppercase italic flex flex-wrap justify-start text-left gap-y-1 max-w-[620px] md:max-w-[760px] lg:max-w-[900px]"
               >
                 {"DREAMCATCHERS BEGAN WITH TWO BROTHERS AND AN OBSESSION WITH TELLING GREAT STORIES.".split(" ").map((word, i) => (
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
                     whileHover={{ scale: 1.1, color: "#fff", rotate: i % 2 === 0 ? 4 : -4 }}
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
                 visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.6 } }
               }}
               className="text-sm sm:text-base md:text-lg text-orange-500/50 leading-relaxed max-w-2xl font-bold border-l-2 border-orange-600/70 pl-6 text-left"
             >
               As more clients showed faith in us, our tribe grew, and here we are today! We&apos;re a happy bunch of people pushing the creative envelope.
             </motion.p>

             <motion.button 
               variants={itemVariants}
               onClick={() => navigate('/story')}
               whileHover={{ 
                 scale: 1.03, 
                 backgroundColor: "#f97316", 
                 color: "#ffffff",
                 boxShadow: "0 15px 30px -10px rgba(249,115,22,0.4)" 
               }}
               className="group flex items-center gap-5 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full transition-all shadow-2xl active:scale-95 pointer-events-auto cursor-pointer"
             >
               <span>Explore Our Story</span>
               <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
             </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const getVimeoEmbedUrl = (url: string) => {
  if (!url) return '';
  // Extract Vimeo video ID
  let videoId = '';
  if (url.includes('/external/')) {
    const match = url.match(/\/external\/(\d+)\./);
    if (match && match[1]) {
      videoId = match[1];
    } else {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      videoId = lastPart.split('.')[0].split('?')[0];
    }
  } else if (url.includes('video/')) {
    const parts = url.split('video/');
    if (parts.length > 1) {
      videoId = parts[1].split('?')[0];
    }
  } else {
    // Try to get any numbers in the path which is the ID
    const matches = url.match(/\/(\d+)(\/|\?|$)/);
    if (matches && matches[1]) {
      videoId = matches[1];
    } else {
      videoId = url.split('/').pop()?.split('?')[0] || '';
    }
  }
  
  if (videoId && /^\d+$/.test(videoId)) {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

const isEmbedUrl = (url: string) => {
  if (!url) return false;
  const lowercase = url.toLowerCase();
  
  // Direct file extensions that are NOT Vimeo links should play in <video> tags
  if (
    (lowercase.includes('.mp4') || lowercase.includes('.webm') || lowercase.includes('.ogg')) &&
    !lowercase.includes('vimeo.com')
  ) {
    return false;
  }
  
  return (
    lowercase.includes('iframe') ||
    lowercase.includes('embed') ||
    lowercase.includes('cloudflarestream.com') ||
    lowercase.includes('player.vimeo.com') ||
    lowercase.includes('vimeo.com') ||
    lowercase.includes('youtube.com') ||
    lowercase.includes('youtu.be') ||
    lowercase.includes('drive.google.com')
  );
};

const getEmbedUrl = (url: string, asBackground = true) => {
  if (!url) return '';
  try {
    if (url.includes('drive.google.com')) {
      // Extract Google Drive File ID
      let fileId = '';
      if (url.includes('/file/d/')) {
        const parts = url.split('/file/d/');
        if (parts.length > 1) {
          fileId = parts[1].split('/')[0].split('?')[0];
        }
      } else {
        try {
          const urlObj = new URL(url);
          fileId = urlObj.searchParams.get('id') || '';
        } catch (err) {
          // fallback
        }
      }
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      return url;
    }

    if (url.includes('vimeo.com')) {
      const baseEmbed = getVimeoEmbedUrl(url);
      const urlObj = new URL(baseEmbed);
      urlObj.searchParams.set('autoplay', '1');
      if (asBackground) {
        urlObj.searchParams.set('loop', '1');
        urlObj.searchParams.set('muted', '1');
        urlObj.searchParams.set('background', '1');
      } else {
        urlObj.searchParams.set('loop', '0');
        urlObj.searchParams.set('muted', '0');
        urlObj.searchParams.set('controls', '1');
      }
      urlObj.searchParams.set('quality', '1080p'); // Force HD 1080p high quality on Vimeo!
      return urlObj.toString();
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let embedUrl = url;
      if (url.includes('watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/').split('&')[0];
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      const urlObj = new URL(embedUrl);
      urlObj.searchParams.set('autoplay', '1');
      if (asBackground) {
        urlObj.searchParams.set('loop', '1');
        urlObj.searchParams.set('mute', '1');
        urlObj.searchParams.set('controls', '0');
      } else {
        urlObj.searchParams.set('loop', '0');
        urlObj.searchParams.set('mute', '0');
        urlObj.searchParams.set('controls', '1');
      }
      urlObj.searchParams.set('vq', 'hd1080'); // Force HD 1080p quality on YouTube
      return urlObj.toString();
    }

    const urlObj = new URL(url);
    if (url.includes('cloudflarestream.com')) {
      urlObj.searchParams.set('autoplay', 'true');
      if (asBackground) {
        urlObj.searchParams.set('loop', 'true');
        urlObj.searchParams.set('muted', 'true');
        urlObj.searchParams.set('controls', 'false');
      } else {
        urlObj.searchParams.set('loop', 'false');
        urlObj.searchParams.set('controls', 'true');
      }
    }
    return urlObj.toString();
  } catch (e) {
    const separator = url.includes('?') ? '&' : '?';
    if (asBackground) {
      return `${url}${separator}autoplay=true&loop=true&muted=true&controls=false&vq=hd1080&quality=1080p`;
    } else {
      return `${url}${separator}autoplay=true&loop=false&controls=true&vq=hd1080&quality=1080p`;
    }
  }
};

function LandingPage() {
  const { scrollY } = useScroll();
  const starOpacity = useTransform(scrollY, [100, 700], [0, 1]);
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);

  const [backdropType, setBackdropType] = useState<'image' | 'video'>('video');
  const [backdropUrl, setBackdropUrl] = useState('https://player.vimeo.com/video/371433846');
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileView(isMobileUA || window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConfigs = () => {
    const type = (localStorage.getItem('home_hero_bg_type') || 'video') as 'image' | 'video';
    setBackdropType(type);
    if (type === 'video') {
      setBackdropUrl(localStorage.getItem('home_hero_bg_url') || 'https://player.vimeo.com/video/371433846');
    } else {
      setBackdropUrl(localStorage.getItem('home_hero_bg_url') || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071');
    }
  };

  const getMobileBackdropUrl = () => {
    const customImg = localStorage.getItem('home_hero_bg_image_url') || '';
    if (customImg) return customImg;
    
    const bgType = localStorage.getItem('home_hero_bg_type') || 'video';
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    if (bgType === 'image' && bgUrl) {
      return bgUrl;
    }
    return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071';
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
          {isMobileView ? (
            <img 
              src={getMobileBackdropUrl()} 
              alt="Cinematic Background" 
              className="w-full h-full object-cover opacity-80 animate-fade-in"
            />
          ) : backdropType === 'video' ? (
            isEmbedUrl(backdropUrl) ? (
              <iframe
                key={backdropUrl}
                src={getEmbedUrl(backdropUrl)}
                className="w-full h-full border-none object-cover opacity-60 scale-105 pointer-events-none"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <video 
                key={backdropUrl}
                src={backdropUrl} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover opacity-60"
              />
            )
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
          <Clients />
          <Portfolio />
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

export function ShowreelPage() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileView(isMobileUA || window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const bgType = localStorage.getItem('home_hero_bg_type') || 'video';
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    const savedShowreel = localStorage.getItem('home_showreel_url') || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
    
    // Play backdrop video or fallback to configured showreel if background is photo
    let activeUrl = savedShowreel;
    if (bgType === 'video' && bgUrl) {
      activeUrl = bgUrl;
    }
    setVideoUrl(activeUrl);
  }, []);

  // When video starts playing on mobile, attempt to request native full screen
  const handleVideoPlay = () => {
    if (isMobileView) {
      const video = videoElementRef.current;
      if (video) {
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(() => {});
        } else if ((video as any).webkitEnterFullscreen) {
          try {
            (video as any).webkitEnterFullscreen();
          } catch (e) {}
        }
      }
    }
  };

  // Tapping screen on mobile can also try to toggle browser full screen mode for maximum immersion
  const handleContainerClick = () => {
    if (isMobileView) {
      const isFullscreenNow = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreenNow) {
        const container = containerRef.current;
        if (container) {
          if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
          } else if ((container as any).webkitRequestFullscreen) {
            (container as any).webkitRequestFullscreen();
          }
        }
        
        const video = videoElementRef.current;
        if (video && (video as any).webkitEnterFullscreen) {
          try {
            video.webkitEnterFullscreen();
          } catch (e) {}
        }
      }
    }
  };

  const isEmbed = isEmbedUrl(videoUrl);

  const getAutoplayUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('drive.google.com')) {
        let fileId = '';
        if (url.includes('/file/d/')) {
          const parts = url.split('/file/d/');
          if (parts.length > 1) {
            fileId = parts[1].split('/')[0].split('?')[0];
          }
        } else {
          try {
            const urlObj = new URL(url);
            fileId = urlObj.searchParams.get('id') || '';
          } catch (err) {}
        }
        if (fileId) {
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return url;
      }

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const cleanUrl = url.replace('watch?v=', 'embed/').split('&')[0];
        const separator = cleanUrl.includes('?') ? '&' : '?';
        return `${cleanUrl}${separator}autoplay=1&controls=1&rel=0&vq=hd1080`;
      }
      
      if (url.includes('vimeo.com')) {
        const baseEmbed = getVimeoEmbedUrl(url);
        const separator = baseEmbed.includes('?') ? '&' : '?';
        return `${baseEmbed}${separator}autoplay=1&controls=1&quality=1080p`;
      }

      const urlObj = new URL(url);
      urlObj.searchParams.set('autoplay', '1');
      return urlObj.toString();
    } catch (e) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}autoplay=1`;
    }
  };

  const iframeSrc = getAutoplayUrl(videoUrl);

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center cursor-pointer md:cursor-default"
    >
      {/* Immersive Top Bar - Desktop Only */}
      {!isMobileView && (
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/85 via-black/45 to-transparent z-[100] flex items-center justify-between px-6 md:px-12 pointer-events-none">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 px-5 py-3 rounded-full bg-black/50 hover:bg-orange-500 backdrop-blur-md border border-white/10 hover:border-orange-500 text-white font-sans text-xs uppercase tracking-widest font-black transition-all duration-300 pointer-events-auto cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>

          <div className="text-right hidden sm:block md:block font-mono">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Cinema Presentation</p>
            <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mt-0.5">Showreel Playback</p>
          </div>
        </div>
      )}

      {/* Floating immersive Back/Exit button for native-feel mobile interface */}
      {isMobileView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
              if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
              }
            }
            navigate('/');
          }}
          className="absolute top-6 left-6 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/70 hover:bg-orange-500 backdrop-blur-md border border-white/15 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95 pointer-events-auto"
        >
          <ArrowLeft size={14} />
          <span>Exit</span>
        </button>
      )}

      {/* Video Content Container */}
      <div className="w-full h-full relative z-10 select-none overflow-hidden">
        {videoUrl ? (
          isEmbed ? (
            <iframe
              src={iframeSrc}
              title="Showreel Player"
              className={`border-none transition-all duration-300 ${
                isMobileView 
                  ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[178vh] h-[100vh] min-w-[100vw] min-h-[56.25vw] max-w-none' 
                  : 'w-full h-full'
              }`}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <video
              ref={videoElementRef}
              src={videoUrl}
              className={`bg-black transition-all duration-300 ${isMobileView ? 'absolute left-0 top-0 w-full h-full object-cover' : 'w-full h-full object-contain'}`}
              controls
              autoPlay
              playsInline
              onPlay={handleVideoPlay}
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/50">
            <div className="w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <span className="text-xs uppercase tracking-widest font-bold font-mono">Loading cinematic feed...</span>
          </div>
        )}
      </div>

      {/* Toast-like tap prompt overlay for Mobile Cinema */}
      {isMobileView && videoUrl && (
        <div className="absolute bottom-6 inset-x-0 mx-auto text-center z-50 pointer-events-none animate-pulse">
          <span className="bg-black/70 text-[9px] font-bold text-white/55 tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/5 shadow-2xl backdrop-blur-sm">
            Tap screen to toggle fullscreen theatre mode
          </span>
        </div>
      )}
    </div>
  );
}

const StoryChapterRow: FC<{
  ch: {
    id: string;
    timeline: string;
    title: string;
    quote: string;
    description: string;
    icon: any;
    color: string;
    tag: string;
  };
  idx: number;
  timecode: string;
}> = ({ ch, idx, timecode }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  
  // High-fidelity individual scroll progress tracking for parallax & organic moves
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"]
  });

  // Smooth cinematic transforms mapped beautifully to viewport scroll percentage
  const rawYText = useTransform(scrollYProgress, [0, 0.5, 1], [-40, 0, 40]);
  const rawYCard = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);
  const rawRotateCard = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);
  const rawScaleCard = useTransform(scrollYProgress, [0, 0.15, 0.5, 0.85, 1], [0.93, 0.98, 1, 0.98, 0.93]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.35, 1, 1, 0.35]);

  const IconComponent = ch.icon;

  return (
    <motion.div
      ref={rowRef}
      style={{ opacity: rawOpacity }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative pl-10 lg:pl-0 min-h-[460px] py-12"
    >
      {/* Central Chrono Node Dot Station */}
      <div className="absolute left-[-26px] lg:left-1/2 top-10 lg:top-1/2 -translate-y-1/2 lg:-translate-x-1/2 z-20 pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-8 h-8 rounded-full bg-black border-2 border-orange-500/60 flex items-center justify-center relative shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        >
          <motion.div 
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-orange-500/40"
          />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
        </motion.div>
        <span className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 font-mono text-[8px] tracking-[0.2em] text-orange-500/80 bg-neutral-950/90 px-2 py-0.5 rounded border border-orange-500/20 whitespace-nowrap">
          CH.{ch.id} STATION
        </span>
      </div>

      {/* Text Side (Odd/Even shifts layout for visual rhythm) */}
      <motion.div 
        style={{ y: rawYText }}
        className={`space-y-6 lg:col-span-7 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{ch.timeline}</span>
          {/* Note: horizontal line is COMPLETELY removed here per user constraint */}
        </div>

        <div className="space-y-1">
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.4em] font-extrabold block">Chapter {ch.id}</span>
          <h2 className="font-syne text-2xl md:text-3xl text-white font-extrabold leading-tight uppercase tracking-tight text-left">
            {ch.title}
          </h2>
        </div>

        {/* Main Quote with Highlight animation on hover */}
        <div className="overflow-hidden p-6 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl border border-white/5 backdrop-blur-md relative group hover:border-orange-500/20 transition-all duration-500">
          <div className="absolute top-4 right-4 text-white/5 group-hover:text-orange-500/15 transition-colors duration-500">
            <IconComponent size={40} />
          </div>
          <p className="font-playfair text-lg md:text-xl lg:text-2xl text-orange-400 font-bold italic leading-relaxed text-left">
            {ch.quote.split(" ").map((word, i) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.08, color: "#ffffff", rotate: i % 2 === 0 ? 1 : -1 }}
                className="inline-block mr-1.5 transition-colors duration-200 cursor-default font-serif"
              >
                {word}
              </motion.span>
            ))}
          </p>
        </div>

        {/* Subtext explanation paragraph */}
        <p className="text-sm md:text-base text-white/60 font-sans leading-relaxed text-left pl-2">
          {ch.description}
        </p>
      </motion.div>

      {/* Graphic Asset Side */}
      <motion.div 
        style={{ 
          y: rawYCard,
          rotate: rawRotateCard,
          scale: rawScaleCard
        }}
        className={`lg:col-span-5 flex items-center justify-center ${idx % 2 === 1 ? 'lg:order-1' : ''}`}
      >
        <div className="w-full max-w-sm aspect-square relative group">
          {/* Decorative background glow matching current color theme */}
          <div className={`absolute inset-0 bg-gradient-to-tr ${ch.color} rounded-3xl blur-[40px] opacity-40 group-hover:opacity-75 transition-opacity duration-1000`} />

          {/* Glass Card Containment */}
          <div className="w-full h-full rounded-3xl bg-neutral-950/40 backdrop-blur-xl border border-white/15 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover:border-orange-500/40 group-hover:scale-[1.02]">
            
            {/* Visual Segment Renderer according to chapter ID */}
            {ch.id === "01" && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 rounded-full border border-dashed border-orange-500/40 flex items-center justify-center"
                >
                  <div className="w-36 h-36 rounded-full border border-orange-500/20 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 rounded-full border border-dashed border-white/20 flex items-center justify-center"
                    />
                  </div>
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-12 h-12 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)] flex items-center justify-center z-10"
                >
                  <Heart size={16} className="text-orange-500 fill-orange-500" />
                </motion.div>

                {/* Interactive floating sparks inside container */}
                {Array.from({ length: 7 }).map((_, sparkIdx) => (
                  <motion.div
                    key={sparkIdx}
                    animate={{
                      y: [-15, -70, -15],
                      x: [0, (sparkIdx % 2 === 0 ? 18 : -18), 0],
                      opacity: [0, 0.7, 0],
                      scale: [0.5, 1.1, 0.5]
                    }}
                    transition={{
                      duration: 3 + sparkIdx,
                      repeat: Infinity,
                      delay: sparkIdx * 0.4,
                      ease: "easeInOut"
                    }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-orange-400 blur-[0.4px] pointer-events-none"
                    style={{
                      bottom: "22%",
                      left: `${15 + sparkIdx * 12}%`
                    }}
                  />
                ))}
                <span className="absolute bottom-2 font-mono text-[8.5px] tracking-[0.4em] text-orange-500/80 font-bold uppercase mt-4">SIBLINGS & MISSION</span>
              </div>
            )}

            {ch.id === "02" && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Simulation of Live TV raster/grids */}
                <div className="w-full h-44 rounded-2xl border border-blue-500/30 bg-blue-950/20 relative overflow-hidden flex flex-col items-center justify-center p-3">
                  
                  {/* Laser SCANLINE overlay */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[2px] bg-cyan-400 opacity-40 pointer-events-none" 
                  />
                  <div className="absolute inset-0 bg-retro-static opacity-[0.03] pointer-events-none" />

                  {/* Live flasher */}
                  <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                    <motion.div 
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_#dc2626]"
                    />
                    <span className="font-mono text-[8px] text-white/60 tracking-widest uppercase">REC [1080P/60]</span>
                  </div>

                  <div className="absolute top-3 right-4 z-10">
                    <span className="font-mono text-[8.5px] text-cyan-400 tracking-wider font-bold">{timecode}</span>
                  </div>
                  
                  {/* Dynamic visual spectrum frequency */}
                  <div className="flex items-end gap-1.5 h-16 w-full max-w-[200px] justify-center mt-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((val, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: [val * 3, val * 8, val * 3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
                        className="w-[3px] bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-cyan-400 mt-4 tracking-widest uppercase">DC-SPECTRUM // ONLINE</span>
                </div>
                <span className="font-mono text-[8px] tracking-[0.4em] text-white/40 block mt-4 uppercase">BROADCAST ROOTS</span>
              </div>
            )}

            {ch.id === "03" && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Morphic fluid bubble using border-radius variables inside framer motion */}
                <motion.div
                  animate={{
                    borderRadius: [
                      "42% 58% 70% 30% / 45% 45% 55% 55%",
                      "70% 30% 52% 48% / 60% 40% 60% 40%",
                      "42% 58% 70% 30% / 45% 45% 55% 55%"
                    ],
                    scale: [1, 1.05, 1],
                    rotate: [0, 8, 0]
                  }}
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/40 border border-teal-500/50 backdrop-blur-xl shadow-2xl flex items-center justify-center text-teal-400 relative"
                >
                  <Compass size={32} className="rotate-45" />

                  {/* Floating interactive tags in orbit around compass */}
                  {["CURIOSITY", "WIZARDRY", "PRECISION", "AESTHETIC"].map((tag, i) => {
                    const angles = [0, 90, 180, 270];
                    const rad = 72;
                    const xVal = Math.cos(angles[i] * Math.PI / 180) * rad;
                    const yVal = Math.sin(angles[i] * Math.PI / 180) * rad;
                    return (
                      <motion.div
                        key={tag}
                        animate={{
                          x: [xVal, xVal + 8, xVal - 8, xVal],
                          y: [yVal, yVal - 10, yVal + 10, yVal],
                        }}
                        transition={{
                          duration: 5 + i,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute px-2 py-0.5 rounded bg-black/90 border border-teal-500/30 text-[7.5px] font-mono tracking-widest text-teal-300 font-bold whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                      >
                        {tag}
                      </motion.div>
                    );
                  })}
                </motion.div>
                <span className="font-mono text-[8px] tracking-[0.4em] text-teal-400 block mt-6 uppercase">ORGANIC STUDIO RISE</span>
              </div>
            )}

            {ch.id === "04" && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Pulsing Concentric Circles representing Global Reach with RadarSweep */}
                <div className="relative w-36 h-36 rounded-full border border-rose-500/30 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-[15px] rounded-full border border-rose-500/25"
                  />
                  <motion.div 
                    animate={{ scale: [1.2, 1.7, 1.2], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-[0px] rounded-full border border-white/5"
                  />
                  
                  {/* Sweep ray indicator */}
                  <div className="absolute inset-0 rounded-full pointer-events-none">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 origin-center rounded-full border-r border-rose-500/40 bg-gradient-to-tr from-rose-500/5 to-transparent"
                    />
                  </div>

                  <Globe size={32} className="text-white relative animate-pulse" />

                  {/* Radar pinpoint beacons representing actual production offices */}
                  <div className="absolute -top-4 right-1">
                    <span className="font-mono text-[8px] text-white/70 bg-black/85 px-1.5 py-0.5 rounded border border-white/5 relative flex items-center gap-1">
                      DUBAI
                      <span className="relative flex h-1.5 w-1.5">
                        <motion.span animate={{ scale: [1, 2.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                      </span>
                    </span>
                  </div>
                  
                  <div className="absolute bottom-1 -left-5">
                    <span className="font-mono text-[8px] text-white/70 bg-black/85 px-1.5 py-0.5 rounded border border-white/5 relative flex items-center gap-1">
                      NAIROBI
                      <span className="relative flex h-1.5 w-1.5">
                        <motion.span animate={{ scale: [1, 2.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                      </span>
                    </span>
                  </div>

                  <div className="absolute top-1/2 -right-8">
                    <span className="font-mono text-[8px] text-orange-400 bg-black/85 px-1.5 py-0.5 rounded border border-orange-500/20 relative flex items-center gap-1 select-none">
                      MUMBAI
                      <span className="relative flex h-1.5 w-1.5">
                        <motion.span animate={{ scale: [1, 2.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                      </span>
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[8px] tracking-[0.4em] text-orange-500 block mt-6 uppercase">GLOBAL PRESENCE</span>
              </div>
            )}

            {/* Cinematic overlay reflection lines */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/5 pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function StoryPage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-fidelity active scroll percentage tracking for timeline connection line
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const [timecode, setTimecode] = useState("02:14:00:00");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Set up real time dynamic Timecode ticking for Broadcast monitoring section (Chapter 2)
  useEffect(() => {
    let frames = 0;
    let seconds = 0;
    let minutes = 14;
    let hours = 2;
    const interval = setInterval(() => {
      frames++;
      if (frames >= 30) {
        frames = 0;
        seconds++;
        if (seconds >= 60) {
          seconds = 0;
          minutes++;
          if (minutes >= 60) {
            minutes = 0;
            hours++;
          }
        }
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimecode(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  const storyChapters = [
    {
      id: "01",
      timeline: "THE INCEPTION / TWO BROTHERS",
      title: "THE SPARK & AN OBSESSION",
      quote: "Dreamcatchers began with two brothers and an obsession with telling great stories.",
      description: "Driven by an unrelenting need to frame reality into captivating narratives, the brothers unified their creative voices. Storytelling wasn't just a career path—it was an all-consuming obsession that governed every waking hour.",
      icon: Sparkles,
      color: "from-orange-500/20 to-amber-500/5",
      tag: "THE SPARK",
    },
    {
      id: "02",
      timeline: "THE CRUCIBLE / TELEVISION ROOTS",
      title: "CUTTING THEIR TEETH",
      quote: "Having cut their teeth at some of India's leading television networks, they set out to create the kind of content they wanted to watch—fresh, engaging, and driven by curiosity.",
      description: "In the high-pressure breeding grounds of prime-time national broadcasting, they mastered the technical mastery and emotional pacing of storytelling. They saw a landscape hungry for real discovery, and chose to build it themselves.",
      icon: Tv,
      color: "from-blue-600/20 to-purple-500/5",
      tag: "THE ROOTS",
    },
    {
      id: "03",
      timeline: "THE EVOLUTION / PASSION OUTPOST",
      title: "A PASSION UNFOLDS",
      quote: "What started as a small passion project soon turned into a creative studio.",
      description: "Boundaries dissolved as the basement fire ignited into a fully-fledged workshop. A sanctuary for rogue ideas, precision crafting, and high-purity art directed by pure curiosity and unyielding discipline.",
      icon: Compass,
      color: "from-emerald-500/20 to-teal-500/5",
      tag: "THE DESIGN",
    },
    {
      id: "04",
      timeline: "THE HORIZON / UNBOUNDED REACH",
      title: "GLOBAL FRONTIERS",
      quote: "Today, DC creates campaigns, films, series, branded content, for brands across the world.",
      description: "From local footprints to international visual signals, the DC stamp of craft now powers global narratives. Crossing screens, cultures, and formats with the exact same obsession that started it all.",
      icon: Globe,
      color: "from-rose-500/20 to-pink-500/5",
      tag: "THE FRONTIER",
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-orange-500 selection:text-white font-sans">
      {/* Background Interactive Aura */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 opacity-70"
        style={{
          background: `radial-gradient(700px at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, 0.08), transparent 80%)`
        }}
      />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0" />

      {/* Star Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <StarField count={120} />
      </div>

      {/* Back to Home Button & Banner */}
      <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-orange-500 text-white font-sans text-xs uppercase tracking-widest font-black transition-all duration-300 pointer-events-auto cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:border-orange-500 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Return</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">Our Chronicle // Story Hub</span>
        </div>
      </header>

      {/* Hero Banner Intro */}
      <section className="relative pt-24 pb-16 px-6 md:px-12 text-center max-w-5xl mx-auto z-10 flex flex-col items-center justify-center">
        <div className="space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] uppercase font-mono tracking-[0.5em] text-orange-500 font-extrabold block"
          >
            The Chronicles / Legacy
          </motion.span>
          
          {/* Blockbuster Cinema Split Title */}
          <h1 className="font-bebas text-5xl md:text-8xl tracking-wider uppercase leading-none text-white font-bold inline-block">
            {"THE CHRONICLES OF ".split(" ").map((w, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block mr-4"
              >
                {w}
              </motion.span>
            ))}
            <span className="text-orange-500 block sm:inline">
              {"DREAMCATCHERS".split("").map((char, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.1, delay: 0.4 + idx * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-block"
                  style={{ textShadow: "0 0 35px rgba(249,115,22,0.4)" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/40 text-xs sm:text-sm font-mono max-w-xl mx-auto mt-4 tracking-wide uppercase leading-relaxed text-center"
          >
            The fire that started as standard television roots blossomed into a relentless studio crafting premium films, campaigns, and formats for visual explorers worldwide.
          </motion.p>
        </div>

        {/* Live oscillating symmetric Soundwave line */}
        <div className="flex gap-1.5 items-center justify-center mt-12 h-10">
          {Array.from({ length: 19 }).map((_, i) => {
            const dist = Math.abs(i - 9);
            const maxHeight = 36 - dist * 2.8;
            return (
              <motion.div
                key={i}
                animate={{ 
                  height: [maxHeight * 0.15, maxHeight, maxHeight * 0.15],
                  backgroundColor: i % 2 === 0 ? "#f97316" : "#fb923c"
                }}
                transition={{
                  duration: 0.8 + (dist * 0.08),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1 rounded-full opacity-60"
              />
            );
          })}
        </div>
      </section>

      {/* Content Showcase Matrix in relative Container */}
      <div ref={containerRef} className="relative max-w-7xl mx-auto px-6 md:px-12 pb-32 z-10 space-y-36 md:space-y-56">
        
        {/* Absolute Glowing Scroll Connection Timeline Trail ribbon */}
        <div className="absolute left-8 lg:left-[50%] top-6 bottom-6 w-[2px] bg-white/5 -translate-x-1/2 pointer-events-none">
          <motion.div 
            style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
            className="w-full h-full bg-gradient-to-b from-orange-500 via-amber-500 to-rose-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]"
          />
        </div>

        {storyChapters.map((ch, idx) => (
          <StoryChapterRow 
            key={ch.id} 
            ch={ch} 
            idx={idx} 
            timecode={timecode} 
          />
        ))}
      </div>

      {/* Persistent creative footer of story section */}
      <footer className="relative py-24 bg-neutral-950 border-t border-white/5 text-center px-6 overflow-hidden z-10">
        
        {/* Ambient subtle glowing floor lines */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-0.5 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent blur-sm pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-6 relative z-10">
          <span className="text-[10px] tracking-[0.6em] font-mono text-orange-500/70 font-extrabold uppercase block">THE CONTINUING PLOT</span>
          
          <h3 className="font-syne text-2xl md:text-3xl font-extrabold uppercase tracking-tight">
            {"LET'S ENVELOPE THE NEXT CHAPTER".split(" ").map((word, i) => (
              <motion.span 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
          </h3>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-white/40 text-xs sm:text-sm font-mono uppercase tracking-wider leading-relaxed"
          >
            HAVE A SIGNIFICANT CONCEPT WAITING TO BE TOLD? LET&apos;S CRAFT IT CINEMATICALLY TOGETHER.
          </motion.p>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button 
              type="button"
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-full transition-all text-black hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(249,115,22,0.4)]"
            >
              Contact Dreamcatchers
            </button>
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-transparent hover:bg-white/[0.04] text-white/80 hover:text-white border border-white/10 rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95"
            >
              Back to Home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
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
        <Route path="/showreel" element={<ShowreelPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/films" element={<FilmsPage />} />
        <Route path="/brand" element={<BrandPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
