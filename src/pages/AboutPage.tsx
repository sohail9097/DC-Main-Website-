import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronRight, Camera, Users, Target, Rocket, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, useEffect, FC } from 'react';
import { Navbar } from '../App';

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

const AboutPage = () => {
  const { scrollY } = useScroll();
  const heroImgOpacity = useTransform(scrollY, [0, 800], [1, 0.1]);
  const starOpacity = useTransform(scrollY, [100, 700], [0.3, 1]);
  const textY = useTransform(scrollY, [0, 500], [0, 150]);

  const stats = [
    { label: 'YEARS ON SET', value: '14+', icon: <Camera className="w-5 h-5" /> },
    { label: 'FILMS BORN', value: '500+', icon: <Rocket className="w-5 h-5" /> },
    { label: 'CREATIVE MINDS', value: '30+', icon: <Users className="w-5 h-5" /> },
    { label: 'GLOBAL BRANDS', value: '100+', icon: <Target className="w-5 h-5" /> },
  ];

  const team = [
    { name: 'ARJUN SHARMA', role: 'FOUNDER / DIRECTOR', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { name: 'RIYA KAPOOR', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
    { name: 'VIKRAM SINGH', role: 'HEAD OF POST-PRODUCTION', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
    { name: 'SARA KHAN', role: 'CREATIVE DIRECTOR', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' },
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
            src="https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072" 
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
                <span className="text-white">Dream</span>
                <span className="text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.4)]">Catchers</span>
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
                className="text-white/40 max-w-3xl mx-auto mt-12 text-sm md:text-xl font-medium tracking-[0.2em] uppercase leading-relaxed px-4"
              >
                Engineers of visual euphoria. Architects of cinematic truth.
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
                  <span className="text-xs font-black text-orange-500 uppercase tracking-[0.5em]">The Genesis</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black italic text-white tracking-tighter leading-none uppercase">
                  Where Magic <br /> Finds Its Form.
                </h2>
                <div className="space-y-8 text-white/60 text-lg md:text-2xl font-medium leading-relaxed tracking-tight border-l-2 border-orange-500/20 pl-8 md:pl-12">
                  <p>
                    Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.
                  </p>
                  <p>
                    From our humble beginnings producing daily chat shows, we&apos;ve evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {team.map((member, idx) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="group relative cursor-pointer"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-[3rem] border border-white/10">
                    <img 
                      src={member.img} 
                      alt={member.name} 
                      className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                  </div>
                  <div className="absolute inset-x-0 bottom-10 px-10">
                    <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-1">
                      {member.name}
                    </h4>
                    <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.3em]">
                      {member.role}
                    </p>
                  </div>
                </motion.div>
              ))}
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
                whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                transition={{ duration: 0.4 }}
                className="px-16 py-8 rounded-full border-2 border-white/10 text-white font-black uppercase tracking-[0.3em] text-xs md:text-sm hover:border-transparent transition-all"
              >
                Contact Our Studio
              </motion.button>
           </div>
        </section>
      </main>

      <footer className="relative z-10 py-16 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
              <span className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic">Dreamcatchers</span>
            </div>
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
            <p className="text-white/10 text-[10px] font-bold uppercase tracking-widest">© 2026 Dreamcatchers Production.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
