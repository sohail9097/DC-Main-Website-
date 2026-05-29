import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { useState, FC, useEffect } from 'react';
import { Navbar } from '../App';

const StarField: FC<{ count?: number }> = ({ count = 250 }) => {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.3,
      duration: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    }));
    setStars(newStars);
  }, [count]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          animate={{
            opacity: [0, 1, 0.3, 1, 0],
            scale: [0.8, 1.2, 0.9, 1.1, 0.8],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: 'white',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
};

const ContactPage = () => {
  const [titleFirst, setTitleFirst] = useState("Let's");
  const [titleOrange, setTitleOrange] = useState("Connect.");
  const [subtitle, setSubtitle] = useState("Start your cinematic journey today.");
  const [email, setEmail] = useState("hello@dreamcatchers.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Lower Parel, Mumbai, India");

  const loadContactConfigs = () => {
    setTitleFirst(localStorage.getItem('contact_title_first') || "Let's");
    setTitleOrange(localStorage.getItem('contact_title_orange') || "Connect.");
    setSubtitle(localStorage.getItem('contact_subtitle') || "Start your cinematic journey today.");
    setEmail(localStorage.getItem('contact_email') || "hello@dreamcatchers.com");
    setPhone(localStorage.getItem('contact_phone') || "+91 98765 43210");
    setAddress(localStorage.getItem('contact_address') || "Lower Parel, Mumbai, India");
  };

  useEffect(() => {
    loadContactConfigs();
    window.addEventListener('storage_updated_contact', loadContactConfigs);
    window.addEventListener('storage', loadContactConfigs);
    return () => {
      window.removeEventListener('storage_updated_contact', loadContactConfigs);
      window.removeEventListener('storage', loadContactConfigs);
    };
  }, []);

  const contactInfo = [
    { icon: <Mail className="w-5 h-5" />, label: 'Email Us', value: email },
    { icon: <Phone className="w-5 h-5" />, label: 'Call Us', value: phone },
    { icon: <MapPin className="w-5 h-5" />, label: 'Visit Us', value: address },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 relative">
      <StarField count={200} />
      <Navbar />

      <main className="relative z-10 pt-40 px-6 pb-32">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-32"
          >
            <h1 className="text-7xl md:text-[12rem] font-black italic tracking-tighter uppercase leading-[0.8] mb-12">
              {titleFirst} <span className="text-orange-500">{titleOrange}</span>
            </h1>
            <p className="text-white/40 text-[10px] md:text-sm font-black uppercase tracking-[0.5em]">{subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Info Cards */}
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-12">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactInfo.map((info, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:bg-orange-500 transition-all duration-500 cursor-pointer"
                  >
                    <div className="text-orange-500 group-hover:text-black mb-6 transition-colors">
                      {info.icon}
                    </div>
                    <p className="text-white/30 group-hover:text-black/60 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
                      {info.label}
                    </p>
                    <p className="text-xl font-black text-white group-hover:text-black tracking-tight transition-colors">
                      {info.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="bg-white/5 rounded-[3.5rem] p-8 md:p-16 border border-white/5 backdrop-blur-3xl"
            >
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Your Name</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500 transition-colors text-white" placeholder="Arjun Sharma" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Your Email</label>
                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500 transition-colors text-white" placeholder="arjun@example.com" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Subject</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500 transition-colors text-white" placeholder="Project Inquiry" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Message</label>
                  <textarea rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500 transition-colors text-white" placeholder="Tell us about your dream..."></textarea>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#f97316", color: "#000" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-6 rounded-2xl bg-white/10 text-white font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-16 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 md:px-24 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <span className="text-4xl md:text-6xl font-black italic tracking-tighter text-orange-500 leading-none">DC</span>
            <span className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic">Dreamcatchers</span>
          </div>
          <div className="flex gap-8 md:gap-10">
              {[
                { name: 'Instagram', icon: <Instagram size={18} />, color: 'hover:text-[#E4405F]' },
                { name: 'Facebook', icon: <Facebook size={18} />, color: 'hover:text-[#1877F2]' },
                { name: 'Youtube', icon: <Youtube size={18} />, color: 'hover:text-[#FF0000]' },
                { name: 'Twitter', icon: <Twitter size={18} />, color: 'hover:text-[#1DA1F2]' }
              ].map(social => (
                <a key={social.name} href="#" className={`text-white/40 transition-all duration-300 hover:scale-125 ${social.color}`} title={social.name}>
                  {social.icon}
                </a>
              ))}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
