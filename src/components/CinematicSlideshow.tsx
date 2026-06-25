import { useRef, memo, FC, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'motion/react';
import { 
  Film, 
  Compass, 
  Tv, 
  Camera, 
  Play, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Zap, 
  ArrowDown,
  ArrowRight
} from 'lucide-react';

export interface CinematicSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const DEFAULT_SLIDES: CinematicSlide[] = [
  {
    id: 'branded_content',
    title: 'Branded Content',
    description: 'Collaboration with brands across sectors to create compelling films as integral parts of their campaigns.',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071'
  },
  {
    id: 'travel_shows',
    title: 'Travel Shows',
    description: 'We have partnered up with Tourism boards across India & overseas to create compelling, visually striking travel content.',
    imageUrl: 'https://images.unsplash.com/photo-1527118732049-c88155f548d7?auto=format&fit=crop&q=80&w=2070'
  },
  {
    id: 'commercial_shoots',
    title: 'Commercial Ads',
    description: 'High-impact campaigns crafted with supreme visual craft, leaving an indelible imprint on target audiences.',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2059'
  },
  {
    id: 'documentaries',
    title: 'Documentaries',
    description: 'Investigating real-world subjects and human struggles with absolute raw visual authenticity and emotional range.',
    imageUrl: 'https://images.unsplash.com/photo-1505159947354-e0b2447798bd?auto=format&fit=crop&q=80&w=2070'
  },
  {
    id: 'music_videos',
    title: 'Music Videos',
    description: 'Unifying melodic textures and abstract, artistic styling with dream-like lighting concepts and edit rhythms.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2070'
  },
  {
    id: 'narrative_shorts',
    title: 'Narrative Shorts',
    description: 'Bringing scripts to life through premium storytelling, masterclass cinematography, and deep ambient soundscapes.',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2025'
  },
  {
    id: 'corporate_stories',
    title: 'Corporate Films',
    description: 'Highlighting brand integrity, corporate vision, and scale for stakeholders and customers alike.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070'
  },
  {
    id: 'fashion_lifestyle',
    title: 'Fashion Sequences',
    description: 'Highly aestheticized visual portfolios capturing fluid movement, modern textures, and design philosophy.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=2070'
  },
  {
    id: 'aerial_adventure',
    title: 'Aerial Adventure',
    description: 'Pushing geographic boundaries with cinematic drone capturing, FPV acrobatics, and high-adrenaline visual stunts.',
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=2070'
  }
];

const ICONS_MAP: Record<string, any> = {
  branded_content: Film,
  travel_shows: Compass,
  commercial_shoots: Tv,
  documentaries: Camera,
  music_videos: Play,
  narrative_shorts: Sparkles,
  corporate_stories: BookOpen,
  fashion_lifestyle: Layers,
  aerial_adventure: Zap
};

const getButtonLabel = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('photo')) return 'VIEW WORK';
  if (t.includes('video')) return 'VIEW OUR FILMS';
  if (t.includes('drone') || t.includes('aerial')) return 'VIEW REEL';
  if (t.includes('brand') || t.includes('content')) return 'VIEW CASE STUDY';
  if (t.includes('commercial') || t.includes('ad')) return 'PLAY ADWORK';
  if (t.includes('document')) return 'WATCH FILM';
  if (t.includes('music')) return 'PLAY VIDEO';
  return 'VIEW CASE STUDY';
};

const makeKeys = (...vals: number[]) => {
  const result: number[] = [];
  let last = 0;
  for (const v of vals) {
    const clamped = Math.max(last, Math.min(1, v));
    result.push(clamped);
    last = clamped;
  }
  return result;
};

