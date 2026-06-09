import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Camera, Users, Target, Rocket, Instagram, Facebook, Youtube, Twitter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, FC } from 'react';
import { 
  Navbar, 
  Footer, 
  InteractiveOptions, 
  OrbitingFrame, 
  DEFAULT_ORBIT_IMAGES,
  DEFAULT_VERTICALS,
  VerticalItem,
  transformGoogleDriveUrl,
  isEmbedUrl,
  getEmbedUrl
} from '../App';

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
    { name: 'FARZEEN KHAN', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
    { name: 'AASHOOTOSH PANDEY', role: 'EXECUTIVE PRODUCER (DELHI)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { name: 'RAHUL DEROZE', role: 'CREATIVE PRODUCER', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
    { name: 'PRITI RAI', role: 'POST PRODUCTION SUPERVISOR', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
    { name: 'YATENDRA NEGI', role: 'ACCOUNTS HEAD', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
    { name: 'DIVYA AGRAWAL', role: 'HUMAN RESOURCE MANAGER', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
    { name: 'KARPU SWAMI', role: 'FINANCE CONTROLLER', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
    { name: 'NAMAN KOHLI', role: 'SENIOR ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400' },
    { name: 'RAMIN YAZESHANI', role: 'ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
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
        { name: 'FARZEEN KHAN', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
        { name: 'AASHOOTOSH PANDEY', role: 'EXECUTIVE PRODUCER (DELHI)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAHUL DEROZE', role: 'CREATIVE PRODUCER', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
        { name: 'PRITI RAI', role: 'POST PRODUCTION SUPERVISOR', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
        { name: 'YATENDRA NEGI', role: 'ACCOUNTS HEAD', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
        { name: 'DIVYA AGRAWAL', role: 'HUMAN RESOURCE MANAGER', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
        { name: 'KARPU SWAMI', role: 'FINANCE CONTROLLER', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
        { name: 'NAMAN KOHLI', role: 'SENIOR ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAMIN YAZESHANI', role: 'ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollContainerRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

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

  const [verticals, setVerticals] = useState<VerticalItem[]>(DEFAULT_VERTICALS);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const loadVerticals = () => {
      const stored = localStorage.getItem('verticals_list');
      if (stored) {
        try {
          setVerticals(JSON.parse(stored));
          return;
        } catch (e) {
          console.error('Error loading verticals list in AboutPage:', e);
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

        {/* DC Orbit Section */}
        <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
          <div className="w-full px-6 md:px-12 lg:px-16 xl:px-20 max-w-[1800px] mx-auto">
            <div id="dc-orbit-section" className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-36 xl:gap-44 items-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                className="group relative flex flex-col items-center justify-center min-h-[350px] md:h-[700px] bg-transparent transition-all duration-700"
                style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
              >
                {/* Background Atmosphere */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0%,transparent_70%)] transition-opacity duration-1000 pointer-events-none opacity-100 group-hover:bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18)_0%,transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-orange-600/5 blur-[120px] rounded-full transition-opacity duration-1000 pointer-events-none opacity-100 group-hover:bg-orange-600/10" />

                {/* 3D Scene Container */}
                <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                   
                   {/* Centered DC Text with Sun Glow */}
                   <div className="relative z-20 text-center flex items-center justify-center animate-pulse-glow" style={{ transformStyle: "preserve-3d" }}>
                       {/* Sun Glow */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 blur-[100px] rounded-full bg-orange-500/30 transition-all duration-1000 group-hover:bg-orange-500/60 group-hover:scale-110 pointer-events-none" />
                       
                       <motion.span 
                         className="text-[6rem] md:text-[18rem] font-sans font-black italic tracking-tighter text-orange-500 drop-shadow-[0_0_60px_rgba(249,115,22,0.7)] hover:drop-shadow-[0_0_120px_rgba(249,115,22,1)] hover:text-orange-400 transition-all duration-700 cursor-default select-none block leading-none relative z-20"
                         style={{ fontFamily: "'Geograph', 'Plus Jakarta Sans', sans-serif" }}
                         whileHover={{ scale: 1.05 }}
                       >
                         DC
                       </motion.span>
                   </div>

                  <>
                    {/* Visual Orbit Path Line */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        width: typeof window !== 'undefined' ? (window.innerWidth > 768 ? '930px' : '285px') : '930px',
                        height: typeof window !== 'undefined' ? (window.innerWidth > 768 ? '210px' : '70px') : '210px', 
                        transform: 'rotateX(78deg) translateY(10px)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Outer Dashed Orbit Ring */}
                      <div className="absolute inset-0 rounded-full border border-dashed border-orange-500/25 group-hover:border-orange-500/40 transition-colors duration-1000 shadow-[0_0_60px_rgba(249,115,22,0.1)]" />
                      
                      {/* Inner Accent Ring */}
                      <div className="absolute inset-[12px] rounded-full border border-white/5" />
                      
                      {/* Atmospheric Glow */}
                      <div className="absolute inset-[-16px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03)_0%,transparent_70%)]" />
                    </div>

                    {/* Orbiting Planets */}
                    {activeOrbitImages.map((img, i) => (
                      <OrbitingFrame key={i} index={i} total={activeOrbitImages.length} item={img} />
                    ))}
                  </>
               </div>
              </motion.div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                className="space-y-10 flex flex-col items-start text-left w-full lg:pl-10 xl:pl-16 font-sans select-none"
              >
                 <motion.div variants={itemVariants} className="flex items-center gap-6 group/dc w-full justify-start">
                    <motion.span 
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      className="text-2xl font-black italic tracking-tighter text-orange-500 leading-none cursor-default drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:drop-shadow-[0_0_25px_rgba(249,115,22,1)] hover:text-orange-400 transition-all duration-300"
                    >
                      DC
                    </motion.span>
                    <div className="h-[1px] w-36 sm:w-64 md:w-96 lg:w-[28rem] bg-gradient-to-r from-orange-500/50 via-white/10 to-transparent transition-all duration-500 group-hover/dc:from-orange-500" />
                 </motion.div>
                 
                 <div className="overflow-hidden w-full flex justify-start">
                   <motion.p 
                     variants={{
                       hidden: { opacity: 0 },
                       visible: { 
                         opacity: 1,
                         transition: { staggerChildren: 0.08, delayChildren: 0.35 }
                       }
                     }}
                     className="text-xl md:text-3xl lg:text-[2.5rem] text-orange-500 font-extrabold leading-[1.15] tracking-tight uppercase flex flex-wrap justify-start text-left gap-y-1 max-w-[620px] md:max-w-[760px] lg:max-w-[900px]"
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
                             transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
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
                     visible: { opacity: 1, x: 0, transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 } }
                   }}
                   className="text-sm sm:text-base md:text-lg text-orange-500/50 leading-relaxed max-w-2xl font-bold border-l-2 border-orange-600/70 pl-6 text-left"
                 >
                   As more clients showed faith in us, our tribe grew, and here we are today! We&apos;re a happy bunch of people pushing the creative envelope.
                 </motion.p>

                 <motion.button 
                   variants={itemVariants}
                   onClick={() => {
                     document.getElementById('about-genesis-section')?.scrollIntoView({ behavior: 'smooth' });
                   }}
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

        {/* Content Section */}
        <section id="about-genesis-section" className="relative bg-black/40 backdrop-blur-3xl border-t border-white/5 py-32 px-6">
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

        {/* Team Section with scroll-controlled horizontal slide */}
        <section ref={scrollContainerRef} className="relative h-[250vh] bg-black">
          {/* Sticky view frame */}
          <div className="sticky top-0 h-screen w-full overflow-hidden bg-black flex flex-col justify-between pt-16 md:pt-24 pb-12">
            
            {/* Ambient Background Notebook Ruled Lines & Margin */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Horizontal Ruled Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-[12vh] opacity-[0.12]">
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
              </div>
              {/* Vertical Notebook Margin Line */}
              <div className="absolute top-0 bottom-0 left-[10%] md:left-[14%] w-[1.5px] bg-orange-500/15" />
            </div>

            {/* Giant Faint Background Word */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
              <span className="text-[28vw] font-black tracking-tighter text-white/[0.015] uppercase italic select-none">
                the tribe
              </span>
            </div>

            <style>{`
              @keyframes border-trace-anim {
                0% {
                  stroke-dashoffset: 100;
                }
                100% {
                   stroke-dashoffset: 0;
                }
              }
            `}</style>

            {/* Header Area (Lower Z-index to prevent covering the cards) */}
            <div className="relative z-10 max-w-xl pl-8 md:pl-24">
              <div className="flex items-center gap-3 text-orange-500 font-mono tracking-widest text-xs uppercase mb-3">
                <span className="px-2 py-0.5 rounded border border-orange-500/30 text-[10px] font-black">04</span>
                <span>Our Tribe</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase mb-4">
                Dream Team
              </h2>
              <p className="text-white/30 text-xs md:text-sm font-semibold uppercase tracking-widest leading-relaxed">
                A collective of obsessed creators, technical wizards, and poetic dreamers.
              </p>
            </div>

            {/* Sliding Container Track (Higher Z-index so it slides over background elements nicely) */}
            <div className="w-full flex-1 relative z-20 flex items-center min-h-0">
              <motion.div 
                style={{ x }} 
                className="flex gap-12 md:gap-16 items-center px-[30vw]"
              >
                {team.map((member, idx) => {
                  // Predefined organic staggered classes - reduced off-center offsets slightly to prevent overlapping text at any viewport size
                  const staggerClasses = [
                    "translate-y-[60px]",
                    "-translate-y-[55px]",
                    "translate-y-0",
                    "translate-y-[85px]",
                    "-translate-y-[70px]",
                    "translate-y-[30px]",
                    "-translate-y-[35px]",
                    "translate-y-[75px]",
                    "-translate-y-[50px]"
                  ];
                  const yClass = staggerClasses[idx % staggerClasses.length];

                  return (
                    <div 
                      key={`${member.name}-${idx}`}
                      className={`bg-transparent w-[230px] md:w-[280px] flex-shrink-0 relative group/card transition-all duration-500 select-none pb-4 ${yClass}`}
                    >
                      {/* Image Frame */}
                      <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden relative mb-6">
                        <img 
                          src={member.img} 
                          alt={member.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover/card:scale-120"
                        />

                        {/* Circular looping orange tracer border on hover directly orbiting around the image borders */}
                        <div className="absolute inset-0 pointer-events-none z-20 rounded-[2rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                          <svg className="absolute inset-0 w-full h-full rounded-[2rem]" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <rect
                              x="0"
                              y="0"
                              width="100"
                              height="100"
                              rx="6"
                              ry="4.5"
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="1.5"
                              pathLength="100"
                              style={{
                                strokeDasharray: '25 75',
                                animation: 'border-trace-anim 3.2s linear infinite'
                              }}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Name Only */}
                      <div className="text-center relative z-10 px-2">
                        <h4 className="text-lg md:text-xl font-black tracking-widest text-white uppercase italic group-hover/card:text-orange-500 transition-colors duration-300">
                          {member.name}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Horizontal Scroll Progress bar / Tip */}
            <div className="absolute bottom-16 right-8 md:right-24 z-20 flex items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-widest">
              <span>Scroll down to slide</span>
              <div className="w-12 h-[1px] bg-white/20 relative overflow-hidden">
                <motion.div 
                  style={{ scaleX: scrollYProgress }} 
                  className="absolute inset-0 bg-orange-500 origin-left"
                />
              </div>
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
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AboutPage;
