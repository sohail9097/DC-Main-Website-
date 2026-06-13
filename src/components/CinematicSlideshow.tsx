import { useRef, memo, FC, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Film, Compass, Tv, Camera, Play, Sparkles, BookOpen, Layers, Zap, Info } from 'lucide-react';

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

export const CinematicSlideshow: FC = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState<CinematicSlide[]>(DEFAULT_SLIDES);
  
  // Track scroll position of the entirepinned slide container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Calculate current active slide index for side navigation indicator
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScrollUpdate = (latest: number) => {
      // Calculate active slide index based on scroll position (0 to 1 split into 9 chunks)
      const fractionalIndex = latest * 9;
      const idx = Math.min(8, Math.max(0, Math.floor(fractionalIndex)));
      setActiveIndex(idx);
    };

    const unsubscribe = scrollYProgress.on('change', handleScrollUpdate);
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Load slides config from localStorage to ensure perfect admin customization sync
  useEffect(() => {
    const loadSlides = () => {
      const stored = localStorage.getItem('cinematic_slides_list');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 9) {
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

  // Soft fallback helper for resolving Google Drive URLs or image strings
  const transformUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      // Extract file id
      const matches = url.match(/(?:\/file\/d\/|id=)([^/?]+)/);
      if (matches && matches[1]) {
        return `https://docs.google.com/uc?export=download&id=${matches[1]}`;
      }
    }
    return url;
  };

  return (
    <section 
      ref={containerRef} 
      className="relative z-20 w-full bg-black overflow-visible"
      style={{ height: '900vh' }} // 9 slides * 100vh of scrolling room
      id="cinematic-slides"
    >
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden bg-black flex flex-col justify-between">
        
        {/* Slides rendering block */}
        <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center">
          {slides.map((slide, idx) => {
            // Apply standard card pile-up / slide-up coordinates matching user intent
            const slideStart = Math.max(0, (idx - 0.72) / 9);
            const slideActive = idx / 9;
            const slideDone = Math.min(1, (idx + 0.72) / 9);
            const slideNext = Math.min(1, (idx + 1) / 9);

            // Interpolated motion variables
            // For index 0, it stays at 0% and slides out to -100%.
            // For intermediate slides, they enter from bottom (100%), stay at 0%, and exit to top (-100%).
            // For the final slide (index 8), it enters from bottom (100%), stays at 0% until the end of the container, with no exit animation. This prevents the blank black screen issue.
            const isFirst = idx === 0;
            const isLast = idx === slides.length - 1;

            const yRange = isFirst 
              ? [0, slideDone, slideNext] 
              : isLast 
                ? [slideStart, slideActive, 1] 
                : [slideStart, slideActive, slideDone, slideNext];

            const yOutput = isFirst 
              ? ['0%', '0%', '-100%'] 
              : isLast 
                ? ['100%', '0%', '0%'] 
                : ['100%', '0%', '0%', '-100%'];

            const y = useTransform(scrollYProgress, yRange, yOutput);

            // Keep opacity fully solid at 1 to prevent black background from showing through during transitions
            const opacity = 1;

            // Keep scale flat at 1 to prevent visual gaps/margins reveals that show black edges
            const scale = 1;

            const Icon = ICONS_MAP[slide.id] || Film;

            return (
              <motion.div
                key={slide.id}
                style={{ y, opacity, scale }}
                className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black origin-center"
              >
                {/* Background Image with slow zoom transition */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={transformUrl(slide.imageUrl)}
                    alt={slide.title}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </div>


              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
});

CinematicSlideshow.displayName = 'CinematicSlideshow';
