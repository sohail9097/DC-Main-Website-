import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, Play, Menu, X, Instagram, Facebook, Youtube, Twitter, ExternalLink } from 'lucide-react';
import { useState, useEffect, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, DEFAULT_FILMS_LIST, Footer, InteractiveOptions, transformGoogleDriveUrl, isEmbedUrl, getEmbedUrl, isYouTubeUrl, getYouTubeWatchUrl } from '../App';

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

const SECTIONS_CONFIG = [
  {
    name: "Branded Content",
    desc: "Premium commercial campaigns & brand stories",
    glow: "rgba(249, 115, 22, 0.4)",
    badge: "01",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Documentaries",
    desc: "Real-world narratives & raw human storytelling",
    glow: "rgba(59, 130, 246, 0.4)",
    badge: "02",
    img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Travel & Lifestyle",
    desc: "Cinematic adventures, luxury spaces, global travel & cozy lifestyle stories",
    glow: "rgba(16, 185, 129, 0.4)",
    badge: "03",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Corporate",
    desc: "Polished workspace narratives & corporate messaging",
    glow: "rgba(236, 72, 153, 0.4)",
    badge: "04",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Sports",
    desc: "Adrenaline-fueled athletic motion & dynamics",
    glow: "rgba(245, 158, 11, 0.4)",
    badge: "05",
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Reality",
    desc: "High-energy television formats, live productions & real-time events",
    glow: "rgba(239, 68, 68, 0.4)",
    badge: "06",
    img: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Commercials",
    desc: "Dynamic short-form advert films & promotional campaigns",
    glow: "rgba(6, 182, 212, 0.4)",
    badge: "07",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Influencer",
    desc: "Premium creator-driven lifestyle content & social-first stories",
    glow: "rgba(236, 72, 153, 0.4)",
    badge: "08",
    img: "https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=600"
  }
];



