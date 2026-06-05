import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, ChevronLeft, Camera, Users, Target, Rocket, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, FC } from 'react';
import { Navbar, Footer, InteractiveOptions } from '../App';

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

const AboutPage = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);
  const starOpacity = useTransform(scrollY, [100, 700], [0.3, 1]);
  const textY = useTransform(scrollY, [0, 500], [0, 150]);

  // Dynamic states
  const [word1, setWord1] = useState('Dream');
  const [word2, setWord2] = useState('Catchers');
  const [tagline, setTagline] = useState('Engineers of visual euphoria. Architects of cinematic truth.');
  const [bgImg, setBgImg] = useState('https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
  const [genesisSub, setGenesisSub] = useState('The Genesis');
  const [genesisTitle, setGenesisTitle] = useState('Where Magic Finds Its Form.');
  const [genesisP1, setGenesisP1] = useState('Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.');
  const [genesisP2, setGenesisP2] = useState("From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.");

  const [stat1Val, setStat1Val] = useState('14+');
  const [stat1Lbl, setStat1Lbl] = useState('YEARS ON SET');
  const [stat2Val, setStat2Val] = useState('500+');
  const [stat2Lbl, setStat2Lbl] = useState('FILMS BORN');
  const [stat3Val, setStat3Val] = useState('30+');
  const [stat3Lbl, setStat3Lbl] = useState('CREATIVE MINDS');
  const [stat4Val, setStat4Val] = useState('100+');
  const [stat4Lbl, setStat4Lbl] = useState('GLOBAL BRANDS');

  const [team, setTeam] = useState<{ name: string; role: string; img: string }[]>([
    { name: 'ARJUN SHARMA', role: 'FOUNDER / DIRECTOR', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { name: 'RIYA KAPOOR', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
    { name: 'VIKRAM SINGH', role: 'HEAD OF POST-PRODUCTION', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
    { name: 'SARA KHAN', role: 'CREATIVE DIRECTOR', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' },
  ]);

  const loadAboutConfigs = () => {
    setWord1(localStorage.getItem('about_bgt_word1') || 'Dream');
    setWord2(localStorage.getItem('about_bgt_word2') || 'Catchers');
    setTagline(localStorage.getItem('about_bgt_tagline') || 'Engineers of visual euphoria. Architects of cinematic truth.');
    setBgImg(localStorage.getItem('about_hero_bg') || 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
    setGenesisSub(localStorage.getItem('about_genesis_sub') || 'The Genesis');
    setGenesisTitle(localStorage.getItem('about_genesis_title') || 'Where Magic Finds Its Form.');
    setGenesisP1(localStorage.getItem('about_genesis_p1') || 'Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.');
    setGenesisP2(localStorage.getItem('about_genesis_p2') || "From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.");

    setStat1Val(localStorage.getItem('about_stat1_val') || '14+');
    setStat1Lbl(localStorage.getItem('about_stat1_lbl') || 'YEARS ON SET');
    setStat2Val(localStorage.getItem('about_stat2_val') || '500+');
    setStat2Lbl(localStorage.getItem('about_stat2_lbl') || 'FILMS BORN');
    setStat3Val(localStorage.getItem('about_stat3_val') || '30+');
    setStat3Lbl(localStorage.getItem('about_stat3_lbl') || 'CREATIVE MINDS');
    setStat4Val(localStorage.getItem('about_stat4_val') || '100+');
    setStat4Lbl(localStorage.getItem('about_stat4_lbl') || 'GLOBAL BRANDS');

    const storedTeam = localStorage.getItem('about_team');
    if (storedTeam) {
      try {
        setTeam(JSON.parse(storedTeam));
      } catch (e) {
        console.error('Error loading team from local storage:', e);
      }
    } else {
      setTeam([
        { name: 'ARJUN SHARMA', role: 'FOUNDER / DIRECTOR', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
        { name: 'RIYA KAPOOR', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
        { name: 'VIKRAM SINGH', role: 'HEAD OF POST-PRODUCTION', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
        { name: 'SARA KHAN', role: 'CREATIVE DIRECTOR', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' },
      ]);
    }
  };

  useEffect(() => {
    loadAboutConfigs();
    window.addEventListener('storage_updated_about', loadAboutConfigs);
    window.addEventListener('storage', loadAboutConfigs);
    return () => {
      window.removeEventListener('storage_updated_about', loadAboutConfigs);
      window.removeEventListener('storage', loadAboutConfigs);
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const autoPlayTimerRef = useRef<any>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    
    // Auto-scroll speed: 0.08px per ms (increased slightly)
    const speed = 0.08; 

    const updateScroll = (time: number) => {
      if (!isPausedByUser && el) {
        const delta = time - lastTime;
        el.scrollLeft += speed * delta;
        
        // Wrap around seamlessly
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollLeft = 10;
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    animationFrameId = requestAnimationFrame(updateScroll);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isPausedByUser, team.length]);

  const triggerUserPause = () => {
    setIsPausedByUser(true);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
    autoPlayTimerRef.current = setTimeout(() => {
      setIsPausedByUser(false);
    }, 5000); // Resume auto scroll after 5 seconds
  };

  const handleScrollLeft = () => {
    triggerUserPause();
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 768 ? 280 + 32 : 380 + 32;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    triggerUserPause();
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 768 ? 280 + 32 : 380 + 32;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const stats = [
    { label: stat1Lbl, value: stat1Val, icon: <Camera className="w-5 h-5" /> },
    { label: stat2Lbl, value: stat2Val, icon: <Rocket className="w-5 h-5" /> },
    { label: stat3Lbl, value: stat3Val, icon: <Users className="w-5 h-5" /> },
    { label: stat4Lbl, value: stat4Val, icon: <Target className="w-5 h-5" /> },
  ];

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
            Our Story
          </motion.span>
        </div>
      </motion.div>

      {/* Global Transitioned Fixed Background Layer */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        <motion.div 
          style={{ opacity: heroImgOpacity }} 
          className="absolute inset-0"
          initial={{ scale: 1.1, filter: "blur(40px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 3, ease: "easeOut", delay: 0.6 }}
        >
          <img 
            src={bgImg} 
            className="w-full h-full object-cover brightness-[0.3] contrast-[1.2]"
            alt="Behind the scenes"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </motion.div>

        <motion.div style={{ opacity: starOpacity }} className="absolute inset-0">
          <StarField count={180} />
        </motion.div>
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Cinematic Header Section */}
        <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden px-6">
          <motion.div style={{ y: textY }} className="relative z-20 max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
            >
              <h1 className="text-6xl md:text-[12rem] font-black italic tracking-tighter uppercase leading-[0.85] flex flex-col items-center">
                <span className="text-white">{word1}</span>
                <span className="text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.4)]">{word2}</span>
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1.5 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-12 md:mt-20 mx-auto"
              />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.2 }}
                className="text-white/45 max-w-3xl mx-auto mt-12 text-sm md:text-xl font-medium tracking-[0.2em] uppercase leading-relaxed px-4"
              >
                {tagline}
              </motion.p>
            </motion.div>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className="relative bg-black/40 backdrop-blur-3xl border-t border-white/5 py-32 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4">
                  <span className="w-12 h-[1px] bg-orange-500" />
                  <span className="text-xs font-black text-orange-500 uppercase tracking-[0.5em]">{genesisSub}</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black italic text-white tracking-tighter leading-none uppercase">
                  {genesisTitle}
                </h2>
                <div className="space-y-8 text-white/60 text-lg md:text-2xl font-medium leading-relaxed tracking-tight border-l-2 border-orange-500/20 pl-8 md:pl-12">
                  <p>
                    {genesisP1}
                  </p>
                  <p>
                    {genesisP2}
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4 md:gap-8 pt-12 lg:pt-32">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="p-8 md:p-12 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:bg-orange-500 transition-all duration-700"
                  >
                    <div className="text-orange-500 group-hover:text-black transition-colors mb-6">
                      {stat.icon}
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white group-hover:text-black transition-colors tracking-tighter mb-2">
                      {stat.value}
                    </h3>
                    <p className="text-white/30 group-hover:text-black/60 transition-colors text-[10px] md:text-xs font-black uppercase tracking-widest leading-none">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-32 px-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
              <div className="space-y-6">
                <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.5em] block">Our Tribe</span>
                <h2 className="text-5xl md:text-8xl font-black italic text-white tracking-tighter leading-none uppercase">The Architects.</h2>
              </div>
              <p className="text-white/30 max-w-md text-base md:text-lg font-medium leading-relaxed tracking-tight">
                A collective of obsessed creators, technical wizards, and poetic dreamers committed to the craft of storytelling.
              </p>
            </div>

            {/* Infinite Horizontal Scrolling Row */}
            <div className="relative w-full py-4 group">
              {/* Fade masks on the edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-20" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-20" />

              {/* Scrollable Row */}
              <div 
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto scrollbar-none py-4 snap-x snap-mandatory scroll-smooth px-12 md:px-24"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {[...team, ...team, ...team].map((member, idx) => (
                  <div
                    key={`${member.name}-${idx}`}
                    className="w-[280px] md:w-[380px] flex-shrink-0 snap-center group/card relative cursor-pointer"
                  >
                    <div className="aspect-[3/4] overflow-hidden rounded-[3rem] border border-white/10 relative">
                      <img 
                        src={member.img} 
                        alt={member.name} 
                        className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover/card:grayscale-0 group-hover/card:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover/card:opacity-40 transition-opacity" />
                    </div>
                    <div className="absolute inset-x-0 bottom-10 px-10 whitespace-normal">
                      <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-1">
                        {member.name}
                      </h4>
                      <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.3em]">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Left Arrow Button */}
              <button 
                type="button"
                onClick={handleScrollLeft}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-black border border-white/10 hover:border-orange-500/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer backdrop-blur-md group-hover:scale-105"
                aria-label="Previous Profile"
              >
                <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
              </button>

              {/* Right Arrow Button */}
              <button 
                type="button"
                onClick={handleScrollRight}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-black border border-white/10 hover:border-orange-500/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer backdrop-blur-md group-hover:scale-105"
                aria-label="Next Profile"
              >
                <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
              </button>
            </div>
          </div>
        </section>

        {/* Global Footer Call to Action */}
        <section className="py-24 border-t border-white/5">
           <div className="max-w-[1400px] mx-auto px-6 text-center">
              <motion.h2 
                whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
                className="text-4xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8] mb-16"
              >
                Let&apos;s Catch Some <br /> 
                <span className="text-orange-500">Dreams Together.</span>
              </motion.h2>
              <motion.button 
                onClick={() => navigate('/contact')}
                whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                transition={{ duration: 0.4 }}
                className="px-16 py-8 rounded-full border-2 border-white/10 text-white font-black uppercase tracking-[0.3em] text-xs md:text-sm hover:border-transparent transition-all"
              >
                Contact Our Studio
              </motion.button>
           </div>
        </section>
       </main>
      <InteractiveOptions />
      <Footer />
    </div>
  );
};

export default AboutPage;
