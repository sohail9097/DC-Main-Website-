import { motion, AnimatePresence, useScroll, useTransform, useTime } from 'motion/react';
import { Camera, Play, ChevronLeft, ChevronRight, Menu, X, Rocket, Moon, ShieldCheck, Instagram, Facebook, Youtube, Twitter, Linkedin, ArrowLeft, ArrowRight, Sparkles, Globe, Tv, Heart, Compass, Mail, Phone, MapPin, Send, UploadCloud, Loader2, CheckCircle2, AlertCircle, User, Building, Trash2, Paperclip } from 'lucide-react';
import React, { useState, useEffect, useRef, FC, memo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import FilmsPage from './pages/FilmsPage';
import AboutPage from './pages/AboutPage';
import BrandPage from './pages/BrandPage';
import ConnectPage from './pages/ConnectPage';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { normalizeAndSyncData, isSimilarName } from './utils/syncHelper';
import { BrandItem, ClientItem, DEFAULT_BRAND_ITEMS, DEFAULT_CLIENTS_LIST } from './utils/brandData';
import { uploadFileInChunks } from './utils/chunkUpload';
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

export const DEFAULT_ORBIT_IMAGES: string[] = [
  'https://imagedelivery.net/aPW-WJR2InBqr5gX4RRkcg/925b4ba3-fc5f-412b-0e60-8f5ff420cd00/public',
  'https://imagedelivery.net/aPW-WJR2InBqr5gX4RRkcg/1ca7976e-4166-40c7-870c-bd343aa35e00/public',
  'https://imagedelivery.net/aPW-WJR2InBqr5gX4RRkcg/b7789c07-e0e4-4b71-7af4-870bee85d100/public',
  'https://imagedelivery.net/aPW-WJR2InBqr5gX4RRkcg/fcdc94b2-b127-4dac-09ac-52fb9cbb3a00/public',
  'https://drive.google.com/file/d/1jJAojjDyMLWWkmm3ZKkgWUCnixmersFM/view?usp=sharing'
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

  // Cloudinary video transformation to direct high quality MP4
  if (trimmed.includes('cloudinary.com') || trimmed.includes('cloudinary')) {
    try {
      if (trimmed.includes('player.cloudinary.com/embed') || trimmed.includes('cloud_name=')) {
        let cloudName = '';
        let publicId = '';
        if (trimmed.includes('?')) {
          const params = new URLSearchParams(trimmed.split('?')[1]);
          cloudName = params.get('cloud_name') || '';
          publicId = params.get('public_id') || '';
        }
        if (cloudName && publicId) {
          return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto:best,f_auto/${publicId}.mp4`;
        }
      }
      if (trimmed.includes('/video/upload/')) {
        if (!trimmed.includes('q_auto')) {
          return trimmed.replace('/video/upload/', '/video/upload/q_auto:best,f_auto/');
        }
        return trimmed;
      }
    } catch (e) {
      console.warn('Cloudinary transform error:', e);
    }
  }
  
  // Extract file ID from google drive share link if it's a google drive url
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdRegex = /(?:\/file\/d\/|id=)([^/?#]+)/;
    const match = trimmed.match(fileIdRegex);
    if (match && match[1]) {
      const fileId = match[1];
      if (type === 'video') {
        // Direct stream via server proxy for high-performance chunking, range support, and bypass CORS/Auth limits
        return `/api/drive-stream?id=${fileId}`;
      }
      return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    }
  }

  // Optimize direct lh3.googleusercontent.com links
  if (trimmed.includes('lh3.googleusercontent.com/d/')) {
    if (type === 'image' && !trimmed.includes('=w') && !trimmed.includes('=s') && !trimmed.includes('=h')) {
      return `${trimmed}=w1200`;
    }
    return trimmed;
  }

  // Unsplash image performance optimization
  if (type === 'image' && trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=format')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}auto=format&fit=crop&q=80&w=1200`;
    }
  }

  // Cloudinary image performance optimization
  if (type === 'image' && trimmed.includes('cloudinary.com') && trimmed.includes('/image/upload/')) {
    if (!trimmed.includes('f_auto') && !trimmed.includes('q_auto')) {
      return trimmed.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1200/');
    }
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
    { name: 'Portfolio', to: '/films', path: '/films' },
    { name: 'Collaborators', to: '/brand', path: '/brand' },
    { name: 'About Us', to: '/about', path: '/about' },
    { name: 'Connect', to: '/connect', path: '/connect' },
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-transparent ${isScrolled ? 'py-4' : 'py-10'}`}>
      {/* Progressive faded blur backdrop layer (high blur at top fading to zero blur at bottom) */}
      <div 
        className="absolute inset-0 -z-10 pointer-events-none transition-all duration-500"
        style={{
          backdropFilter: isScrolledOrBrand ? 'blur(24px)' : 'blur(0px)',
          WebkitBackdropFilter: isScrolledOrBrand ? 'blur(24px)' : 'blur(0px)',
          maskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0) 100%)',
          background: isScrolledOrBrand ? 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)' : 'transparent',
        }}
      />
      <div className="max-w-[1920px] mx-auto px-6 md:px-24 lg:px-40 flex justify-between items-center">
        {location.pathname === '/' ? (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 md:gap-4 select-none cursor-default"
          >
            {logoType === 'image' && logoImageUrl ? (
              <img 
                src={transformGoogleDriveUrl(logoImageUrl)} 
                alt={logoTextFull} 
                className="h-12 sm:h-14 md:h-16 object-contain max-w-[240px]" 
                referrerPolicy="no-referrer"
                onError={() => {
                  setLogoType('text');
                }}
              />
            ) : (
              <div className="flex items-center gap-0.5 select-none font-inter">
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white uppercase">
                  DREAMCATCHERS
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-orange-500 uppercase">
                  .TV
                </span>
              </div>
            )}
          </motion.div>
        ) : (
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
                  className="h-12 sm:h-14 md:h-16 object-contain max-w-[240px] transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setLogoType('text');
                  }}
                />
              ) : (
                <div className="flex items-center gap-0.5 select-none group font-inter">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white uppercase transition-colors duration-300 group-hover:text-orange-400">
                    DREAMCATCHERS
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-orange-500 uppercase">
                    .TV
                  </span>
                </div>
              )}
            </motion.div>
          </Link>
        )}

        <div className="hidden lg:flex items-center gap-14">
          {navLinks.map((link) => (
            link.to ? (
              <Link 
                key={link.name} 
                to={link.to} 
                className={`text-sm font-bold uppercase tracking-[0.2em] font-inter transition-all duration-300 ${isActive(link.path) ? 'text-orange-500' : 'text-white/70 hover:text-orange-400'}`}
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                className={`text-sm font-bold uppercase tracking-[0.2em] font-inter transition-all duration-300 text-white/70 hover:text-orange-400`}
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
                className="h-10 max-w-[180px] object-contain" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center gap-0.5 select-none font-inter">
                <span className="text-xl font-black tracking-wider text-white uppercase">
                  DREAMCATCHERS
                </span>
                <span className="text-xl font-black tracking-wider text-orange-500 uppercase">
                  .TV
                </span>
              </div>
            )}
            <button onClick={() => setIsMenuOpen(false)}><X /></button>
          </div>
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              link.to ? (
                <Link 
                  key={link.name} 
                  to={link.to} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-xs xs:text-sm font-bold uppercase tracking-[0.2em] font-inter transition-all duration-300 ${isActive(link.path) ? 'text-orange-500 font-extrabold' : 'text-white/60 hover:text-orange-400'}`}
                >
                  {link.name}
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-xs xs:text-sm font-bold uppercase tracking-[0.2em] font-inter transition-all duration-300 ${isActive(link.path) ? 'text-orange-500 font-extrabold' : 'text-white/60 hover:text-orange-400'}`}
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
    const defaultCloudinary = 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix';
    
    // Migration: Migrate any broken/expired Vimeo, old YouTube, or old Google Drive showreel URL in localStorage to the Cloudinary embed video
    const storedShowreel = localStorage.getItem('home_showreel_url');
    if (!storedShowreel || storedShowreel.includes('371433846') || storedShowreel.includes('EngS8gK6u4I') || storedShowreel.includes('11IhUdtZgucLSQsiqe2OZb08DOhidbTmD') || storedShowreel.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
      localStorage.setItem('home_showreel_url', defaultCloudinary);
    }
    
    // Also migrate the home_hero_bg_url if it was pointing to the old video, or if it is empty, or if we want to ensure the showreel video plays directly
    const storedHeroBgUrl = localStorage.getItem('home_hero_bg_url');
    if (!storedHeroBgUrl || storedHeroBgUrl.includes('11IhUdtZgucLSQsiqe2OZb08DOhidbTmD') || storedHeroBgUrl.includes('UhTRVjkQZMw') || storedHeroBgUrl.includes('EngS8gK6u4I') || storedHeroBgUrl.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
      localStorage.setItem('home_hero_bg_url', defaultCloudinary);
      localStorage.setItem('home_hero_bg_type', 'video');
    }
    
    const savedShowreel = localStorage.getItem('home_showreel_url') || defaultCloudinary;
    
    // If background is video and populated, use it. Otherwise, use stored/default showreel.
    if (bgType === 'video' && bgUrl && !bgUrl.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
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
        {/* Buttons removed so that the autoplay showreel video background plays directly without obstacles */}
 
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce">
           <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        </div>
      </motion.div>
    </div>
  );
}

export const DEFAULT_FILMS_LIST = [
  { id: '2', title: 'Postcards from Hong Kong', category: 'Travel', img: 'https://drive.google.com/file/d/1UW7uPDOF4S4KncVjllELIMuIlcPNFSf2/view?usp=sharing', video: 'https://www.youtube.com/embed/VjavKsM7qHs?si=u2fNMWNZNK4wb_uY' },
  { id: '1', title: 'Nofilter by Indigo - Season 2 | Episode 03 | From Heritage to Horizons', category: 'Reality TV / Live', img: 'https://drive.google.com/file/d/1cIyZpT9G7YcKSgi8lza2tx-gIDZ4G5Gr/view?usp=sharing', video: 'https://www.youtube.com/embed/iJ713HTcE1U?si=eJ_sitczZUkh5A-v', frameType: 'auto' },
  { id: '3', title: 'Priyanka | Bulgari Mediterranea High Jewelry collection', category: 'Branded Content', img: 'https://drive.google.com/file/d/1d0mPQcKFtNkJsaavGa-iz-EA0Gt_7n2Z/view?usp=sharing', video: 'https://youtube.com/shorts/xPPP1lv9Vd4?si=MmsNHZbxAQsr2ob3' },
  { id: '5', title: 'A celebration of color | Bvlgari High Jewelry', category: 'Branded Content', img: 'https://drive.google.com/file/d/12Zu7_nlH-KZEF9V62D4hlAGyHTra8yx1/view?usp=sharing', video: 'https://www.youtube.com/embed/FcBhpB-B45s?si=m8wn5B__4KRnXS3s' },
  { id: '6', title: 'Lights, Camera, Action: Filmfare OTT Awards 2023', category: 'Reality TV / Live', img: 'https://drive.google.com/file/d/1JGrcplp-uyVzLHSkqT1U7HIL_oUjFjq0/view?usp=sharing', video: 'https://www.youtube.com/embed/b70Q25Su9NU?si=TEz-JbdL-7JwTe6R', frameType: 'auto' },
  { id: '4', title: 'TVC Seven7 MS Dhoni', category: 'Branded Content', img: 'https://drive.google.com/file/d/1AHLQTzxuEsHqrhgvAhygLqun6ZnB-QpG/view?usp=sharing', video: 'https://youtube.com/watch?v=5B_gbhjjw58', frameType: 'auto' },
  { id: '8', title: 'VISITING THE INTERNATIONAL KITE FESTIVAL ft. Dolly Singh | IT HAPPENS ONLY IN INDIA', category: 'Influencer', img: 'https://drive.google.com/file/d/1LaqB8XI3Rgr420n6z4N3uyrAAxnN0Qy4/view?usp=sharing', video: 'https://www.youtube.com/embed/yNUmldWWUiY?si=skz1m0y8drBQG4_U', frameType: 'auto' },
  { id: '23', title: ' CYRUS AND CYRUS TAKE A WALK DOWN (THE PARSI) MEMORY LANE ft.', category: 'Travel & Lifestyle', img: 'https://drive.google.com/file/d/1E32s7yGCGjq4v_ZIglb5YomUkHYAYlSu/view?usp=sharing', video: 'https://www.youtube.com/embed/NM6p-AeiqZ0?si=S32By4fX1C27EybQ', frameType: 'landscape' },
  { id: '9', title: ' GO INTO THE WILD | Series Promo ', category: 'Branded Content', img: 'https://drive.google.com/file/d/1x3XIqAWKzXGOpqCQX0yGzeIGIAIAjNQh/view?usp=drive_link', video: 'https://www.youtube.com/embed/FGIJLFVpGjw?si=KlAQOR_Zm26X2gCX', frameType: 'vertical' },
  { id: '14', title: 'Lucknow Travel Itinerary from food to heritage to culture, Kebabs to Imambara to the new T3 AIRPORT', category: 'Influencer', img: 'https://drive.google.com/file/d/1XMBdG85TdoEPDCS37mCkEAYsFsg8xHvx/view?usp=sharing', video: 'https://www.youtube.com/embed/dCjkr3zU1fw?si=K7et4zTMTAUBNBN3', frameType: 'landscape' },
  { id: '11', title: 'Nature’s Hidden Jewel | Into The Green: Discovering Jharkhand | Discovery Channel', category: 'Travel', img: 'https://drive.google.com/file/d/19EFeZzYiyHSqI0rediEz-y6jGWKY36XF/view?usp=sharing', video: 'https://www.youtube.com/embed/mpIZwJYxN28?si=VmrgrntVheW1a_Fm', frameType: 'auto' },
  { id: '21', title: ' Postcards From Meghalaya', category: 'Branded Content', img: 'https://drive.google.com/file/d/1Cj5sIi_0zvgdY7Wm2ZGd5jGWs9PE9xfo/view?usp=sharing', video: 'https://www.youtube.com/embed/x0Rdp2MnTeA?si=IV7gtNu-bumTOdEK', frameType: 'landscape' },
  { id: '24', title: ' TRYING CHOCOLATE MOMOS AT THE ALCHI\'S KITCHEN ft.', category: 'Travel & Lifestyle', img: 'https://drive.google.com/file/d/1-lPXoFL0rxUQMr1VxfBs_fl3P30kyX7S/view?usp=sharing', video: 'https://www.youtube.com/embed/hFjSP37rI1c?si=iaQg9jCDlOrlGXfS', frameType: 'landscape' },
  { id: '10', title: 'Adani’s Story - The Biggest Comeback in India’s Corporate History | Complete Case Study', category: 'Influencer', img: 'https://drive.google.com/file/d/1dwrUT3tPDnLaImFKZNqzVCh7Pbl7Ef6D/view?usp=sharing', video: 'https://www.youtube.com/embed/WACpHc8iR3w?si=w7_U--VSBdgph6Q3', frameType: 'landscape' },
  { id: '13', title: 'Daifuku x Birla Opus || Corporate Film 2025', category: 'Branded Content', img: 'https://drive.google.com/file/d/14Z34wTAzJxUjBq7oyqPXQ2tGveY66_My/view?usp=sharing', video: 'https://www.youtube.com/embed/QO-htcvs0f0?si=SqFwMA_NxZXsWyDm', frameType: 'landscape' },
  { id: '7', title: 'Vim Maha Kadai Record | Discovery Channel Documentary | Mahakumbh 2025', category: 'Branded Content', img: 'https://drive.google.com/file/d/1okt8Su1Ly43qvqGIzYQEyw6lmMJm_5Rh/view?usp=drive_link', video: 'https://www.youtube.com/embed/x9pvZw8Qc3E?si=xFge5o1ZiK-1l--M', frameType: 'landscape' },
  { id: '16', title: 'AI-Led CFO Transformation: Rebuilding the CFO Office', category: 'Branded Content', img: 'https://drive.google.com/file/d/1KYF33Y7Vt-ksjjTYBIP_n4ZaqpxYuc_U/view?usp=sharing', video: 'https://www.youtube.com/embed/YCRPmba_czo?si=JsfyhTuW32VlgSiE', frameType: 'landscape' },
  { id: '15', title: 'BSF: India\'s First Line of Defence', category: 'Documentaries', img: 'https://drive.google.com/file/d/1bdyKVwTqBugVyij5Hz95VVmwYe8pf9OG/view?usp=sharing', video: 'https://www.youtube.com/embed/I_STX2cKx-Q?si=KSSVdVfBITsdrdai', frameType: 'vertical' },
  { id: '17', title: 'DLF CyberHub 10 Years Anniversary', category: 'Commercials', img: 'https://drive.google.com/file/d/1u4jokMDn45XyKCzgD1kZ26L8oLEoOjjh/view?usp=sharing', video: 'https://www.youtube.com/embed/BdHFOLaoQnc?si=GsoF9V0yEYZ0T4Xe', frameType: 'landscape' },
  { id: '18', title: 'Adani Music Video', category: 'Branded Content', img: 'https://drive.google.com/file/d/1_PztCvb6PVUtlkqGNPtYS_AhRENRHzit/view?usp=sharing', video: 'https://www.youtube.com/embed/B9daInmjtSU?si=4ukf0-j5-b8CZk1b', frameType: 'auto' },
  { id: '19', title: 'Adani Vidya mandir ', category: 'Branded Content', img: 'https://drive.google.com/file/d/1JMWtvDxcO4ZB-iMB3-MJNOnKbw1kbRNi/view?usp=sharing', video: 'https://www.instagram.com/reel/DLt2aE7s30_/embed', frameType: 'auto' },
  { id: '20', title: 'Flight of the Hawkz (Nat Geo)', category: 'Branded Content', img: 'https://drive.google.com/file/d/1iMwXqUCobmPj4AfGqisnhcqtPqcJceI4/view?usp=sharing', video: 'https://www.youtube.com/embed/v7_pjg3IS9s?si=itc0J5U4GNj1T_w2', frameType: 'landscape' },
  { id: '22', title: 'L&T - We Take The Leap', category: 'Documentaries', img: 'https://drive.google.com/file/d/1GNXIvh2qdFDKhWIaX9x6_6EVGacEYK2m/view?usp=sharing', video: 'https://www.youtube.com/embed/Qnpw4VEayHg?si=yQ5UC6-tPdTMUzou', frameType: 'auto' },
  { id: '25', title: 'Adarsh gupta - Vizhinjam ', category: 'Influencer', img: 'https://drive.google.com/file/d/17jZaNGe4vj2my8v4EYVVeq2KBi7sQcJe/view?usp=sharing', video: 'https://www.instagram.com/reel/DJnmrzFBdos/embed', frameType: 'vertical' },
  { id: '26', title: 'Maidaan Saaf - Coca Cola', category: 'Branded Content', img: 'https://drive.google.com/file/d/1hmg01XXPLs4owUKw6fMMA6EYrS3mXSa5/view?usp=sharing', video: 'https://www.youtube.com/embed/7PKpLenMeGo?si=XbwxVcAejT6l6byt', frameType: 'landscape' },
  { id: '27', title: 'Superstructures Birsa Munda Hockey Stadium, Rourkela', category: 'Documentaries', img: 'https://drive.google.com/file/d/1UgovzIyXB8c4jycJo4sp6T4kDgnimq2E/view?usp=sharing', video: 'https://www.youtube.com/embed/W9IwuYAoC4k?si=15d3PQw8Vego9uyt', frameType: 'landscape' },
  { id: '28', title: ' SWACHH BHARAT - INDIA\'S SANITATION REVOLUTION', category: 'Documentaries', img: 'https://drive.google.com/file/d/1Lv77Y0grN5yc4DCErY93sf03YN9qDfx6/view?usp=sharing', video: 'https://www.youtube.com/embed/ZYqTE0GhQA0?si=xYNXNK7PM-izp3p_', frameType: 'landscape' },
  { id: '29', title: 'WOMEN OF HONOUR - OTA CHENNAI', category: 'Documentaries', img: 'https://drive.google.com/file/d/16WEq7ghmxvhyawEzL6m1wmd0pJMnvW5f/view?usp=sharing', video: 'https://www.youtube.com/embed/VDfTUaTgaeo?si=pn7hOFgmSmBzHcMK', frameType: 'landscape' },
  { id: '30', title: 'MEGAICONS: Keshav Murugesh I National Geographic', category: 'Documentaries', img: 'https://drive.google.com/file/d/1lPjRnI4Fw2javLGucIsBLEjH6OsETljf/view?usp=sharing', video: 'https://www.youtube.com/embed/tFR6IRKQguY?si=2N5pxm6O9m4y0m8N', frameType: 'landscape' },
  { id: '31', title: 'Hyundai India Junior Golf Tournament 2023 I WB DISCOVERY I EUROPORT', category: 'Branded Content', img: 'https://drive.google.com/file/d/1b7_zJRRQhD8OtR0CFZl_lODvCN18y9pJ/view?usp=sharing', video: 'https://www.youtube.com/embed/c2Y1NAn0kkQ?si=3l6wMznnDEaBXsRZ', frameType: 'landscape' },
  { id: '32', title: 'Excellence Now In Noida', category: 'Branded Content', img: 'https://drive.google.com/file/d/1HpKIACg24e6vsl2__lBM7_v8IZTRzfv9/view?usp=sharing', video: 'https://www.youtube.com/embed/KATDD-yna5w?si=7f8A8iXTKl47SrsJ', frameType: 'landscape' },
  { id: '33', title: 'TECNO Wali Diwali | Diwali Film', category: 'Branded Content', img: 'https://drive.google.com/file/d/1KbKC2ZgaOMlj2uhAbwz93YF2eaD-7V2a/view?usp=sharing', video: 'https://www.youtube.com/embed/ORLgzjF1Uug?si=gb9IPIPE-wGvAIGL', frameType: 'landscape' }
];

export const FILMS = DEFAULT_FILMS_LIST;

function Clients() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  
  // Dynamic speed calculations so all rows move at the same speed
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchClients = () => {
      const { clients: syncedClients } = normalizeAndSyncData(DEFAULT_CLIENTS_LIST, DEFAULT_BRAND_ITEMS);

      const mappedClients: ClientItem[] = syncedClients.map((item, idx) => {
        const defaultItem = DEFAULT_BRAND_ITEMS.find(d => 
          d.id.toLowerCase() === item.id.toLowerCase() || 
          d.name.toLowerCase() === item.name.toLowerCase() ||
          d.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(d.name.toLowerCase())
        );

        // Fallback layer assignment if layer is not defined or invalid
        let assignedLayer: 1 | 2 | 3 | 4 | string = item.layer || '';
        if (!assignedLayer) {
          assignedLayer = (((idx % 4) + 1) as 1 | 2 | 3 | 4);
        }

        const matchesName = defaultItem ? isSimilarName(defaultItem.name, item.name) : false;

        return {
          ...item,
          layer: assignedLayer,
          renderLogo: (defaultItem && matchesName) ? defaultItem.renderLogo : item.renderLogo
        };
      });

      setClients(mappedClients);
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

  // Filter clients into Row 1, Row 2, Row 3, Row 4 based on 'layer' setting (fallback to index % 4 if unset)
  const row1Clients = clients.filter((c, idx) => c.layer ? (Number(c.layer) === 1) : (idx % 4 === 0));
  const row2Clients = clients.filter((c, idx) => c.layer ? (Number(c.layer) === 2) : (idx % 4 === 1));
  const row3Clients = clients.filter((c, idx) => c.layer ? (Number(c.layer) === 3) : (idx % 4 === 2));
  const row4Clients = clients.filter((c, idx) => c.layer ? (Number(c.layer) === 4) : (idx % 4 === 3));

  return (
    <section 
      id="clients" 
      className="pt-12 md:pt-16 lg:pt-20 xl:pt-24 pb-8 md:pb-12 bg-transparent overflow-hidden relative" 
      ref={containerRef}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex flex-col items-start relative z-20">
        <div className="text-left mb-6 md:mb-8 lg:mb-10">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-redhat text-[19px] xs:text-[23px] sm:text-[29px] md:text-[41px] lg:text-[53px] font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none"
          >
            Collaborators
          </motion.h3>
        </div>

        {/* Scrolling Marquees */}
        <div className="w-full space-y-2 md:space-y-3 lg:space-y-4 overflow-hidden pointer-events-auto">
          {/* Top Row - Scrolling Left */}
          {row1Clients.length > 0 && (
            <DraggableMarqueeRow items={row1Clients} direction="left" isMobile={isMobile} />
          )}

          {/* Middle Row - Scrolling Right */}
          {row2Clients.length > 0 && (
            <DraggableMarqueeRow items={row2Clients} direction="right" isMobile={isMobile} />
          )}

          {/* Bottom Row - Scrolling Left */}
          {row3Clients.length > 0 && (
            <DraggableMarqueeRow items={row3Clients} direction="left" isMobile={isMobile} />
          )}

          {/* Fourth Row - Scrolling Right */}
          {row4Clients.length > 0 && (
            <DraggableMarqueeRow items={row4Clients} direction="right" isMobile={isMobile} />
          )}
        </div>
      </div>

      {/* Styled inline mask for edge-fade effect */}
      <style>{`
        .mask-gradient {
          mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
        }
      `}</style>
    </section>
  );
}

interface DraggableMarqueeRowProps {
  items: ClientItem[];
  direction: 'left' | 'right';
  isMobile: boolean;
}

const DraggableMarqueeRow: FC<DraggableMarqueeRowProps> = ({ items, direction, isMobile }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const autoScrollPauseUntilRef = useRef(0);

  // Pad list elements to guarantee seamless infinite wrapping
  const getPaddedRowItems = (rowList: ClientItem[]) => {
    if (rowList.length === 0) return [];
    let list = [...rowList];
    while (list.length < 12) {
      list = [...list, ...rowList];
    }
    // Return 3 copies to easily center and wrap seamlessly
    return [...list, ...list, ...list];
  };

  const paddedItems = getPaddedRowItems(items);

  // Set initial scroll position to the middle copy
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setInitialScroll = () => {
      const totalWidth = container.scrollWidth;
      container.scrollLeft = totalWidth / 3;
    };

    const timer = setTimeout(setInitialScroll, 100);
    return () => clearTimeout(timer);
  }, [items]);

  // Handle requestAnimationFrame automatic scroll
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateScroll = (time: number) => {
      const container = containerRef.current;
      if (container && !isDragging && Date.now() >= autoScrollPauseUntilRef.current) {
        const delta = (time - lastTime) / 1000;
        // Speed: 35px/sec on mobile, 55px/sec on desktop
        const speed = isMobile ? 35 : 55;
        const scrollAmount = direction === 'left' ? speed * delta : -speed * delta;
        container.scrollLeft += scrollAmount;

        // Seamless wrap checks
        const totalWidth = container.scrollWidth;
        if (totalWidth > 0) {
          const oneThird = totalWidth / 3;
          if (container.scrollLeft >= oneThird * 2) {
            container.scrollLeft -= oneThird;
          } else if (container.scrollLeft <= 5) {
            container.scrollLeft += oneThird;
          }
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    animationFrameId = requestAnimationFrame(updateScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging, direction, isMobile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    dragStartX.current = e.pageX - container.offsetLeft;
    dragScrollLeft.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (dragStartX.current - x) * 1.5;
    container.scrollLeft = dragScrollLeft.current + walk;

    const totalWidth = container.scrollWidth;
    if (totalWidth > 0) {
      const oneThird = totalWidth / 3;
      if (container.scrollLeft >= oneThird * 2) {
        container.scrollLeft -= oneThird;
        dragStartX.current = x;
        dragScrollLeft.current = container.scrollLeft;
      } else if (container.scrollLeft <= 5) {
        container.scrollLeft += oneThird;
        dragStartX.current = x;
        dragScrollLeft.current = container.scrollLeft;
      }
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      autoScrollPauseUntilRef.current = Date.now() + 2500;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    dragStartX.current = e.touches[0].pageX - container.offsetLeft;
    dragScrollLeft.current = container.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (!isDragging) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (dragStartX.current - x) * 1.5;
    container.scrollLeft = dragScrollLeft.current + walk;

    const totalWidth = container.scrollWidth;
    if (totalWidth > 0) {
      const oneThird = totalWidth / 3;
      if (container.scrollLeft >= oneThird * 2) {
        container.scrollLeft -= oneThird;
        dragStartX.current = x;
        dragScrollLeft.current = container.scrollLeft;
      } else if (container.scrollLeft <= 5) {
        container.scrollLeft += oneThird;
        dragStartX.current = x;
        dragScrollLeft.current = container.scrollLeft;
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      className={`flex overflow-x-hidden relative w-full mask-gradient py-3 md:py-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="flex w-max flex-shrink-0">
        {paddedItems.map((client, i) => (
          <ClientLogo key={`${client.name}-${direction}-${client.id || i}-${i}`} client={client} />
        ))}
      </div>
    </div>
  );
};

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
  let pxClass = 'px-4 md:px-8';

  if (size === 'small') {
    imgClasses = 'h-5 md:h-8 lg:h-10 max-w-[70px] md:max-w-[140px] lg:max-w-[180px]';
    txtClasses = 'text-[9px] md:text-xs font-semibold';
    pxClass = 'px-3 md:px-[16px] lg:px-[22px] xl:px-[28px]';
  } else if (size === 'medium') {
    imgClasses = 'h-6 md:h-12 lg:h-15 xl:h-18 max-w-[90px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px]';
    txtClasses = 'text-[10px] md:text-sm lg:text-base font-bold';
    pxClass = 'px-4 md:px-[18px] lg:px-[26px] xl:px-[36px]';
  } else if (size === 'large') {
    imgClasses = 'h-8 md:h-16 lg:h-20 xl:h-24 max-w-[110px] md:max-w-[240px] lg:max-w-[300px] xl:max-w-[340px]';
    txtClasses = 'text-xs md:text-lg lg:text-xl font-extrabold';
    pxClass = 'px-5 md:px-[22px] lg:px-[32px] xl:px-[48px]';
  } else if (size === 'xlarge') {
    imgClasses = 'h-10 md:h-20 lg:h-24 xl:h-28 max-w-[130px] md:max-w-[300px] lg:max-w-[380px] xl:max-w-[420px]';
    txtClasses = 'text-xs md:text-xl lg:text-2xl font-black';
    pxClass = 'px-5 md:px-[24px] lg:px-[38px] xl:px-[54px]';
  } else if (
    size === 'extralarge' || 
    size === 'extra-large' || 
    size === 'xl' || 
    size === 'extra large'
  ) {
    imgClasses = 'h-12 md:h-24 lg:h-28 xl:h-[135px] max-w-[150px] md:max-w-[350px] lg:max-w-[450px] xl:max-w-[500px]';
    txtClasses = 'text-sm md:text-2xl lg:text-3xl font-black tracking-wider';
    pxClass = 'px-6 md:px-[30px] lg:px-[50px] xl:px-[72px]';
  } else {
    // Default fallback (medium-ish)
    imgClasses = 'h-6 md:h-12 lg:h-15 xl:h-18 max-w-[90px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px]';
    txtClasses = 'text-[10px] md:text-sm lg:text-base font-bold';
    pxClass = 'px-4 md:px-[18px] lg:px-[26px] xl:px-[36px]';
  }

  return (
    <div 
      className={`flex items-center justify-center ${pxClass} h-12 md:h-[90px] lg:h-[115px] xl:h-[145px] flex-shrink-0 relative overflow-hidden select-none cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
    >
      {hasLogoUrl ? (
        <img 
          src={transformGoogleDriveUrl(client.logoUrl)} 
          alt={client.name} 
          className={`${imgClasses} w-auto object-contain pointer-events-none shadow-sm`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : client.renderLogo ? (
        client.renderLogo()
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
    url: 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix'
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
    id: "sports_box",
    label: "Sports Box Vertical",
    title: "SPORTS BOX",
    subtitle: "SPORTS VERTICAL",
    description: "INTERNATIONAL TOURNAMENT ORGANISING & BROADCAST",
    type: "image",
    url: "https://lh3.googleusercontent.com/d/1OTE2iM4TZ1mKn4OEt6rS410Y3wW_1K6O"
  },
  {
    id: "dc_digital",
    label: "DC Digital Studio Vertical",
    title: "DC DIGITAL STUDIO",
    subtitle: "DIGITAL VERTICAL",
    description: "SHORT FORM, DIGITAL, AI CONTENT",
    type: "image",
    url: "https://lh3.googleusercontent.com/d/1-ne-2qbWr2Pe13o1JsHXHvXyVpr_zi2_"
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
    mapsUrl: "https://maps.app.goo.gl/KqzYV4eiiicY2aiG9",
    path: "M60 22 C75 22, 95 32, 95 52 C95 72, 75 88, 60 94 C45 88, 25 72, 25 52 C25 32, 45 22, 60 22 Z",
    mapImage: "https://lh3.googleusercontent.com/d/1UTIMHUUL8M_fB7OBzyhIv-DuQJAhRMoM"
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
    mapsUrl: "https://drive.google.com/file/d/1JN9Ltlir20z0JIbiwmRPPSPviwQYAK-3/view?usp=sharing",
    path: "M55 18 C65 18, 68 30, 62 45 C56 60, 58 72, 50 85 C42 96, 38 102, 36 104 C34 99, 30 87, 34 74 C38 61, 34 48, 40 34 C46 20, 42 18, 55 18 Z",
    mapImage: "https://lh3.googleusercontent.com/d/1PpR1bjwzHbQYnABpPwFhfu0BVqdTgB2G"
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
    mapsUrl: "https://maps.google.com/?q=Grand+Oasis+Towers,+Lower+Parel,+Mumbai",
    path: "M45 22 C60 26, 72 35, 70 52 C68 70, 55 85, 50 96 C42 85, 32 70, 35 52 C38 35, 29 26, 45 22 Z",
    mapImage: "https://lh3.googleusercontent.com/d/1YsrWfxGY9byZp2cUcQtdJFQF0liO6l_z"
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
    mapImage: "https://lh3.googleusercontent.com/d/1Apke2XVpNh-L_NEeyyh0uNA-4xYb6XS4"
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
    mapsUrl: "https://drive.google.com/file/d/1qswJZJQMEB6gRyvQcmqJ0ptyhnBsKM9M/view?usp=sharing",
    path: "M48 22 C66 22, 80 35, 85 52 C90 70, 72 87, 58 94 C44 87, 26 70, 30 52 C34 35, 30 22, 48 22 Z",
    mapImage: "https://lh3.googleusercontent.com/d/1qswJZJQMEB6gRyvQcmqJ0ptyhnBsKM9M"
  }
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: "PUNEET GAUTAM", role: "", image: "https://drive.google.com/file/d/1bwolrzjYywZ7sA3z8tgS-iS1KYX11W7l/view?usp=sharing", mediaType: "image" },
  { id: 2, name: "AAKASH DUTT", role: "", image: "https://drive.google.com/file/d/1s4BfwZv_dBXt_uRDmbWx9xnbTVtcngEc/view?usp=sharing", mediaType: "image" },
  { id: 3, name: "RAGHAV SHIROMANI", role: "Post-Production", image: "https://drive.google.com/file/d/1EstiyCHGeRscKQIwFz_ghnE1DCeqfiCz/view?usp=sharing", mediaType: "image" },
  { id: 5, name: "DEODAT KUMAR", role: "Team Associate", image: "https://drive.google.com/file/d/1xuuUAYxz2Q2qicHdLeKUfyBSv_XwKBk8/view?usp=sharing", mediaType: "image" },
  { id: 4, name: "NIKHIL SHARMA", role: "Cinematographer", image: "https://drive.google.com/file/d/1VEJ2UFRDWSiZ9u9W8t9Htt4MU4Vh37tJ/view?usp=sharing", mediaType: "image" },
  { id: 6, name: "AKSHIT MATHUR", role: "Team Associate", image: "https://drive.google.com/file/d/1x3b8vP9r9_NlAL5aSudHSitXnTkJ3gp6/view?usp=sharing", mediaType: "image" },
  { id: 7, name: "FALAK KHATANA", role: "Team Associate", image: "https://drive.google.com/file/d/17Cdf03kcdbdbwutiOMkN3aAwJFN-wIMm/view?usp=sharing", mediaType: "image" },
  { id: 8, name: "NANDINI IYER", role: "Team Associate", image: "https://drive.google.com/file/d/1SGNI6-54LGypHgEMNEDw8DEzWCdLxXiZ/view?usp=sharing", mediaType: "image" },
  { id: 9, name: "ANIMAN PRASHAD ", role: "Team Associate", image: "https://drive.google.com/file/d/1Hoi2Fep3m1zPHU56GneQxa0UTVOF_SU2/view?usp=sharing", mediaType: "image" },
  { id: 10, name: "MRIDUL SWWAMI", role: "Team Associate", image: "https://drive.google.com/file/d/1gdaViZLjHAjHpVLvkxJLd8sc14lS6WP9/view?usp=sharing", mediaType: "image" },
  { id: 11, name: "SURENDER VASHISHT", role: "Team Associate", image: "https://drive.google.com/file/d/1_zfWSIHfGDNiw1tzQTZvTrsfCWjNa--f/view?usp=sharing", mediaType: "image" },
  { id: 12, name: "SURBHI RANA ", role: "Team Associate", image: "https://drive.google.com/file/d/1Q5ZcHNFNvLoRirNrBwZn3jKcw1unGG3h/view?usp=sharing", mediaType: "image" },
  { id: 13, name: "JEETENDER", role: "Team Associate", image: "https://drive.google.com/file/d/1892f9udVzfXEUNNRCTFgZxE2hr4GiRtB/view?usp=sharing", mediaType: "image" },
  { id: 14, name: "BIJAY KUMAR", role: "Team Associate", image: "https://drive.google.com/file/d/1rkA_iwJQBbZv6bBmw-RCM2kBW8MdmFQv/view?usp=sharing", mediaType: "image" },
  { id: 15, name: "COFFEE", role: "Team Associate", image: "https://drive.google.com/file/d/18ZgyQiqhhm9FyioZoySxCvK1Msve7GAp/view?usp=sharing", mediaType: "image" },
  { id: 16, name: "BARFI", role: "Team Associate", image: "https://drive.google.com/file/d/1IRUkj8RaqXgPuKpXmaZ5YukIoJyKAqRu/view?usp=sharing", mediaType: "image" },
  { id: 17, name: "RABDI", role: "Team Associate", image: "https://drive.google.com/file/d/1dRAKgwVIpzZRCucXDXpEMG0MGcUA9l7h/view?usp=sharing", mediaType: "image" },
  { id: 19, name: "CHICO", role: "Team Associate", image: "https://drive.google.com/file/d/1hEUudJsJt3sr12uQS0bzbTu8BRsKmRhp/view?usp=sharing", mediaType: "image" }
];

function DreamTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isTeamSectionInView, setIsTeamSectionInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTeamSectionInView(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
      }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
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
    
    window.addEventListener('storage_updated_team', loadTeamMembers);
    window.addEventListener('storage', loadTeamMembers);
    return () => {
      window.removeEventListener('storage_updated_team', loadTeamMembers);
      window.removeEventListener('storage', loadTeamMembers);
    };
  }, []);

  // Center selected card smoothly
  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.children[index] as HTMLElement;
    if (card) {
      const targetScrollLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  const handlePrev = () => {
    if (teamMembers.length === 0) return;
    const prevIndex = (activeIndex - 1 + teamMembers.length) % teamMembers.length;
    scrollToCard(prevIndex);
  };

  const handleNext = () => {
    if (teamMembers.length === 0) return;
    const nextIndex = (activeIndex + 1) % teamMembers.length;
    scrollToCard(nextIndex);
  };

  // Determine activeIndex on user manual scroll/drag
  const handleScroll = () => {
    if (!scrollContainerRef.current || teamMembers.length === 0) return;
    const container = scrollContainerRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    
    const children = container.children;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < teamMembers.length; i++) {
      const card = children[i] as HTMLElement;
      if (!card) continue;
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    setActiveIndex(closestIndex);
  };

  // Slow automated rotation
  useEffect(() => {
    if (teamMembers.length === 0 || !isTeamSectionInView) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % teamMembers.length;
      scrollToCard(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [teamMembers, activeIndex, isTeamSectionInView]);

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
    <section id="team" ref={sectionRef} className="pt-16 md:pt-28 pb-16 md:pb-24 relative overflow-hidden bg-black border-t border-zinc-950">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial-gradient from-zinc-900/40 via-transparent to-transparent pointer-events-none select-none z-0" />

      <div className="max-w-[1920px] mx-auto relative z-10">
        <div className="px-6 md:px-24 mb-12 md:mb-16 text-left">
          <motion.span 
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-orange-500 text-xs font-black uppercase tracking-[0.5em] mb-3 block"
          >
            The Visionaries
          </motion.span>
          <motion.h3 
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="font-bebas text-4xl md:text-7xl font-black italic tracking-[0.02em] text-orange-500 uppercase leading-none select-none"
          >
            Dream Team
          </motion.h3>
        </div>

        {/* Real Continuous 35mm Filmstrip Belt */}
        <div className="relative w-full bg-black py-10 md:py-14 border-y-[20px] border-zinc-950 select-none overflow-hidden">
          
          {/* Top Sprocket Perforation Holes */}
          <div className="absolute top-3 left-0 right-0 h-4 flex justify-between pointer-events-none select-none z-20 px-2 gap-[1vw] overflow-hidden">
            {Array.from({ length: 60 }).map((_, idx) => (
              <div 
                key={`sprocket-top-${idx}`} 
                className="w-3.5 h-3 bg-white/90 border border-zinc-900 shadow-sm flex-shrink-0" 
              />
            ))}
          </div>

          {/* Film Cells Track */}
          <div className="relative z-10 w-full flex items-center justify-center">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full flex flex-row overflow-x-auto gap-0 py-2 scrollbar-none select-none scroll-smooth snap-x snap-mandatory relative z-10 pl-[30vw] pr-[30vw] md:pl-[38vw] md:pr-[38vw]"
              style={{
                scrollSnapType: 'x mandatory'
              }}
            >
              {teamMembers.map((member, i) => {
                const isActive = i === activeIndex;
                
                return (
                  <div
                    key={member.id}
                    onClick={() => scrollToCard(i)}
                    className="flex-shrink-0 snap-center cursor-pointer transition-all duration-500 w-[240px] md:w-[325px] aspect-[2/3] bg-black relative flex items-center justify-center border-r-[16px] md:border-r-[24px] border-black rounded-none"
                  >
                    {/* Portrait Picture Box Frame (Perfect Square / No Rounded corners) */}
                    <div 
                      className={`w-full h-full bg-zinc-900 border-2 transition-all duration-500 overflow-hidden rounded-none ${
                        isActive 
                          ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.25)] brightness-110 scale-100' 
                          : 'border-zinc-800 scale-95 opacity-50 hover:opacity-100 hover:scale-97'
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
                          className="w-full h-full object-cover pointer-events-none rounded-none"
                        />
                      ) : (
                        <img 
                          src={transformGoogleDriveUrl(member.image, 'image')} 
                          alt={member.name} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover pointer-events-none select-none rounded-none transition-opacity duration-500 opacity-0"
                          referrerPolicy="no-referrer"
                          onLoad={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                          }}
                        />
                      )}
                      
                      {/* Cine reflection overlays */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left Scroll Trigger Button */}
            <button 
              type="button"
              onClick={handlePrev}
              className="absolute left-4 md:left-10 z-30 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/75 hover:bg-orange-500 hover:text-black border border-zinc-800 hover:border-orange-500 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer text-white backdrop-blur-md group"
              aria-label="Previous Team Member"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-0.5" />
            </button>

            {/* Right Scroll Trigger Button */}
            <button 
              type="button"
              onClick={handleNext}
              className="absolute right-4 md:right-10 z-30 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/75 hover:bg-orange-500 hover:text-black border border-zinc-800 hover:border-orange-500 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer text-white backdrop-blur-md group"
              aria-label="Next Team Member"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Bottom Sprocket Perforation Holes */}
          <div className="absolute bottom-3 left-0 right-0 h-4 flex justify-between pointer-events-none select-none z-20 px-2 gap-[1vw] overflow-hidden">
            {Array.from({ length: 60 }).map((_, idx) => (
              <div 
                key={`sprocket-bottom-${idx}`} 
                className="w-3.5 h-3 bg-white/90 border border-zinc-900 shadow-sm flex-shrink-0" 
              />
            ))}
          </div>
        </div>

        {/* Name and description panel displayed cleanly below the film strip */}
        <div className="mt-10 mb-6 text-center max-w-xl mx-auto px-6 h-28 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`metadata-${activeIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <h4 className="font-bebas text-4xl md:text-5xl font-black tracking-wider text-orange-500 uppercase leading-none">
                {teamMembers[activeIndex]?.name}
              </h4>
              <p className="text-xs font-mono font-extrabold tracking-[0.25em] text-zinc-400 uppercase mt-2.5">
                {teamMembers[activeIndex]?.role}
              </p>
              {teamMembers[activeIndex]?.bio && (
                <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed max-w-sm mx-auto">
                  {teamMembers[activeIndex]?.bio}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom continuous cinematic stream labels */}
        <div className="hidden md:flex flex-row justify-between items-center mt-6 px-24 pointer-events-none select-none">
          <span className="text-[9px] font-mono tracking-[0.3em] text-zinc-700 uppercase">
            35MM FILM REEL CONTROL // FRAME-LOCK CALIBRATION COMPLETE
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              CONTINUOUS CINEMATIC STREAM
            </span>
            <div className="w-16 h-[2px] bg-orange-500" />
          </div>
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
    name: "Travel & Lifestyle",
    desc: "Cinematic adventures, luxury spaces, global travel & cozy lifestyle stories",
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
    name: "Reality",
    desc: "High-energy television formats, live productions & real-time events",
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(239, 68, 68, 0.4)"
  },
  {
    name: "Commercials",
    desc: "Dynamic short-form advert films & promotional campaigns",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(6, 182, 212, 0.4)"
  },
  {
    name: "Influencer",
    desc: "Premium creator-driven lifestyle content & social-first stories",
    img: "https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=800",
    glow: "rgba(236, 72, 153, 0.4)"
  }
];

