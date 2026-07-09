import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, animate } from 'motion/react';
import { Shield, Sparkles, Building2, Landmark, Clapperboard, ExternalLink, ArrowRight, Plus, Award } from 'lucide-react';
import React, { useState, useEffect, FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer, InteractiveOptions } from '../App';
import { BrandItem, DEFAULT_BRAND_ITEMS, DEFAULT_CLIENTS_LIST, transformGoogleDriveUrl } from '../utils/brandData';
import { normalizeAndSyncData, isSimilarName } from '../utils/syncHelper';

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
            transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.1);
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
          className="absolute bg-white rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: 0.3,
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

const AnimatedCounter: FC<{ target: number; suffix?: string; duration?: number }> = ({ target, suffix = '', duration }) => {
  const countMotion = useMotionValue(0);
  const rounded = useTransform(countMotion, Math.round);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let controls: any = null;

    const startCounting = () => {
      // Proportional duration: smaller numbers finish faster so they don't stutter, larger numbers have more time.
      const animDuration = duration || Math.max(1.2, Math.min(2.2, target * 0.04 + 0.8));
      
      controls = animate(countMotion, target, {
        duration: animDuration,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      });
    };

    if (elementRef.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            startCounting();
            if (observer) observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
    } else {
      startCounting();
    }

    return () => {
      if (controls) controls.stop();
      if (observer) observer.disconnect();
    };
  }, [target, duration, countMotion]);

  return (
    <span ref={elementRef} className="tabular-nums inline-flex items-center">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

const CATEGORIES = [
  { id: 'all', name: 'ALL COLLABORATORS', icon: Sparkles },
  { id: 'brands', name: 'BRANDS', icon: Award },
  { id: 'govt', name: 'GOVT', icon: Landmark },
  { id: 'corporates', name: 'CORPORATES', icon: Shield },
  { id: 'platforms', name: 'PLATFORMS', icon: Clapperboard },
];

const BrandCardLogo: FC<{ brand: BrandItem }> = ({ brand }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [brand.logoUrl]);

  const hasLogoUrl = brand.logoUrl && brand.logoUrl.trim().length > 0 && !imgError;

  if (hasLogoUrl) {
    return (
      <img
        src={transformGoogleDriveUrl(brand.logoUrl)}
        alt={brand.name}
        className="max-w-[95%] max-h-[95%] object-contain"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  if (brand.renderLogo) {
    return brand.renderLogo();
  }

  return (
    <span className="text-[7px] xs:text-[9px] sm:text-xs md:text-sm font-black text-white/90 uppercase tracking-widest leading-none text-center px-1">
      {brand.name}
    </span>
  );
};

export default function BrandPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const selectorRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<BrandItem[]>([]);

  useEffect(() => {
    const loadBrands = () => {
      const { brands: syncedBrands } = normalizeAndSyncData(DEFAULT_CLIENTS_LIST, DEFAULT_BRAND_ITEMS);

      const mapped = syncedBrands.map(item => {
        const defaultItem = DEFAULT_BRAND_ITEMS.find(d => 
          d.id.toLowerCase() === item.id.toLowerCase() || 
          d.name.toLowerCase() === item.name.toLowerCase()
        );
        // Ensure that we only inherit the default vector logo if the names are similar.
        const matchesName = defaultItem ? isSimilarName(defaultItem.name, item.name) : false;
        if (defaultItem && matchesName && defaultItem.renderLogo) {
          return {
            ...item,
            renderLogo: defaultItem.renderLogo
          };
        }
        return item;
      });

      setBrands(mapped);
    };

    loadBrands();
    window.addEventListener('storage', loadBrands);
    window.addEventListener('storage_updated_brand_partners', loadBrands);
    window.addEventListener('storage_updated_clients', loadBrands);

    return () => {
      window.removeEventListener('storage', loadBrands);
      window.removeEventListener('storage_updated_brand_partners', loadBrands);
      window.removeEventListener('storage_updated_clients', loadBrands);
    };
  }, []);
  
  const filteredBrands = brands.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black font-sans text-white relative selection:bg-orange-500 selection:text-white pb-32">
      <Navbar />
      
      {/* Dynamic Star Field background */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none">
        <StarField count={180} />
      </div>

      {/* Atmospheric Ambient Lighting Gradients */}
      <div className="absolute top-[10%] left-[20%] w-[50%] h-[30%] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[40%] h-[25%] bg-blue-900/5 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[60%] h-[30%] bg-purple-900/5 blur-[220px] rounded-full pointer-events-none" />

      {/* Main Core Showcase Section */}
      <div className="relative z-10 pt-40 px-6 md:px-24 lg:px-40 max-w-[1920px] mx-auto">
        


        {/* Dynamic Typography Title Headers */}
        <h1 className="text-3xl md:text-[4.2rem] font-black tracking-tighter uppercase leading-[0.9] text-white">
          Trusted partner of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-orange-500">
            global industry leaders
          </span>
        </h1>
        
        <p className="text-white/40 max-w-2xl text-xs md:text-sm font-medium mt-6 leading-relaxed">
          We have collaborated with leading lifestyle, FMCG, fashion, luxury, hospitality, healthcare, government departments, tourism, automotive, real estate, infrastructure, edtech, ecommerce, media and entertainment brands and global broadcast networks & platforms.
        </p>

        {/* Interactive Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-12 mb-16 max-w-5xl border-t border-b border-white/5 py-8 mx-auto w-full justify-center">
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-orange-500">
              <AnimatedCounter target={50} suffix="+" />
            </span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">COLLABORATORS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">
              <AnimatedCounter target={15} suffix="+" />
            </span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">BRANDS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">
              <AnimatedCounter target={15} suffix="+" />
            </span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">GOVT DEPARTMENTS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">
              <AnimatedCounter target={17} suffix="+" />
            </span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">CORPORATE PARTNERS</span>
          </div>
          <div className="flex flex-col items-center text-center col-span-2 sm:col-span-1">
            <span className="text-3xl md:text-4xl font-black text-white">
              <AnimatedCounter target={8} />
            </span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">PLATFORMS</span>
          </div>
        </div>

        {/* Dynamic Category Selector Menu Layout */}
        <div 
          ref={selectorRef}
          className="flex justify-center sticky top-[95px] z-40 bg-black/80 backdrop-blur-xl py-6 border-b border-white/5 px-4 -mx-4 rounded-b-2xl scroll-mt-32"
        >
          <div className="flex flex-nowrap items-center justify-start md:justify-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full max-w-5xl px-2">
            {CATEGORIES.map(category => {
              const IconComp = category.icon;
              const isActive = activeCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${
                    isActive 
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                      : 'bg-[#121214] hover:bg-zinc-800 border border-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid representing active Partner items */}
        <motion.div 
          layout
          className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 mt-6 md:mt-12"
        >
          <AnimatePresence mode="popLayout">
            {filteredBrands.map((brand) => (
              <motion.div
                layout
                key={`${activeCategory}-${brand.id}`}
                initial={{ opacity: 0, y: -25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="group relative h-20 xs:h-24 sm:h-28 md:h-36 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col justify-center items-center overflow-hidden hover:border-orange-500/30 transition-all duration-500 p-1 md:p-4"
              >
                {/* Highlight background glowing ring */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 to-orange-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Actual styled vector logo */}
                <div className={`transform transition-all duration-500 z-10 w-full h-full flex items-center justify-center ${
                  brand.logoSize === 'small' ? 'scale-[0.45] md:scale-[0.7]' :
                  brand.logoSize === 'large' ? 'scale-[0.75] md:scale-[1.05]' :
                  brand.logoSize === 'xlarge' ? 'scale-[0.85] md:scale-[1.2]' :
                  'scale-[0.55] md:scale-100'
                } group-hover:scale-[1.06]`}>
                  <BrandCardLogo brand={brand} />
                </div>

                {/* hover descriptive tag identifier */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-black/90 border-t border-white/10 hidden md:flex flex-col items-center justify-center text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                  <span className="text-[9px] font-black text-white tracking-widest uppercase">{brand.name}</span>
                  {brand.description && (
                    <span className="text-[7.5px] text-white/40 tracking-wider uppercase mt-0.5 line-clamp-1">{brand.description}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No results placeholder */}
        {filteredBrands.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-3xl mt-12 bg-zinc-950/20">
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">No matching partners found</span>
          </div>
        )}



      </div>
      <InteractiveOptions />
      <Footer />
    </div>
  );
}