const FilmsPage = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0]);
  const starOpacity = useTransform(scrollY, [100, 700], [0.3, 1]);

  const [films, setFilms] = useState<{ id: string; title: string; category?: string; img: string; video?: string; frameType?: string }[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);
  const [hoveredFilmId, setHoveredFilmId] = useState<string | null>(null);

  const selectAndScroll = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const element = document.getElementById("gallery-anchor");
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  useEffect(() => {
    if (location.hash) {
      const hashClean = location.hash.replace('#', '');
      const matched = SECTIONS_CONFIG.find(sec => sec.name.toLowerCase().replace(/\s+/g, '-') === hashClean.toLowerCase());
      if (matched) {
        setSelectedCategory(matched.name);
        const timer = setTimeout(() => {
          const element = document.getElementById("gallery-anchor");
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [location.hash, films]);

  useEffect(() => {
    const loadFilms = () => {
      const stored = localStorage.getItem('dc_films');
      if (stored) {
        try {
          setFilms(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error loading films from localStorage:', e);
        }
      }
      setFilms(DEFAULT_FILMS_LIST);
    };

    loadFilms();
    window.addEventListener('storage_updated_films', loadFilms);
    window.addEventListener('storage', loadFilms);
    return () => {
      window.removeEventListener('storage_updated_films', loadFilms);
      window.removeEventListener('storage', loadFilms);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 relative">
      {/* Page Reveal Overlay */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 1.8, ease: [0.8, 0, 0.1, 1], delay: 0.1 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      >
        <div className="overflow-hidden">
          <motion.span
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="block text-4xl font-black uppercase tracking-widest text-orange-500"
          >
            Dreamcatchers
          </motion.span>
        </div>
      </motion.div>

      {/* Global Transitioned Fixed Background Layer (Like Home Page) */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        
        {/* Layer 1: Main Starry Background Image (Always active and visible behind the hero image) */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&q=80&w=2070" 
            alt="Global Stars" 
            className="w-full h-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Layer 2: Global Animated Star Field (Always active and twinkling) */}
        <div className="absolute inset-0">
          <StarField count={180} />
        </div>

        {/* Layer 3: Cinematic Base Image */}
        <motion.div 
          style={{ opacity: heroImgOpacity }} 
          className="absolute inset-0"
          initial={{ scale: 1.05, filter: "blur(20px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2070" 
            className="w-full h-full object-cover brightness-[0.8] contrast-[1.1]"
            alt="Cinematic Movie Background"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </motion.div>

        {/* Layer 4: Subtle Film Grain/Texture */}
        <motion.div style={{ opacity: heroImgOpacity }} className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1598897135853-90d56621252e?auto=format&fit=crop&q=80&w=2070" 
            className="w-full h-full object-cover grayscale"
            alt="Film Texture"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
        
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/5 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-900/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Full Screen Cinematic Hero (Maintains spacing for the background scroll & fade transition) */}
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden px-6">
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce pointer-events-none">
             <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          </div>
        </section>

        {/* Sub-Navbar Categories Quick Jump Menu */}
        <div className="relative z-20 w-full py-4 bg-zinc-950/90 backdrop-blur-md border-y border-white/5 overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent snap-x touch-pan-x justify-start">
              {/* External Detailed Portfolio link */}
              <a
                href="https://canva.link/dreamcatchers-portfolio2026"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group h-14 sm:h-16 md:h-20 min-w-[180px] xs:min-w-[220px] sm:min-w-[260px] md:min-w-[280px] rounded-sm overflow-hidden text-left flex-shrink-0 snap-start border border-orange-500/25 bg-orange-950/5 hover:border-orange-500/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 cursor-pointer"
              >
                <img 
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600"
                  alt="Detailed Portfolio"
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.55] group-hover:brightness-[0.75] group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-all duration-300" />
                
                <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-10">
                  <span className="font-bebas text-lg xs:text-xl sm:text-2xl font-bold tracking-wider text-orange-500 uppercase select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex items-center gap-1.5">
                    DETAILED PORTFOLIO
                    <ExternalLink size={14} className="text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </span>
                  <div className="flex justify-between items-end gap-3">
                    <span className="text-[9px] font-mono tracking-widest text-white/50 group-hover:text-white/80 transition-colors uppercase leading-none truncate max-w-[120px] sm:max-w-[180px]">
                      View Canva presentation deck
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 font-bold px-1.5 py-0.5 bg-black/60 rounded-sm">
                      DECK ↗
                    </span>
                  </div>
                </div>
              </a>

              <button
                onClick={() => selectAndScroll("All")}
                className={`relative group h-14 sm:h-16 md:h-20 min-w-[180px] xs:min-w-[220px] sm:min-w-[260px] md:min-w-[280px] rounded-sm overflow-hidden text-left flex-shrink-0 snap-start border transition-all duration-300 ${
                  selectedCategory === 'All'
                    ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] ring-1 ring-orange-500'
                    : 'border-white/10 hover:border-orange-500/50'
                }`}
              >
                <img 
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600"
                  alt="All"
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.9] group-hover:scale-105 transition-all duration-500"
                />
                <div className={`absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 ${selectedCategory === 'All' ? 'bg-orange-950/20' : ''}`} />
                
                <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-10">
                  <span className="font-bebas text-lg xs:text-xl sm:text-2xl font-bold tracking-wider text-white uppercase select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                    ALL WORKS
                  </span>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-mono tracking-widest text-white/50 group-hover:text-white/80 transition-colors uppercase leading-none">
                      Explore complete craft
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 font-bold px-1.5 py-0.5 bg-black/60 rounded-sm">
                      {films.length}
                    </span>
                  </div>
                </div>
              </button>

              {SECTIONS_CONFIG.map((sec) => {
                const count = films.filter(f => normalizeCategoryName(f.category).toLowerCase() === sec.name.toLowerCase()).length;
                const isSelected = selectedCategory.toLowerCase() === sec.name.toLowerCase();
                return (
                  <button
                    key={sec.name}
                    onClick={() => selectAndScroll(sec.name)}
                    className={`relative group h-14 sm:h-16 md:h-20 min-w-[180px] xs:min-w-[220px] sm:min-w-[260px] md:min-w-[280px] rounded-sm overflow-hidden text-left flex-shrink-0 snap-start border transition-all duration-300 ${
                      isSelected
                        ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] ring-1 ring-orange-500'
                        : 'border-white/10 hover:border-orange-500/50'
                    }`}
                  >
                    <img 
                      src={sec.img}
                      alt={sec.name}
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.9] group-hover:scale-105 transition-all duration-500"
                    />
                    <div className={`absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 ${isSelected ? 'bg-orange-950/20' : ''}`} />
                    
                    <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-10">
                      <span className="font-bebas text-lg xs:text-xl sm:text-2xl font-bold tracking-wider text-white uppercase select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                        {sec.name}
                      </span>
                      <div className="flex justify-between items-end gap-3">
                        <span className="text-[9px] font-mono tracking-widest text-white/50 group-hover:text-white/80 transition-colors uppercase leading-none truncate max-w-[120px] sm:max-w-[180px]">
                          {sec.desc}
                        </span>
                        <span className="text-[10px] font-mono text-orange-400 font-bold px-1.5 py-0.5 bg-black/60 rounded-sm">
                          {count}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div id="gallery-anchor" className="relative scroll-mt-24">
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-24">
            
            {/* Unified Section Header */}
            <div className="border-b border-white/[0.08] pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <h2 className="font-redhat text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.02em] text-orange-500 uppercase leading-none select-none">
                  {selectedCategory === 'All' ? 'PORTFOLIO' : selectedCategory}
                </h2>
                <p className="text-white text-[8px] xs:text-[9px] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.1em] xs:tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.3em] font-redhat leading-relaxed max-w-full block whitespace-nowrap overflow-x-auto scrollbar-none">
                  {selectedCategory === 'All' 
                    ? 'Explore our portfolio across formats.' 
                    : SECTIONS_CONFIG.find(sec => sec.name === selectedCategory)?.desc || ''}
                </p>
              </div>

              {/* Reset to All or Scroll to top */}
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-orange-500 hover:text-orange-400 text-xs font-semibold tracking-wider uppercase font-mono py-1.5 px-3 border border-orange-500/20 hover:border-orange-500/50 rounded-md bg-orange-500/5 cursor-pointer transition-all self-start md:self-auto"
                >
                  Show Portfolio
                </button>
              )}
            </div>

            {/* Movie Grid */}
            {(() => {
              const categoryFilms = selectedCategory === 'All' 
                ? films 
                : films.filter(film => normalizeCategoryName(film.category).toLowerCase() === selectedCategory.toLowerCase());

              if (categoryFilms.length === 0) {
                return (
                  <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl bg-zinc-950/40">
                    <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
                      No cinematic works found in {selectedCategory}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-6 md:gap-8 pt-4 grid-flow-row-dense auto-rows-auto">
                  {categoryFilms.map((film, idx) => {
                    const videoUrl = film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
                    
                    // Elegantly mapped layout configurations to match user's collage layout perfectly
                    const layoutConfigs = [
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-2", // 1st vertical frame: right column
                        aspect: "aspect-[2/3]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-2", // 2nd vertical frame: left column
                        aspect: "aspect-[2/3]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-2", // 3rd vertical frame: center column
                        aspect: "aspect-[2/3]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      }
                    ];

                    let cfg;
                    if (film.frameType === 'vertical') {
                      cfg = {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-2",
                        aspect: "aspect-[2/3]"
                      };
                    } else if (film.frameType === 'landscape') {
                      cfg = {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.42/1]"
                      };
                    } else {
                      const autoIndex = categoryFilms.slice(0, idx).filter(f => !f.frameType || f.frameType === 'auto').length;
                      cfg = layoutConfigs[autoIndex % layoutConfigs.length];
                    }
                    
                    // Subtle vertical stagger offsets to position frames slightly up and down for an elegant asymmetrical collage effect
                    const staggerOffsets = [
                      "md:-translate-y-3",
                      "md:translate-y-3",
                      "md:-translate-y-1.5",
                      "md:translate-y-1.5",
                    ];
                    const staggerClass = staggerOffsets[idx % staggerOffsets.length];
                    
                    return (
                      <div key={film.id} className={`${cfg.colSpan} ${cfg.rowSpan} ${staggerClass} transition-transform duration-500`}>
                        <motion.div 
                          className={`group relative overflow-hidden rounded-2xl shadow-xl bg-zinc-950 border border-white/5 hover:border-orange-500/60 transition-all duration-500 ease-out cursor-pointer w-full hover:shadow-[0_15px_40px_rgba(249,115,22,0.15)] ${cfg.aspect}`}
                          initial={{ opacity: 0, y: 30, scale: 0.97 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, margin: "-10px" }}
                          transition={{ 
                            duration: 0.6, 
                            ease: [0.16, 1, 0.3, 1],
                            delay: (idx % 3) * 0.08
                          }}
                          onClick={() => {
                            setSelectedVideo(videoUrl);
                          }}
                        >
                          <img 
                            src={transformGoogleDriveUrl(film.img)} 
                            alt={film.title} 
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />

                          {/* Subtle spotlight backdrop override on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:via-black/30 duration-500 transition-all pointer-events-none" />

                          {/* Category badge heading overlay inside each video card frame */}
                          {film.category && (
                            <div className="absolute top-1.5 left-1.5 xs:top-3 xs:left-3 md:top-5 md:left-5 z-20">
                              <span className="px-1.5 py-0.5 xs:px-2.5 xs:py-1 md:px-3.5 md:py-1 text-[6px] xs:text-[9px] md:text-[11px] font-medium font-bebas tracking-[0.16em] uppercase rounded-full bg-black/95 text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-orange-500/40">
                                {normalizeCategoryName(film.category)}
                              </span>
                            </div>
                          )}

                          {/* Title bottom overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-1.5 xs:p-3 sm:p-5 z-20 flex items-center gap-1.5 xs:gap-3 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-6 xs:pt-8 sm:pt-12 transition-all duration-300">
                            <div className="hidden">
                               <Play className="fill-current w-2 h-2 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 translate-x-0.5 text-white" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h3 className="text-[7.5px] xs:text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-white uppercase font-sans truncate pr-2 leading-tight">
                                 {film.title}
                               </h3>
                             </div>
                          </div>

                          {/* Central Play Button */}
                          <div className="hidden">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 group-hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_15px_rgba(249,115,22,0.35)] group-hover:scale-110">
                              <Play className="fill-current text-white w-4 h-4 sm:w-5 sm:h-5 translate-x-0.5" />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Dynamic Lightbox Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 bg-black/65 z-[9999] flex items-center justify-center p-4 md:p-8 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedVideo(null)}
          >
            <button 
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all border border-white/10 cursor-pointer"
            >
              <X size={24} />
            </button>
            <div 
              className={`w-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative cursor-default animate-in fade-in zoom-in duration-300 ${selectedVideo?.includes('instagram.com') ? 'max-w-[420px] aspect-[9/16] h-[80vh] max-h-[750px]' : 'max-w-5xl aspect-video'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {isEmbedUrl(selectedVideo) ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo, false)} 
                  title="Video Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                />
              ) : (
                <video 
                  src={transformGoogleDriveUrl(selectedVideo, 'video')} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              )}
            </div>
          </div>
        )}
      </main>
      <InteractiveOptions />
      <Footer />
    </div>
  );
};

export default FilmsPage;
