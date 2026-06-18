import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Mail, Phone, Clock, Award, Compass, Sparkles, Globe, Heart, Building, Info, Terminal, RefreshCw, Key, Shield } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

interface LocationInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  // Position specifically for the high-fidelity simulated SVG vector map relative coordinates (0-100% of container)
  xPercent: number; 
  yPercent: number;
  timezone: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  division: string;
  founded: string;
  specialty: string;
  projects: string[];
}

const locations: LocationInfo[] = [
  {
    id: 'mumbai',
    name: 'Dreamcatchers Corporate HQ',
    city: 'Mumbai',
    country: 'India',
    lat: 19.0022,
    lng: 72.8279,
    xPercent: 55,
    yPercent: 56,
    timezone: 'Asia/Kolkata',
    type: 'Global Corporate HQ & Film Division',
    description: 'Where global cinematic visions take shape. This site manages corporate partnerships, commercial TVCs, theatrical features, and major post-production pipelines.',
    address: 'Grand Oasis Towers, Lower Parel, Mumbai, MH 400013, India',
    phone: '+91 98765 43210',
    email: 'mumbai@dreamcatchers.com',
    division: 'FILMS & COMMERCIALS DEPT.',
    founded: '2012',
    specialty: 'High-Scale Concert Visuals & CGI',
    projects: ['National Brand Campaigns', 'OTT Original Features', 'Sound Design Stages']
  },
  {
    id: 'delhi',
    name: 'Dreamcatchers North India Hub',
    city: 'Delhi',
    country: 'India',
    lat: 28.5900,
    lng: 77.2200,
    xPercent: 57,
    yPercent: 44,
    timezone: 'Asia/Kolkata',
    type: 'Creative Design & Advertising Hub',
    description: 'Focusing on strategic public relations, massive brand campaigns, institutional narratives, and direct collaborations with major corporate clusters in Gurugram.',
    address: '820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016',
    phone: '+91 98765 43211',
    email: 'delhi@dreamcatchers.com',
    division: 'BRAND ADVERTISING DEPT.',
    founded: '2016',
    specialty: 'Digital Marketing & Corporate Storytelling',
    projects: ['North Belt Campaigns', 'Government Media Projects', 'B2B Brand Strategy']
  },
  {
    id: 'goa',
    name: 'Dreamcatchers Creative Sanctuary',
    city: 'Goa',
    country: 'India',
    lat: 15.5800,
    lng: 73.7420,
    xPercent: 54,
    yPercent: 62,
    timezone: 'Asia/Kolkata',
    type: 'Experimental Art & Event Studio',
    description: 'An inspirational beach-facing production retreat focusing on music festivals, experiential events, indie incubation camps, and writer-room bootcamps.',
    address: 'Arpora-Vagator Creative Hub, Bardez, Goa 403509, India',
    phone: '+91 98765 43212',
    email: 'goa@dreamcatchers.com',
    division: 'EVENTS & EXPERIENTIAL DEPT.',
    founded: '2019',
    specialty: 'Live Experiences, Independent Cinema Retreats',
    projects: ['Sub-Brand Festivals', 'Writer Residency Programs', 'Cinematography Camps']
  },
  {
    id: 'uae',
    name: 'Dreamcatchers MENA HQ',
    city: 'Dubai',
    country: 'UAE',
    lat: 25.0950,
    lng: 55.1560,
    xPercent: 41,
    yPercent: 48,
    timezone: 'Asia/Dubai',
    type: 'International Co-Production & Strategy',
    description: 'Our Middle East & North Africa anchor. Driving multi-national co-productions, high-tech visual effects operations, and representation in the EMEA markets.',
    address: 'Executive Office 402, Building 7, Dubai Media City, Dubai, UAE',
    phone: '+971 4 123 4567',
    email: 'dubai@dreamcatchers.com',
    division: 'INTERNATIONAL OPERATIONS',
    founded: '2021',
    specialty: 'Bilingual Features & Middle East Brand Representation',
    projects: ['Desert Cinematic Campaigns', 'Arabian Luxury Brands Visuals', 'CGI Post-Production']
  },
  {
    id: 'kenya',
    name: 'Dreamcatchers Wilderness Unit',
    city: 'Nairobi',
    country: 'Kenya',
    lat: -1.3480,
    lng: 36.7210,
    xPercent: 28,
    yPercent: 82,
    timezone: 'Africa/Nairobi',
    type: 'Documentary & Wildlife Unit',
    description: 'In the heart of the savannah. Our specialised field office is equipped with ultra-telephoto, thermal, and aerial camera systems dedicated to capturing wildlife.',
    address: 'The Hub Office Park, Dagoretti Road, Karen, Nairobi, Kenya',
    phone: '+254 20 9876543',
    email: 'kenya@dreamcatchers.com',
    division: 'NATURE & DOCUMENTARY DEPT.',
    founded: '2023',
    specialty: 'High-Altitude & Wildlife Documentaries',
    projects: ['The Great Migration (4K Feature)', 'Rift Valley Eco-Docs', 'Conservation Chronicles']
  }
];

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== 'undefined' && API_KEY !== '';

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#09090b" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#09090b" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#71717a" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#18181b" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#f97316" }, { "weight": 1 }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#09090b" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#18181b" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#18181b" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#27272a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
];

