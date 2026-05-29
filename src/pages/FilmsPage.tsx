import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, Play, Menu, X, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, useEffect, FC } from 'react';
import { Link } from 'react-router-dom';
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


const FilmsPage = () => {
  const { scrollY } = useScroll();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);
  const starOpacity = useTransform(scrollY, [100, 700], [0.3, 1]);
  
  // New parallax transforms for text
  const textY = useTransform(scrollY, [0, 500], [0, 150]);
  const titleXRight = useTransform(scrollY, [0, 500], [0, 100]);
  const titleXLeft = useTransform(scrollY, [0, 500], [0, -100]);

  const [films, setFilms] = useState<{ id: string; title: string; category?: string; img: string; video?: string }[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

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

        <div className="relative">
          <div className="relative z-10 w-full max-w-[1900px] mx-auto px-4 md:px-6 pt-32 pb-24">
            <div className="columns-1 md:columns-2 lg:columns-2 xl:columns-3 gap-6 space-y-6">
              {films.map((film, idx) => (
                <motion.div 
                  key={film.id}
                  initial={{ opacity: 0, y: 50, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, margin: "-50px", amount: 0.2 }}
                  transition={{ 
                    duration: 0.7, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: (idx % 3) * 0.05 
                  }}
                  style={{ willChange: 'transform, opacity' }}
                  className="group relative overflow-hidden rounded-2xl shadow-2xl break-inside-avoid mb-6 bg-white/5"
                >
                  <img 
                    src={film.img} 
                    alt={film.title} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-[1px] bg-orange-500" />
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.3em]">{film.category || 'Cinematic'}</span>
                    </div>
                    <h4 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none truncate mb-4">
                      {film.title}
                    </h4>
                    <button 
                      type="button"
                      onClick={() => setSelectedVideo(film.video || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761')}
                      className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-110 active:scale-95 transition-all"
                    >
                      <Play className="fill-current w-4 h-4 translate-x-0.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
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
