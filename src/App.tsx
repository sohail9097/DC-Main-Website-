import { motion, AnimatePresence, useScroll, useTransform, useTime } from 'motion/react';
import { Camera, Play, ChevronLeft, ChevronRight, Menu, X, Rocket, Moon, ShieldCheck, Instagram, Facebook, Youtube, Twitter, ArrowLeft, ArrowRight, Sparkles, Globe, Tv, Heart, Compass, Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState, useEffect, useRef, FC, memo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import FilmsPage from './pages/FilmsPage';
import AboutPage from './pages/AboutPage';
import BrandPage from './pages/BrandPage';
import { initSiteSync } from './lib/siteSync';
import { CinematicSlideshow } from './components/CinematicSlideshow';

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

export const OrbitingFrame: FC<{ index: number; total: number; item: any }> = ({ index, total, item }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const element = containerRef.current;
    if (!element) return;

    // Cache radiusX outside requestAnimationFrame loop to prevent layout thrashing
    let radiusX = typeof window !== 'undefined' ? (window.innerWidth > 768 ? 465 : (window.innerWidth > 480 ? 180 : 135)) : 465;
    let radiusZ = typeof window !== 'undefined' ? (window.innerWidth > 768 ? 170 : (window.innerWidth > 480 ? 80 : 55)) : 170;
    
    const handleResize = () => {
      radiusX = window.innerWidth > 768 ? 465 : (window.innerWidth > 480 ? 180 : 135);
      radiusZ = window.innerWidth > 768 ? 170 : (window.innerWidth > 480 ? 80 : 55);
    };
    window.addEventListener('resize', handleResize);

    const update = (time: number) => {
      // Map time to angle
      const angle = (time / 2200) + (index * (2 * Math.PI / total));
      
      const x = Math.sin(angle) * radiusX;
      const z = Math.cos(angle) * radiusZ;
      const y = Math.sin(angle * 1.5) * (window.innerWidth > 768 ? 20 : 8);

      // Normalizing Z between -radiusZ and radiusZ to range 0 and 1
      const normalizedZ = (z + radiusZ) / (2 * radiusZ);
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
              className="w-full h-full object-cover rounded-full transition-all duration-1000 group-hover:rotate-6"
              autoPlay
              loop
              muted
              playsInline
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={transformedUrl} 
              className="w-full h-full object-cover rounded-full transition-all duration-1000 group-hover:rotate-6" 
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

  const isBrandPage = location.pathname === '/brand';
  const isScrolledOrBrand = isScrolled || isBrandPage;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolledOrBrand 
        ? 'bg-black/60 backdrop-blur-md border-b border-white/5 shadow-xl shadow-black/20' 
        : 'bg-transparent'
    } ${isScrolled ? 'py-4' : 'py-10'}`}>
      <div className="max-w-[1920px] mx-auto px-6 md:px-24 lg:px-40 flex justify-between items-center">
        <Link to="/">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 md:gap-4 group"
          >
            {logoType === 'image' && logoImageUrl ? (
              <img 
                src={transformGoogleDriveUrl(logoImageUrl)} 
                alt={logoTextFull} 
                className="h-10 sm:h-12 md:h-14 object-contain max-w-[200px] transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
                referrerPolicy="no-referrer"
                onError={() => {
                  setLogoType('text');
                }}
              />
            ) : (
              <div className="flex items-center gap-0.5 select-none group">
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-white uppercase transition-colors duration-300 group-hover:text-orange-400">
                  DREAMCATCHERS
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-orange-500 uppercase">
                  .TV
                </span>
              </div>
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
              <div className="flex items-center gap-0.5 select-none">
                <span className="text-lg font-black tracking-wider text-white uppercase">
                  DREAMCATCHERS
                </span>
                <span className="text-lg font-black tracking-wider text-orange-500 uppercase">
                  .TV
                </span>
              </div>
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
            onClick={() => {
              const el = document.getElementById('contact-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/#contact-section');
              }
            }}
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
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'extralarge' | string;
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
  
  // Ensure we have enough items to span across very wide monitors dynamically
  let baseList = [...clients];
  while (baseList.length < 15) {
    baseList = [...baseList, ...clients];
  }

  const itemsRow1 = [...baseList, ...baseList];
  const itemsRow2 = [...baseList.slice().reverse(), ...baseList.slice().reverse()];

  return (
    <section 
      id="clients" 
      className="pt-12 md:pt-28 pb-10 md:pb-16 bg-transparent overflow-hidden relative snap-start snap-always" 
      ref={containerRef}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex flex-col items-start relative z-20">
        <div className="text-left mb-8 md:mb-14">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-helvetica-cond text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none"
          >
            Collaborators
          </motion.h3>
          <p className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.3em] font-mono">
            Trusted by the world's most progressive brands & organizations
          </p>
        </div>

        {/* Scrolling Marquees */}
        <div className="w-full space-y-6 md:space-y-8 overflow-hidden pointer-events-auto">
          {/* Top Row - Scrolling Left to Right (CSS Animation scroll-left) */}
          <div className="flex overflow-hidden relative w-full mask-gradient py-4 md:py-6">
            <div className="animate-scroll-left">
              {itemsRow1.map((client, i) => (
                <ClientLogo key={`${client.name}-r1-${client.id || i}-${i}`} client={client} />
              ))}
            </div>
          </div>

          {/* Bottom Row - Scrolling Right to Left (CSS Animation scroll-right) */}
          <div className="flex overflow-hidden relative w-full mask-gradient py-4 md:py-6">
            <div className="animate-scroll-right">
              {itemsRow2.map((client, i) => (
                <ClientLogo key={`${client.name}-r2-${client.id || i}-${i}`} client={client} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styled inline mask & keyframes for buttery smooth GPU-accelerated performance */}
      <style>{`
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 20%, white 80%, transparent);
        }
        @keyframes scroll-left {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 50s linear infinite;
          display: flex;
          width: max-content;
          will-change: transform;
        }
        .animate-scroll-right {
          animation: scroll-right 50s linear infinite;
          display: flex;
          width: max-content;
          will-change: transform;
        }
        /* Pause on hover to allow users to interact/inspect */
        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

interface ClientLogoProps {
  client: ClientItem;
}

