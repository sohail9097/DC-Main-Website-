import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, Play, Menu, X, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
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


const SECTIONS_CONFIG = [
  {
    name: "Branded Content",
    desc: "Premium commercial campaigns & brand stories",
    glow: "rgba(249, 115, 22, 0.4)",
    badge: "01"
  },
  {
    name: "Documentaries",
    desc: "Real-world narratives & raw human storytelling",
    glow: "rgba(59, 130, 246, 0.4)",
    badge: "02"
  },
  {
    name: "Travel",
    desc: "Cinematic adventures across global horizons",
    glow: "rgba(16, 185, 129, 0.4)",
    badge: "03"
  },
  {
    name: "Corporate",
    desc: "Polished workspace narratives & corporate messaging",
    glow: "rgba(236, 72, 153, 0.4)",
    badge: "04"
  },
  {
    name: "Sports",
    desc: "Adrenaline-fueled athletic motion & dynamics",
    glow: "rgba(245, 158, 11, 0.4)",
    badge: "05"
  },
  {
    name: "Lifestyle",
    desc: "Cozy spaces, curated travel, luxury & foods",
    glow: "rgba(139, 92, 246, 0.4)",
    badge: "06"
  }
];



const FilmsPage = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);
  const starOpacity = useTransform(scrollY, [100, 700], [0.3, 1]);
  
  // New parallax transforms for text
  const textY = useTransform(scrollY, [0, 500], [0, 150]);
  const titleXRight = useTransform(scrollY, [0, 500], [0, 100]);
  const titleXLeft = useTransform(scrollY, [0, 500], [0, -100]);

  const [films, setFilms] = useState<{ id: string; title: string; category?: string; img: string; video?: string }[]>([]);
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
        
        {/* Layer 1: Cinematic Base Image */}
        <motion.div 
          style={{ opacity: heroImgOpacity }} 
          className="absolute inset-0"
          initial={{ scale: 1.05, filter: "blur(20px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.6 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2070" 
            className="w-full h-full object-cover brightness-[0.5] contrast-[1.2]"
            alt="Cinematic Movie Background"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black" />
        </motion.div>

        {/* Layer 2: Subtle Film Grain/Texture */}
        <motion.div style={{ opacity: heroImgOpacity }} className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1598897135853-90d56621252e?auto=format&fit=crop&q=80&w=2070" 
            className="w-full h-full object-cover grayscale"
            alt="Film Texture"
            loading="lazy"
            decoding="async"
          />
        </motion.div>

        {/* Star Field & Ambient Atmosphere */}
        <motion.div style={{ opacity: starOpacity }} className="absolute inset-0">
          <StarField count={150} />
        </motion.div>
        
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/5 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-900/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Full Screen Cinematic Hero */}
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden px-6">
          {/* Main Title Background Reveal */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-10">
            <h1 className="font-bebas text-[20rem] font-black italic uppercase tracking-[0.02em] select-none">
              FILMS
            </h1>
          </div>

          <motion.div style={{ y: textY }} className="relative z-20 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
              className="text-center"
            >
              <h1 className="font-bebas text-7xl md:text-[10rem] font-black italic tracking-[0.02em] uppercase leading-none flex flex-col items-center">
                <motion.span style={{ x: titleXLeft }} className="text-orange-500 drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]">Gallery of</motion.span>
                <motion.span style={{ x: titleXRight }} className="text-white -mt-4 md:-mt-10">Motion</motion.span>
              </h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="text-white/60 max-w-2xl mx-auto mt-8 text-sm md:text-lg font-medium tracking-tight leading-relaxed px-4"
              >
                Explore our diverse portfolio of cinematic work. From high-octane commercials to soulful documentaries, we bring stories to life with artistic precision and technical mastery.
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Home Style Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce"
          >
             <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          </motion.div>
        </section>

        {/* Sticky Sub-Navbar Categories Quick Jump Menu */}
        <div className="sticky top-20 z-40 w-full py-4 bg-zinc-950/85 backdrop-blur-md border-y border-white/5 px-4">
          <div className="max-w-[1600px] mx-auto flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-5">
            <button
              onClick={() => selectAndScroll("All")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 font-mono ${
                selectedCategory === 'All'
                  ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.25)] font-bold'
                  : 'border-white/5 text-white/60 bg-white/[0.02] hover:border-orange-500/30 hover:text-orange-500 hover:bg-orange-500/5'
              }`}
            >
              <span>ALL</span>
              <span className={`text-[10px] ${selectedCategory === 'All' ? 'text-orange-400' : 'text-white/30'}`}>
                ({films.length})
              </span>
            </button>
            {SECTIONS_CONFIG.map((sec) => {
              const count = films.filter(f => (f.category || '').toLowerCase() === sec.name.toLowerCase()).length;
              const isSelected = selectedCategory.toLowerCase() === sec.name.toLowerCase();
              return (
                <button
                  key={sec.name}
                  onClick={() => selectAndScroll(sec.name)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 font-mono ${
                    isSelected
                      ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.25)] font-bold'
                      : 'border-white/5 text-white/60 bg-white/[0.02] hover:border-orange-500/30 hover:text-orange-500 hover:bg-orange-500/5'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-orange-400' : 'text-white/30'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="gallery-anchor" className="relative scroll-mt-24">
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-24">
            
            {/* Unified Section Header */}
            <div className="border-b border-white/[0.08] pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <h2 className="font-bebas text-5xl md:text-7xl font-bold tracking-wide text-orange-500 uppercase leading-none">
                  {selectedCategory === 'All' ? 'OUR WORKS' : selectedCategory}
                </h2>
                <p className="text-white/50 text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.35em] uppercase font-mono leading-relaxed max-w-4xl block">
                  {selectedCategory === 'All' 
                    ? 'Explore our full collection of cinematic masterpieces across all genres.' 
                    : SECTIONS_CONFIG.find(sec => sec.name === selectedCategory)?.desc || ''}
                </p>
              </div>

              {/* Reset to All or Scroll to top */}
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-orange-500 hover:text-orange-400 text-xs font-semibold tracking-wider uppercase font-mono py-1.5 px-3 border border-orange-500/20 hover:border-orange-500/50 rounded-md bg-orange-500/5 cursor-pointer transition-all self-start md:self-auto"
                >
                  Show Our Works
                </button>
              )}
            </div>

            {/* Movie Grid */}
            {(() => {
              const categoryFilms = selectedCategory === 'All' 
                ? films 
                : films.filter(film => (film.category || '').toLowerCase() === selectedCategory.toLowerCase());

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4 grid-flow-row-dense auto-rows-auto">
                  {categoryFilms.map((film, idx) => {
                    const videoUrl = film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
                    
                    // Elegantly mapped layout configurations to match user's collage layout perfectly
                    const layoutConfigs = [
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.5/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.4/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "md:row-span-2",
                        aspect: "aspect-[2/3]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[16/10]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.6/1]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "md:row-span-2",
                        aspect: "aspect-[2/3]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[16/9]"
                      },
                      {
                        colSpan: "col-span-1",
                        rowSpan: "row-span-1",
                        aspect: "aspect-[1.85/1]"
                      }
                    ];
                    const cfg = layoutConfigs[idx % layoutConfigs.length];
                    
                    return (
                      <div key={film.id} className={`${cfg.colSpan} ${cfg.rowSpan}`}>
                        <motion.div 
                          className={`group relative overflow-hidden rounded-2xl shadow-xl bg-zinc-950 border border-white/5 hover:border-orange-500/60 transition-all duration-500 ease-out cursor-pointer w-full hover:shadow-[0_15px_40px_rgba(249,115,22,0.15)] ${cfg.aspect}`}
                          initial={{ opacity: 0, y: 30, scale: 0.97 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: false, margin: "-40px" }}
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
                            <div className="absolute top-4 left-4 z-20">
                              <span className="px-2.5 py-1 text-[8px] font-bold font-mono tracking-widest uppercase rounded-full bg-black/80 text-orange-400 backdrop-blur-md shadow border border-orange-500/20">
                                {film.category}
                              </span>
                            </div>
                          )}

                          {/* Title bottom overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-20 flex flex-col justify-end translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <h3 className="text-sm sm:text-base font-bold tracking-wide text-white uppercase font-sans">
                              {film.title}
                            </h3>
                            <p className="text-[9px] text-white/50 uppercase tracking-widest font-mono mt-0.5">
                              Launch Playback →
                            </p>
                          </div>

                          {/* Central Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center z-10 transition-colors duration-500">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 group-hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_15px_rgba(249,115,22,0.35)] group-hover:scale-110">
                              <Play className="fill-current w-4 h-4 sm:w-5 sm:h-5 translate-x-0.5 text-white" />
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
              className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative cursor-default animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {isEmbedUrl(selectedVideo) ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo, false) + (selectedVideo.includes('?') ? '&autoplay=1' : '?autoplay=1')} 
                  title="Video Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
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