export const CinematicSlideshow: FC = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState<CinematicSlide[]>(DEFAULT_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll position of the entire pinned slide container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Create a beautiful, physics-based smooth scroll progress to remove scroll jitter
  const smoothScrollYProgress = useSpring(scrollYProgress, {
    stiffness: 65,
    damping: 28,
    restDelta: 0.0001
  });

  // Keep tracking current active indices
  useEffect(() => {
    const handleScrollUpdate = (latest: number) => {
      const fractionalIndex = latest * (slides.length || 1);
      const idx = Math.floor(fractionalIndex);
      setActiveIndex(Math.min((slides.length || 1) - 1, Math.max(0, idx)));
    };

    const unsubscribe = smoothScrollYProgress.on('change', handleScrollUpdate);
    return () => unsubscribe();
  }, [smoothScrollYProgress, slides.length]);

  // Load slides config from localStorage to ensure perfect admin customization sync
  useEffect(() => {
    const loadSlides = () => {
      const stored = localStorage.getItem('cinematic_slides_list');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(parsed);
          } else {
            setSlides(DEFAULT_SLIDES);
          }
        } catch (e) {
          console.error('Error parsing loaded cinematic slides:', e);
          setSlides(DEFAULT_SLIDES);
        }
      } else {
        setSlides(DEFAULT_SLIDES);
      }
    };

    loadSlides();
    window.addEventListener('storage', loadSlides);
    window.addEventListener('storage_updated_cinematic_slides', loadSlides);

    return () => {
      window.removeEventListener('storage', loadSlides);
      window.removeEventListener('storage_updated_cinematic_slides', loadSlides);
    };
  }, []);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.ogg') ||
      url.toLowerCase().includes('.mp4') ||
      url.toLowerCase().includes('.mov') ||
      url.toLowerCase().includes('.webm') ||
      url.toLowerCase().includes('video/mp4') ||
      url.toLowerCase().includes('/video/') ||
      url.startsWith('data:video/')
    );
  };

  // Soft fallback helper for resolving Google Drive URLs or image strings
  const transformUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const matches = url.match(/(?:\/file\/d\/|id=)([^/?]+)/);
      if (matches && matches[1]) {
        const fileId = matches[1];
        if (isVideoUrl(url)) {
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    return url;
  };

  return (
    <section 
      ref={containerRef} 
      className="relative z-20 w-full bg-black overflow-visible"
      style={{ height: `${slides.length * 180}vh` }}
      id="cinematic-slides"
    >
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden bg-black flex flex-col justify-between">

        {/* Stacked Slides Layer rendering block */}
        <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center">
          {slides.map((slide, idx) => {
            const totalSlides = slides.length || 9;
            const numTransitions = Math.max(1, totalSlides - 1);
            const transitionRange = 1 / numTransitions;

            const incomingStart = (idx - 1) * transitionRange;
            const incomingEnd = idx * transitionRange;
            const outgoingStart = idx * transitionRange;
            const outgoingEnd = (idx + 1) * transitionRange;

            // Slide translation: "image top se gayab na ho, niche slide upar aaye and cover kre"
            // The upper (current) image remains stationary at "0%" as subsequent slides slide on top of them.
            // Incoming slides start offscreen at "100%" (bottom) and slide UP to "0%" as they become active.
            // Since incoming slides slide ON TOP of existing ones, z-index increases with the slide index.
            let yRange: number[];
            let yOutput: string[];

            if (idx === 0) {
              // The first slide is active immediately at 0% and remains covered by subsequent slides
              yRange = [0, 1];
              yOutput = ['0%', '0%'];
            } else {
              // Subsequent slides start at 100% and slide up to 0% as they become active
              if (incomingStart <= 0) {
                yRange = [0, incomingEnd, 1];
                yOutput = ['100%', '0%', '0%'];
              } else if (incomingEnd >= 0.999) {
                yRange = [0, incomingStart, 1];
                yOutput = ['100%', '100%', '0%'];
              } else {
                yRange = [0, incomingStart, incomingEnd, 1];
                yOutput = ['100%', '100%', '0%', '0%'];
              }
            }

            const y = useTransform(smoothScrollYProgress, yRange, yOutput);
            const zIndex = idx + 1;

            // Background image stays stable and flat during slide shifts
            const scale = 1.0;

            // Text translations driven strictly by smooth scroll progress to trigger cinematic staggered entry/exit offsets
            let textY;

            if (idx === 0) {
              // First slide starts active at 0vh, then scrolls up smoothly with its slide and subtle parallax
              const keys = [0, outgoingEnd, 1];
              textY = useTransform(
                smoothScrollYProgress,
                keys,
                ["0vh", "-100vh", "-100vh"]
              );
            } else if (idx === totalSlides - 1) {
              // Last slide's text starts active relative to its rising container to slide in 1:1
              const keys = [0, 1];
              textY = useTransform(
                smoothScrollYProgress,
                keys,
                ["0vh", "0vh"]
              );
            } else {
              // Middle slides
              if (incomingStart <= 0) {
                // For slide 1, incomingStart is 0, so avoid duplicate 0 in keys
                if (outgoingEnd >= 0.999) {
                  const keys = [0, incomingEnd, 1];
                  textY = useTransform(
                    smoothScrollYProgress,
                    keys,
                    ["0vh", "0vh", "-100vh"]
                  );
                } else {
                  const keys = [0, incomingEnd, outgoingEnd, 1];
                  textY = useTransform(
                    smoothScrollYProgress,
                    keys,
                    ["0vh", "0vh", "-100vh", "-100vh"]
                  );
                }
              } else {
                if (outgoingEnd >= 0.999) {
                  const keys = [0, incomingStart, incomingEnd, 1];
                  textY = useTransform(
                    smoothScrollYProgress,
                    keys,
                    ["0vh", "0vh", "0vh", "-100vh"]
                  );
                } else {
                  const keys = [0, incomingStart, incomingEnd, outgoingEnd, 1];
                  textY = useTransform(
                    smoothScrollYProgress,
                    keys,
                    ["0vh", "0vh", "0vh", "-100vh", "-100vh"]
                  );
                }
              }
            }

            return (
              <motion.div
                key={slide.id}
                style={{ y, zIndex }}
                className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black"
              >
                {/* Background Image without visual scaling gaps */}
                <div className="absolute inset-0 w-full h-full pb-0">
                  {isVideoUrl(slide.imageUrl) ? (
                    <video
                      src={transformUrl(slide.imageUrl)}
                      className="w-full h-full object-cover select-none"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={transformUrl(slide.imageUrl)}
                      alt={slide.title}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Premium floating text block - High-fidelity pure slide translation with absolutely NO fade */}
                <motion.div 
                  style={{ y: textY }}
                  className="absolute bottom-20 md:bottom-[100px] left-6 md:left-[80px] right-6 md:right-[80px] z-20 text-left pointer-events-none select-none"
                >
                  <div className="w-full md:max-w-none">
                    <h2 
                      style={{ 
                        fontFamily: '"Barlow Condensed", sans-serif',
                        textShadow: '0 4px 16px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9)'
                      }}
                      className="font-condensed text-4xl md:text-[5.5rem] font-bold text-white tracking-[-0.015em] leading-[1.05] mb-3"
                    >
                      {slide.title}
                    </h2>
                    
                    <p 
                      style={{ 
                        fontFamily: '"Barlow Condensed", sans-serif',
                        textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)'
                      }}
                      className="font-condensed text-sm md:text-[1.85rem] font-normal text-white/90 tracking-[0.015em] leading-[1.35] w-full"
                    >
                      {slide.description}
                    </p>


                  </div>
                </motion.div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
});

CinematicSlideshow.displayName = 'CinematicSlideshow';