const ClientLogo: FC<ClientLogoProps> = memo(({ client }) => {
  const [imgError, setImgError] = useState(false);
  const hasLogoUrl = client.logoUrl && client.logoUrl.trim().length > 0 && !imgError;

  // Reset imgError if the user updates the logoUrl so the new image loads
  useEffect(() => {
    setImgError(false);
  }, [client.logoUrl]);

  const size = client.size || 'medium';
  let imgClasses = '';
  let txtClasses = '';
  let pxClass = 'px-6 md:px-10';

  if (size === 'small') {
    imgClasses = 'h-8 md:h-12 max-w-[120px] md:max-w-[180px]';
    txtClasses = 'text-xs md:text-sm font-semibold';
    pxClass = 'px-5 md:px-8';
  } else if (size === 'medium') {
    imgClasses = 'h-12 md:h-18 max-w-[170px] md:max-w-[260px]';
    txtClasses = 'text-sm md:text-lg font-bold';
    pxClass = 'px-7 md:px-11';
  } else if (size === 'large') {
    imgClasses = 'h-16 md:h-24 max-w-[220px] md:max-w-[340px]';
    txtClasses = 'text-base md:text-2xl font-extrabold';
    pxClass = 'px-9 md:px-15';
  } else if (size === 'xlarge') {
    imgClasses = 'h-20 md:h-28 max-w-[280px] md:max-w-[420px]';
    txtClasses = 'text-lg md:text-3xl font-black';
    pxClass = 'px-11 md:px-18';
  } else if (
    size === 'extralarge' || 
    size === 'extra-large' || 
    size === 'xl' || 
    size === 'extra large'
  ) {
    imgClasses = 'h-24 md:h-[135px] max-w-[340px] md:max-w-[500px]';
    txtClasses = 'text-xl md:text-4xl font-black tracking-wider';
    pxClass = 'px-14 md:px-24';
  } else {
    // Default fallback (medium-ish)
    imgClasses = 'h-12 md:h-18 max-w-[170px] md:max-w-[260px]';
    txtClasses = 'text-sm md:text-lg font-bold';
    pxClass = 'px-7 md:px-11';
  }

  return (
    <div 
      className={`flex items-center justify-center ${pxClass} h-24 md:h-[155px] flex-shrink-0 relative overflow-hidden select-none cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
    >
      {hasLogoUrl ? (
        <img 
          src={transformGoogleDriveUrl(client.logoUrl)} 
          alt={client.name} 
          className={`${imgClasses} w-auto object-contain pointer-events-none shadow-sm`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center justify-center text-center">
          <span 
            className={`${txtClasses} font-bold uppercase tracking-widest text-zinc-100 font-sans block hover:text-orange-500 transition-colors`}
          >
            {client.name}
          </span>
        </div>
      )}
    </div>
  );
});

ClientLogo.displayName = 'ClientLogo';

export interface ParagraphFrameItem {
  id: string; // 'frame1', 'frame2', 'frame4', 'frame5', 'frame6'
  label: string;
  type: 'image' | 'video';
  url: string;
}

export const DEFAULT_PARAGRAPH_FRAMES: ParagraphFrameItem[] = [
  {
    id: 'frame1',
    label: 'Frame 1 (KODAK Film Slide)',
    type: 'video',
    url: 'https://drive.google.com/file/d/11IhUdtZgucLSQsiqe2OZb08DOhidbTmD/view?usp=sharing'
  },
  {
    id: 'frame2',
    label: 'Frame 2 (Anamorphic Strip)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=240'
  },
  {
    id: 'frame4',
    label: 'Frame 4 (Circular Aperture)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'frame5',
    label: 'Frame 5 (Skewed Clapperboard)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'frame6',
    label: 'Frame 6 (Retro CRT Frame)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200'
  }
];

export interface VerticalItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'image' | 'video';
  url: string;
}

export const DEFAULT_VERTICALS: VerticalItem[] = [
  {
    id: 'sports_box',
    label: 'Sports Box Vertical',
    title: 'SPORTS BOX',
    subtitle: 'SPORTS VERTICAL',
    description: 'INTERNATIONAL TOURNAMENT ORGANISING & BROADCAST',
    type: 'video',
    url: ''
  },
  {
    id: 'dc_digital',
    label: 'DC Digital Studio Vertical',
    title: 'DC DIGITAL STUDIO',
    subtitle: 'DIGITAL VERTICAL',
    description: 'SHORT FORM, DIGITAL, AI CONTENT',
    type: 'video',
    url: ''
  }
];

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  mediaType?: 'image' | 'video';
}

export interface OperationalLocation {
  id: string;
  city: string;
  cityAlt: string;
  title: string;
  address: string;
  phone: string;
  specialty: string;
  meta: string;
  localText: string;
  textY: number;
  fontSize: number;
  mapsUrl: string;
  path: string;
  mapImage?: string;
}

export const DEFAULT_LOCATIONS: OperationalLocation[] = [
  {
    id: "delhi",
    city: "DELHI",
    cityAlt: "Delhi NCR",
    title: "North India Hub",
    address: "820, Sector 21A, Pocket E, Sector 21, Gurugram, Delhi OCR, India",
    phone: "+91 98765 43211",
    specialty: "Brand Ad Strategy & Design",
    meta: "EST. 2016",
    localText: "दिल्ली",
    textY: 62,
    fontSize: 10.5,
    mapsUrl: "https://maps.google.com/?q=820,+Sector+21A,+Pocket+E,+Sector+21,+Gurugram,+Delhi+OCR",
    path: "M60 22 C75 22, 95 32, 95 52 C95 72, 75 88, 60 94 C45 88, 25 72, 25 52 C25 32, 45 22, 60 22 Z",
    mapImage: ""
  },
  {
    id: "mumbai",
    city: "MUMBAI",
    cityAlt: "Mumbai",
    title: "Corporate HQ & Post",
    address: "Grand Oasis Towers, Lower Parel, Mumbai, MH 400013, India",
    phone: "+91 98765 43210",
    specialty: "Film Division & Concert VFX",
    meta: "EST. 2012",
    localText: "मुम्बई",
    textY: 53,
    fontSize: 10,
    mapsUrl: "https://maps.google.com/?q=Grand+Oasis+Towers,+Lower+Parel,+Mumbai",
    path: "M55 18 C65 18, 68 30, 62 45 C56 60, 58 72, 50 85 C42 96, 38 102, 36 104 C34 99, 30 87, 34 74 C38 61, 34 48, 40 34 C46 20, 42 18, 55 18 Z",
    mapImage: ""
  },
  {
    id: "goa",
    city: "GOA",
    cityAlt: "Goa",
    title: "Creative Sanctuary",
    address: "Arpora-Vagator Creative Hub, Bardez, Goa 403509, India",
    phone: "+91 98765 43212",
    specialty: "Experimental Art & Writers Retreat",
    meta: "EST. 2019",
    localText: "गोवा",
    textY: 58,
    fontSize: 10.5,
    mapsUrl: "https://maps.google.com/?q=Arpora-Vagator+Creative+Hub,+Goa",
    path: "M45 22 C60 26, 72 35, 70 52 C68 70, 55 85, 50 96 C42 85, 32 70, 35 52 C38 35, 29 26, 45 22 Z",
    mapImage: ""
  },
  {
    id: "uae",
    city: "UAE (DUBAI)",
    cityAlt: "Dubai",
    title: "MENA Headquarters",
    address: "Executive Office 402, Building 7, Dubai Media City, Dubai, UAE",
    phone: "+971 4 123 4567",
    specialty: "Global Co-Prod & Distribution",
    meta: "EST. 2021",
    localText: "دبي",
    textY: 56,
    fontSize: 12,
    mapsUrl: "https://maps.google.com/?q=Dubai+Media+City",
    path: "M32 82 C45 68, 65 54, 78 40 C83 30, 78 20, 83 15 C88 10, 93 20, 88 35 C83 48, 73 62, 58 76 C48 86, 35 91, 32 82 Z",
    mapImage: ""
  },
  {
    id: "kenya",
    city: "KENYA (NAIROBI)",
    cityAlt: "Nairobi",
    title: "Wilderness Production Base",
    address: "The Hub Office Park, Dagoretti Road, Karen, Nairobi, Kenya",
    phone: "+254 20 9876543",
    specialty: "Wildlife Documentaries Unit",
    meta: "EST. 2023",
    localText: "KENYA",
    textY: 58,
    fontSize: 9,
    mapsUrl: "https://maps.google.com/?q=Karen,+Nairobi,+Kenya",
    path: "M48 22 C66 22, 80 35, 85 52 C90 70, 72 87, 58 94 C44 87, 26 70, 30 52 C34 35, 30 22, 48 22 Z",
    mapImage: ""
  }
];

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
  const sectionRef = useRef<HTMLElement>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
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

  // Reset to first profile when the Dream Team section is scrolled into view
  useEffect(() => {
    if (teamMembers.length === 0) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentIndex(0);
        }
      },
      { threshold: 0.15 } // Trigger when at least 15% of the section is visible in the viewport
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [teamMembers]);

  useEffect(() => {
    if (teamMembers.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
    }, 1500); // Ultra-fast auto-switch (1.5 seconds)
    return () => clearInterval(timer);
  }, [teamMembers, currentIndex]);

  if (teamMembers.length === 0) {
    return (
      <section id="team" ref={sectionRef} className="pt-8 md:pt-16 pb-24 md:pb-48 relative overflow-hidden bg-black/20">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-white/50">
          Loading team members...
        </div>
      </section>
    );
  }

  return (
    <section id="team" ref={sectionRef} className="pt-8 md:pt-16 pb-24 md:pb-48 relative overflow-hidden bg-black/20">
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
            className="font-bebas text-4xl md:text-7xl font-black italic tracking-[0.02em] text-orange-500 uppercase leading-none select-none"
          >
            Dream Team
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
                    stiffness: 650,
                    damping: 34,
                    mass: 0.25
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
                              src={transformGoogleDriveUrl(member.image, 'video')} 
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
                              src={transformGoogleDriveUrl(member.image, 'image')} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
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
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800",
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
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800",
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
  const [verticals, setVerticals] = useState<VerticalItem[]>(DEFAULT_VERTICALS);

  useEffect(() => {
    const loadVerticals = () => {
      const stored = localStorage.getItem('verticals_list');
      if (stored) {
        try {
          setVerticals(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error loading verticals list:', e);
        }
      }
      setVerticals(DEFAULT_VERTICALS);
    };

    loadVerticals();
    window.addEventListener('storage_updated_verticals', loadVerticals);
    window.addEventListener('storage', loadVerticals);
    return () => {
      window.removeEventListener('storage_updated_verticals', loadVerticals);
      window.removeEventListener('storage', loadVerticals);
    };
  }, []);

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
                className="font-bebas text-4xl md:text-7xl font-black italic text-orange-500 tracking-[0.02em] uppercase leading-none drop-shadow-[0_0_60px_rgba(249,115,22,0.2)] pointer-events-none select-none"
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
              whileHover={{ 
                y: -6,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
              }}
              transition={{ 
                duration: 1.2, 
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: false, amount: 0.15 }}
              onClick={() => {
                const sectionId = category.name.toLowerCase().replace(/\s+/g, '-');
                navigate(`/films#${sectionId}`);
              }}
              className="flex flex-col items-center justify-center cursor-pointer group text-center"
            >
              {/* Giant Outer Orbit Ring - Animating with GPU-accelerated CSS floats */}
              <div 
                className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03] ${
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
                    stroke="#f97316" 
                    strokeOpacity="0.95"
                    strokeWidth="1.5"
                    strokeDasharray="30 15 10 5"
                  />
                </svg>

                {/* Inner Counter-Rotating Aperture Ring */}
                <svg className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] pointer-events-none animate-spin-reverse-slow" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="transparent" 
                    stroke="rgba(249,115,22,0.12)" 
                    strokeWidth="1"
                    strokeDasharray="15 20 8 12"
                    className="group-hover:stroke-orange-500/40 transition-colors duration-500"
                  />
                </svg>

                {/* Outer spinning dash border on hover */}
                <div className="absolute inset-2 rounded-full border border-dashed border-orange-500/0 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-40 group-hover:border-orange-500 group-hover:rotate-[120deg] transition-all duration-[1200ms] ease-out pointer-events-none" />

                {/* Colored glowing halo behind the frame */}
                <div 
                  className="absolute inset-4 rounded-full blur-2xl opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-110 transition-all duration-700 pointer-events-none" 
                  style={{ backgroundColor: category.glow }}
                />

                {/* Inner continuous frame outline */}
                <div className="absolute inset-3 rounded-full border border-white/5 group-hover:border-orange-500/35 transition-all duration-500 pointer-events-none" />

                {/* Centered Circle Mask for category artwork */}
                <div className="absolute inset-[15px] rounded-full overflow-hidden border-[4px] border-black group-hover:border-orange-500 group-hover:shadow-[0_0_35px_rgba(249,115,22,0.35)] transition-all duration-500 z-10 shadow-2xl bg-zinc-950">
                  <img 
                    src={category.img} 
                    alt="" 
                    className="w-full h-full object-cover brightness-[0.8] group-hover:scale-110 group-hover:brightness-100 transition-all duration-700 ease-out" 
                    referrerPolicy="no-referrer"
                  />
                  {/* Atmospheric dark radial vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/75 group-hover:via-black/25 group-hover:to-transparent transition-all duration-500" />

                  {/* Category name inside frame */}
                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/40 group-hover:bg-black/15 transition-all duration-500">
                    <h4 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter text-white uppercase text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] group-hover:text-orange-500 group-hover:scale-105 transition-all duration-500 font-sans pointer-events-none select-none">
                      {category.name}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Enhanced sliding description below category circle */}
              <div className="mt-5 flex flex-col items-center gap-1.5 max-w-[280px] mx-auto pointer-events-none select-none">
                <span className="text-[10px] md:text-[11px] font-mono font-black tracking-[0.35em] text-orange-500/40 uppercase transition-all duration-300 group-hover:text-orange-500 group-hover:tracking-[0.5em]">
                  EXPLORE CRAFT
                </span>
                <p className="text-white/30 text-[10px] md:text-[11px] font-sans font-medium leading-relaxed max-w-[210px] mx-auto opacity-0 translate-y-2 scale-95 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:text-white/70">
                  {category.desc}
                </p>
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

