import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, Play, Menu, X, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, useEffect, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, DEFAULT_FILMS_LIST } from '../App';

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 700);
      return () => clearTimeout(timer);
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
            <h1 className="text-[20rem] font-black uppercase tracking-tighter italic select-none">
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
              <h1 className="text-7xl md:text-[10rem] font-black italic tracking-tighter uppercase leading-none flex flex-col items-center">
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
            {SECTIONS_CONFIG.map((sec) => {
              const count = films.filter(f => (f.category || '').toLowerCase() === sec.name.toLowerCase()).length;
              return (
                <button
                  key={sec.name}
                  onClick={() => scrollToSection(sec.name.toLowerCase().replace(/\s+/g, '-'))}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/5 hover:border-orange-500/30 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-orange-500 bg-white/[0.02] hover:bg-orange-500/5 transition-all cursor-pointer flex items-center gap-1.5 font-mono"
                >
                  <span>{sec.name}</span>
                  <span className="text-[10px] text-white/30">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-24">
            <div className="space-y-20 md:space-y-28">
              {SECTIONS_CONFIG.map((section, secIdx) => {
                const categoryFilms = films.filter(
                  (film) => (film.category || '').toLowerCase() === section.name.toLowerCase()
                );

                return (
                  <div 
                    key={section.name} 
                    id={section.name.toLowerCase().replace(/\s+/g, '-')} 
                    className="scroll-mt-36 group/sec"
                  >
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 mb-8 gap-4">
                      <div>
                        {/* Section Counter Badge */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-orange-500 font-mono text-xs font-black tracking-widest uppercase">
                            SECTION {section.badge}
                          </span>
                          <span className="w-8 h-[1px] bg-orange-500/30" />
                          <span className="text-white/30 text-xs tracking-wider font-mono">
                            {categoryFilms.length} {categoryFilms.length === 1 ? 'WORK' : 'WORKS'}
                          </span>
                        </div>

                        {/* Title with decorative Glow on hover */}
                        <div className="relative inline-block">
                          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase group-hover/sec:text-orange-500 transition-colors duration-500">
                            {section.name}
                          </h2>
                          {/* Accent color blur underlay */}
                          <div 
                            className="absolute -inset-1 rounded-lg blur-lg opacity-0 group-hover/sec:opacity-15 transition-opacity duration-1000 -z-10"
                            style={{ backgroundColor: section.glow }}
                          />
                        </div>

                        <p className="text-white/40 text-xs md:text-sm mt-2 font-medium tracking-tight">
                          {section.desc}
                        </p>
                      </div>

                      {/* Smooth scroll-to-top button */}
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-white/20 hover:text-orange-500 text-[10px] font-mono tracking-widest uppercase py-1.5 px-3 border border-white/5 hover:border-orange-500/20 rounded-md bg-transparent cursor-pointer transition-all self-start md:self-auto"
                      >
                        BACK TO TOP ↑
                      </button>
                    </div>

                    {/* Movies Grid for current category */}
                    {categoryFilms.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-zinc-950/40">
                        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
                          No cinematic works added yet in {section.name}
                        </p>
                      </div>
                    ) : (
                      <div 
                        className={
                          section.name.toLowerCase() === 'branded content'
                            ? "flex flex-row overflow-x-auto gap-6 md:gap-8 pt-4 pb-6 snap-x snap-mandatory max-w-[1600px] mx-auto scroll-smooth"
                            : "columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 pt-4 [column-fill:balance] max-w-[1600px] mx-auto"
                        }
                        style={
                          section.name.toLowerCase() === 'branded content'
                            ? { scrollbarWidth: 'none', msOverflowStyle: 'none' }
                            : undefined
                        }
                      >
                        {categoryFilms.map((film, idx) => {
                          // Structural layout configuration based on different poster frames
                          const cycle = idx % 6;
                          let layout = {
                            aspectClass: "aspect-[4/3] sm:aspect-[3/2] lg:aspect-[1.4/1]",
                            badge: "CINEMATIC FEATURE",
                            badgeColor: "text-amber-400 border-amber-500/20 bg-amber-950/30",
                            showBillingBlock: false,
                            itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                          };

                          if (section.name.toLowerCase() === 'branded content') {
                            layout = {
                              aspectClass: "aspect-video",
                              badge: "BRANDED CONTENT",
                              badgeColor: "text-orange-400 border-orange-500/20 bg-orange-900/40",
                              showBillingBlock: false,
                              itemClass: "w-[85%] sm:w-[46%] lg:w-[31.5%] flex-shrink-0 snap-start"
                            };
                          } else if (cycle === 1) {
                            // Vertical tall theatrical poster frame
                            layout = {
                              aspectClass: "aspect-[3/4.2] sm:aspect-[2/2.8]",
                              badge: "THEATRICAL POSTER",
                              badgeColor: "text-orange-500 border-orange-500/20 bg-orange-950/30",
                              showBillingBlock: true,
                              itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                            };
                          } else if (cycle === 2) {
                            // Medium landscape screen frame
                            layout = {
                              aspectClass: "aspect-video sm:aspect-[1.5/1]",
                              badge: "PREMIERE REEL",
                              badgeColor: "text-yellow-500 border-yellow-500/20 bg-yellow-950/30",
                              showBillingBlock: false,
                              itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                            };
                          } else if (cycle === 3) {
                            // Large widescreen cinematic poster frame
                            layout = {
                              aspectClass: "aspect-video sm:aspect-[1.6/1]",
                              badge: "EPIC CINEMA",
                              badgeColor: "text-red-500 border-red-500/20 bg-red-950/30",
                              showBillingBlock: true,
                              itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                            };
                          } else if (cycle === 4) {
                            // Tall elegant editorial portrait poster
                            layout = {
                              aspectClass: "aspect-[3/4.2] lg:aspect-[2/2.8]",
                              badge: "EDITORIAL FOCUS",
                              badgeColor: "text-cyan-400 border-cyan-400/20 bg-cyan-950/30",
                              showBillingBlock: true,
                              itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                            };
                          } else if (cycle === 5) {
                            // Full-width stream cap layout
                            layout = {
                              aspectClass: "aspect-[1.8/1] lg:aspect-[1.85/1]",
                              badge: "STREAMING NOW",
                              badgeColor: "text-emerald-400 border-emerald-400/20 bg-emerald-950/30",
                              showBillingBlock: false,
                              itemClass: "break-inside-avoid mb-6 md:mb-8 w-full inline-block"
                            };
                          }

                          return (
                            <motion.div 
                              key={film.id}
                              initial={{ opacity: 0, y: 35, scale: 0.97 }}
                              whileInView={{ opacity: 1, y: 0, scale: 1 }}
                              viewport={{ once: true, margin: "-100px" }}
                              transition={{ 
                                duration: 0.8, 
                                ease: [0.16, 1, 0.3, 1],
                                delay: idx * 0.05 
                              }}
                              className={`group relative overflow-hidden rounded-xl shadow-2xl bg-zinc-950 border border-white/5 hover:border-orange-500/30 transition-all duration-700 ease-out hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] ${layout.itemClass} ${layout.aspectClass}`}
                            >
                              <img 
                                src={film.img} 
                                alt={film.title} 
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 group-hover:brightness-105 saturate-100 group-hover:saturate-110"
                              />
                              
                              {/* Classic subtle black shadow underlay at the bottom for readability */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 opacity-75 group-hover:opacity-55 transition-all duration-500 pointer-events-none" />

                              {/* Film view glass glaze overlay effect */}
                              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                                <div className="absolute -inset-x-[100%] h-[200%] w-[200%] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-out rotate-12" />
                              </div>

                              {/* Camera viewpoint brackets */}
                              <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-white/10 group-hover:border-orange-500/30 transition-colors duration-500 pointer-events-none" />
                              <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-white/10 group-hover:border-orange-500/30 transition-colors duration-500 pointer-events-none" />
                              <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-white/10 group-hover:border-orange-500/30 transition-colors duration-500 pointer-events-none" />
                              <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-white/10 group-hover:border-orange-500/30 transition-colors duration-500 pointer-events-none" />
                              
                              <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 z-20">
                                <div className="flex justify-between items-start pointer-events-none">
                                  <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest uppercase font-mono font-bold border backdrop-blur-md transition-colors ${layout.badgeColor}`}>
                                    {layout.badge}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col items-center text-center">
                                  <h4 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tighter uppercase italic leading-none truncate w-full mb-1.5 font-sans group-hover:text-orange-500 transition-colors duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                                    {film.title}
                                  </h4>
                                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                    Dreamcatchers Official
                                  </p>

                                  {/* Dramatic Film Billing Block / Credits Roll simulation */}
                                  {layout.showBillingBlock && (
                                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col items-center justify-center text-center w-full select-none pointer-events-none pr-1">
                                      <span className="text-[6px] tracking-[0.3em] font-mono leading-none text-white/30 uppercase">
                                        A PRESTIGE STUDIO PRESENTATION IN ASSOCIATION WITH THE FILMMAKERS DIVISION
                                      </span>
                                      <span className="text-[5.5px] mt-1 tracking-[0.25em] font-mono leading-none text-white/20 uppercase">
                                        DIRECTED BY <span className="text-white/40 font-bold">T. SHANE</span> / ORIGINAL SOUND BY <span className="text-white/40">DOLBY ATMOS</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Floating Hover Play Button */}
                              <button 
                                type="button"
                                onClick={() => setSelectedVideo(film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761')}
                                className="absolute inset-0 m-auto w-14 h-14 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-300 pointer-events-auto cursor-pointer z-30 shadow-2xl"
                              >
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-400 transition-colors">
                                  <Play className="fill-current w-4 h-4 translate-x-0.5 text-white" />
                                </div>
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Lightbox Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl">
            <button 
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all border border-white/10"
            >
              <X size={24} />
            </button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
              {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
                <iframe 
                  src={selectedVideo.replace('watch?v=', 'embed/').split('&')[0] + "?autoplay=1"} 
                  title="Video Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              ) : selectedVideo.includes('vimeo.com') ? (
                <iframe 
                  src={selectedVideo.includes('player.vimeo.com') ? `${selectedVideo}?autoplay=1` : `https://player.vimeo.com/video/${selectedVideo.split('/').pop()}?autoplay=1`} 
                  title="Video Player" 
                  className="w-full h-full border-none" 
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              ) : (
                <video 
                  src={selectedVideo} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-16 border-t border-white/5 bg-black/40 backdrop-blur-xl mt-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
              <span className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic">Dreamcatchers</span>
            </div>
            <p className="text-white/20 text-xs font-medium max-w-sm text-center md:text-left">
              High-end creative studio delivering cinematic excellence across all platforms.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-8 md:gap-10">
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
            <p className="text-white/10 text-[10px] font-bold uppercase tracking-widest">© 2026 Dreamcatchers Production. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FilmsPage;
