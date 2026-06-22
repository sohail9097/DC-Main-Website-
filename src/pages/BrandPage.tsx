import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Shield, Sparkles, Building2, Landmark, Clapperboard, ExternalLink, ArrowRight, Plus } from 'lucide-react';
import React, { useState, useEffect, FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, transformGoogleDriveUrl, Footer, InteractiveOptions } from '../App';
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

export interface BrandItem {
  id: string;
  name: string;
  category: 'platforms' | 'govt' | 'corporates';
  logoUrl?: string;
  renderLogo?: () => React.ReactNode;
  description?: string;
  logoSize?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const DEFAULT_BRAND_ITEMS: BrandItem[] = [
  // ================= GOVT =================
  {
    id: 'bsf',
    name: 'BSF',
    category: 'govt',
    description: 'Border Security Force of India.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-yellow-500/50 flex flex-col items-center justify-center p-0.5 bg-yellow-500/10">
          <span className="text-[7px] font-black text-yellow-500 leading-none">BSF</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-wide text-white">BSF</span>
          <span className="text-[6px] tracking-[0.1em] text-yellow-500/80 font-bold uppercase">DUTY UNTO DEATH</span>
        </div>
      </div>
    )
  },
  {
    id: 'jalshakti',
    name: 'Ministry of Jal Shakti',
    category: 'govt',
    description: 'Government of India department for water resources.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <div className="flex flex-col text-left">
          <span className="text-[7px] tracking-[0.15em] text-white/60 uppercase">GOVERNMENT OF INDIA</span>
          <span className="text-[9px] font-bold text-white uppercase leading-tight">MINISTRY OF JAL SHAKTI</span>
        </div>
      </div>
    )
  },
  {
    id: 'mohua',
    name: 'Ministry of Housing and Urban Affairs',
    category: 'govt',
    description: 'Government of India ministry for housing & municipal growth.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-white/10 rounded border border-white/10 flex items-center justify-center p-1 shrink-0">
          <span className="text-white text-[8px] font-black">MoHUA</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[6px] tracking-[0.15em] text-orange-500/80 font-bold uppercase">MINISTRY OF HOUSING &</span>
          <span className="text-[8px] font-black text-white uppercase leading-none mt-0.5">URBAN AFFAIRS</span>
        </div>
      </div>
    )
  },
  {
    id: 'hongkongtourism',
    name: 'Hong Kong Tourism Board',
    category: 'govt',
    description: 'Official tourism portal for Hong Kong SAR.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 12v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 1.83-.62 3.51-1.66 4.88z"/>
        </svg>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-extrabold text-white tracking-widest leading-none">HONG KONG</span>
          <span className="text-[7px] text-red-500 font-bold uppercase tracking-wider mt-0.5">TOURISM BOARD</span>
        </div>
      </div>
    )
  },
  {
    id: 'landresources',
    name: 'Department of Land Resources',
    category: 'govt',
    description: 'Ministry of Rural Development, India.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9s9-4.03 9-9c0-.46-.04-.92-.1-1.36M12 3a9 9 0 0 1 9 9c0 .46-.04.92-.1 1.36M12 3V12l6 4M12 21v-9m0 0H3" />
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[6px] tracking-widest text-[#EAB308] uppercase font-bold">DEPARTMENT OF</span>
          <span className="text-[8px] font-black text-white uppercase leading-none">LAND RESOURCES</span>
        </div>
      </div>
    )
  },
  {
    id: 'landports',
    name: 'Land Ports Authority of India',
    category: 'govt',
    description: 'Empowered agency managing land ports at cross borders.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-orange-500 text-[8px] font-black">LPAI</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[8px] font-black text-white uppercase leading-tight">LAND PORTS</span>
          <span className="text-[6px] tracking-[0.1em] text-white/50 uppercase leading-none">AUTHORITY OF INDIA</span>
        </div>
      </div>
    )
  },
  {
    id: 'swachhbharat',
    name: 'Swachh Bharat',
    category: 'govt',
    description: 'National clean India mission.',
    renderLogo: () => (
      <div className="flex flex-col items-center">
        {/* Spectacular Swachh glasses logo outline in SVG */}
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-[5px] text-white/80 select-none">स्वच्छ</div>
          <div className="w-2 h-[1px] bg-white/40" />
          <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-[5px] text-white/80 select-none">भारत</div>
        </div>
        <span className="text-[6px] text-yellow-500 tracking-[0.15em] uppercase font-medium mt-1 font-sans">एक कदम स्वच्छता की ओर</span>
      </div>
    )
  },
  {
    id: 'ota',
    name: 'Officers Training Academy',
    category: 'govt',
    description: 'Premier Indian Army commissioning training center.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded border border-yellow-500/30 bg-orange-500/15 flex items-center justify-center text-yellow-400 font-extrabold text-[8px]">
          OTA
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[8px] font-black text-white uppercase leading-tight">OFFICERS TRAINING</span>
          <span className="text-[6px] tracking-[0.1em] text-[#EAB308] uppercase font-bold leading-none">ACADEMY</span>
        </div>
      </div>
    )
  },
  {
    id: 'jharkhand',
    name: 'Government of Jharkhand',
    category: 'govt',
    description: 'Official department and tourism initiatives of Jharkhand.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <span className="text-green-400 text-[6px] font-black uppercase">GOJ</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[6px] text-green-400 tracking-[0.1em] uppercase font-bold">GOVERNMENT OF</span>
          <span className="text-[8px] font-black text-white uppercase leading-none">JHARKHAND</span>
        </div>
      </div>
    )
  },
  {
    id: 'meghalayatourism',
    name: 'Meghalaya Tourism',
    category: 'govt',
    description: 'High end tourism authority for pure scenic Meghalaya.',
    renderLogo: () => (
      <div className="flex flex-col items-center">
        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-emerald-400 text-[9px] font-black tracking-widest uppercase">MEGHALAYA</span>
        <span className="text-[6px] tracking-[0.3em] text-white/50 uppercase mt-0.5 font-sans font-bold">TOURISM</span>
      </div>
    )
  },
  {
    id: 'odisha',
    name: 'Odisha Government',
    category: 'govt',
    description: 'Official Odisha state government sector initiatives.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-red-600/10 border border-red-500/20 flex items-center justify-center text-[7px] text-[#F97316] font-black">
          ODISHA
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[7px] text-white/50 tracking-wider">ODISHA STATE</span>
          <span className="text-[8px] font-bold text-white uppercase leading-none mt-0.5">GOVERNMENT</span>
        </div>
      </div>
    )
  },
  {
    id: 'gujarattourism',
    name: 'Gujarat Tourism',
    category: 'govt',
    description: 'Leading heritage and vibrant tour initiatives in western India.',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-orange-500 fill-current shrink-0" viewBox="0 0 24 24">
          {/* Saffron lion silhouette or symbol */}
          <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10h-2A8 8 0 0 1 12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8V2z" />
        </svg>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-black text-white tracking-widest leading-none">GUJARAT</span>
          <span className="text-[7px] text-orange-500/90 font-bold uppercase tracking-wider mt-0.5">TOURISM</span>
        </div>
      </div>
    )
  },
  {
    id: 'cidco',
    name: 'CIDCO',
    category: 'govt',
    description: 'City and Industrial Development Corporation.',
    renderLogo: () => (
      <div className="flex items-center gap-1.5 text-left">
        <div className="w-5 h-5 bg-blue-600/20 border border-blue-500/30 rounded flex items-center justify-center text-[9px] font-black text-blue-400">C</div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-white tracking-widest">CIDCO</span>
          <span className="text-[5px] tracking-[0.05em] text-white/40 uppercase font-sans">WE MAKE CITIES</span>
        </div>
      </div>
    )
  },
  {
    id: 'indianairforce',
    name: 'Indian Air Force',
    category: 'govt',
    description: 'Indian Air Force - Touch the Sky with Glory.',
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-[#072F5F]/40 shrink-0 relative p-1">
          <div className="w-full h-full rounded-full bg-[#1e3a8a] flex items-center justify-center p-0.5 relative">
            <div className="w-full h-full rounded-full border-[1.5px] border-orange-500 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-wide text-white">INDIAN AIR FORCE</span>
          <span className="text-[6px] tracking-[0.05em] text-[#38bdf8] font-black uppercase">TOUCH THE SKY WITH GLORY</span>
        </div>
      </div>
    )
  },
  {
    id: 'indianarmy',
    name: 'Indian Army',
    category: 'govt',
    description: 'Indian Army - Service Before Self.',
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full border border-yellow-500/30 flex items-center justify-center bg-red-950/20 shrink-0 p-1">
          <div className="w-full h-full rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-wide text-white font-sans">INDIAN ARMY</span>
          <span className="text-[6px] tracking-[0.05em] text-red-500 font-bold uppercase">SERVICE BEFORE SELF</span>
        </div>
      </div>
    )
  },

  // ================= CORPORATES =================
  {
    id: 'adani',
    name: 'Adani',
    category: 'corporates',
    description: 'Global infrastructure and specialized utility hub.',
    renderLogo: () => (
      <div className="flex flex-col items-center border border-purple-500/15 bg-purple-500/5 px-2 py-1 rounded">
        <span className="text-xl font-bold tracking-tight text-white font-sans">
          adani
        </span>
      </div>
    )
  },
  {
    id: 'lt',
    name: 'L&T',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center p-0.5 bg-blue-500/10">
          <div className="w-full h-full rounded-full border border-white/20 flex items-center justify-center text-white text-[10px] font-bold">L&T</div>
        </div>
        <span className="text-[7px] text-white/40 tracking-wider">LARSEN & TOUBRO</span>
      </div>
    )
  },
  {
    id: 'gmr',
    name: 'GMR',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-black italic tracking-wide text-white">GMR</span>
        <div className="h-4 w-[2px] bg-red-500 rotate-12" />
        <span className="text-[7px] tracking-widest text-[#EAB308] uppercase font-bold mt-1">AIRPORTS</span>
      </div>
    )
  },
  {
    id: 'kpmg',
    name: 'KPMG',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center">
        <span className="text-2xl font-black text-blue-500 tracking-tight flex items-center gap-0.5">
          <span>K</span>
          <span>P</span>
          <span>M</span>
          <span>G</span>
        </span>
      </div>
    )
  },
  {
    id: 'vedanta',
    name: 'Vedanta',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-500 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
        </svg>
        <span className="text-base font-extrabold tracking-[0.1em] text-white uppercase">vedanta</span>
      </div>
    )
  },
  {
    id: 'max',
    name: 'Max Healthcare',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
          +
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-black text-white uppercase leading-none">MAX</span>
          <span className="text-[7px] tracking-wider text-teal-400 uppercase mt-0.5">HEALTHCARE</span>
        </div>
      </div>
    )
  },
  {
    id: 'amns',
    name: 'AM/NS India',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded">
        <span className="text-xs font-black tracking-tighter text-red-500">AM/NS</span>
        <span className="text-[9px] font-bold text-white uppercase tracking-wider">INDIA</span>
      </div>
    )
  },
  {
    id: 'grantthornton',
    name: 'Grant Thornton',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-purple-400 font-bold">GT</span>
        </div>
        <span className="text-[10px] font-black text-white tracking-widest uppercase">Grant Thornton</span>
      </div>
    )
  },
  {
    id: 'npcl',
    name: 'NPCL',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex flex-col text-center">
        <span className="text-lg font-black tracking-widest text-[#F97316]">NPCL</span>
        <span className="text-[5px] tracking-wide text-white/40 uppercase mt-0.5">NOIDA POWER COMPANY LIMITED</span>
      </div>
    )
  },
  {
    id: 'jakson',
    name: 'Jakson',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <span className="text-[#EF4444] font-extrabold text-sm border-r border-[#EF4444]/30 pr-1.5 scale-y-125">X</span>
        <span className="text-base font-black text-white tracking-widest uppercase">JAKSON</span>
      </div>
    )
  },
  {
    id: 'wns',
    name: 'WNS',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex flex-col">
        <span className="text-xl font-black text-white tracking-[0.1em] font-sans">WNS</span>
        <span className="text-[6px] tracking-widest text-white/30 uppercase">PART OF CAPGEMINI</span>
      </div>
    )
  },
  {
    id: 'experion',
    name: 'Experion',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex flex-col text-center">
        <span className="text-base font-black tracking-[0.15em] text-[#22C55E]">EXPERION</span>
        <span className="text-[5px] tracking-widest text-white/40 uppercase">THE POSITIVE SIDE OF LIFE</span>
      </div>
    )
  },
  {
    id: 'misumi',
    name: 'Misumi',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 bg-[#3B82F6] flex items-center justify-center shrink-0">
          <span className="text-white text-[7px] font-bold">M</span>
        </div>
        <span className="text-sm font-black text-white tracking-[0.1em]">MISUMI</span>
      </div>
    )
  },
  {
    id: 'arcelormittal',
    name: 'ArcelorMittal',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex flex-col">
        <span className="text-xs font-black tracking-tight text-white">ArcelorMittal</span>
        <div className="w-full h-[2px] bg-orange-500 mt-0.5" />
      </div>
    )
  },
  {
    id: 'terumo',
    name: 'Terumo',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center justify-center">
        <span className="text-lg font-black tracking-[0.1em] text-[#10B981] font-sans">TERUMO</span>
      </div>
    )
  },
  {
    id: 'daifuku',
    name: 'Daifuku',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex items-center justify-center bg-indigo-950/20 px-2 py-0.5 border border-indigo-500/10 rounded">
        <span className="text-sm font-black tracking-widest text-indigo-400 uppercase">DAIFUKU</span>
      </div>
    )
  },
  {
    id: 'jupiterhospital',
    name: 'Jupiter Hospital',
    category: 'corporates',
    renderLogo: () => (
      <div className="flex flex-col">
        <span className="text-xs font-extrabold text-[#3B82F6] leading-none uppercase">JUPITER HOSPITAL</span>
        <span className="text-[6px] tracking-widest text-white/50 uppercase mt-0.5">PATIENT FIRST</span>
      </div>
    )
  },
  {
    id: 'cairn',
    name: 'Cairn',
    category: 'corporates',
    renderLogo: () => (
      <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center">
        <span className="text-xs font-black text-white tracking-widest uppercase">CAIRN</span>
      </div>
    )
  },

  // ================= PLATFORMS =================
  {
    id: 'jiostar',
    name: 'Jio Star',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center gap-2 bg-[#001D3D] px-3 py-1.5 rounded-xl border border-blue-900/40">
        <span className="text-xs font-bold text-white uppercase font-sans">Jio</span>
        <span className="text-xs font-black text-pink-500 uppercase font-serif tracking-widest">STAR</span>
      </div>
    )
  },
  {
    id: 'discovery',
    name: 'Warner Bros. Discovery',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex flex-col items-center">
        {/* WB Shield mini representation */}
        <div className="w-5 h-6 rounded-b-full border border-blue-400 bg-blue-500/15 flex items-center justify-center shadow-lg">
          <span className="text-white text-[7px] font-black">WB</span>
        </div>
        <span className="text-[7px] text-white/50 tracking-[0.25em] font-sans font-bold uppercase mt-1">DISCOVERY</span>
      </div>
    )
  },
  {
    id: 'natgeo',
    name: 'National Geographic',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-5 border-2 border-yellow-500 bg-transparent shrink-0" />
        <div className="flex flex-col text-left">
          <span className="text-[7px] text-white tracking-[0.1em] uppercase font-bold leading-none">NATIONAL</span>
          <span className="text-[8px] text-white/60 font-semibold uppercase leading-none mt-0.5">GEOGRAPHIC</span>
        </div>
      </div>
    )
  },
  {
    id: 'zeetv',
    name: 'Zee TV',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex flex-col items-center justify-center bg-orange-600/15 px-3 py-1.5 border border-orange-500/20 rounded-lg">
        <span className="text-xs font-black text-orange-500 uppercase tracking-widest">ZEE TV</span>
      </div>
    )
  },
  {
    id: 'sony',
    name: 'Sony Entertainment Television',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center gap-1.5 text-left bg-gradient-to-r from-red-600/10 to-transparent px-2.5 py-0.5 rounded-lg border border-red-500/10">
        <div className="w-5 h-5 bg-gradient-to-tr from-yellow-500 to-red-600 flex items-center justify-center rounded text-[9px] font-black text-white shrink-0">S</div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white uppercase leading-none">SONY</span>
          <span className="text-[5px] tracking-wide text-white/40 uppercase">ENTERTAINMENT</span>
        </div>
      </div>
    )
  },
  {
    id: 'dd',
    name: 'DD (Doordarshan)',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full border border-blue-500 bg-blue-500/10 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
          {/* Characteristic circular Indian doordarshan swirl mark */}
          <div className="w-2.5 h-2.5 rounded-full border-t-2 border-r-2 border-blue-400 rotate-45" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[8px] font-black text-white uppercase leading-tight">दूरदर्शन</span>
          <span className="text-[6.5px] tracking-widest text-[#EAB308] uppercase font-bold leading-none">DOORDARSHAN</span>
        </div>
      </div>
    )
  },
  {
    id: 'starsports',
    name: 'Star Sports',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center gap-2 text-left">
        <div className="w-6 h-6 text-red-500 fill-current flex items-center justify-center shrink-0">
          <svg className="w-full h-full" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white uppercase leading-none">STAR</span>
          <span className="text-[8px] tracking-widest text-red-500 font-bold uppercase">SPORTS</span>
        </div>
      </div>
    )
  },
  {
    id: 'tlc',
    name: 'TLC',
    category: 'platforms',
    renderLogo: () => (
      <div className="flex items-center justify-center bg-red-600/20 px-4 py-1.5 rounded border border-red-500/40">
        <span className="text-xl font-sans font-black tracking-widest text-white italic">TLC</span>
      </div>
    )
  }
];