function MapController({ activeLoc }: { activeLoc: LocationInfo }) {
  const map = useMap();
  useEffect(() => {
    if (map && activeLoc) {
      map.setCenter({ lat: activeLoc.lat, lng: activeLoc.lng });
      map.setZoom(5);
    }
  }, [map, activeLoc]);
  return null;
}

export default function GlobalPresenceMap() {
  const [activeId, setActiveId] = useState<string>('mumbai');
  const [clocks, setClocks] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTime = () => {
      const newClocks: Record<string, string> = {};
      locations.forEach(loc => {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: loc.timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          newClocks[loc.id] = formatter.format(new Date());
        } catch (e) {
          newClocks[loc.id] = new Date().toLocaleTimeString();
        }
      });
      setClocks(newClocks);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeLoc = locations.find(loc => loc.id === activeId) || locations[0];

  return (
    <section id="office-presence" className="w-full bg-black border-t border-zinc-900 py-24 relative overflow-hidden snap-start snap-always">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-orange-500/[0.04] rounded-full blur-[180px] pointer-events-none" />
      
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        
        {/* Header Block exactly styled like user's request */}
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-orange-500 font-bold uppercase tracking-[0.3em] mb-5 shadow-2xl"
          >
            <Globe className="w-3.5 h-3.5 animate-spin duration-10000 text-orange-500" /> 
            LIVE GLOBAL COORDINATES
          </motion.div>
          
          <h2 className="text-5xl md:text-8xl font-bebas font-black italic tracking-tighter uppercase text-white leading-none">
            OUR STUDIO <span className="text-orange-500">LOCATIONS</span>
          </h2>
          <p className="text-white/40 text-[9px] md:text-xs font-black uppercase tracking-[0.35em] mt-4 max-w-2xl mx-auto leading-relaxed">
            Click on any region highlight to verify local times and active production branches
          </p>
        </div>

        {/* Main interactive area wrapper code */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Dynamic Map Component Grid Area */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 md:p-8 relative min-h-[500px] md:min-h-[600px] overflow-hidden shadow-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950">
            
            {/* Top telemetry logs */}
            <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-4 mb-4">
              <div className="text-[9px] font-mono text-white/40 tracking-widest flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-orange-500" />
                <span>ACTIVE_REGIONS: [DELHI, MUMBAI, GOA, DUBAI, NAIROBI]</span>
              </div>
              <div className="text-[9px] font-mono text-white/40 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-500">LIVE MAP PLATFORM SYNC</span>
              </div>
            </div>

            {/* Google Interactive Map frame / High fidelity Vector fallback */}
            <div className="relative w-full flex-1 min-h-[360px] md:min-h-[420px] rounded-2xl overflow-hidden">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <div className="w-full h-full min-h-[360px] md:min-h-[420px] rounded-2xl overflow-hidden relative">
                    <Map
                      defaultCenter={{ lat: activeLoc.lat, lng: activeLoc.lng }}
                      defaultZoom={5}
                      mapId="DEMO_MAP_ID"
                      gestureHandling="cooperative"
                      disableDefaultUI={false}
                      zoomControl={true}
                      styles={darkMapStyle}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <MapController activeLoc={activeLoc} />
                      
                      {locations.map((loc) => {
                        const isSelected = loc.id === activeId;
                        return (
                          <AdvancedMarker
                            key={loc.id}
                            position={{ lat: loc.lat, lng: loc.lng }}
                            title={loc.city}
                            onClick={() => setActiveId(loc.id)}
                          >
                            <Pin 
                              background={isSelected ? "#f97316" : "#09090b"} 
                              borderColor={isSelected ? "#ffffff" : "#f97316"}
                              glyphColor={isSelected ? "#000000" : "#ffffff"}
                              scale={isSelected ? 1.3 : 1.0}
                            />
                          </AdvancedMarker>
                        );
                      })}
                    </Map>
                  </div>
                </APIProvider>
              ) : (
                /* Sleek, premium high-fidelity interactive vector geographical map */
                <div className="w-full h-full min-h-[360px] md:min-h-[420px] bg-zinc-950 border border-zinc-900 rounded-3xl p-4 md:p-6 flex flex-col justify-between relative overflow-hidden group">
                  
                  {/* Digital Grid overlay effect */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" strokeDasharray="1,2" />
                  
                  {/* Tactical cartographic grid line overlays */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 1000 500" fill="none">
                      {/* Horizontal Latitudes */}
                      <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="4,8" />
                      <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                      <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="4,8" />
                      
                      {/* Vertical Longitudes */}
                      <line x1="200" y1="0" x2="200" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4,8" />
                      <line x1="400" y1="0" x2="400" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4,8" />
                      <line x1="600" y1="0" x2="600" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4,8" />
                      <line x1="800" y1="0" x2="800" y2="500" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4,8" />

                      {/* Cartographic Labels */}
                      <text x="15" y="120" className="fill-zinc-650 font-mono text-[7px] tracking-widest uppercase font-semibold">Tropic of Cancer (23.5° N)</text>
                      <text x="15" y="244" className="fill-zinc-500 font-mono text-[7px] tracking-widest uppercase font-black">Equator (0.0° N/S)</text>
                      <text x="15" y="370" className="fill-zinc-650 font-mono text-[7px] tracking-widest uppercase font-semibold">Tropic of Capricorn (23.5° S)</text>
                    </svg>
                  </div>

                  {/* Ambient vector glowing center overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(249,115,22,0.04),rgba(0,0,0,0))] pointer-events-none" />

                  {/* High Quality SVG World Outline with active pins and connections */}
                  <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-auto">
                    <svg className="w-full h-full text-zinc-800" viewBox="0 0 1000 500" fill="none">
                      
                      {/* Greenland */}
                      <path
                        d="M 270,30 L 300,25 L 330,30 L 340,45 L 325,65 L 290,72 L 275,55 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* North America */}
                      <path
                        d="M 20,100 C 40,80 80,70 120,60 C 160,50 200,65 220,100 C 240,120 230,160 210,180 C 190,200 170,220 150,250 L 140,260 C 135,220 120,180 100,170 C 80,160 50,150 20,140 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* South America */}
                      <path
                        d="M 140,260 C 160,280 180,310 190,340 C 200,380 180,440 150,480 C 135,460 120,400 110,360 C 100,320 115,280 140,260 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Africa */}
                      <path
                        d="M 220,250 C 245,235 285,230 315,245 C 330,255 350,270 345,295 C 340,320 300,340 310,370 C 315,390 300,420 290,440 C 275,440 265,410 255,390 C 245,360 225,340 215,310 C 205,280 210,265 220,250 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Middle East (Dubai region) */}
                      <path
                        d="M 330,230 C 350,220 380,215 410,225 C 430,235 440,250 435,260 C 420,270 380,270 365,260 C 350,250 340,240 330,230 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Europe */}
                      <path
                        d="M 230,120 C 260,110 320,105 370,110 C 400,120 420,150 410,180 C 400,200 370,210 340,200 C 310,190 280,210 260,200 C 240,190 220,150 230,120 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Indian Subcontinent */}
                      <path
                        d="M 450,200 C 480,195 550,195 580,200 C 600,210 610,230 590,250 C 575,265 565,285 550,320 C 545,310 540,290 535,270 C 520,255 480,250 450,220 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-800"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* East Asia & Siberia */}
                      <path
                        d="M 580,120 C 640,110 740,105 850,120 C 880,140 890,180 870,210 C 850,230 810,250 780,240 C 750,230 710,250 670,240 C 630,230 590,210 580,120 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Indonesia Archipelago */}
                      <path d="M 640,320 L 670,340 L 660,350 L 630,330 Z" className="fill-zinc-900/65" stroke="rgba(255,255,255,0.04)" />
                      <path d="M 690,320 L 720,330 L 710,350 L 680,340 Z" className="fill-zinc-900/65" stroke="rgba(255,255,255,0.04)" />
                      <path d="M 660,360 L 710,370 L 700,375 L 650,365 Z" className="fill-zinc-900/65" stroke="rgba(255,255,255,0.04)" />
                      <path d="M 560,335 C 565,335 568,340 565,345 C 562,348 558,345 560,335 Z" className="fill-zinc-900/90" stroke="rgba(255,255,255,0.1)" />

                      {/* Madagascar */}
                      <path
                        d="M 330,390 C 335,395 332,415 328,420 C 324,415 325,395 330,390 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Australia */}
                      <path
                        d="M 780,360 C 820,350 870,355 900,370 C 920,385 910,430 880,440 C 850,450 800,430 770,410 C 750,390 760,370 780,360 Z"
                        className="fill-zinc-900/60 transition-colors duration-500 hover:fill-zinc-900/90"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />

                      {/* Compass Rose */}
                      <g transform="translate(900, 100)" className="opacity-40 select-none pointer-events-none">
                        <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth="0.8" strokeDasharray="3,3" />
                        <circle cx="0" cy="0" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
                        <line x1="0" y1="-32" x2="0" y2="32" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                        <line x1="-32" y1="0" x2="32" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                        <polygon points="0,-24 4,-4 0,0" fill="rgba(249,115,22,0.85)" />
                        <polygon points="0,-24 -4,-4 0,0" fill="rgba(249,115,22,0.4)" />
                        <polygon points="0,24 4,4 0,0" fill="rgba(255,255,255,0.4)" />
                        <polygon points="0,24 -4,4 0,0" fill="rgba(255,255,255,0.15)" />
                        <polygon points="24,0 4,4 0,0" fill="rgba(255,255,255,0.4)" />
                        <polygon points="24,0 4,-4 0,0" fill="rgba(255,255,255,0.15)" />
                        <polygon points="-24,0 -4,4 0,0" fill="rgba(255,255,255,0.4)" />
                        <polygon points="-24,0 -4,-4 0,0" fill="rgba(255,255,255,0.15)" />
                        <text x="-3" y="-36" className="fill-orange-500 font-mono text-[8px] font-black">N</text>
                      </g>

                      {/* Connections: Curved Flight Routing Arcs starting from Mumbai and flowing live */}
                      {locations.map((loc) => {
                        if (loc.id === 'mumbai') return null;
                        
                        // Scale coordinates to SVG viewBox (1000 x 500)
                        const startX = 55 * 10;
                        const startY = 56 * 5;
                        const targetX = loc.xPercent * 10;
                        const targetY = loc.yPercent * 5;
                        
                        const midX = (startX + targetX) / 2;
                        const midY = (startY + targetY) / 2;
                        
                        const dx = targetX - startX;
                        const dy = targetY - startY;
                        const angle = Math.atan2(dy, dx);
                        const offsetAmt = -50; // Curve amount upward
                        const controlX = midX + Math.cos(angle + Math.PI / 2) * offsetAmt;
                        const controlY = midY + Math.sin(angle + Math.PI / 2) * offsetAmt;
                        
                        const pathString = `M ${startX} ${startY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
                        const isActiveRoute = activeId === loc.id || activeId === 'mumbai';
                        
                        return (
                          <g key={`route-${loc.id}`} className="pointer-events-none">
                            {/* Static underlying route track */}
                            <path
                              d={pathString}
                              fill="none"
                              stroke={isActiveRoute ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}
                              strokeWidth={isActiveRoute ? 1.5 : 0.8}
                              strokeDasharray="4,4"
                              className="transition-all duration-500"
                            />
                            
                            {/* Live streaming coordinate pulse along the line */}
                            {isActiveRoute && (
                              <motion.path
                                d={pathString}
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeDasharray="12, 120"
                                animate={{ strokeDashoffset: [0, -132] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2.5,
                                  ease: "linear"
                                }}
                              />
                            )}
                          </g>
                        );
                      })}

                      {/* Location Interactive Pin Groups */}
                      {locations.map((loc) => {
                        const x = loc.xPercent * 10;
                        const y = loc.yPercent * 5;
                        const isSel = loc.id === activeId;
                        
                        return (
                          <g 
                            key={`pin-group-${loc.id}`} 
                            transform={`translate(${x}, ${y})`}
                            onClick={() => setActiveId(loc.id)}
                            className="cursor-pointer pointer-events-auto"
                          >
                            {/* Sonar Beacon Rings */}
                            <circle r="22" className="fill-transparent" />
                            
                            {isSel ? (
                              <>
                                <motion.circle
                                  r="20"
                                  fill="rgba(249,115,22,0.04)"
                                  stroke="rgba(249,115,22,0.25)"
                                  strokeWidth="1"
                                  animate={{ scale: [0.8, 1.8], opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                                />
                                <motion.circle
                                  r="13"
                                  fill="rgba(249,115,22,0.08)"
                                  stroke="rgba(249,115,22,0.4)"
                                  strokeWidth="1.2"
                                  animate={{ scale: [0.8, 1.4], opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.6, ease: "easeOut" }}
                                />
                              </>
                            ) : (
                              <circle
                                r="12"
                                fill="rgba(255,255,255,0.01)"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="0.8"
                                className="hover:stroke-orange-500/40 transition-colors duration-300"
                              />
                            )}

                            {/* Outer coordinate pin border */}
                            <circle
                              r={isSel ? "6.5" : "4.5"}
                              fill={isSel ? "#000" : "rgba(9, 9, 11, 0.9)"}
                              stroke={isSel ? "#f97316" : "rgba(255,255,255,0.6)"}
                              strokeWidth={isSel ? "2" : "1"}
                              className="transition-all duration-300"
                            />

                            {/* Tiny center core dot */}
                            <circle
                              r="2"
                              fill={isSel ? "#f97316" : "#f97316"}
                              opacity={isSel ? 1 : 0.7}
                              className="transition-all duration-300"
                            />

                            {/* Location Floating Label Tag */}
                            <g transform={`translate(0, ${isSel ? -16 : -12})`}>
                              <rect
                                x={-(loc.city.length * 3 + 10)}
                                y="-8"
                                width={loc.city.length * 6 + 20}
                                height="15"
                                rx="4"
                                fill="rgba(9,9,11,0.92)"
                                stroke={isSel ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.06)"}
                                strokeWidth="0.8"
                                className="transition-all duration-300 shadow-2xl"
                              />
                              <text
                                textAnchor="middle"
                                y="2"
                                className={`font-sans text-[8px] font-black uppercase tracking-wider ${isSel ? 'fill-orange-500' : 'fill-white/70'} transition-colors duration-300`}
                              >
                                {loc.city}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* High Tech Status Coordinates Display Overlay at Bottom Left */}
                  <div className="absolute bottom-4 left-4 z-10 bg-black/90 border border-white/5 rounded-2xl px-5 py-3 select-none pointer-events-none md:max-w-xs transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-orange-500 animate-spin duration-15000" />
                      <span className="text-[9px] font-black uppercase text-white tracking-widest font-sans">LIVE SYSTEM TELEMETRY</span>
                    </div>
                    <div className="font-mono text-[8px] text-zinc-500 space-y-1">
                      <p>TARGET_LOC: <span className="text-orange-500 font-bold">{activeLoc.city.toUpperCase()}</span></p>
                      <p>LATITUDE: <span className="text-white">{activeLoc.lat.toFixed(4)}° N</span></p>
                      <p>LONGITUDE: <span className="text-white">{activeLoc.lng.toFixed(4)}° E</span></p>
                      <p>STATUS: <span className="text-emerald-500 tracking-wider font-semibold">ACTIVE_SYNCED</span></p>
                    </div>
                  </div>

                  {/* Creative Legend at Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-4 bg-black/90 border border-white/5 rounded-2xl px-4 py-2 text-[8px] font-mono text-zinc-500 select-none pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>HQ HUB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span>OUTPOSTS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 border-t border-dashed border-orange-500/60" />
                      <span>LIVE NET LINKS</span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Bottom Clocks exactly mimicking image */}
            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-5 gap-2 relative z-10 select-none">
              {locations.map(loc => {
                const isActive = loc.id === activeId;
                return (
                  <button
                    key={`clock-sim-${loc.id}`}
                    onClick={() => setActiveId(loc.id)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl border text-center transition-all duration-300 ${isActive ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'bg-zinc-900/30 border-white/5 text-white/50 hover:bg-zinc-900/80 hover:border-white/10 hover:text-white'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest block font-sans">{loc.city}</span>
                    <span className="text-[9px] font-mono text-zinc-500 block tracking-wider mt-1 font-semibold">
                      {clocks[loc.id] ? clocks[loc.id].substring(0, 5) : '--:--'}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Sidebar detail display panel (highly polished) */}
          <div className="lg:col-span-5 flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLoc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-md shadow-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950 to-zinc-950"
              >
                {/* Visual glow accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                <div>
                  {/* Category Details */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                        {activeLoc.id === 'mumbai' && <Building className="w-5.5 h-5.5" />}
                        {activeLoc.id === 'delhi' && <Sparkles className="w-5.5 h-5.5" />}
                        {activeLoc.id === 'goa' && <Heart className="w-5.5 h-5.5" />}
                        {activeLoc.id === 'uae' && <Globe className="w-5.5 h-5.5" />}
                        {activeLoc.id === 'kenya' && <Compass className="w-5.5 h-5.5" />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-500">{activeLoc.division}</p>
                        <h4 className="text-xl font-bold tracking-tight text-white uppercase font-sans mt-0.5">{activeLoc.city} UNIT</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-mono font-black uppercase text-zinc-500 block tracking-widest">Est. Founded</span>
                      <span className="text-sm font-black text-white italic mt-0.5 block">{activeLoc.founded}</span>
                    </div>
                  </div>

                  {/* Primary text */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">{activeLoc.name}</h3>
                      <p className="text-white/40 text-xs md:text-sm font-medium leading-relaxed mt-3">{activeLoc.description}</p>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 gap-4 bg-zinc-900/30 border border-white/5 p-5 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Address</span>
                          <span className="text-xs text-white/80 leading-relaxed mt-0.5 block font-medium">{activeLoc.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Current Local Time</span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-lg font-mono font-bold text-white tracking-wider leading-none">
                              {clocks[activeLoc.id] ? clocks[activeLoc.id] : '--:--:--'}
                            </span>
                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{activeLoc.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Core Specialty</span>
                          <span className="text-xs text-white/90 font-bold mt-1 block tracking-tight">{activeLoc.specialty}</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Local Projects Portfolio */}
                    <div>
                      <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3 block">Key Division Highlights</h5>
                      <div className="flex flex-wrap gap-2">
                        {activeLoc.projects.map((proj, idx) => (
                          <div 
                            key={idx} 
                            className="px-3.5 py-2 bg-zinc-900/60 border border-white/5 hover:border-orange-500/20 text-white/70 hover:text-white text-[10px] font-bold tracking-wide rounded-full transition-colors flex items-center gap-2 cursor-default"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            {proj}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication buttons */}
                <div className="pt-6 border-t border-white/5 flex gap-4 mt-8">
                  <a 
                    href={`mailto:${activeLoc.email}`}
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-650 active:scale-[0.98] text-black font-black uppercase tracking-[0.25em] text-[10px] rounded-full transition-all flex items-center justify-center gap-2 font-sans font-bold shadow-[0_4px_15px_rgba(249,115,22,0.3)] cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Connect Directly
                  </a>
                  <a 
                    href={`tel:${activeLoc.phone}`}
                    className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-850 active:scale-[0.98] text-white hover:text-orange-500 border border-white/5 hover:border-orange-500/20 font-black uppercase tracking-[0.25em] text-[10px] rounded-full transition-all flex items-center justify-center gap-2 font-sans font-bold cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Office
                  </a>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
