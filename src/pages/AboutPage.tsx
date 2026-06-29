import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { ChevronRight, ChevronLeft, Camera, Users, Target, Rocket, Instagram, Facebook, Youtube, Twitter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, FC, MouseEvent, TouchEvent } from 'react';
import { useAuth } from '../context/AuthContext';
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

const parseStatValue = (valStr: string) => {
  const numberPart = valStr.replace(/[^0-9]/g, '');
  const suffixPart = valStr.replace(/[0-9]/g, '');
  const target = parseInt(numberPart, 10);
  return {
    target: isNaN(target) ? 0 : target,
    suffix: suffixPart
  };
};

const AnimatedCounter: FC<{ value: string }> = ({ value }) => {
  const { target, suffix } = parseStatValue(value);
  const countMotion = useMotionValue(0);
  const rounded = useTransform(countMotion, Math.round);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let controls: any = null;

    const startCounting = () => {
      // Smooth out duration based on the value to ensure it feels rhythmic and satisfying
      const animDuration = Math.max(1.2, Math.min(2.2, target * 0.003 + 1.2));
      
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
  }, [target, countMotion]);

  return (
    <span ref={elementRef} className="tabular-nums inline-flex items-center">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

const AboutPage = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const { isAdmin } = useAuth();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0]);
  const starOpacity = useTransform(scrollY, [100, 700], [0, 1]);
  const textY = useTransform(scrollY, [0, 500], [0, 150]);

  // Admin edit states
  const [isEditingBg, setIsEditingBg] = useState(false);
  const [tempBgImg, setTempBgImg] = useState('');

  // Dynamic states
  const [word1, setWord1] = useState('Dream');
  const [word2, setWord2] = useState('Catchers');
  const [tagline, setTagline] = useState('Engineers of visual euphoria. Architects of cinematic truth.');
  const [bgImg, setBgImg] = useState('https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
  const [genesisSub, setGenesisSub] = useState('The Genesis');
  const [genesisTitle, setGenesisTitle] = useState('The Genesis');
  const [genesisP1, setGenesisP1] = useState('Dreamcatchers began with two storytellers creating lifestyle programming for television. After years of crafting content at some of India\'s leading broadcast networks, Puneet and Amitabh Gautam set out to build a production company.');
  const [genesisP2, setGenesisP2] = useState('More than two decades later, today, Dreamcatchers is a full-service creative studio that operates from three offices across India and two international locations. The company has expanded into specialised verticals, including DC Digital, dedicated to digital-first storytelling, and Sports Box, a sports production company operating across Africa and Europe.');
  const [genesisSub3, setGenesisSub3] = useState('Our Evolution');
  const [genesisTitle3, setGenesisTitle3] = useState('From Curiosity to Creation');
  const [genesisP3, setGenesisP3] = useState('From television beginnings to global productions, our journey has remained rooted in one constant: creating stories that move people.');

  const [stat1Val, setStat1Val] = useState('20+');
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

  const wavyBackgroundPaths = useMemo(() => {
    const linesCount = 70;
    const width = 1600;
    const height = 900;
    const paths: string[] = [];

    for (let i = 0; i <= linesCount; i++) {
      const yNorm = i / linesCount;
      const yBase = yNorm * height;
      const points: string[] = [];
      const segments = 45;

      for (let j = 0; j <= segments; j++) {
        const xNorm = j / segments;
        const x = -200 + xNorm * 2000;

        // Taper waves off smoothly at left and right outer boundaries
        const baseAmplitude = Math.sin(xNorm * Math.PI);
        const wave = Math.sin(xNorm * Math.PI * 2.5 - yNorm * 2.2) * 55 * baseAmplitude;
        
        points.push(`${x.toFixed(1)},${(yBase + wave).toFixed(1)}`);
      }
      paths.push(`M ${points.join(' L ')}`);
    }
    return paths;
  }, []);

  const loadAboutConfigs = () => {
    setWord1(localStorage.getItem('about_bgt_word1') || 'Dream');
    setWord2(localStorage.getItem('about_bgt_word2') || 'Catchers');
    setTagline(localStorage.getItem('about_bgt_tagline') || 'Engineers of visual euphoria. Architects of cinematic truth.');
    setBgImg(localStorage.getItem('about_hero_bg') || 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
    setGenesisSub(localStorage.getItem('about_genesis_sub') || 'The Genesis');

    let storedTitle = localStorage.getItem('about_genesis_title');
    if (!storedTitle || storedTitle === 'Where Magic Finds Its Form.') {
      storedTitle = 'The Genesis';
    }
    setGenesisTitle(storedTitle);

    let storedP1 = localStorage.getItem('about_genesis_p1');
    if (!storedP1 || storedP1 === 'Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.') {
      storedP1 = 'Dreamcatchers began with two storytellers creating lifestyle programming for television. After years of crafting content at some of India\'s leading broadcast networks, Puneet and Amitabh Gautam set out to build a production company.';
    }
    setGenesisP1(storedP1);

    let storedP2 = localStorage.getItem('about_genesis_p2');
    if (!storedP2 || storedP2 === "From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.") {
      storedP2 = 'More than two decades later, today, Dreamcatchers is a full-service creative studio that operates from three offices across India and two international locations. The company has expanded into specialised verticals, including DC Digital, dedicated to digital-first storytelling, and Sports Box, a sports production company operating across Africa and Europe.';
    }
    setGenesisP2(storedP2);

    setGenesisSub3(localStorage.getItem('about_genesis_sub3') || 'Our Evolution');
    setGenesisTitle3(localStorage.getItem('about_genesis_title3') || 'From Curiosity to Creation');

    let storedP3 = localStorage.getItem('about_genesis_p3');
    if (!storedP3 || storedP3 === "Having cut their teeth at some of India's leading television networks, they set out to create the kind of content they wanted to watch—fresh, engaging, and driven by curiosity. What started as a small passion project soon turned into a creative studio. Today, DC creates campaigns, films, series, branded content, for brands across the world.") {
      storedP3 = 'From television beginnings to global productions, our journey has remained rooted in one constant: creating stories that move people.';
    }
    setGenesisP3(storedP3);

    let storedStat1 = localStorage.getItem('about_stat1_val');
    if (!storedStat1 || storedStat1 === '14+') {
      storedStat1 = '20+';
      localStorage.setItem('about_stat1_val', '20+');
    }
    setStat1Val(storedStat1);
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

  useEffect(() => {
    if (isEditingBg) {
      setTempBgImg(bgImg);
    }
  }, [isEditingBg, bgImg]);

  const handleSaveHeroBg = () => {
    const sanitizedUrl = tempBgImg.trim();
    if (!sanitizedUrl) return;

    localStorage.setItem('about_hero_bg', sanitizedUrl);
    setBgImg(sanitizedUrl);
    window.dispatchEvent(new Event('storage_updated_about'));
    setIsEditingBg(false);
  };


  // Staggered custom spring physics for organic fluid waves (inertia, mass, and drag)
  const springConfig1 = { stiffness: 45, damping: 18, mass: 0.8 };
  const springConfig2 = { stiffness: 30, damping: 12, mass: 1.0 };
  const springConfig3 = { stiffness: 60, damping: 22, mass: 0.6 };

  const waveX1 = useMotionValue(0);
  const waveX2 = useMotionValue(0);
  const waveY1 = useMotionValue(0);
  const waveY2 = useMotionValue(0);
  const waveY3 = useMotionValue(0);

  useEffect(() => {
    const controlsX1 = animate(waveX1, [0, 180, 0], {
      duration: 15,
      ease: "easeInOut",
      repeat: Infinity
    });
    const controlsX2 = animate(waveX2, [0, -180, 0], {
      duration: 18,
      ease: "easeInOut",
      repeat: Infinity
    });
    const controlsY1 = animate(waveY1, [0, 50, 0], {
      duration: 12,
      ease: "easeInOut",
      repeat: Infinity
    });
    const controlsY2 = animate(waveY2, [0, -40, 0], {
      duration: 14,
      ease: "easeInOut",
      repeat: Infinity
    });
    const controlsY3 = animate(waveY3, [0, 30, 0], {
      duration: 10,
      ease: "easeInOut",
      repeat: Infinity
    });

    return () => {
      controlsX1.stop();
      controlsX2.stop();
      controlsY1.stop();
      controlsY2.stop();
      controlsY3.stop();
    };
  }, []);

  const scrollWaveX1_A = useSpring(waveX1, springConfig1);
  const scrollWaveX1_B = useSpring(waveX2, springConfig2);
  const scrollWaveX1_C = useSpring(waveY1, springConfig3);

  const scrollWaveX2_A = useSpring(waveY2, springConfig1);
  const scrollWaveX2_B = useSpring(waveY3, springConfig2);
  const scrollWaveX2_C = useSpring(waveX1, springConfig3);

  const scrollWaveY_A = useSpring(waveY1, springConfig1);
  const scrollWaveY_B = useSpring(waveY2, springConfig2);
  const scrollWaveY_C = useSpring(waveY3, springConfig3);

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

  const [timecode, setTimecode] = useState("01:24:59:00");
  useEffect(() => {
    let frame = 0;
    let sec = 59;
    let min = 24;
    const interval = setInterval(() => {
      frame++;
      if (frame >= 24) {
        frame = 0;
        sec++;
        if (sec >= 60) {
          sec = 0;
          min++;
          if (min >= 100) min = 0;
        }
      }
      const pad = (num: number) => String(num).padStart(2, '0');
      setTimecode(`01:${pad(min)}:${pad(sec)}:${pad(frame)}`);
    }, 1000 / 24); // cinematic 24 FPS ticker
    return () => clearInterval(interval);
  }, []);

  const teamCarouselRef = useRef<HTMLDivElement>(null);
  const [isDraggingTeam, setIsDraggingTeam] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const autoScrollPauseUntilRef = useRef(0);

  const scrollTeam = (direction: 'left' | 'right') => {
    const container = teamCarouselRef.current;
    if (!container) return;

    // Pause auto scrolling for 2.5 seconds when clicking arrows
    autoScrollPauseUntilRef.current = Date.now() + 2500;

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 256 : 344;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;

    container.scrollTo({
      left: container.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const container = teamCarouselRef.current;
    if (!container) return;

    // Rendered list is 3 copies of team: [...team, ...team, ...team]
    // Start scroll in the middle copy
    const setInitialScroll = () => {
      const totalWidth = container.scrollWidth;
      container.scrollLeft = totalWidth / 3;
    };

    // Wait a moment for images/elements to render and measure
    const timer = setTimeout(setInitialScroll, 150);

    let animationFrameId: number;
    let lastTime = performance.now();

    const updateScroll = (time: number) => {
      if (!isDraggingTeam && teamCarouselRef.current && Date.now() >= autoScrollPauseUntilRef.current) {
        const delta = (time - lastTime) / 1000;
        // speed of transition: 85px per second
        teamCarouselRef.current.scrollLeft += 85 * delta;

        // Wrap seamlessly
        const totalWidth = teamCarouselRef.current.scrollWidth;
        if (totalWidth > 0) {
          const oneThird = totalWidth / 3;
          if (teamCarouselRef.current.scrollLeft >= oneThird * 2) {
            teamCarouselRef.current.scrollLeft -= oneThird;
          } else if (teamCarouselRef.current.scrollLeft <= 5) {
            teamCarouselRef.current.scrollLeft += oneThird;
          }
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    animationFrameId = requestAnimationFrame(updateScroll);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDraggingTeam, team]);

  const handleTeamMouseDown = (e: MouseEvent) => {
    const container = teamCarouselRef.current;
    if (!container) return;

    setIsDraggingTeam(true);
    dragStartX.current = e.pageX - container.offsetLeft;
    dragScrollLeft.current = container.scrollLeft;
  };

  const handleTeamMouseMove = (e: MouseEvent) => {
    const container = teamCarouselRef.current;
    if (!container) return;

    if (!isDraggingTeam) return;
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

  const handleTeamMouseUpOrLeave = () => {
    setIsDraggingTeam(false);
  };

  const handleTeamTouchStart = (e: TouchEvent) => {
    const container = teamCarouselRef.current;
    if (!container) return;

    setIsDraggingTeam(true);
    dragStartX.current = e.touches[0].pageX - container.offsetLeft;
    dragScrollLeft.current = container.scrollLeft;
  };

  const handleTeamTouchMove = (e: TouchEvent) => {
    const container = teamCarouselRef.current;
    if (!container) return;

    if (!isDraggingTeam) return;
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

        {/* Layer 3: Hero Scenery/Behind the scenes background image (Sits on top and fades out cleanly on scroll) */}
        <motion.div 
          style={{ opacity: heroImgOpacity }} 
          className="absolute inset-0"
          initial={{ scale: 1.1, filter: "blur(40px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        >
          <img 
            src={transformGoogleDriveUrl(bgImg, 'image')} 
            className="w-full h-full object-cover"
            alt="Behind the scenes"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Cinematic Header Section (Maintains spacing for the clear hero background scroll & fade transition) */}
        <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden px-6">
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce pointer-events-none">
             <span className="text-[9px] text-white/30 uppercase tracking-[0.5em]">Scroll</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
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
                className="space-y-16"
              >
                <div className="space-y-10">

                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-black font-redhat text-orange-500 tracking-tighter leading-none uppercase text-left">
                    {genesisTitle}
                  </h2>
                  <div className="space-y-8 font-redhat text-white/60 text-lg md:text-2xl font-medium leading-relaxed tracking-tight text-justify">
                    <p>
                      {genesisP1}
                    </p>
                    <p className="pt-8 md:pt-12" style={{ textIndent: '5rem' }}>
                      {genesisP2}
                    </p>
                    {genesisP3 && (
                      <p className="pt-8 md:pt-12">
                        {genesisP3}
                      </p>
                    )}
                  </div>
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
                      <AnimatedCounter value={stat.value} />
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

        {/* Team Section with continuous auto sliding horizontal marquee */}
        <section className="relative py-24 min-h-[92vh] bg-black flex flex-col justify-between overflow-hidden">
             
             {/* Flickering Projector Beam of light */}
             <div 
               className="absolute top-0 left-0 w-[70%] h-[120%] pointer-events-none z-0 transform -translate-x-[15%] -translate-y-[15%]" 
               style={{
                 background: 'conic-gradient(from 135deg at 0% 0%, rgba(249, 115, 22, 0.15) 0deg, rgba(255, 255, 255, 0.08) 25deg, transparent 45deg)',
                 filter: 'blur(45px)',
                 animation: 'projector-flicker 5s infinite'
               }}
             />

             {/* Cinematically Moving Film Scratch system */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
               <div 
                 className="absolute top-0 bottom-0 w-[1px] bg-white/[0.08]"
                 style={{
                   animation: 'film-scratches-x 10s steps(1) infinite'
                 }}
               />
               <div 
                 className="absolute w-1.5 h-1.5 rounded-full bg-white/[0.12]"
                 style={{
                   animation: 'film-dust-pulse 7s steps(1) infinite'
                 }}
               />
             </div>


 
             {/* Giant Faint Background Word */}
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
               <span className="text-[28vw] font-black tracking-tighter text-white/[0.015] uppercase italic select-none">
                 the tribe
               </span>
             </div>

             {/* Dynamic Scrolling Celluloid Movie Reels (Background) */}
             <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-around py-16 opacity-30 select-none">
               
               {/* Reel 1: Upper Track (Scrolling Left) */}
               <div className="w-full h-24 overflow-hidden relative border-y border-white/[0.03] bg-zinc-950/20">
                 <div className="flex w-max gap-0 animate-film-reel-left">
                   {/* Loop 1 */}
                   <div className="flex">
                     {Array.from({ length: 12 }).map((_, idx) => (
                       <div key={`reel-top-${idx}`} className="w-56 h-24 flex-shrink-0 bg-neutral-950 border-r-2 border-neutral-900 relative flex flex-col justify-between py-1.5">
                         {/* Top Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                         {/* Frame Space */}
                         <div className="flex-grow mx-3 my-0.5 bg-black/55 border border-white/[0.05] rounded-[1px] flex items-center justify-between px-3 text-white/10 font-mono text-[8px] tracking-widest select-none">
                           <span className="text-orange-500/20 font-black">KODAK 500T</span>
                           <span>01:{String(idx + 1).padStart(2, '0')}</span>
                           <span className="text-white/5 font-extrabold">▲ {12 + idx}</span>
                         </div>
                         {/* Bottom Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                   {/* Loop 2 (Duplicate for seamless infinite wrap) */}
                   <div className="flex">
                     {Array.from({ length: 12 }).map((_, idx) => (
                       <div key={`reel-top-dup-${idx}`} className="w-56 h-24 flex-shrink-0 bg-neutral-950 border-r-2 border-neutral-900 relative flex flex-col justify-between py-1.5">
                         {/* Top Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                         {/* Frame Space */}
                         <div className="flex-grow mx-3 my-0.5 bg-black/55 border border-white/[0.05] rounded-[1px] flex items-center justify-between px-3 text-white/10 font-mono text-[8px] tracking-widest select-none">
                           <span className="text-orange-500/20 font-black">KODAK 500T</span>
                           <span>01:{String(idx + 1).padStart(2, '0')}</span>
                           <span className="text-white/5 font-extrabold">▲ {12 + idx}</span>
                         </div>
                         {/* Bottom Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Reel 2: Lower Track (Scrolling Left) */}
               <div className="w-full h-24 overflow-hidden relative border-y border-white/[0.03] bg-zinc-950/20">
                 <div className="flex w-max gap-0 animate-film-reel-left">
                   {/* Loop 1 */}
                   <div className="flex">
                     {Array.from({ length: 12 }).map((_, idx) => (
                       <div key={`reel-bottom-${idx}`} className="w-56 h-24 flex-shrink-0 bg-neutral-950 border-r-2 border-neutral-900 relative flex flex-col justify-between py-1.5">
                         {/* Top Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                         {/* Frame Space */}
                         <div className="flex-grow mx-3 my-0.5 bg-black/55 border border-white/[0.05] rounded-[1px] flex items-center justify-between px-3 text-white/10 font-mono text-[8px] tracking-widest select-none">
                           <span className="text-orange-500/20 font-black">FUJI REALA</span>
                           <span>02:{String(idx + 1).padStart(2, '0')}</span>
                           <span className="text-white/5 font-extrabold">▲ {38 + idx}</span>
                         </div>
                         {/* Bottom Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                   {/* Loop 2 (Duplicate for seamless infinite wrap) */}
                   <div className="flex">
                     {Array.from({ length: 12 }).map((_, idx) => (
                       <div key={`reel-bottom-dup-${idx}`} className="w-56 h-24 flex-shrink-0 bg-neutral-950 border-r-2 border-neutral-900 relative flex flex-col justify-between py-1.5">
                         {/* Top Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                         {/* Frame Space */}
                         <div className="flex-grow mx-3 my-0.5 bg-black/55 border border-white/[0.05] rounded-[1px] flex items-center justify-between px-3 text-white/10 font-mono text-[8px] tracking-widest select-none">
                           <span className="text-orange-500/20 font-black">FUJI REALA</span>
                           <span>02:{String(idx + 1).padStart(2, '0')}</span>
                           <span className="text-white/5 font-extrabold">▲ {38 + idx}</span>
                         </div>
                         {/* Bottom Sprockets */}
                         <div className="flex justify-between px-1.5 opacity-60">
                           {Array.from({ length: 9 }).map((_, s) => (
                             <span key={s} className="w-2 h-2.5 bg-zinc-700/80 border border-white/20 rounded-[1px]" />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

             </div>

             {/* Film Strip Outer Frame Sprocket slots */}
             <div className="absolute top-0 left-0 right-0 h-6 bg-zinc-950/90 z-10 flex items-center border-b border-white/5 overflow-hidden">
               <div className="w-full h-2 film-strip" />
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-6 bg-zinc-950/90 z-10 flex items-center border-t border-white/5 overflow-hidden">
               <div className="w-full h-2 film-strip" />
             </div>

             {/* Dynamic Viewfinder Cameras Hub Overlays */}
             <div className="absolute top-10 left-8 md:left-24 z-10 pointer-events-none text-[10px] font-mono tracking-wider text-white/30 flex items-center gap-12 select-none">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block" />
                 <span className="font-extrabold text-red-500 uppercase">REC [RAW_4K]</span>
               </div>
               <div>24 FPS</div>
               <div className="hidden sm:block">ISO 800</div>
               <div className="hidden sm:block">SHUTTER 180°</div>
               <div className="hidden sm:block">5600K</div>
             </div>

             <div className="absolute top-10 right-8 md:right-24 z-10 pointer-events-none text-[10px] font-mono tracking-wider text-white/30 flex items-center gap-8 select-none">
               <div className="flex items-center gap-2">
                 <span>AUDIO dB</span>
                 <div className="flex items-end gap-[1.5px] h-3 w-10 bg-zinc-900/40 p-[2px] rounded border border-white/5">
                   <div className="w-[3px] bg-green-500/80 animate-pulse h-1" style={{ animationDelay: '0.1s' }} />
                   <div className="w-[3px] bg-green-500/80 animate-pulse h-2" style={{ animationDelay: '0.4s' }} />
                   <div className="w-[3px] bg-green-500/80 animate-pulse h-1.5" style={{ animationDelay: '0.2s' }} />
                   <div className="w-[3px] bg-orange-500/80 animate-pulse h-2.5" style={{ animationDelay: '0s' }} />
                 </div>
               </div>
               <div className="font-bold text-orange-500">{timecode}</div>
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
               @keyframes film-strip-flow {
                 0% { background-position-x: 0px; }
                 100% { background-position-x: 48px; }
               }
               @keyframes projector-flicker {
                 0%, 100% { opacity: 0.12; }
                 15% { opacity: 0.08; }
                 30% { opacity: 0.15; }
                 45% { opacity: 0.06; }
                 60% { opacity: 0.14; }
                 75% { opacity: 0.09; }
                 90% { opacity: 0.18; }
               }
               @keyframes film-scratches-x {
                 0%, 100% { transform: translateX(12%) scaleX(1); opacity: 0; }
                 5% { transform: translateX(28%) scaleX(1.5); opacity: 0.12; }
                 6% { transform: translateX(38%) scaleX(0.8); opacity: 0; }
                 35% { transform: translateX(65%) scaleX(1.2); opacity: 0.1; }
                 37% { transform: translateX(18%) scaleX(2); opacity: 0.15; }
                 39% { transform: translateX(68%) scaleX(0.5); opacity: 0; }
                 70% { transform: translateX(82%) scaleX(1); opacity: 0.12; }
                 72% { transform: translateX(32%) scaleX(1.5); opacity: 0; }
               }
               @keyframes film-dust-pulse {
                 0%, 100% { opacity: 0; transform: translate(15%, 25%) scale(0.6); }
                 10% { opacity: 0.25; transform: translate(32%, 48%) scale(1.3); }
                 20% { opacity: 0; transform: translate(48%, 15%) scale(0.4); }
                 40% { opacity: 0.2; transform: translate(72%, 78%) scale(1.6); }
                 50% { opacity: 0; transform: translate(22%, 60%) scale(0.7); }
                 70% { opacity: 0.3; transform: translate(82%, 32%) scale(1.2); }
                 80% { opacity: 0; transform: translate(18%, 85%) scale(0.5); }
               }
               @keyframes film-reel-left {
                 0% { transform: translateX(0); }
                 100% { transform: translateX(-50%); }
               }
               @keyframes film-reel-right {
                 0% { transform: translateX(-50%); }
                 100% { transform: translateX(0); }
               }
               .animate-film-reel-left {
                 animation: film-reel-left 45s linear infinite;
               }
               .animate-film-reel-right {
                 animation: film-reel-right 38s linear infinite;
               }
               .film-strip {
                 background: repeating-linear-gradient(90deg, transparent, transparent 16px, rgba(255,255,255,0.06) 16px, rgba(255,255,255,0.06) 24px);
                 background-size: 48px 100%;
                 animation: film-strip-flow 1.8s linear infinite;
               }
             `}</style>
 
             {/* Header Area (Lower Z-index to prevent covering the cards) */}
             <div className="relative z-10 max-w-xl pl-8 md:pl-24">
               <h2 className="text-3xl md:text-5xl font-black font-redhat text-white tracking-tighter leading-none uppercase mb-4">
                 Dream Team
               </h2>
               <p className="font-redhat text-white/30 text-xs md:text-sm font-semibold uppercase tracking-widest leading-relaxed">
                 A collective of obsessed creators, technical wizards, and poetic dreamers.
               </p>
             </div>
 
             {/* Sliding Container Track Wrapper with Navigation Arrows */}
             <div className="relative w-full flex-grow flex items-center">
               {/* Left Navigation Arrow */}
               <button
                 onClick={() => scrollTeam('left')}
                 className="absolute left-4 md:left-10 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full bg-white text-black shadow-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 pointer-events-auto active:scale-95 border border-zinc-200"
                 aria-label="Previous team frame"
               >
                 <ChevronLeft size={22} className="md:w-7 md:h-7 text-current" />
               </button>

               {/* Sliding Container Track (Supports mouse dragging, touch, and auto-scrolling infinite loop) */}
               <div 
                 ref={teamCarouselRef}
               onMouseDown={handleTeamMouseDown}
               onMouseMove={handleTeamMouseMove}
               onMouseUp={handleTeamMouseUpOrLeave}
               onMouseLeave={handleTeamMouseUpOrLeave}
               onTouchStart={handleTeamTouchStart}
               onTouchMove={handleTeamTouchMove}
               onTouchEnd={handleTeamMouseUpOrLeave}
               className={`w-full flex-grow relative z-20 flex items-center min-h-0 overflow-x-hidden py-10 select-none ${isDraggingTeam ? 'cursor-grabbing' : 'cursor-grab'}`}
               style={{ scrollBehavior: 'auto' }}
             >
               <div className="flex gap-0 w-max px-[4vw] md:px-[10vw]">
                 {([...team, ...team, ...team]).map((member, idx) => {
                    return (
                      <div 
                        key={`${member.name}-${idx}`}
                        className="bg-transparent w-[27vw] min-w-[100px] max-w-[135px] md:w-[320px] md:max-w-none flex-shrink-0 relative group/card select-none flex flex-col items-center border-r-[4px] md:border-r-[24px] border-black pt-4 pb-3.5 md:pt-8 md:pb-7"
                      >
                        {/* Top Perforation Sprocket Holes */}
                        <div className="absolute top-1 md:top-2.5 left-0 right-0 h-1 md:h-2.5 flex justify-between px-0.5 md:px-1 pointer-events-none select-none z-20 gap-0.5 md:gap-1.5 overflow-hidden">
                          {Array.from({ length: 8 }).map((_, s) => (
                            <div key={`sprocket-top-${s}`} className="w-1.5 md:w-4 h-1 md:h-2.5 bg-white/95 shadow-sm flex-shrink-0" />
                          ))}
                        </div>

                        {/* Image Frame - Perfect Square, Zero Rounded Corners */}
                        <div className="w-full aspect-[3/4] overflow-hidden relative mb-1.5 md:mb-3 z-10 border border-zinc-800 group-hover/card:border-orange-500 transition-colors duration-300 rounded-none bg-zinc-900/40">
                          <img 
                            src={transformGoogleDriveUrl(member.img, 'image')} 
                            alt={member.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-[1200ms] ease-out group-hover/card:scale-110 rounded-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/10 pointer-events-none" />
                        </div>

                        {/* Name and Role */}
                        <div className="text-center relative z-10 px-1 md:px-2 pointer-events-none select-none">
                          <h4 className="text-[10px] xs:text-[11px] md:text-lg font-black tracking-wider md:tracking-widest text-zinc-300 uppercase group-hover/card:text-orange-500 transition-colors duration-300 line-clamp-1">
                            {member.name}
                          </h4>
                          <p className="text-[7.5px] xs:text-[9px] md:text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5 md:mt-1">
                            {member.role}
                          </p>
                        </div>

                        {/* Bottom Perforation Sprocket Holes */}
                        <div className="absolute bottom-1 md:bottom-2.5 left-0 right-0 h-1 md:h-2.5 flex justify-between px-0.5 md:px-1 pointer-events-none select-none z-20 gap-0.5 md:gap-1.5 overflow-hidden">
                          {Array.from({ length: 8 }).map((_, s) => (
                            <div key={`sprocket-bottom-${s}`} className="w-1.5 md:w-4 h-1 md:h-2.5 bg-white/95 shadow-sm flex-shrink-0" />
                          ))}
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>

             {/* Right Navigation Arrow */}
             <button
               onClick={() => scrollTeam('right')}
               className="absolute right-4 md:right-10 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full bg-white text-black shadow-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 pointer-events-auto active:scale-95 border border-zinc-200"
               aria-label="Next team frame"
             >
               <ChevronRight size={22} className="md:w-7 md:h-7 text-current" />
             </button>
           </div>
 
             {/* Horizontal Continuous Stream Indicator */}
             <div className="absolute bottom-8 right-8 md:right-24 z-20 flex items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-widest">
               <span>Continuous Cinematic Stream</span>
               <div className="w-12 h-[2px] bg-white/10 relative overflow-hidden rounded-full">
                 <div 
                   className="absolute inset-0 bg-orange-500 origin-left animate-pulse"
                 />
               </div>
             </div>
 
         </section>


       </main>
      <InteractiveOptions />
      <Footer />

      {/* Hero Image Management Mini Admin Modal */}
      <AnimatePresence>
        {isEditingBg && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingBg(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2rem] p-6 md:p-8 overflow-hidden shadow-2xl z-10"
            >
              {/* Top glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Title */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-orange-500/20 bg-orange-500/5 flex items-center justify-center text-orange-500">
                    <Camera size={14} />
                  </div>
                  <div>
                    <h3 className="text-white font-black tracking-tight uppercase text-xs md:text-sm">Hero Image Management</h3>
                    <p className="text-white/40 text-[9px] font-mono tracking-wider uppercase">Dreamcatchers Customization Grid</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingBg(false)}
                  className="w-7 h-7 rounded-full border border-white/5 hover:border-white/10 hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Form content */}
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    Hero Background Image URL or Google Drive Link
                  </label>
                  <input
                    type="text"
                    value={tempBgImg}
                    onChange={(e) => setTempBgImg(e.target.value)}
                    placeholder="https://images.unsplash.com/... or google-drive-url"
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/5 focus:border-orange-500/30 rounded-xl text-white text-xs font-medium focus:outline-none transition-all placeholder:text-zinc-600"
                  />
                  <p className="text-[9px] text-zinc-500 font-mono mt-1 px-1">
                    Enter any Unsplash address or Google Drive share link. It supports instant image transformation automatically.
                  </p>
                </div>

                {/* Preview Frame */}
                {tempBgImg && (
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Live Canvas Preview</span>
                    <div className="w-full h-36 rounded-xl overflow-hidden relative border border-white/5 bg-zinc-900/50">
                      <img
                        src={transformGoogleDriveUrl(tempBgImg, 'image')}
                        className="w-full h-full object-cover"
                        alt="Hero Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <span className="text-[10px] font-black tracking-widest text-white uppercase italic">PREVIEW ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingBg(false)}
                    className="flex-1 py-3 px-4 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer text-center bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHeroBg}
                    className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-[0.1em] text-[10px] rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-orange-500/10 text-center"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBg(false);
                      navigate('/admin');
                    }}
                    className="text-[9px] font-bold text-orange-400 hover:text-orange-300 font-mono tracking-widest uppercase flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                  >
                    🚀 Enter Full Studio Editorial Panel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