const CATEGORIES = [
  { id: 'all', name: 'ALL PARTNERS', icon: Sparkles },
  { id: 'platforms', name: 'PLATFORMS', icon: Clapperboard },
  { id: 'govt', name: 'GOVT', icon: Landmark },
  { id: 'corporates', name: 'CORPORATES', icon: Shield },
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
      const { brands: syncedBrands } = normalizeAndSyncData();

      const mapped = syncedBrands.map(item => {
        const defaultItem = DEFAULT_BRAND_ITEMS.find(d => 
          d.id.toLowerCase() === item.id.toLowerCase() || 
          d.name.toLowerCase() === item.name.toLowerCase()
        );
        // Ensure that we only inherit the default vector logo if the names are similar.
        // This prevents a card renamed to "INDIAN AIRFORCE" from getting the "National Geographic" logo.
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
        
        {/* Subtle Visual Breadcrumb line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-orange-500" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-bold font-mono">DREAMCATCHERS PORTFOLIO</span>
        </div>

        {/* Dynamic Typography Title Headers */}
        <h1 className="text-3xl md:text-[4.2rem] font-black tracking-tighter uppercase leading-[0.9] text-white">
          TRUSTED BY <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-orange-500">
            THE WORLD'S ELITE
          </span>
        </h1>
        
        <p className="text-white/40 max-w-2xl text-xs md:text-sm font-medium mt-6 leading-relaxed">
          Creating stunning high-impact media campaigns, digital films, branded contents, 
          We partner with local governments, public sectors, global corporate conglomerates, 
          and premier broadcast networks & platforms.
        </p>

        {/* Interactive Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-16 max-w-3xl border-t border-b border-white/5 py-8 mx-auto w-full">
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-orange-500">8+</span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">BROADCAST PLATFORMS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">12+</span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">GOVT DEPARTMENTS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">18+</span>
            <span className="text-[9px] tracking-widest text-white/50 uppercase font-mono mt-1">CORPORATE PARTNERS</span>
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

        {/* Bottom Call to Action block */}
        <div className="mt-32 border border-white/5 rounded-[2.5rem] bg-gradient-to-bl from-orange-600/5 via-transparent to-zinc-950 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
          <div className="flex flex-col max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl md:text-3.5xl font-black uppercase tracking-tight text-white leading-none">
              HAVE AN AMBITIOUS DIGITAL INITIATIVE?
            </h3>
            <p className="text-white/40 text-xs md:text-sm mt-3 font-medium leading-relaxed uppercase tracking-widest">
              LET'S CO-CREATE VISUAL ADAPTATIONS THAT CAPTURE ATTENTION AND COMPELL ACTION.
            </p>
          </div>
          <button 
            onClick={() => navigate('/#contact-section')}
            className="group flex items-center gap-6 px-8 md:px-12 py-4 md:py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full transition-all shadow-xl hover:bg-orange-500 hover:shadow-orange-500/20 shrink-0 self-start md:self-auto"
          >
            COLLABORATE WITH US
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
      <InteractiveOptions />
      <Footer />
    </div>
  );
}