const normalizeCategoryName = (name: string | undefined): string => {
  if (!name) return '';
  const n = name.trim().toLowerCase();
  if (n === 'travel' || n === 'lifestyle' || n === 'travel & lifestyle') {
    return 'Travel & Lifestyle';
  }
  if (n === 'reality tv / live' || n === 'reality' || n === 'reality tv') {
    return 'Reality';
  }
  return name.trim();
};

function Portfolio() {
  const navigate = useNavigate();
  const [films, setFilms] = useState<any[]>([]);
  const [title, setTitle] = useState('Films');
  const [visible, setVisible] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [hoveredFilmId, setHoveredFilmId] = useState<string | null>(null);
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
              viewport={{ once: true, amount: 0.15 }}
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

              {films.filter(film => normalizeCategoryName(film.category).toLowerCase() === selectedCategory.name.toLowerCase()).length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-white/30 text-sm font-black uppercase tracking-widest">No cinematic works added yet under this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {films.filter(film => normalizeCategoryName(film.category).toLowerCase() === selectedCategory.name.toLowerCase()).map((film, idx) => {
                    // Fallback to our cinematic YouTube link if film video is empty or broken
                    const videoUrl = !film.video || film.video.includes('371433846') 
                      ? 'https://www.youtube.com/watch?v=EngS8gK6u4I' 
                      : film.video;
                    const isYouTube = isYouTubeUrl(videoUrl);
                    const isEmbed = isEmbedUrl(videoUrl);
                    const isHovered = hoveredFilmId === film.id;

                    return (
                      <motion.div
                        key={film.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onMouseEnter={() => setHoveredFilmId(film.id)}
                        onMouseLeave={() => setHoveredFilmId(null)}
                        onClick={() => {
                          if (isYouTube) {
                            window.open(getYouTubeWatchUrl(videoUrl), '_blank', 'noopener,noreferrer');
                          } else {
                            setSelectedVideo(videoUrl);
                          }
                        }}
                        className="group relative aspect-video overflow-hidden rounded-2xl cursor-pointer bg-zinc-950 border border-white/5 shadow-lg"
                      >
                        <img
                          src={transformGoogleDriveUrl(film.img)}
                          alt={film.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />

                        {/* On-Hover Video Player/Preview Overlay */}
                        {isHovered && (
                          <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden rounded-2xl">
                            {isEmbed ? (
                              <iframe 
                                src={getEmbedUrl(videoUrl, true)} 
                                className="absolute inset-0 w-full h-full scale-110 border-0 pointer-events-none"
                                allow="autoplay; encrypted-media"
                                style={{ pointerEvents: 'none' }}
                              />
                            ) : (
                              <video 
                                src={transformGoogleDriveUrl(videoUrl, 'video')} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover scale-105" 
                              />
                            )}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-75 transition-opacity z-20 pointer-events-none" />
                        
                        <div className="absolute inset-x-0 bottom-0 p-6 z-30 pointer-events-none">
                          <h5 className="text-lg font-black text-white uppercase italic leading-none truncate group-hover:text-orange-500 transition-colors">
                            {film.title}
                          </h5>
                        </div>

                        <div className="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-300 z-30 pointer-events-auto">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 fill-current translate-x-0.5 animate-pulse" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
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
              className={`relative w-full bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl ${selectedVideo?.includes('instagram.com') ? 'max-w-[420px] aspect-[9/16] h-[80vh] max-h-[750px]' : 'max-w-5xl aspect-video'}`}
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
                  src={transformGoogleDriveUrl(selectedVideo, 'video')} 
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
    { name: 'PORTFOLIO', to: '/films' },
    { name: 'COLLABORATORS', to: '/brand' },
    { name: 'ABOUT US', to: '/about' },
    { name: 'CONNECT', to: '/connect' },
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
            <div className="relative z-10 flex flex-col items-center overflow-visible">
              <motion.h2
                variants={{
                  initial: { scale: 1, color: "#fff" },
                  hover: { scale: 1.1, color: "#000" }
                }}
                transition={{ duration: 0.4 }}
                className="text-2xl md:text-6xl lg:text-7xl font-bold italic font-redhat tracking-tight uppercase leading-none px-6 md:px-12 pr-10 md:pr-20"
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-black/60">Explore more</span>
                <ChevronRight size={14} className="text-black/60" />
              </motion.div>
            </div>


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
  const [linkedin, setLinkedin] = useState('#');
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

  const loadSocials = () => {
    setInstagram(localStorage.getItem('social_instagram') || '#');
    setFacebook(localStorage.getItem('social_facebook') || '#');
    setYoutube(localStorage.getItem('social_youtube') || '#');
    setTwitter(localStorage.getItem('social_twitter') || '#');
    setLinkedin(localStorage.getItem('social_linkedin') || 'https://www.linkedin.com/company/dreamcatchers-films-pvt-ltd/');
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
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 xl:px-36">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="sm:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-4 mb-1 md:mb-1.5 group cursor-default">
              <span className="text-3xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none transition-all duration-300 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]">DC</span>
              <span className="text-xl md:text-4xl font-black tracking-tighter text-white uppercase italic transition-all duration-300 group-hover:text-orange-100">Dreamcatchers</span>
            </div>
            <p className="text-white/40 leading-relaxed max-w-md text-xs md:text-sm font-medium tracking-tight">
              Dreamcatchers Films Pvt. Ltd. is an award-winning creative agency that produces content across formats for leading brands and channel partners.
            </p>
          </div>
          
          <div id="contact">
            <h5 className="text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10">Inquiries</h5>
            <div className="space-y-4 md:space-y-6">
              <a href="mailto:hello@dreamcatchers.tv" className="block text-lg md:text-xl font-bold text-white hover:text-orange-400 transition-all tracking-tight whitespace-nowrap">hello@dreamcatchers.tv</a>
              
              <div className="pt-6 border-t border-white/5">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-white/20 bg-zinc-800 flex items-center justify-center text-white font-bold text-xs uppercase">
                          {user.displayName ? user.displayName.charAt(0) : 'U'}
                        </div>
                      )}
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
                { name: 'Youtube', icon: <Youtube size={26} />, color: 'hover:text-[#FF0000]', url: youtube },
                { name: 'Instagram', icon: <Instagram size={26} />, color: 'hover:text-[#E4405F]', url: instagram },
                { name: 'Facebook', icon: <Facebook size={26} />, color: 'hover:text-[#1877F2]', url: facebook },
                { name: 'LinkedIn', icon: <Linkedin size={26} />, color: 'hover:text-[#0A66C2]', url: linkedin }
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
          const hasOldFrame1 = parsed.some(f => f.id === 'frame1' && (f.type !== 'video' || !f.url.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')));
          if (hasOldFrame1) {
            const updated = parsed.map(f => {
              if (f.id === 'frame1') {
                return {
                  ...f,
                  type: 'video' as const,
                  url: 'https://drive.google.com/file/d/1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf/view?usp=sharing'
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
          viewport={{ once: true, margin: "-100px" }}
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
  
  // Try matching unlisted format: vimeo.com/1029384756/e38f97fa62
  const unlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/i);
  if (unlistedMatch) {
    return `https://player.vimeo.com/video/${unlistedMatch[1]}?h=${unlistedMatch[2]}`;
  }

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

export const isYouTubeUrl = (url: string) => {
  if (!url) return false;
  const lowercase = url.toLowerCase();
  return lowercase.includes('youtube.com') || lowercase.includes('youtu.be');
};

export const getYouTubeWatchUrl = (url: string): string => {
  if (!url) return '';
  try {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('&')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  } catch (e) {
    console.error('Error parsing YouTube URL:', e);
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

  // Google Drive/Docs and Cloudinary videos should be played in native <video> tags
  if (lowercase.includes('drive.google.com') || lowercase.includes('docs.google.com') || lowercase.includes('cloudinary')) {
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
    lowercase.includes('instagram.com')
  );
};

export const getEmbedUrl = (url: string, asBackground = true) => {
  if (!url) return '';
  try {
    if (url.includes('cloudinary.com') || url.includes('cloudinary')) {
      const urlObj = new URL(url);
      if (asBackground) {
        urlObj.searchParams.set('autoplay', 'true');
        urlObj.searchParams.set('loop', 'true');
        urlObj.searchParams.set('muted', 'true');
        urlObj.searchParams.set('controls', 'false');
        urlObj.searchParams.set('player[autoplay]', 'true');
        urlObj.searchParams.set('player[loop]', 'true');
        urlObj.searchParams.set('player[muted]', 'true');
        urlObj.searchParams.set('player[controls]', 'false');
        urlObj.searchParams.set('playsinline', 'true');
      } else {
        urlObj.searchParams.set('autoplay', 'true');
        urlObj.searchParams.set('controls', 'true');
        urlObj.searchParams.set('player[autoplay]', 'true');
        urlObj.searchParams.set('player[controls]', 'true');
      }
      return urlObj.toString();
    }
    if (url.includes('instagram.com')) {
      // Instagram URL can be like: https://www.instagram.com/p/C-h9D7Iy9Xm/ or https://www.instagram.com/reel/C-h9D7Iy9Xm/
      // The embed format is https://www.instagram.com/p/C-h9D7Iy9Xm/embed/ or https://www.instagram.com/reel/C-h9D7Iy9Xm/embed/
      let embedUrl = url;
      // Strip query parameters to get the clean path
      const cleanUrl = url.split('?')[0];
      // Check if it ends with /embed or /embed/
      if (!cleanUrl.endsWith('/embed') && !cleanUrl.endsWith('/embed/')) {
        // Ensure trailing slash then add embed/
        embedUrl = cleanUrl.endsWith('/') ? `${cleanUrl}embed/` : `${cleanUrl}/embed/`;
      }
      return embedUrl;
    }

    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
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
      urlObj.searchParams.set('playsinline', '1');
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
      let videoId = '';
      if (url.includes('watch?v=')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v') || '';
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('/shorts/')) {
        videoId = url.split('/shorts/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('/embed/')) {
        videoId = url.split('/embed/')[1]?.split('?')[0];
      }
      const urlObj = new URL(embedUrl);
      urlObj.searchParams.set('autoplay', '1');
      urlObj.searchParams.set('playsinline', '1');
      urlObj.searchParams.set('enablejsapi', '1');
      if (asBackground) {
        urlObj.searchParams.set('loop', '1');
        urlObj.searchParams.set('mute', '1');
        urlObj.searchParams.set('controls', '0');
        urlObj.searchParams.set('modestbranding', '1');
        urlObj.searchParams.set('rel', '0');
        urlObj.searchParams.set('showinfo', '0');
        urlObj.searchParams.set('iv_load_policy', '3');
        urlObj.searchParams.set('disablekb', '1');
        urlObj.searchParams.set('fs', '0');
        if (videoId) {
          urlObj.searchParams.set('playlist', videoId);
        }
      } else {
        urlObj.searchParams.set('loop', '0');
        urlObj.searchParams.set('mute', '0');
        urlObj.searchParams.set('controls', '1');
      }
      urlObj.searchParams.set('vq', 'hd1080'); // Force HD 1080p quality on YouTube
      urlObj.searchParams.set('hd', '1'); // Legacy fallback for high definition
      urlObj.searchParams.set('suggestedQuality', 'hd1080'); // Force high quality through player suggestion API parameters
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
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0]);

  const [backdropType, setBackdropType] = useState<'image' | 'video'>('video');
  const [backdropUrl, setBackdropUrl] = useState(() => {
    const saved = localStorage.getItem('home_hero_bg_url') || localStorage.getItem('home_showreel_url');
    if (!saved || saved.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
      return 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix';
    }
    return saved;
  });
  const [videoPlayFailed, setVideoPlayFailed] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset play failure flag and video playback status when URL changes
    setVideoPlayFailed(false);
    setVideoStarted(false);
  }, [backdropUrl]);

  useEffect(() => {
    // Force immediate autoplay on videoRef if present
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play()
        .then(() => {
          setVideoStarted(true);
        })
        .catch(err => {
          console.warn("Autoplay attempt in useEffect was blocked or failed:", err);
        });
    }
  }, [backdropUrl, videoPlayFailed]);

  // Resume background video play on user interaction if blocked (crucial for Chrome inside iframe/mobile)
  useEffect(() => {
    const resumeVideo = () => {
      if (backdropType === 'video' && videoRef.current && !videoStarted) {
        videoRef.current.play()
          .then(() => {
            setVideoStarted(true);
          })
          .catch(err => {
            console.warn("User interaction video playback resume failed:", err);
          });
      }
    };

    window.addEventListener('click', resumeVideo);
    window.addEventListener('touchstart', resumeVideo);
    window.addEventListener('keydown', resumeVideo);

    return () => {
      window.removeEventListener('click', resumeVideo);
      window.removeEventListener('touchstart', resumeVideo);
      window.removeEventListener('keydown', resumeVideo);
    };
  }, [backdropType, videoStarted]);

  const [isMobileView, setIsMobileView] = useState(false);
  const [verticals, setVerticals] = useState<VerticalItem[]>(DEFAULT_VERTICALS);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);
  const [locations, setLocations] = useState<OperationalLocation[]>(DEFAULT_LOCATIONS);

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryOrgName, setInquiryOrgName] = useState('');
  const [inquiryOrgType, setInquiryOrgType] = useState('brand');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inquiryFormError, setInquiryFormError] = useState('');

  // Brief file attachment states
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [briefUrl, setBriefUrl] = useState('');
  const [briefFilename, setBriefFilename] = useState('');
  const [briefUploadProgress, setBriefUploadProgress] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [briefUploadError, setBriefUploadError] = useState('');

  const handleBriefChange = async (file: File) => {
    const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".exe", ".jpg", ".jpeg", ".png", ".worl"];
    const ext = "." + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExts.includes(ext)) {
      setBriefUploadError("Only .pdf, .doc, .docx, .txt, .exe, .jpg, .jpeg, .png, and .worl files are allowed.");
      setBriefUploadProgress('error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB
      setBriefUploadError("File size limit exceeded. Max is 25MB.");
      setBriefUploadProgress('error');
      return;
    }

    setBriefFile(file);
    setBriefUploadProgress('uploading');
    setBriefUploadError('');

    try {
      const data = await uploadFileInChunks(file, 'brief');
      setBriefUrl(data.url);
      setBriefFilename(data.originalname || file.name);
      setBriefUploadProgress('uploaded');
    } catch (err: any) {
      console.error("Brief upload error:", err);
      setBriefUploadError(err.message || "Failed to upload project brief. Please try again.");
      setBriefUploadProgress('error');
    }
  };

  const removeBriefFile = () => {
    setBriefFile(null);
    setBriefUrl('');
    setBriefFilename('');
    setBriefUploadProgress('idle');
    setBriefUploadError('');
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryOrgName.trim() || !inquiryOrgType || !inquirySubject.trim() || !inquiryMessage.trim()) {
      setInquiryFormError("All fields are required (Name, Email/Phone, Organization Name, Organization Type, Subject, Message).");
      return;
    }

    if (briefUploadProgress === 'uploading') {
      setInquiryFormError("Please wait for your project brief file to finish uploading before submitting.");
      return;
    }

    setInquiryStatus('submitting');
    setInquiryFormError('');

    try {
      const inquiryId = 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newInquiry = {
        id: inquiryId,
        name: inquiryName.trim(),
        emailOrPhone: inquiryEmail.trim(),
        orgName: inquiryOrgName.trim(),
        orgType: inquiryOrgType,
        briefUrl: briefUrl,
        briefOriginalName: briefFilename,
        subject: inquirySubject.trim(),
        message: inquiryMessage.trim(),
        createdAt: new Date().toISOString()
      };

      // 1. Save directly into Firestore 'project_inquiries'
      await addDoc(collection(db, 'project_inquiries'), {
        ...newInquiry,
        createdAt: serverTimestamp()
      });

      // 2. Notify backend to trigger email transmission
      const emailRes = await fetch('/api/notify-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInquiry)
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.json().catch(() => ({}));
        throw new Error(emailErr.error || "Failed to dispatch email notification.");
      }

      const emailSuccess = await emailRes.json();
      console.log("Inquiry Email status:", emailSuccess);

      // Save to localStorage so Admin panel has immediate local copy
      const existingInquiriesStr = localStorage.getItem('dc_inquiries') || '[]';
      let inquiries = [];
      try {
        inquiries = JSON.parse(existingInquiriesStr);
        if (!Array.isArray(inquiries)) inquiries = [];
      } catch (error) {
        inquiries = [];
      }

      inquiries.unshift(newInquiry);
      localStorage.setItem('dc_inquiries', JSON.stringify(inquiries));
      
      window.dispatchEvent(new Event('storage_updated_inquiries'));
      
      setInquiryStatus('success');
      
      setInquiryName('');
      setInquiryEmail('');
      setInquiryOrgName('');
      setInquiryOrgType('brand');
      setInquirySubject('');
      setInquiryMessage('');
      removeBriefFile();
    } catch (err: any) {
      console.error("Failed to submit inquiry:", err);
      setInquiryFormError(err.message || "An unexpected error occurred. Please try again.");
      setInquiryStatus('error');
    }
  };

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

  const [contactTitleFirst, setContactTitleFirst] = useState(() => {
    const val = localStorage.getItem('contact_title_first');
    if (!val || val === "Let's" || val === "Connect with") return "Partner with";
    return val;
  });
  const [contactTitleOrange, setContactTitleOrange] = useState(() => {
    const val = localStorage.getItem('contact_title_orange');
    if (!val || val === "Connect.") return "us.";
    return val;
  });
  const [contactSubtitle, setContactSubtitle] = useState("Start your cinematic journey today.");
  const [contactEmail, setContactEmail] = useState(() => {
    const email = localStorage.getItem('contact_email') || "hello@dreamcatchers.tv";
    return email.toLowerCase().includes('@dreamcatchers.com') 
      ? email.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv') 
      : email;
  });
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
  const [contactImage, setContactImage] = useState(() => {
    return localStorage.getItem('contact_image') || "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop";
  });

  const loadContactConfigs = () => {
    const titleFirst = localStorage.getItem('contact_title_first');
    setContactTitleFirst(!titleFirst || titleFirst === "Let's" || titleFirst === "Connect with" ? "Partner with" : titleFirst);
    const titleOrange = localStorage.getItem('contact_title_orange');
    setContactTitleOrange(!titleOrange || titleOrange === "Connect." ? "us." : titleOrange);
    setContactSubtitle(localStorage.getItem('contact_subtitle') || "Start your cinematic journey today.");
    let email = localStorage.getItem('contact_email') || "hello@dreamcatchers.tv";
    if (email.toLowerCase().includes('@dreamcatchers.com')) {
      email = email.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv');
      localStorage.setItem('contact_email', email);
    }
    setContactEmail(email);
    setContactPhone(localStorage.getItem('contact_phone') || "+91 98765 43210");
    setContactAddress(localStorage.getItem('contact_address') || "820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
    setContactImage(localStorage.getItem('contact_image') || "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop");
  };

  const loadConfigs = () => {
    const bgType = (localStorage.getItem('home_hero_bg_type') as 'image' | 'video') || 'video';
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    setBackdropType(bgType);
    
    const defaultCloudinary = 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix';
    const savedShowreel = localStorage.getItem('home_showreel_url') || defaultCloudinary;
    if (bgType === 'video') {
      const active = bgUrl || savedShowreel;
      if (!active || active.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
        setBackdropUrl(defaultCloudinary);
      } else {
        setBackdropUrl(active);
      }
    } else {
      setBackdropUrl(bgUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000');
    }
  };

  const getMobileBackdropUrl = () => {
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    if (bgUrl && bgUrl.trim() !== '') {
      const lowercase = bgUrl.toLowerCase();
      // If the URL is actually a video file, return a high-quality default poster image instead
      if (
        lowercase.includes('.mp4') || 
        lowercase.includes('.webm') || 
        lowercase.includes('.ogg') || 
        lowercase.includes('.mov') ||
        lowercase.startsWith('/uploads/')
      ) {
        return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000';
      }
      return transformGoogleDriveUrl(bgUrl, 'image');
    }
    return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071';
  };

  const getDesktopHighQualityUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      return transformGoogleDriveUrl(url, 'video');
    }
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
        
        {/* Dynamic Video or Image Backdrop Layer for Hero Section */}
        <motion.div 
          style={{ opacity: heroImgOpacity }}
          className="absolute inset-0"
        >
          {backdropType === 'image' ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
              <img 
                src={transformGoogleDriveUrl(backdropUrl, 'image') || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000'} 
                alt="Hero Image Backdrop" 
                className="w-full h-full object-cover opacity-100 transition-opacity duration-1000"
              />
            </div>
          ) : (() => {
            const defaultCloudinary = 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix';
            const videoUrl = backdropUrl || defaultCloudinary;
            const transformedUrl = transformGoogleDriveUrl(videoUrl, 'video');
            const isEmbed = isEmbedUrl(videoUrl);
            const isDrive = videoUrl.includes('drive.google.com') || videoUrl.includes('docs.google.com');
            const isCloudinary = videoUrl.includes('cloudinary') || transformedUrl.includes('cloudinary.com');
            const isLocal = videoUrl.startsWith('/') || videoUrl.includes('/uploads/') || videoUrl.includes('video-');
            const isDirectVideo = isLocal || isDrive || isCloudinary ||
                                  transformedUrl.toLowerCase().includes('.mp4') || 
                                  transformedUrl.toLowerCase().includes('.webm') || 
                                  transformedUrl.toLowerCase().includes('.ogg') || 
                                  transformedUrl.toLowerCase().includes('.mov') || 
                                  transformedUrl.toLowerCase().includes('.m4v');

            // If it is an embed URL (YouTube, Vimeo, etc.), or if stream failed, use iframe
            if ((isEmbed || (videoPlayFailed && !isLocal && !isDrive && !isCloudinary)) && !isDirectVideo) {
              const fallbackUrl = (isEmbed || isDrive) ? videoUrl : defaultCloudinary;
              const isFallbackDrive = fallbackUrl.includes('drive.google.com') || fallbackUrl.includes('docs.google.com');
              return (
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                  <iframe 
                    src={getEmbedUrl(fallbackUrl, true) || undefined} 
                    className={`absolute border-none ${isFallbackDrive ? 'pointer-events-auto' : 'pointer-events-none'} animate-fade-in`}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                    style={{ 
                      border: 'none',
                      width: '100vw',
                      height: '56.25vw',
                      minWidth: '177.78vh',
                      minHeight: '100vh',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) scale(1.12)',
                    }}
                  />
                </div>
              );
            }

            // High-performance HTML5 Video tag for direct MP4, stream URLs and Google Drive videos
            // Set high brightness and full color (no grayscale, opacity-100) to remove the dark/black shade overlay!
            return (
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                <video 
                  key={transformedUrl}
                  ref={(el) => {
                    (videoRef as any).current = el;
                    if (el) {
                      el.defaultMuted = true;
                      el.muted = true;
                      el.playsInline = true;
                      if (el.paused) {
                        const playPromise = el.play();
                        if (playPromise !== undefined) {
                          playPromise.then(() => setVideoStarted(true)).catch(() => {});
                        }
                      }
                    }
                  }}
                  src={transformedUrl || undefined} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="auto"
                  className="w-full h-full object-cover min-w-full min-h-full scale-[1.01] transform-gpu opacity-100 transition-opacity duration-1000 z-0"
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%'
                  }}
                  onLoadStart={(e) => {
                    const vid = e.currentTarget;
                    vid.defaultMuted = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    if (vid.paused) {
                      vid.play().then(() => setVideoStarted(true)).catch(() => {});
                    }
                  }}
                  onPlaying={() => {
                    console.log("Video started playing successfully!");
                    setVideoStarted(true);
                  }}
                  onTimeUpdate={(e) => {
                    if (e.currentTarget.currentTime > 0.05) {
                      setVideoStarted(true);
                    }
                  }}
                  onCanPlay={(e) => {
                    const vid = e.currentTarget;
                    vid.defaultMuted = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.play()
                      .then(() => {
                        setVideoStarted(true);
                      })
                      .catch((err) => {
                        console.warn("Autoplay failed onCanPlay:", err);
                      });
                  }}
                  onCanPlayThrough={(e) => {
                    const vid = e.currentTarget;
                    vid.defaultMuted = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.play()
                      .then(() => {
                        setVideoStarted(true);
                      })
                      .catch(() => {});
                  }}
                  onLoadedData={(e) => {
                    const vid = e.currentTarget;
                    vid.defaultMuted = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.play()
                      .then(() => {
                        setVideoStarted(true);
                      })
                      .catch((err) => {
                        console.warn("Autoplay failed onLoadedData:", err);
                      });
                  }}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    vid.defaultMuted = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.play()
                      .then(() => {
                        setVideoStarted(true);
                      })
                      .catch((err) => {
                        console.warn("Autoplay failed onLoadedMetadata:", err);
                      });
                  }}
                  onError={(e) => {
                    const videoElement = e.currentTarget;
                    if (videoElement && videoElement.error) {
                      const code = videoElement.error.code;
                      // Code 1 is MEDIA_ERR_ABORTED, which happens naturally when browser requests chunking/seeking
                      if (code === 1) {
                        return;
                      }
                      console.warn("Direct video playback encountered error code:", code);
                    } else {
                      console.warn("Direct video playback encountered error");
                    }
                    // For any genuine error on remote (excluding Google Drive) videos, mark play as failed so we can fall back to iframe
                    if (!isLocal && !isDrive) {
                      setVideoPlayFailed(true);
                    }
                  }}
                />
              </div>
            );
          })()}
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
        <div className="h-screen pointer-events-none" /> {/* Spacer for fixed hero */}
        
        <div className="relative z-10">
          <CinematicSlideshow />
          <Clients />
          <section id="about" className="py-12 md:py-24 relative overflow-hidden bg-black">
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
                  className="font-redhat text-[19px] xs:text-[23px] sm:text-[29px] md:text-[41px] lg:text-[53px] font-black tracking-[0.02em] text-orange-500 uppercase mb-2 select-none"
                >
                  Our Verticals & Sub-Brands
                </motion.h3>

              </div>

              {(() => {
                const sportsBox = verticals.find(v => v.id === 'sports_box') || DEFAULT_VERTICALS[0];
                const dcDigital = verticals.find(v => v.id === 'dc_digital') || DEFAULT_VERTICALS[1];

                const cardContainerVariants = {
                  hidden: (direction: number) => ({
                    opacity: 0,
                    x: direction === -1 ? -450 : 450,
                    scale: 0.94
                  }),
                  visible: {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: {
                      type: "tween",
                      duration: 1.25,
                      ease: [0.16, 1, 0.3, 1]
                    }
                  }
                };

                const cardChildVariants = {
                  hidden: { opacity: 1 },
                  visible: { opacity: 1 }
                };

                return (
                  <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.12 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 xs:gap-8 md:gap-16 max-w-[1440px] mx-auto mt-4 md:mt-8 px-4 sm:px-8 lg:px-12 pb-8" 
                    style={{ perspective: 1200 }}
                  >
                    {/* SPORTS BOX Card */}
                    <motion.div
                      custom={-1}
                      variants={cardContainerVariants}
                      style={{ transformOrigin: "bottom center" }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.01,
                        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      onClick={(e) => {
                        if (sportsBox.url && sportsBox.type !== 'image') {
                          setInlinePlayingId('sports_box');
                        } else {
                          window.open('https://www.sportsbox.in/', '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="group relative flex flex-col items-center justify-between p-2.5 xs:p-4 sm:p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-zinc-950/40 border border-orange-500/25 backdrop-blur-xl overflow-hidden select-none cursor-pointer text-center h-[320px] xs:h-[380px] sm:h-[450px] md:h-[610px] w-full hover:border-orange-500/50 hover:shadow-[0_0_80px_rgba(249,115,22,0.14)] transition-[background-color,border-color,box-shadow] duration-500"
                    >
                      {/* Moving Digital Scanline Grid backdrop */}
                      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] transition-opacity duration-500 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.01] to-transparent pointer-events-none group-hover:from-orange-500/[0.04] transition-all duration-500" />

                      {/* Branding Area of equal size to DC Digital, styled with original Sportsbox logo from first image */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="h-8 xs:h-12 sm:h-16 md:h-28 flex items-center justify-center mb-1 relative z-10 w-full"
                      >
                        <motion.div 
                          whileHover={{ y: -4, scale: 1.03 }}
                          className="bg-zinc-950 p-1.5 xs:p-2.5 sm:p-3 md:p-5 rounded-lg xs:rounded-xl md:rounded-2xl flex items-center justify-center w-full max-w-[124px] xs:max-w-[155px] md:w-72 md:max-w-none shadow-[0_5px_15px_rgba(0,0,0,0.4)] md:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-[border-color,box-shadow] duration-500 group-hover:shadow-[0_15px_45px_rgba(239,61,51,0.15)] group-hover:border-orange-500/30 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-center gap-1 md:gap-3">
                            <div className="w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-[42px] md:h-[42px] bg-[#ef3d33] rounded-sm xs:rounded-[6px] md:rounded-[10px] flex items-center justify-center shadow-[0_2px_6px_rgba(239,61,51,0.3)] md:shadow-[0_4px_12px_rgba(239,61,51,0.3)] flex-shrink-0">
                              <span className="text-white font-helvetica-cond font-black italic text-[9px] xs:text-[12px] sm:text-base md:text-2xl tracking-tighter select-none -translate-x-[0.2px] md:-translate-x-[0.5px]">S</span>
                            </div>
                            <div className="flex items-center text-[8px] xs:text-[10px] sm:text-sm md:text-2xl font-helvetica-cond font-black italic tracking-[-0.01em] uppercase select-none leading-none">
                              <span className="text-white">SPORTS</span>
                              <span className="text-[#ef3d33]">BOX</span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Creative Frame */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 group-hover:border-orange-500/40 bg-zinc-950 transition-[border-color,box-shadow] duration-500 relative flex items-center justify-center shadow-[0_15px_45px_0_rgba(0,0,0,0.5)] z-20"
                      >
                        {inlinePlayingId === 'sports_box' && sportsBox.url ? (
                          <div className="absolute inset-0 w-full h-full bg-black z-30 flex items-center justify-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            {isEmbedUrl(sportsBox.url) ? (
                              <iframe 
                                src={getEmbedUrl(sportsBox.url, false)} 
                                title={sportsBox.title} 
                                className="w-full h-full border-none object-cover" 
                                allowFullScreen
                                allow="autoplay; encrypted-media; picture-in-picture"
                              />
                            ) : (
                              <video 
                                src={transformGoogleDriveUrl(sportsBox.url, 'video')} 
                                controls 
                                autoPlay 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlinePlayingId(null);
                              }}
                              className="absolute top-3 right-3 z-40 p-1.5 bg-black/80 hover:bg-black text-white hover:text-orange-500 rounded-full border border-white/10 transition-all shadow-xl flex items-center justify-center cursor-pointer pointer-events-auto"
                              title="Close Video"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : sportsBox.url ? (
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
                        
                        {sportsBox.url && inlinePlayingId !== 'sports_box' && (
                          <div 
                            onClick={(e) => {
                              if (sportsBox.type !== 'image') {
                                e.stopPropagation();
                                setInlinePlayingId('sports_box');
                              }
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer pointer-events-auto"
                          >
                            <motion.div 
                              className="w-7 h-7 xs:w-10 xs:h-10 md:w-14 md:h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl"
                              whileHover={{ scale: 1.15 }}
                            >
                              {sportsBox.type === 'image' ? (
                                <svg className="w-3 h-3 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 xs:w-5 xs:h-5 md:w-6 md:h-6 fill-current ml-0.5" viewBox="0 0 24 24">
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
                        className="space-y-0.5 xs:space-y-1 md:space-y-2 z-10 w-full mt-1.5 xs:mt-2 md:mt-4"
                      >
                        <span className="text-orange-500 text-[7px] xs:text-[9px] md:text-xs font-black uppercase tracking-[0.1em] xs:tracking-[0.2em] md:tracking-[0.3em] block group-hover:text-amber-400 transition-colors duration-300">
                          {sportsBox.subtitle}
                        </span>
                        <p className="text-[8.5px] xs:text-[10.5px] sm:text-xs md:text-base font-black text-white uppercase tracking-wider leading-relaxed group-hover:text-white/90 transition-colors line-clamp-2 md:line-clamp-none">
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
                      style={{ transformOrigin: "bottom center" }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.01,
                        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      onClick={() => {
                        if (dcDigital.url && dcDigital.type !== 'image') {
                          setInlinePlayingId('dc_digital');
                        }
                      }}
                      className={`group relative flex flex-col items-center justify-between p-2.5 xs:p-4 sm:p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-zinc-950/40 border border-orange-500/25 backdrop-blur-xl overflow-hidden select-none ${dcDigital.url ? 'cursor-pointer' : 'cursor-default'} transition-[background-color,border-color,box-shadow] duration-500 hover:border-orange-500/50 hover:shadow-[0_0_80px_rgba(249,115,22,0.14)] text-center h-[320px] xs:h-[380px] sm:h-[450px] md:h-[610px] w-full`}
                    >
                      {/* Grid Backdrop */}
                      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.01] to-transparent pointer-events-none group-hover:from-amber-500/[0.04] transition-all duration-500" />

                      {/* Branding Area with highly interactive 3D style floating logo */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="h-8 xs:h-12 sm:h-16 md:h-28 flex items-center justify-center mb-1 relative z-10 w-full"
                      >
                        <motion.div 
                          whileHover={{ y: -4, scale: 1.03 }}
                          className="bg-white p-1.5 xs:p-2.5 sm:p-3 md:p-5 rounded-lg xs:rounded-xl md:rounded-2xl flex flex-col items-center justify-center w-full max-w-[124px] xs:max-w-[155px] md:w-72 md:max-w-none shadow-[0_5px_15px_rgba(0,0,0,0.4)] md:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/50 transition-[border-color,box-shadow] duration-500 group-hover:shadow-[0_15px_45px_rgba(255,255,255,0.18)] relative overflow-hidden"
                        >
                          {/* Clean typography layout without graphical logo */}
                          <div className="flex items-center justify-center gap-0.5 xs:gap-1 md:gap-1.5 w-full">
                            <span className="text-orange-600 font-extrabold font-bebas text-[8.5px] xs:text-[11px] sm:text-sm md:text-xl tracking-wider leading-none">DC</span>
                            <span className="w-[1px] h-2.5 xs:h-3 md:h-4 bg-zinc-300"></span>
                            <span className="text-zinc-900 font-bold font-sans text-[6.5px] xs:text-[8px] sm:text-xs md:text-sm tracking-[0.05em] xs:tracking-[0.1em] uppercase leading-none">{dcDigital.title.replace('DC DIGITAL STUDIO', 'DIGITAL STUDIO')}</span>
                          </div>
                          <div className="text-[4.5px] xs:text-[5.5px] sm:text-[6.5px] md:text-[7px] text-zinc-400 font-black uppercase tracking-[0.1em] xs:tracking-[0.2em] font-sans mt-0.5 xs:mt-1 md:mt-1.5">A DREAMCATCHERS VERTICAL</div>
                        </motion.div>
                      </motion.div>

                      {/* Creative Frame */}
                      <motion.div 
                        variants={cardChildVariants}
                        className="w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 group-hover:border-amber-500/35 bg-zinc-950 transition-[border-color,box-shadow] duration-500 relative flex items-center justify-center shadow-[0_15px_45px_0_rgba(0,0,0,0.5)] z-20"
                      >
                        {inlinePlayingId === 'dc_digital' && dcDigital.url ? (
                          <div className="absolute inset-0 w-full h-full bg-black z-30 flex items-center justify-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            {isEmbedUrl(dcDigital.url) ? (
                              <iframe 
                                src={getEmbedUrl(dcDigital.url, false)} 
                                title={dcDigital.title} 
                                className="w-full h-full border-none object-cover" 
                                allowFullScreen
                                allow="autoplay; encrypted-media; picture-in-picture"
                              />
                            ) : (
                              <video 
                                src={transformGoogleDriveUrl(dcDigital.url, 'video')} 
                                controls 
                                autoPlay 
                                className="w-full h-full object-contain" 
                              />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlinePlayingId(null);
                              }}
                              className="absolute top-3 right-3 z-40 p-1.5 bg-black/80 hover:bg-black text-white hover:text-orange-500 rounded-full border border-white/10 transition-all shadow-xl flex items-center justify-center cursor-pointer pointer-events-auto"
                              title="Close Video"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : dcDigital.url ? (
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
                                  animate={isMobileView ? { height: `${h * 0.4}%` } : { height: [`${h * 0.2}%`, `${h * 0.8}%`, `${h * 0.2}%`] }}
                                  transition={isMobileView ? { duration: 0 } : {
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
                        
                        {dcDigital.url && inlinePlayingId !== 'dc_digital' && (
                          <div 
                            onClick={(e) => {
                              if (dcDigital.type !== 'image') {
                                e.stopPropagation();
                                setInlinePlayingId('dc_digital');
                              }
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer pointer-events-auto"
                          >
                            <motion.div 
                              className="w-7 h-7 xs:w-10 xs:h-10 md:w-14 md:h-14 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl"
                              whileHover={{ scale: 1.15 }}
                            >
                              {dcDigital.type === 'image' ? (
                                <svg className="w-3 h-3 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 xs:w-5 xs:h-5 md:w-6 md:h-6 fill-current ml-0.5" viewBox="0 0 24 24">
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
                        className="space-y-0.5 xs:space-y-1 md:space-y-2 z-10 w-full mt-1.5 xs:mt-2 md:mt-4"
                      >
                        <span className="text-orange-500 text-[7px] xs:text-[9px] md:text-xs font-black uppercase tracking-[0.1em] xs:tracking-[0.2em] md:tracking-[0.3em] block group-hover:text-amber-400 transition-colors duration-300">
                          {dcDigital.subtitle}
                        </span>
                        <p className="text-[8.5px] xs:text-[10.5px] sm:text-xs md:text-base font-black text-white uppercase tracking-wider leading-relaxed group-hover:text-white/90 transition-colors line-clamp-2 md:line-clamp-none">
                          {dcDigital.description}
                        </p>
                      </motion.div>
                      
                      {/* Corner glowing element */}
                      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 group-hover:scale-135 transition-all duration-700"></div>
                    </motion.div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Integrated Contact Section under Verticals */}
            <div id="contact-form-section" className="mt-16 md:mt-28 max-w-[1440px] mx-auto w-full px-6 sm:px-12 lg:px-16 relative z-10 pb-3">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                {/* Left Side: Contact Details & Image */}
                <div className="lg:col-span-5 space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="text-orange-500 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">Contact Info</span>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                      {contactTitleFirst} <span className="text-orange-500">{contactTitleOrange}</span>
                    </h2>
                  </motion.div>

                  {/* Contact Card Details Grid with Staggered Scroll Animation */}
                  <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.2 }}
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.15
                        }
                      }
                    }}
                    className="grid grid-cols-2 gap-3 sm:gap-6"
                  >
                    {/* Card 1: Email */}
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 40, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      whileHover={{ y: -6, borderColor: 'rgba(249,115,22,0.5)', boxShadow: '0 10px 30px -10px rgba(249,115,22,0.15)' }}
                      className="p-3.5 sm:p-5 bg-zinc-950/60 border border-orange-500/20 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-start transition-all duration-300 w-full overflow-hidden"
                    >
                      <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-4 sm:mb-6 flex-shrink-0" />
                      <div className="text-left w-full overflow-hidden">
                        <p className="text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 font-bold mb-1">Email Us</p>
                        <a 
                          href={`mailto:${contactEmail}`} 
                          title={contactEmail}
                          className="text-[10px] xs:text-xs sm:text-xs md:text-sm lg:text-xs xl:text-sm min-[1300px]:text-base font-bold text-white hover:text-orange-400 transition-colors font-sans block truncate leading-tight w-full"
                        >
                          {contactEmail}
                        </a>
                      </div>
                    </motion.div>

                    {/* Card 2: Phone */}
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 40, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      whileHover={{ y: -6, borderColor: 'rgba(249,115,22,0.5)', boxShadow: '0 10px 30px -10px rgba(249,115,22,0.15)' }}
                      className="p-3.5 sm:p-5 bg-zinc-950/60 border border-orange-500/20 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-start transition-all duration-300 w-full overflow-hidden"
                    >
                      <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-4 sm:mb-6 flex-shrink-0" />
                      <div className="text-left w-full overflow-hidden">
                        <p className="text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 font-bold mb-1">Call Us</p>
                        <a 
                          href={`tel:${contactPhone}`} 
                          title={contactPhone}
                          className="text-[10px] xs:text-xs sm:text-xs md:text-sm lg:text-xs xl:text-sm min-[1300px]:text-base font-bold text-white hover:text-orange-400 transition-colors font-sans block truncate leading-tight w-full"
                        >
                          {contactPhone}
                        </a>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Frameless Contact Custom Image */}
                  {contactImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="w-full flex justify-center items-center pt-4"
                    >
                      <img 
                        src={transformGoogleDriveUrl(contactImage)} 
                        alt="Creative Studio Visual" 
                        referrerPolicy="no-referrer"
                        className="w-full max-h-[350px] object-contain rounded-none opacity-100 transition-all duration-300"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Right Side: Inquiry Form */}
                <div className="lg:col-span-7">
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <h3 className="text-xl font-bold uppercase tracking-wide text-white">Project Inquiry / Brief</h3>
                    </div>

                    {inquiryStatus === 'success' ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 px-4 flex flex-col items-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-6 text-orange-500">
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 font-sans">
                          Inquiry Submitted!
                        </h3>
                        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed font-sans">
                          Thank you for reaching out. Your inquiry and brief have been successfully received and emailed to our team.
                        </p>
                        <button
                          type="button"
                          onClick={() => setInquiryStatus('idle')}
                          className="px-6 py-2.5 bg-orange-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors hover:bg-orange-600 font-sans"
                        >
                          Submit another inquiry
                        </button>
                      </motion.div>
                    ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-2.5 sm:space-y-5 text-left font-sans">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Your Name *</label>
                          <div className="relative">
                            <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Your name"
                              value={inquiryName}
                              onChange={(e) => setInquiryName(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Email/Number */}
                        <div>
                          <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Your Email / Number *</label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Email or phone"
                              value={inquiryEmail}
                              onChange={(e) => setInquiryEmail(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Org Name */}
                        <div>
                          <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Organisation *</label>
                          <div className="relative">
                            <Building className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Organisation name"
                              value={inquiryOrgName}
                              onChange={(e) => setInquiryOrgName(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Org Type */}
                        <div>
                          <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Org Type *</label>
                          <div className="relative">
                            <select
                              required
                              value={inquiryOrgType}
                              onChange={(e) => setInquiryOrgType(e.target.value)}
                              className="w-full pl-3 pr-8 sm:px-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 appearance-none text-white font-medium"
                            >
                              <option value="brand" className="bg-zinc-950 text-white">Brand</option>
                              <option value="agency" className="bg-zinc-950 text-white">Agency</option>
                              <option value="individual" className="bg-zinc-950 text-white">Individual Artist</option>
                              <option value="government" className="bg-zinc-950 text-white">Government / NGO</option>
                              <option value="other" className="bg-zinc-950 text-white">Other</option>
                            </select>
                            <ChevronRight className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-zinc-600 pointer-events-none rotate-90" />
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Subject *</label>
                        <input
                          type="text"
                          required
                          placeholder="Project inquiry subject"
                          value={inquirySubject}
                          onChange={(e) => setInquirySubject(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">Message *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Tell us about your project, target audience, timeline, or scope..."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 resize-none md:rows-4"
                          style={{ minHeight: isMobileView ? '60px' : '100px' }}
                        />
                      </div>

                      {/* Brief File Upload */}
                      <div>
                        <label className="block text-[9px] xs:text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5 sm:mb-1.5 font-bold">
                          Project Brief (Optional)
                        </label>
                        <div className="border border-dashed border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4 bg-zinc-900/10 hover:border-orange-500/50 transition-colors relative flex flex-row sm:flex-col items-center sm:justify-center justify-start text-left sm:text-center gap-3 sm:gap-1.5 cursor-pointer">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBriefChange(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <UploadCloud className="text-zinc-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                          <p className="text-[10px] sm:text-xs font-bold text-zinc-300">
                            {briefUploadProgress === 'uploading' ? 'Uploading...' : 'Drag & drop or click to upload brief file'}
                          </p>
                        </div>

                        {briefUploadError && (
                          <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5">
                            <AlertCircle size={14} />
                            {briefUploadError}
                          </p>
                        )}

                        {briefUploadProgress === 'uploaded' && briefFilename && (
                          <div className="mt-3 flex items-center justify-between p-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <span className="text-xs text-green-400 font-bold font-mono flex items-center gap-1.5">
                              <Paperclip size={14} />
                              {briefFilename} (Uploaded)
                            </span>
                            <button
                              type="button"
                              onClick={removeBriefFile}
                              className="text-red-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {inquiryFormError && (
                        <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5 font-sans">
                          <AlertCircle size={14} />
                          {inquiryFormError}
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={inquiryStatus === 'submitting' || briefUploadProgress === 'uploading'}
                        className="w-full py-2.5 sm:py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-extrabold uppercase tracking-widest text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.25)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                          {inquiryStatus === 'submitting' ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Inquiry</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </motion.div>
                </div>

              </div>
            </div>
          </section>

          {/* OFFICES / LOCATIONS SECTION */}
          <section id="locations-section" className="pt-4 md:pt-8 pb-12 md:pb-20 border-t border-white/5 bg-zinc-950/40 relative z-10">
            <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-12 lg:px-16">
              <div className="text-left mb-10">
                <h2 className="text-4xl md:text-6xl font-black text-orange-500 uppercase tracking-tighter mb-1.5 leading-none">
                  OFFICES
                </h2>
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-[0.25em] block font-bold">Our Locations</span>
              </div>

              <div className="grid grid-cols-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 xs:gap-2.5 sm:gap-6 w-full">
                {locations.map((loc, idx) => (
                  <motion.div
                    key={loc.id}
                    initial={{ opacity: 0, y: idx % 2 === 0 ? 30 : -30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      type: "spring",
                      stiffness: 50,
                      damping: 15,
                      delay: idx * 0.08 
                    }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => window.open(loc.mapsUrl, '_blank')}
                    className={`group relative p-1.5 xs:p-2.5 sm:p-4 bg-zinc-950/40 border border-zinc-800 rounded-[1rem] sm:rounded-[1.8rem] hover:border-orange-500/40 hover:bg-black/80 transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[140px] xs:min-h-[160px] sm:min-h-[220px] md:min-h-[280px] shadow-lg md:w-auto md:flex-shrink ${
                      idx < 3 ? 'col-span-2' : 'col-span-3'
                    } md:col-span-1`}
                  >
                    {/* Top Map Graphic Outline */}
                    <div className="h-[75px] xs:h-[100px] sm:h-[140px] md:h-[180px] w-full bg-zinc-950/90 rounded-[0.8rem] sm:rounded-[1.4rem] flex items-center justify-center relative overflow-hidden transition-all duration-300">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.02)_0%,transparent_100%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18)_0%,transparent_100%)] transition-all duration-500 pointer-events-none" />

                      {loc.mapImage ? (
                        <motion.img 
                          src={loc.mapImage} 
                          alt={loc.cityAlt}
                          animate={isMobileView ? { y: 0, rotate: 0 } : {
                            y: [2, -6, 2],
                            rotate: [-0.5, 0.5, -0.5]
                          }}
                          transition={isMobileView ? { duration: 0 } : {
                            duration: 4.5 + idx * 0.4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 w-full h-full object-contain p-1.5 xs:p-2 md:p-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.75)] group-hover:scale-110 group-hover:rotate-[-2deg] transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.svg 
                          viewBox="-20 -10 160 150" 
                          animate={isMobileView ? { y: 0 } : {
                            y: [2, -4, 2],
                          }}
                          transition={isMobileView ? { duration: 0 } : {
                            duration: 5 + idx * 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }}
                          className="w-[70px] h-[70px] xs:w-[90px] xs:h-[90px] sm:w-[120px] sm:h-[120px] md:w-[155px] md:h-[155px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.75)] relative z-10 select-none pointer-events-none group-hover:scale-[1.08] group-hover:rotate-[-2deg] transition-all duration-500"
                        >
                          <g transform="translate(10, 0)">
                            {/* Layer 5: Deepest wireframe trail (stroke only) */}
                            <g className="transition-transform duration-500 ease-out translate-x-[-10px] translate-y-[10px] group-hover:translate-x-[-15px] group-hover:translate-y-[15px]">
                              <motion.path 
                                d={loc.path} 
                                fill="none" 
                                stroke="rgba(255,255,255,0.06)" 
                                strokeWidth="0.8" 
                                strokeDasharray="20 15"
                                animate={isMobileView ? undefined : { strokeDashoffset: [0, 35] }}
                                transition={isMobileView ? undefined : { duration: 12, repeat: Infinity, ease: "linear" }}
                              />
                            </g>
                            {/* Layer 4: Deep wireframe trail */}
                            <g className="transition-transform duration-500 ease-out translate-x-[-8px] translate-y-[8px] group-hover:translate-x-[-12px] group-hover:translate-y-[12px]">
                              <motion.path 
                                d={loc.path} 
                                fill="none" 
                                stroke="rgba(255,255,255,0.1)" 
                                strokeWidth="0.8" 
                                strokeDasharray="15 15"
                                animate={isMobileView ? undefined : { strokeDashoffset: [0, -30] }}
                                transition={isMobileView ? undefined : { duration: 10, repeat: Infinity, ease: "linear" }}
                              />
                            </g>
                            {/* Layer 3: Medium wireframe trail */}
                            <g className="transition-transform duration-500 ease-out translate-x-[-6px] translate-y-[6px] group-hover:translate-x-[-9px] group-hover:translate-y-[9px]">
                              <motion.path 
                                d={loc.path} 
                                fill="none" 
                                stroke="rgba(255,255,255,0.18)" 
                                strokeWidth="0.8" 
                                strokeDasharray="12 10"
                                animate={isMobileView ? undefined : { strokeDashoffset: [0, 22] }}
                                transition={isMobileView ? undefined : { duration: 8, repeat: Infinity, ease: "linear" }}
                              />
                            </g>
                            {/* Layer 2: Shallow wireframe trail */}
                            <g className="transition-transform duration-500 ease-out translate-x-[-4px] translate-y-[4px] group-hover:translate-x-[-6px] group-hover:translate-y-[6px]">
                              <motion.path 
                                d={loc.path} 
                                fill="none" 
                                stroke="rgba(255,255,255,0.28)" 
                                strokeWidth="0.8" 
                                strokeDasharray="10 12"
                                animate={isMobileView ? undefined : { strokeDashoffset: [0, -22] }}
                                transition={isMobileView ? undefined : { duration: 7, repeat: Infinity, ease: "linear" }}
                              />
                            </g>
                            {/* Layer 1: Closest wireframe trail */}
                            <g className="transition-transform duration-500 ease-out translate-x-[-2px] translate-y-[2px] group-hover:translate-x-[-3px] group-hover:translate-y-[3px]">
                              <motion.path 
                                d={loc.path} 
                                fill="none" 
                                stroke="rgba(255,255,255,0.45)" 
                                strokeWidth="0.8" 
                                strokeDasharray="8 8"
                                animate={isMobileView ? undefined : { strokeDashoffset: [0, 16] }}
                                transition={isMobileView ? undefined : { duration: 5, repeat: Infinity, ease: "linear" }}
                              />
                            </g>
                            {/* Layer 0: Main Solid Orange Map Layer */}
                            <g className="transition-transform duration-500 ease-out translate-x-0 translate-y-0 group-hover:translate-x-[1px] group-hover:translate-y-[-1px]">
                              <path 
                                d={loc.path} 
                                fill="#f97316" 
                                stroke="#000000" 
                                strokeWidth="1.2" 
                                className="group-hover:fill-[#ff7c17] transition-colors duration-300" 
                              />
                              <text 
                                x="60" 
                                y={loc.textY || 58} 
                                textAnchor="middle" 
                                fill="#000000" 
                                fontSize={loc.fontSize || 10} 
                                fontWeight="900" 
                                className="font-sans font-extrabold tracking-tight select-none pointer-events-none uppercase transition-all duration-300"
                              >
                                {loc.city.includes("DUBAI") ? "DUBAI" : loc.city.includes("KENYA") ? "NAIROBI" : loc.city}
                              </text>
                            </g>
                          </g>
                        </motion.svg>
                      )}
                    </div>

                    {/* Info and Address */}
                    <div className="pt-2 pb-0.5 text-left">
                      <div className="flex items-center justify-between gap-0.5 sm:gap-1">
                        <span className="text-white text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wide group-hover:text-orange-500 transition-colors duration-300 truncate">
                          {loc.cityAlt}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5 md:w-4 md:h-4 text-white/50 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              className={`relative w-full bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl ${selectedVideo?.includes('instagram.com') ? 'max-w-[420px] aspect-[9/16] h-[80vh] max-h-[750px]' : 'max-w-5xl aspect-video'}`}
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
    const defaultCloudinary = 'https://player.cloudinary.com/embed/?cloud_name=w37bjaa2&public_id=Final-1_1_agtvix';
    const bgType = localStorage.getItem('home_hero_bg_type') || 'video';
    const bgUrl = localStorage.getItem('home_hero_bg_url') || '';
    
    // Migrate any broken/expired Vimeo, old YouTube, or old Google Drive showreel URL in localStorage to Cloudinary video
    const storedShowreel = localStorage.getItem('home_showreel_url');
    if (!storedShowreel || storedShowreel.includes('371433846') || storedShowreel.includes('EngS8gK6u4I') || storedShowreel.includes('UhTRVjkQZMw') || storedShowreel.includes('11IhUdtZgucLSQsiqe2OZb08DOhidbTmD') || storedShowreel.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
      localStorage.setItem('home_showreel_url', defaultCloudinary);
    }

    const savedShowreel = localStorage.getItem('home_showreel_url') || defaultCloudinary;
    
    // Play backdrop video or fallback to configured showreel if background is photo
    let activeUrl = savedShowreel;
    if (bgType === 'video' && bgUrl && !bgUrl.includes('1b38p3_XY-qOoqHtiIPVc2Qdq00DhDpTf')) {
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

  const iframeSrc = getEmbedUrl(videoUrl, false);

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
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
            />
          ) : (
            <video
              ref={videoElementRef}
              src={transformGoogleDriveUrl(videoUrl, 'video')}
              className="absolute left-0 top-0 w-full h-full object-cover bg-black transition-all duration-300"
              controls
              autoPlay={true}
              playsInline={true}
              onPlay={handleVideoPlay}
              onLoadedMetadata={(e) => {
                e.currentTarget.play().catch(() => {
                  console.log("Autoplay with sound was blocked; waiting for user interaction");
                });
              }}
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
      <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md px-6 py-5 flex items-center justify-between">
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
              onClick={() => navigate('/connect')}
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
  const [appLoading, setAppLoading] = useState(true);
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoTextFull, setLogoTextFull] = useState('DREAMCATCHERS');

  useEffect(() => {
    const unsub = initSiteSync();
    
    // Load current logo configurations so loading matches branding exactly
    const navLogoType = localStorage.getItem('nav_logo_type') as 'text' | 'image' | null;
    const navLogoImg = localStorage.getItem('nav_logo_image_url');
    const navLogoText = localStorage.getItem('nav_logo_text_full');
    
    if (navLogoType) setLogoType(navLogoType);
    if (navLogoImg) setLogoImageUrl(navLogoImg);
    if (navLogoText) setLogoTextFull(navLogoText);

    // Hide loader after a premium cinematic delay
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1800);

    return () => {
      if (unsub) unsub();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {appLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Soft, premium ambient radial backglow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Display Dreamcatchers Logo in Center */}
            <div className="relative z-10 flex flex-col items-center">
              {logoType === 'image' && logoImageUrl ? (
                <motion.img 
                  src={transformGoogleDriveUrl(logoImageUrl)}
                  alt={logoTextFull}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-28 sm:h-36 md:h-48 max-w-[280px] sm:max-w-[360px] md:max-w-[500px] object-contain drop-shadow-[0_0_50px_rgba(249,115,22,0.5)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-1 flex-row text-4xl sm:text-5xl md:text-7xl font-black tracking-[0.3em] select-none text-center"
                >
                  <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    DREAMCATCHERS
                  </span>
                  <span className="text-orange-500 drop-shadow-[0_0_40px_rgba(249,115,22,0.7)]">
                    .TV
                  </span>
                </motion.div>
              )}

              {/* Cinematic Loading Progress Line */}
              <div className="w-56 h-[2px] bg-white/10 rounded-full mt-10 overflow-hidden relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                className="text-[9px] uppercase tracking-[0.45em] text-white/40 mt-4 font-mono font-bold"
              >
                LOADING EXPERIENCE
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/showreel" element={<ShowreelPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/films" element={<FilmsPage />} />
        <Route path="/brand" element={<BrandPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/connect/:formType" element={<ConnectPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