export function InteractiveOptions() {
  const navigate = useNavigate();
  const options = [
    { name: 'CONTENT', to: '/films' },
    { name: 'BRAND', to: '/brand' },
    { name: 'ABOUT US', to: '/about' },
    { name: 'CONTACT US', to: '/#contact-section' },
  ];

  return (
    <section className="bg-transparent border-t border-white/5 snap-start snap-always">
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

export function Footer() {
  const { user, isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();

  const [instagram, setInstagram] = useState('#');
  const [facebook, setFacebook] = useState('#');
  const [youtube, setYoutube] = useState('#');
  const [twitter, setTwitter] = useState('#');
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

  const loadSocials = () => {
    setInstagram(localStorage.getItem('social_instagram') || '#');
    setFacebook(localStorage.getItem('social_facebook') || '#');
    setYoutube(localStorage.getItem('social_youtube') || '#');
    setTwitter(localStorage.getItem('social_twitter') || '#');
    setContactAddress(localStorage.getItem('contact_address') || "820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
  };

  useEffect(() => {
    loadSocials();
    window.addEventListener('storage', loadSocials);
    window.addEventListener('storage_updated_socials', loadSocials);
    window.addEventListener('storage_updated_contact', loadSocials);
    return () => {
      window.removeEventListener('storage', loadSocials);
      window.removeEventListener('storage_updated_socials', loadSocials);
      window.removeEventListener('storage_updated_contact', loadSocials);
    };
  }, []);

  return (
    <footer className="py-8 md:py-12 bg-zinc-950/20 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-[1800px] mx-auto px-6 md:px-48 lg:px-56">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6 md:mb-10 group cursor-default">
              <span className="text-3xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none transition-all duration-300 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]">DC</span>
              <span className="text-xl md:text-4xl font-black tracking-tighter text-white uppercase italic transition-all duration-300 group-hover:text-orange-100">Dreamcatchers</span>
            </div>
            <p className="text-white/40 leading-relaxed max-w-md text-xs md:text-sm font-medium tracking-tight">
              A high-end creative studio for brands, agencies & OTT platforms to increase visibility through advertising, films, and creative adaptations.
            </p>
          </div>
          
          <div id="contact">
            <h5 className="text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10">Inquiries</h5>
            <div className="space-y-4 md:space-y-6">
              <a href="mailto:hello@dreamcatchers.com" className="block text-lg md:text-xl font-bold text-white hover:text-orange-400 transition-all tracking-tight">hello@dreamcatchers.com</a>
              <p className="text-white/30 text-sm italic">{contactAddress}</p>
              
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
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const [paragraphFrames, setParagraphFrames] = useState<ParagraphFrameItem[]>(DEFAULT_PARAGRAPH_FRAMES);

  useEffect(() => {
    const loadParagraphFrames = () => {
      const stored = localStorage.getItem('paragraph_frames');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ParagraphFrameItem[];
          const hasOldFrame1 = parsed.some(f => f.id === 'frame1' && (f.type !== 'video' || !f.url.includes('11IhUdtZgucLSQsiqe2OZb08DOhidbTmD')));
          if (hasOldFrame1) {
            const updated = parsed.map(f => {
              if (f.id === 'frame1') {
                return {
                  ...f,
                  type: 'video' as const,
                  url: 'https://drive.google.com/file/d/11IhUdtZgucLSQsiqe2OZb08DOhidbTmD/view?usp=sharing'
                };
              }
              return f;
            });
            localStorage.setItem('paragraph_frames', JSON.stringify(updated));
            setParagraphFrames(updated);
            return;
          }
          setParagraphFrames(parsed);
          return;
        } catch (e) {
          console.error('Error parsing paragraph frames:', e);
        }
      }
      setParagraphFrames(DEFAULT_PARAGRAPH_FRAMES);
    };

    loadParagraphFrames();
    window.addEventListener('storage_updated_paragraph_frames', loadParagraphFrames);
    window.addEventListener('storage', loadParagraphFrames);
    return () => {
      window.removeEventListener('storage_updated_paragraph_frames', loadParagraphFrames);
      window.removeEventListener('storage', loadParagraphFrames);
    };
  }, []);

  const getFrame = (id: string): ParagraphFrameItem => {
    return paragraphFrames.find(f => f.id === id) || DEFAULT_PARAGRAPH_FRAMES.find(f => f.id === id)!;
  };

  const renderMiniBadge = (frameId: string, defaultImg: string) => {
    const frame = getFrame(frameId);
    const mediaUrl = frame?.url ? frame.url : defaultImg;
    const isVid = frame?.type === 'video';
    
    return (
      <div className="w-[1.8rem] h-[1.1rem] sm:w-[2.4rem] sm:h-[1.4rem] md:w-[3.0rem] md:h-[1.7rem] lg:w-[3.6rem] lg:h-[2.1rem] xl:w-[4.0rem] xl:h-[2.3rem] rounded-full overflow-hidden border border-white/20 bg-neutral-900 shadow-md relative group shrink-0 inline-block align-middle mx-1 sm:mx-1.5 transition-all duration-500 hover:scale-110 hover:border-orange-500/50">
        {isVid ? (
          isEmbedUrl(mediaUrl) ? (
            <iframe 
              src={getEmbedUrl(mediaUrl, true)} 
              className="absolute inset-[0%] w-full h-full pointer-events-none scale-105 border-0 rounded-full"
              allow="autoplay"
              style={{ pointerEvents: 'none' }}
            />
          ) : (
            <video 
              src={transformGoogleDriveUrl(mediaUrl, 'video')} 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500" 
              autoPlay 
              loop 
              muted 
              playsInline 
            />
          )
        ) : (
          <img 
            src={transformGoogleDriveUrl(mediaUrl, 'image')} 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500" 
            alt="" 
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    );
  };

  const renderEarthBadge = () => {
    const frame = getFrame('frame4');
    const defaultEarthUrl = "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=400";
    const url = frame?.url && !frame.url.includes('1478720568477') 
      ? frame.url 
      : defaultEarthUrl;
    const isVid = frame?.type === 'video' && !frame.url.includes('1478720568477');

    return (
      <motion.div 
        whileHover={{ scale: 1.08, rotate: 1 }}
        className="inline-block shrink-0 align-middle mx-2 sm:mx-3 my-1"
      >
        <div className="w-[3.6rem] h-[2.3rem] sm:w-[5.2rem] sm:h-[3.3rem] md:w-[6.8rem] md:h-[4.4rem] lg:w-[8.2rem] lg:h-[5.1rem] rounded-full overflow-hidden border border-white/20 bg-neutral-900 shadow-[0_4px_25px_rgba(0,0,0,0.8)] relative group">
          {isVid ? (
            isEmbedUrl(url) ? (
              <iframe 
                src={getEmbedUrl(url, true)} 
                className="absolute inset-0 w-full h-full pointer-events-none scale-105 border-0 rounded-full"
                allow="autoplay"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <video 
                src={transformGoogleDriveUrl(url, 'video')} 
                className="w-full h-full object-cover brightness-110 group-hover:scale-110 transition-transform duration-700" 
                autoPlay 
                loop 
                muted 
                playsInline 
              />
            )
          ) : (
            <img 
              src={transformGoogleDriveUrl(url, 'image')} 
              className="w-full h-full object-cover brightness-110 group-hover:scale-110 transition-transform duration-700" 
              alt="Earth" 
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none" />
        </div>
      </motion.div>
    );
  };

  const line1Variants = {
    hidden: { x: 120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 90,
        damping: 15,
        duration: 1.1
      }
    }
  };

  const line2Variants = {
    hidden: { x: -120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 90,
        damping: 15,
        duration: 1.1
      }
    }
  };

  const line3Variants = {
    hidden: { x: 120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 90,
        damping: 15,
        duration: 1.1
      }
    }
  };

  const badgeRowVariants = {
    hidden: { scale: 0.5, opacity: 0, y: 15 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 95,
        damping: 14,
        delay: 0.35,
        staggerChildren: 0.08,
        delayChildren: 0.45
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

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.6, rotate: -40 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 14,
        delay: 0.5
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
          className="w-full pb-16 md:pb-24 flex flex-col md:flex-row items-start justify-between gap-12 font-geograph select-none"
        >
          {/* Left Text Block */}
          <motion.div className="w-full md:max-w-5xl text-left">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[2.8rem] xl:text-[3.6rem] font-black tracking-tighter leading-[1.05] uppercase font-geograph text-white overflow-hidden">
              {/* Line 1 */}
              <motion.div className="overflow-hidden mb-2">
                <motion.span 
                  variants={line1Variants}
                  whileHover={{ scale: 1.015, x: 8, textShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="block text-white/95 origin-left cursor-default hover:text-orange-500 transition-colors duration-300"
                >
                  DREAMCATCHERS IS A
                </motion.span>
              </motion.div>
              
              {/* Line 2 with inline oval earth image */}
              <motion.div className="overflow-hidden mb-2">
                <motion.div 
                  variants={line2Variants}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 origin-left cursor-default"
                >
                  {renderEarthBadge()}
                  <motion.span 
                    whileHover={{ scale: 1.015, x: 8 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="text-white/95 inline-block align-middle hover:text-orange-500 transition-colors duration-300"
                  >
                    CREATIVE STUDIO THAT
                  </motion.span>
                </motion.div>
              </motion.div>
              
              {/* Line 3 */}
              <motion.div className="overflow-hidden">
                <motion.span 
                  variants={line3Variants}
                  whileHover={{ scale: 1.015, x: 8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="block text-white/95 leading-none origin-left cursor-default hover:text-orange-500 transition-colors duration-300"
                >
                  HELPS BRANDS WITH
                </motion.span>
              </motion.div>
            </h1>

            {/* Badge tags row */}
            <motion.div 
              variants={badgeRowVariants}
              className="mt-6 md:mt-8 flex flex-wrap md:flex-nowrap items-center gap-x-2 sm:gap-x-2.5 gap-y-2.5 text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-black italic tracking-wide uppercase font-geograph text-white md:whitespace-nowrap origin-left"
            >
              {/* ADVERTISING */}
              <motion.span 
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-x-2 shrink-0 cursor-default"
              >
                {renderMiniBadge('frame2', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=240')}
                <span className="text-white/90 hover:text-orange-500 transition-colors duration-200">ADVERTISING,</span>
              </motion.span>

              {/* FILMS */}
              <motion.span 
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-x-2 shrink-0 cursor-default"
              >
                {renderMiniBadge('frame5', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=240')}
                <span className="text-white/90 hover:text-orange-500 transition-colors duration-200">FILMS,</span>
              </motion.span>

              {/* EVENTS */}
              <motion.span 
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-x-2 shrink-0 cursor-default"
              >
                {renderMiniBadge('frame6', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=240')}
                <span className="text-white/90 hover:text-orange-500 transition-colors duration-200">EVENTS,</span>
              </motion.span>

              {/* AND */}
              <motion.span variants={itemVariants} className="text-white/40 font-bold mx-1">AND</motion.span>

              {/* DOCUMENTARIES */}
              <motion.span 
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-x-2 shrink-0 cursor-default"
              >
                {renderMiniBadge('frame1', 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=240')}
                <span className="text-orange-500 italic underline decoration-orange-500/50 decoration-2 underline-offset-4 cursor-pointer hover:text-orange-400 transition-colors duration-300">DOCUMENTARIES.</span>
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Right Navigation Arrow Button */}
          <div className="flex items-center justify-center pt-6 md:pt-0 md:mt-[3rem] lg:mt-[4rem] xl:mt-[4.5rem] md:-translate-x-12 lg:-translate-x-20 xl:-translate-x-24">
            <motion.button
              variants={buttonVariants}
              onClick={() => {
                document.getElementById('clients')?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ 
                scale: 1.05,
                rotate: 90,
                borderColor: "rgba(249,115,22,1)", 
                backgroundColor: "rgba(249,115,22,0.2)",
                boxShadow: "0 0 50px rgba(249,115,22,0.8), inset 0 0 20px rgba(249,115,22,0.5)"
              }}
              whileActive={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border border-orange-500/40 flex items-center justify-center cursor-pointer relative bg-black/20 group shrink-0 overflow-hidden"
              title="Next Section"
            >
              {/* Inner glowing circle */}
              <div className="absolute inset-2 sm:inset-3 rounded-full border border-orange-500/20 group-hover:border-orange-500/60 transition-all duration-500 bg-orange-500/0 group-hover:bg-orange-500/5 shadow-[inset_0_0_15px_rgba(249,115,22,0)] group-hover:shadow-[inset_0_0_25px_rgba(249,115,22,0.6)]" />
              
              <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500/70 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-500 relative z-10" strokeWidth={1.5} stroke="currentColor" />
            </motion.button>
          </div>
        </motion.div>
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

export const isEmbedUrl = (url: string) => {
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

export const getEmbedUrl = (url: string, asBackground = true) => {
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
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const starOpacity = useTransform(scrollY, [100, 700], [0, 1]);
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);

  const [backdropType, setBackdropType] = useState<'image' | 'video'>('video');
  const [backdropUrl, setBackdropUrl] = useState('https://player.vimeo.com/video/371433846');
  const [isMobileView, setIsMobileView] = useState(false);
  const [verticals, setVerticals] = useState<VerticalItem[]>(DEFAULT_VERTICALS);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [locations, setLocations] = useState<OperationalLocation[]>(DEFAULT_LOCATIONS);

  useEffect(() => {
    const loadLocations = () => {
      const stored = localStorage.getItem('dc_locations');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as OperationalLocation[];
          const merged = parsed.map(loc => {
            const def = DEFAULT_LOCATIONS.find(d => d.id === loc.id);
            if (def) {
              return {
                ...def,
                ...loc,
                path: loc.path || def.path,
                textY: typeof loc.textY !== 'undefined' ? loc.textY : def.textY,
                fontSize: typeof loc.fontSize !== 'undefined' ? loc.fontSize : def.fontSize,
                city: loc.city || def.city,
                localText: loc.localText || def.localText
              };
            }
            return loc;
          });
          setLocations(merged);
          return;
        } catch (e) {
          console.error('Error loading locations list in LandingPage:', e);
        }
      }
      setLocations(DEFAULT_LOCATIONS);
    };

    loadLocations();
    window.addEventListener('storage_updated_locations', loadLocations);
    window.addEventListener('storage', loadLocations);
    return () => {
      window.removeEventListener('storage_updated_locations', loadLocations);
      window.removeEventListener('storage', loadLocations);
    };
  }, []);

  useEffect(() => {
    const loadVerticals = () => {
      const stored = localStorage.getItem('verticals_list');
      if (stored) {
        try {
          setVerticals(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error loading verticals list in LandingPage:', e);
        }
      }
      setVerticals(DEFAULT_VERTICALS);
    };

    loadVerticals();
    window.addEventListener('storage_updated_verticals', loadVerticals);
    window.addEventListener('storage', loadVerticals);
    return () => {
      window.removeEventListener('storage_updated_verticals', loadVerticals);
      window.removeEventListener('storage', loadVerticals);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileView(isMobileUA || window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [contactTitleFirst, setContactTitleFirst] = useState("Let's");
  const [contactTitleOrange, setContactTitleOrange] = useState("Connect.");
  const [contactSubtitle, setContactSubtitle] = useState("Start your cinematic journey today.");
  const [contactEmail, setContactEmail] = useState("hello@dreamcatchers.com");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

  const loadContactConfigs = () => {
    setContactTitleFirst(localStorage.getItem('contact_title_first') || "Let's");
    setContactTitleOrange(localStorage.getItem('contact_title_orange') || "Connect.");
    setContactSubtitle(localStorage.getItem('contact_subtitle') || "Start your cinematic journey today.");
    setContactEmail(localStorage.getItem('contact_email') || "hello@dreamcatchers.com");
    setContactPhone(localStorage.getItem('contact_phone') || "+91 98765 43210");
    setContactAddress(localStorage.getItem('contact_address') || "820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
  };

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

  const getDesktopHighQualityUrl = (url: string) => {
    if (!url) return '';
    if (!isMobileView) {
      let highQualityUrl = url;
      // Convert Vimeo external SD video links (sd.mp4) to high-definition (hd.mp4)
      if (highQualityUrl.includes('.sd.mp4')) {
        highQualityUrl = highQualityUrl.replace('.sd.mp4', '.hd.mp4');
      }
      // Upgrade Vimeo profiles to HD (profile_id 139 / 164 is SD, while 174 / 175 is HD)
      if (highQualityUrl.includes('profile_id=139')) {
        highQualityUrl = highQualityUrl.replace('profile_id=139', 'profile_id=174');
      } else if (highQualityUrl.includes('profile_id=164')) {
        highQualityUrl = highQualityUrl.replace('profile_id=164', 'profile_id=174');
      }
      return highQualityUrl;
    }
    return url;
  };

  useEffect(() => {
    loadConfigs();
    loadContactConfigs();
    window.addEventListener('storage_updated_home_hero', loadConfigs);
    window.addEventListener('storage_updated_contact', loadContactConfigs);
    window.addEventListener('storage', loadConfigs);
    window.addEventListener('storage', loadContactConfigs);
    return () => {
      window.removeEventListener('storage_updated_home_hero', loadConfigs);
      window.removeEventListener('storage_updated_contact', loadContactConfigs);
      window.removeEventListener('storage', loadConfigs);
      window.removeEventListener('storage', loadContactConfigs);
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
              className="w-full h-full object-cover opacity-95 animate-fade-in"
            />
          ) : backdropType === 'video' ? (
            isEmbedUrl(backdropUrl) ? (
              <iframe
                key={backdropUrl}
                src={getEmbedUrl(getDesktopHighQualityUrl(backdropUrl))}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-none opacity-95 scale-105 pointer-events-none"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{
                  width: '177.77vh',
                  height: '100vh',
                  minWidth: '100vw',
                  minHeight: '56.25vw',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <video 
                key={backdropUrl}
                src={getDesktopHighQualityUrl(backdropUrl)} 
                autoPlay 
                loop 
                muted 
                playsInline 
                preload="auto"
                className="w-full h-full object-cover opacity-95"
              />
            )
          ) : (
            <img 
              src={backdropUrl} 
              alt="Cinematic Background" 
              className="w-full h-full object-cover opacity-95"
            />
          )}
          {/* Transition overlays - Soft bottom blend only, not a dark cover shield */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
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
          <StarField count={isMobileView ? 20 : 250} />
        </motion.div>

        {/* Ambient Atmosphere */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/5 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-900/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />
      <main className="relative">
        <Hero />
        <div className="h-screen pointer-events-none snap-start snap-always" /> {/* Spacer for fixed hero */}
        
        <div className="relative z-10">
          <CinematicSlideshow />
          <Clients />
          <section id="about" className="py-12 md:py-24 relative overflow-hidden bg-black snap-start snap-always">
            {/* Background cinematic grid light glow */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            {/* Stars background that animates smoothly when scrolled into view */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 0.75, scale: 1 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ 
                opacity: { duration: 1.2, ease: "easeOut" },
                scale: { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
              }}
              className="absolute inset-0 pointer-events-none z-0"
            >
              <StarField count={110} />
            </motion.div>
            
            {/* Sub-Brands / Verticals Integration */}
            <div className="max-w-[1600px] mx-auto w-full relative z-10 px-6 md:px-16">
              <div className="text-left mb-8 md:mb-14">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="font-helvetica-cond text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none"
                >
                  Our Verticals & Sub-Brands
                </motion.h3>
                <p className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.3em] font-mono">
                  Enterprise Initiatives
                </p>
              </div>

              {(() => {
                const sportsBox = verticals.find(v => v.id === 'sports_box') || DEFAULT_VERTICALS[0];
                const dcDigital = verticals.find(v => v.id === 'dc_digital') || DEFAULT_VERTICALS[1];

                const cardContainerVariants = {
                  hidden: (direction: number) => ({
                    opacity: 0,
                    x: direction * 40,
                    y: 30,
                    scale: 0.97,
                  }),
                  visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.7,
                      ease: [0.16, 1, 0.3, 1],
                      staggerChildren: 0.1,
                      delayChildren: 0.05,
                    }
                  }
                };

                const cardChildVariants = {
                  hidden: { opacity: 0, y: 15, scale: 0.98 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  }
                };

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 max-w-[1440px] mx-auto mt-8 px-4 sm:px-8 lg:px-12 pb-8" style={{ perspective: 1200 }}>
                    {/* SPORTS BOX Card */}
                    <motion.div
                      custom={-1}
                      variants={cardContainerVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-100px" }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.01,
                        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      onClick={() => window.open('https://www.sportsbox.in/', '_blank', 'noopener,noreferrer')}
                      className="group relative flex flex-col items-center justify-between p-8 md:p-10 rounded-[2.5rem] bg-zinc-950/40 backdrop-blur-xl overflow-hidden select-none cursor-pointer text-center h-[540px] md:h-[610px] w-full"
                    >
                      {/* Moving Digital Scanline Grid backdrop */}
                      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] transition-opacity duration-500 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.01] to-transparent pointer-events-none group-hover:from-orange-500/[0.04] transition-all duration-500" />

                      {/* Branding Area of equal size to DC Digital, styled with original Sportsbox logo from first image */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="h-28 flex items-center justify-center mb-2 relative z-10 w-full"
                      >
                        <motion.div 
                          whileHover={{ y: -4, scale: 1.03 }}
                          className="bg-zinc-950 p-5 rounded-2xl flex items-center justify-center w-64 sm:w-72 shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-[border-color,box-shadow] duration-500 group-hover:shadow-[0_15px_45px_rgba(239,61,51,0.15)] group-hover:border-orange-500/30 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-[42px] h-[42px] bg-[#ef3d33] rounded-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(239,61,51,0.3)] flex-shrink-0">
                              <span className="text-white font-helvetica-cond font-black italic text-2xl tracking-tighter select-none -translate-x-[0.5px]">S</span>
                            </div>
                            <div className="flex items-center text-xl sm:text-2xl font-helvetica-cond font-black italic tracking-[-0.01em] uppercase select-none leading-none">
                              <span className="text-white">SPORTS</span>
                              <span className="text-[#ef3d33]">BOX</span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Creative Frame */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 group-hover:border-orange-500/40 bg-zinc-950 transition-[border-color,box-shadow] duration-500 relative flex items-center justify-center shadow-[0_15px_45px_0_rgba(0,0,0,0.5)]"
                      >
                        {sportsBox.url ? (
                          sportsBox.type === 'image' ? (
                            <div className="w-full h-full relative group/img overflow-hidden">
                              <img 
                                src={transformGoogleDriveUrl(sportsBox.url, 'image')}
                                alt={sportsBox.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              {/* Premium acrylic reflection sweep */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover/img:animate-[shine_1.2s_ease-in-out_infinite] z-10 pointer-events-none" />
                            </div>
                          ) : isEmbedUrl(sportsBox.url) ? (
                            <iframe 
                              src={getEmbedUrl(sportsBox.url, true)} 
                              className="absolute inset-0 w-full h-full pointer-events-none scale-105 border-0"
                              allow="autoplay"
                              style={{ pointerEvents: 'none' }}
                            />
                          ) : (
                            <video 
                              src={transformGoogleDriveUrl(sportsBox.url, 'video')} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                            />
                          )
                        ) : (
                          // Ultra-creative High-Tech Live Broadcast Radar Sweeper Placeholder
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-neutral-900 flex flex-col items-center justify-center p-4 overflow-hidden">
                            {/* Rotating radar line */}
                            <div className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,rgba(249,115,22,0.12),transparent_60deg)] animate-[spin_6s_linear_infinite] rounded-full pointer-events-none" />
                            
                            {/* Radial HUD rings */}
                            <div className="absolute w-44 h-44 rounded-full border border-orange-500/5 animate-[pulse_3s_infinite]" />
                            <div className="absolute w-28 h-28 rounded-full border border-orange-500/5" />
                            <div className="absolute w-12 h-12 rounded-full border border-orange-500/10" />

                            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                              <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest font-black">SYS_ACTIVE</span>
                            </div>
                            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-white/30 uppercase tracking-widest font-bold z-10">
                              MONITOR - 01 / PROD
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                              <svg className="w-12 h-12 text-white/10 group-hover:text-orange-500/30 group-hover:scale-110 transition-all duration-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                <path d="M2 12h20" />
                              </svg>
                              <span className="text-[11px] text-white/50 uppercase tracking-[0.25em] font-black">SPORTS_CENTRAL_HUB</span>
                              <span className="text-[9px] text-orange-500/60 uppercase tracking-[0.1em] mt-1 font-bold">CONFIGURE IMAGE / VIDEO IN ADMIN</span>
                            </div>
                          </div>
                        )}
                        
                        {sportsBox.url && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl"
                              whileHover={{ scale: 1.15 }}
                            >
                              {sportsBox.type === 'image' ? (
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </motion.div>
                          </div>
                        )}
                      </motion.div>

                      {/* Texts */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="space-y-2 z-10 w-full mt-4"
                      >
                        <span className="text-orange-500 text-xs font-black uppercase tracking-[0.3em] block group-hover:text-amber-400 transition-colors duration-300">
                          {sportsBox.subtitle}
                        </span>
                        <p className="text-sm md:text-base font-black text-white uppercase tracking-wider leading-relaxed group-hover:text-white/90 transition-colors">
                          {sportsBox.description}
                        </p>
                      </motion.div>
                      
                      {/* Corner glowing element */}
                      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/20 group-hover:scale-135 transition-all duration-700"></div>
                    </motion.div>

                    {/* DC DIGITAL STUDIO Card */}
                    <motion.div
                      custom={1}
                      variants={cardContainerVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-100px" }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.01,
                        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      onClick={() => dcDigital.url && setSelectedVideo(dcDigital.url)}
                      className={`group relative flex flex-col items-center justify-between p-8 md:p-10 rounded-[2.5rem] bg-zinc-950/40 backdrop-blur-xl overflow-hidden select-none ${dcDigital.url ? 'cursor-pointer' : 'cursor-default'} transition-[background-color,border-color,box-shadow] duration-500 hover:shadow-[0_0_80px_rgba(245,158,11,0.14)] text-center h-[540px] md:h-[610px] w-full`}
                    >
                      {/* Grid Backdrop */}
                      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.01] to-transparent pointer-events-none group-hover:from-amber-500/[0.04] transition-all duration-500" />

                      {/* Branding Area with highly interactive 3D style floating logo */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="h-28 flex items-center justify-center mb-2 relative z-10 w-full"
                      >
                        <motion.div 
                          whileHover={{ y: -4, scale: 1.03 }}
                          className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center w-64 sm:w-72 shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/50 transition-[border-color,box-shadow] duration-500 group-hover:shadow-[0_15px_45px_rgba(255,255,255,0.18)] relative overflow-hidden"
                        >
                          {/* Clean typography layout without graphical logo */}
                          <div className="flex items-center justify-center gap-1.5 w-full">
                            <span className="text-orange-600 font-extrabold font-bebas text-lg sm:text-xl tracking-wider leading-none">DC</span>
                            <span className="w-0.5 h-4 bg-zinc-300"></span>
                            <span className="text-zinc-900 font-bold font-sans text-xs sm:text-sm tracking-[0.1em] uppercase leading-none">{dcDigital.title.replace('DC DIGITAL STUDIO', 'DIGITAL STUDIO')}</span>
                          </div>
                          <div className="text-[7px] text-zinc-400 font-black uppercase tracking-[0.2em] font-sans mt-1.5">A DREAMCATCHERS VERTICAL</div>
                        </motion.div>
                      </motion.div>

                      {/* Creative Frame */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 group-hover:border-amber-500/35 bg-zinc-950 transition-[border-color,box-shadow] duration-500 relative flex items-center justify-center shadow-[0_15px_45px_0_rgba(0,0,0,0.5)]"
                      >
                        {dcDigital.url ? (
                          dcDigital.type === 'image' ? (
                            <div className="w-full h-full relative group/img overflow-hidden">
                              <img 
                                src={transformGoogleDriveUrl(dcDigital.url, 'image')}
                                alt={dcDigital.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              {/* Premium acrylic reflection sweep */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover/img:animate-[shine_1.2s_ease-in-out_infinite] z-10 pointer-events-none" />
                            </div>
                          ) : isEmbedUrl(dcDigital.url) ? (
                            <iframe 
                              src={getEmbedUrl(dcDigital.url, true)} 
                              className="absolute inset-0 w-full h-full pointer-events-none scale-105 border-0"
                              allow="autoplay"
                              style={{ pointerEvents: 'none' }}
                            />
                          ) : (
                            <video 
                              src={transformGoogleDriveUrl(dcDigital.url, 'video')} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                            />
                          )
                        ) : (
                          // Ultra-creative High-Tech Equalizer Audioscape / Constellation Placeholder
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-neutral-900 flex flex-col items-center justify-center p-4 overflow-hidden">
                            {/* Soundwave wave visualization lines */}
                            <div className="absolute bottom-6 flex gap-[3px] items-end h-20 w-4/5 justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                              {[60, 85, 45, 95, 70, 55, 90, 100, 40, 80, 65, 85, 50, 75, 95, 60, 45, 70, 80, 55, 90, 40].map((h, i) => (
                                <motion.div
                                  key={`eq-${i}`}
                                  className="w-[20px] rounded-t-sm bg-orange-500"
                                  animate={{ height: [`${h * 0.2}%`, `${h * 0.8}%`, `${h * 0.2}%`] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.2 + (i % 5) * 0.2,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>

                            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">DIGITAL_FEED</span>
                            </div>
                            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-white/30 uppercase tracking-widest font-bold z-10">
                              CH. 02 / STREAM
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                              <svg className="w-12 h-12 text-white/10 group-hover:text-amber-500/20 group-hover:scale-110 transition-all duration-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                              <span className="text-[11px] text-white/50 uppercase tracking-[0.25em] font-black">AI_CREATIVE_SYSTEM</span>
                              <span className="text-[9px] text-amber-500/60 uppercase tracking-[0.1em] mt-1 font-bold">CONFIGURE IMAGE / VIDEO IN ADMIN</span>
                            </div>
                          </div>
                        )}
                        
                        {dcDigital.url && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl"
                              whileHover={{ scale: 1.15 }}
                            >
                              {dcDigital.type === 'image' ? (
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </motion.div>
                          </div>
                        )}
                      </motion.div>

                      {/* Texts */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="space-y-2 z-10 w-full mt-4"
                      >
                        <span className="text-orange-500 text-xs font-black uppercase tracking-[0.3em] block group-hover:text-amber-400 transition-colors duration-300">
                          {dcDigital.subtitle}
                        </span>
                        <p className="text-sm md:text-base font-black text-white uppercase tracking-wider leading-relaxed group-hover:text-white/90 transition-colors">
                          {dcDigital.description}
                        </p>
                      </motion.div>
                      
                      {/* Corner glowing element */}
                      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 group-hover:scale-135 transition-all duration-700"></div>
                    </motion.div>
                  </div>
                );
              })()}
            </div>

            {/* Integrated Contact Section under Verticals */}
            <div id="contact-section" className="mt-32 md:mt-48 max-w-[1440px] mx-auto w-full px-6 sm:px-8 lg:px-12 relative z-10 pb-8 scroll-mt-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-0">
                {/* Left Side: Contact Details Card Grid */}
                <div className="space-y-12">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-left"
                  >
                    <h3 className="font-helvetica-cond text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none">
                      {contactTitleFirst} {contactTitleOrange}
                    </h3>
                    <p className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.3em] font-mono">
                      {contactSubtitle}
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -50, rotate: -2, scale: 0.95 }}
                      whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ type: "spring", stiffness: 90, damping: 15 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="p-8 md:p-10 bg-zinc-950/60 border border-zinc-900/80 rounded-[2rem] hover:bg-orange-500 hover:border-transparent transition-all duration-500 group cursor-pointer flex flex-col justify-between min-h-[170px]"
                      onClick={() => window.location.href = `mailto:${contactEmail}`}
                    >
                      <div className="text-orange-500 group-hover:text-black mb-6 transition-colors">
                        <Mail className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white/30 group-hover:text-black/60 text-[10px] font-black uppercase tracking-widest mb-1 transition-colors">
                          Email Us
                        </p>
                        <p className="text-lg md:text-xl font-bold text-white group-hover:text-black tracking-tight break-all transition-colors font-sans">
                          {contactEmail}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -50, rotate: 2, scale: 0.95 }}
                      whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ type: "spring", stiffness: 90, damping: 15, delay: 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="p-8 md:p-10 bg-zinc-950/60 border border-zinc-900/80 rounded-[2rem] hover:bg-orange-500 hover:border-transparent transition-all duration-500 group cursor-pointer flex flex-col justify-between min-h-[170px]"
                      onClick={() => window.location.href = `tel:${contactPhone}`}
                    >
                      <div className="text-orange-500 group-hover:text-black mb-6 transition-colors">
                        <Phone className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white/30 group-hover:text-black/60 text-[10px] font-black uppercase tracking-widest mb-1 transition-colors">
                          Call Us
                        </p>
                        <p className="text-lg md:text-xl font-bold text-white group-hover:text-black tracking-tight transition-colors font-sans">
                          {contactPhone}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Added elegant Offices title block aligned below cards with animation matching collaborators */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="pt-4 text-left"
                  >
                    <h3 className="font-helvetica-cond text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none">
                      Offices
                    </h3>
                    <p className="text-white/40 text-xs md:text-sm font-black uppercase tracking-[0.3em] font-mono">
                      Our Locations
                    </p>
                  </motion.div>
                </div>

                {/* Right Side: Contact Submission Form */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 50 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  className="bg-zinc-950/60 border border-zinc-900/80 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md relative overflow-hidden"
                >
                  <form onSubmit={(e) => { e.preventDefault(); alert("Success! Your message was sent beautifully."); }} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4 font-sans">Your Name</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors text-white text-sm tracking-wide" placeholder="Enter your name" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4 font-sans">Your Email / Contact Number</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors text-white text-sm tracking-wide" placeholder="Enter your mail or contact number" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4 font-sans">Subject</label>
                      <input type="text" className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors text-white text-sm tracking-wide" placeholder="Project Inquiry" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4 font-sans">Message</label>
                      <textarea rows={4} className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-colors text-white text-sm tracking-wide" placeholder="Tell us about your dream..." required></textarea>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "#f97316", color: "#000" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-5 rounded-2xl bg-white/10 text-white font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all text-sm shadow-xl"
                    >
                      <Send className="w-4 h-4" />
                      Submit Request
                    </motion.button>
                  </form>
                </motion.div>
              </div>

              {/* Seamless Locations block in the same contact-section */}
              <div className="mt-12 relative z-10">
                {/* Custom Inline Keyframe Styling for the dynamic laser scanning and top-tier aesthetic touches */}
                <style>{`
                  @keyframes laserScan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(200px); opacity: 0; }
                  }
                  .animate-laser-scan {
                    animation: laserScan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                  }
                `}</style>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {locations.map((loc, idx) => (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0, y: 60, scale: 0.92, rotate: idx % 2 === 0 ? -1.5 : 1.5 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                      viewport={{ once: false, amount: 0.12 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 70, 
                        damping: 15, 
                        delay: idx * 0.05 
                      }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => window.open(loc.mapsUrl, '_blank')}
                      className="group relative p-4 bg-[#050505] border border-zinc-900 rounded-[1.8rem] hover:border-orange-500/30 hover:bg-[#070707] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[290px] shadow-lg"
                    >
                      {/* Top Graphic Map Visual Block */}
                      <div className="h-[200px] w-full bg-zinc-950/60 border border-zinc-900/60 rounded-[1.4rem] flex items-center justify-center relative overflow-hidden transition-all duration-300">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.04)_0%,transparent_100%)] pointer-events-none" />
                        
                        {/* Dynamic Neon Laser scanning line */}
                        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 animate-laser-scan" />

                        {loc.mapImage ? (
                          <motion.img 
                            src={loc.mapImage} 
                            alt={loc.cityAlt}
                            animate={{
                              y: [2, -6, 2],
                              rotate: [-0.5, 0.5, -0.5]
                            }}
                            transition={{
                              duration: 4.5 + idx * 0.4,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut"
                            }}
                            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-110 group-hover:rotate-[-2deg] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.9)] transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* 3D Stacked Map outline layers with interactive separating/expanding stack coordinates */
                          <motion.svg 
                            viewBox="-10 -10 140 140" 
                            animate={{
                              y: [3, -5, 3],
                            }}
                            transition={{
                              duration: 4.2 + idx * 0.4,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut"
                            }}
                            className="w-[140px] h-[140px] drop-shadow-2xl relative z-10 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-[-3deg] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.85)] transition-all duration-500"
                          >
                            <g transform="translate(0, 0)">
                              {/* Layer 1 (bottom-most background shadow layer - expands deepest on hover) */}
                              <g className="transition-transform duration-500 ease-out translate-x-[2px] translate-y-[2px] group-hover:translate-x-[14px] group-hover:translate-y-[14px]">
                                <path d={loc.path} fill="#000000" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
                              </g>
                              
                              {/* Layer 2 (middle shadow layer) */}
                              <g className="transition-transform duration-500 ease-out translate-x-[1.5px] translate-y-[1.5px] group-hover:translate-x-[10.5px] group-hover:translate-y-[10.5px]">
                                <path d={loc.path} fill="#000000" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.22" />
                              </g>
                              
                              {/* Layer 3 (elevated layer) */}
                              <g className="transition-transform duration-500 ease-out translate-x-[1px] translate-y-[1px] group-hover:translate-x-[7px] group-hover:translate-y-[7px]">
                                <path d={loc.path} fill="#030303" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.32" />
                              </g>
                              
                              {/* Layer 4 (close layer) */}
                              <g className="transition-transform duration-500 ease-out translate-x-[0.5px] translate-y-[0.5px] group-hover:translate-x-[3.5px] group-hover:translate-y-[3.5px]">
                                <path d={loc.path} fill="#0a0a0a" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.45" />
                              </g>
                              
                              {/* Main Top Layer (floats up and to the left dynamically on hover) */}
                              <g className="transition-transform duration-500 ease-out translate-x-0 translate-y-0 group-hover:-translate-x-[3px] group-hover:-translate-y-[3px]">
                                <path 
                                  d={loc.path} 
                                  fill="#f97316" 
                                  stroke="#ffffff" 
                                  strokeWidth="1.5" 
                                  className="group-hover:fill-[#ea580c] transition-colors duration-300" 
                                />
                                
                                {/* Centered Bold Identifier Text inside Map with elegant styling */}
                                <text 
                                  x="60" 
                                  y={loc.textY || 58} 
                                  textAnchor="middle" 
                                  fill="#000000" 
                                  fontSize={loc.fontSize || 10} 
                                  fontWeight="900" 
                                  className="font-sans font-black tracking-normal select-none pointer-events-none uppercase transition-all duration-300 group-hover:fill-[#ffffff]"
                                >
                                  {loc.city.includes("DUBAI") ? "DUBAI" : loc.city.includes("KENYA") ? "KENYA" : loc.city}
                                </text>
                              </g>
                            </g>
                          </motion.svg>
                        )}
                      </div>

                      {/* Info & Redirection Metadata Section */}
                      <div className="pt-3 pb-1 text-left pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-base font-black tracking-wide uppercase font-sans group-hover:text-orange-500 transition-colors duration-300">
                            {loc.cityAlt}
                          </span>
                          <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-orange-400 group-hover:translate-x-1.5 transition-all duration-300 animate-pulse" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <InteractiveOptions />
        </div>
      </main>

      <Footer />

      {/* Vertical Lightbox Video Modal overlay */}
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
              {(() => {
                const isImage = selectedVideo.startsWith('data:image') || 
                                selectedVideo.startsWith('blob:') || 
                                /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(selectedVideo) ||
                                verticals.some(v => v.url === selectedVideo && v.type === 'image');
                if (isImage) {
                  return (
                    <img 
                      src={transformGoogleDriveUrl(selectedVideo, 'image')} 
                      alt="Vertical Media Preview" 
                      className="w-full h-full object-contain mx-auto" 
                      referrerPolicy="no-referrer"
                    />
                  );
                }
                return isEmbedUrl(selectedVideo) ? (
                  <iframe 
                    src={getEmbedUrl(selectedVideo, false)} 
                    className="w-full h-full border-none" 
                    allow="autoplay; encrypted-media; fullscreen" 
                    allowFullScreen 
                  />
                ) : (
                  <video 
                    src={transformGoogleDriveUrl(selectedVideo, 'video')} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain" 
                  />
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.substring(1));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[178vh] h-[100vh] min-w-[100vw] min-h-[56.25vw] max-w-none border-none transition-all duration-300"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <video
              ref={videoElementRef}
              src={videoUrl}
              className="absolute left-0 top-0 w-full h-full object-cover bg-black transition-all duration-300"
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
  
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const yText = isMobileScreen ? 0 : rawYText;
  const yCard = isMobileScreen ? 0 : rawYCard;
  const rotateCard = isMobileScreen ? 0 : rawRotateCard;
  const scaleCard = isMobileScreen ? 1 : rawScaleCard;
  const opacityVal = isMobileScreen ? 1 : rawOpacity;

  const IconComponent = ch.icon;

  return (
    <motion.div
      ref={rowRef}
      style={{ opacity: opacityVal }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative min-h-[460px] py-12"
    >

      {/* Text Side (Odd/Even shifts layout for visual rhythm) */}
      <motion.div 
        style={{ y: yText }}
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
          y: yCard,
          rotate: rotateCard,
          scale: scaleCard
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
          <h1 className="font-bebas text-3xl sm:text-5xl md:text-7xl tracking-[0.02em] italic uppercase leading-tight text-white font-black block">
            <span className="block mb-2">
              {"THE CHRONICLES OF".split(" ").map((w, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block mr-3 md:mr-4"
                >
                  {w}
                </motion.span>
              ))}
            </span>
            <span className="text-orange-500 block whitespace-nowrap">
              {"DREAMCATCHERS".split("").map((char, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.1, delay: 0.3 + idx * 0.03, ease: [0.34, 1.56, 0.64, 1] }}
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
          
          <h3 className="font-bebas text-2xl md:text-3xl font-black italic uppercase tracking-[0.02em] text-orange-500">
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
              onClick={() => navigate('/#contact-section')}
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
      <InteractiveOptions />
      <Footer />
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
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
