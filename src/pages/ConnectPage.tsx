import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Building,
  ChevronRight,
  Sparkles,
  Paperclip,
  Trash2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, FC, FormEvent } from 'react';
import { uploadFileInChunks } from '../utils/chunkUpload';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Navbar, 
  Footer, 
  InteractiveOptions, 
  DEFAULT_LOCATIONS,
  OperationalLocation,
  transformGoogleDriveUrl
} from '../App';

const StarField: FC<{ count?: number }> = ({ count = 250 }) => {
  const [stars, setStars] = useState<{ id: number; left: string; top: string; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const optimizedCount = Math.min(count, 85);
    const newStars = Array.from({ length: optimizedCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 1.6 + 0.4,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * -10,
    }));
    setStars(newStars);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.15, 0.85, 0.15],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function ConnectPage() {
  const navigate = useNavigate();

  // Contact details state (CONNECT WITH US)
  const [contactTitleFirst, setContactTitleFirst] = useState("Partner with");
  const [contactTitleOrange, setContactTitleOrange] = useState("us.");
  const [contactSubtitle, setContactSubtitle] = useState("Start your cinematic journey today.");
  const [contactEmail, setContactEmail] = useState("hello@dreamcatchers.tv");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
  const [contactImage, setContactImage] = useState("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop");
  
  // Inquiry submission states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryOrgName, setInquiryOrgName] = useState('');
  const [inquiryOrgType, setInquiryOrgType] = useState('brand');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  
  // Brief file attachment states
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [briefUrl, setBriefUrl] = useState('');
  const [briefFilename, setBriefFilename] = useState('');
  const [briefUploadProgress, setBriefUploadProgress] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [briefUploadError, setBriefUploadError] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inquiryFormError, setInquiryFormError] = useState('');

  // Career form states (JOIN US)
  const [joinUsImg, setJoinUsImg] = useState('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateRole, setCandidateRole] = useState('');
  const [candidateMessage, setCandidateMessage] = useState('');
  const [candidateResume, setCandidateResume] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFilename, setResumeFilename] = useState('');
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  // Operational locations state
  const [locations, setLocations] = useState<OperationalLocation[]>(DEFAULT_LOCATIONS);

  const { formType } = useParams<{ formType?: string }>();

  // Active Tab derived from URL parameters (separate pages)
  const activeTab = useMemo<'connect' | 'work' | null>(() => {
    if (formType === 'produce') return 'connect';
    if (formType === 'careers') return 'work';
    return null;
  }, [formType]);

  // Option Cards Customizations
  const [box1Bg, setBox1Bg] = useState("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1170&auto=format&fit=crop");
  const [box1Label, setBox1Label] = useState("SPORTS VERTICAL");
  const [box1Title, setBox1Title] = useState("INTERNATIONAL TOURNAMENT ORGANISING & BROADCAST");
  const [box2Bg, setBox2Bg] = useState("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1102&auto=format&fit=crop");
  const [box2Label, setBox2Label] = useState("DIGITAL VERTICAL");
  const [box2Title, setBox2Title] = useState("SHORT FORM, DIGITAL, AI CONTENT");

  // Load configuration and listen to changes
  const loadConfigs = () => {
    // Contact Section Details
    const titleFirst = localStorage.getItem('contact_title_first');
    setContactTitleFirst(!titleFirst || titleFirst === "Let's" || titleFirst === "Connect with" ? "Partner with" : titleFirst);
    const titleOrange = localStorage.getItem('contact_title_orange');
    setContactTitleOrange(!titleOrange || titleOrange === "Connect." ? "us." : titleOrange);
    setContactSubtitle(localStorage.getItem('contact_subtitle') || "Start your cinematic journey today.");
    let email = localStorage.getItem('contact_email') || "hello@dreamcatchers.tv";
    if (email.toLowerCase().includes('@dreamcatchers.com')) {
      email = email.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv');
      localStorage.setItem('contact_email', email);
    }
    setContactEmail(email);
    setContactPhone(localStorage.getItem('contact_phone') || "+91 98765 43210");
    setContactAddress(localStorage.getItem('contact_address') || "820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");
    setContactImage(localStorage.getItem('contact_image') || "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop");

    // Load Option Cards Configurations
    setBox1Bg(localStorage.getItem('contact_box1_bg') || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1170&auto=format&fit=crop");
    setBox1Label(localStorage.getItem('contact_box1_label') || "SPORTS VERTICAL");
    setBox1Title(localStorage.getItem('contact_box1_title') || "INTERNATIONAL TOURNAMENT ORGANISING & BROADCAST");
    setBox2Bg(localStorage.getItem('contact_box2_bg') || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1102&auto=format&fit=crop");
    setBox2Label(localStorage.getItem('contact_box2_label') || "DIGITAL VERTICAL");
    setBox2Title(localStorage.getItem('contact_box2_title') || "SHORT FORM, DIGITAL, AI CONTENT");

    // Careers section details
    setJoinUsImg(localStorage.getItem('about_join_us_img') || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800');

    // Locations list details
    const storedLocs = localStorage.getItem('dc_locations');
    if (storedLocs) {
      try {
        const parsed = JSON.parse(storedLocs) as OperationalLocation[];
        const merged = parsed.map(loc => {
          const def = DEFAULT_LOCATIONS.find(d => d.id === loc.id);
          if (def) {
            return {
              ...def,
              ...loc,
              path: loc.path || def.path,
              textY: typeof loc.textY !== 'undefined' ? loc.textY : def.textY,
              fontSize: typeof loc.fontSize !== 'undefined' ? loc.fontSize : def.fontSize,
              city: loc.city || def.city,
              cityAlt: loc.cityAlt || def.cityAlt,
              localText: loc.localText || def.localText
            };
          }
          return loc;
        });
        setLocations(merged);
      } catch (e) {
        console.error('Error loading locations list in ConnectPage:', e);
      }
    } else {
      setLocations(DEFAULT_LOCATIONS);
    }
  };

  useEffect(() => {
    loadConfigs();
    window.addEventListener('storage', loadConfigs);
    window.addEventListener('storage_updated_locations', loadConfigs);
    window.addEventListener('storage_updated_verticals', loadConfigs);
    window.addEventListener('storage_updated_contact', loadConfigs);
    window.addEventListener('storage_updated_about', loadConfigs);

    // Initial and hash change checking
    const handleHashCheck = () => {
      const h = window.location.hash;
      if (h === '#careers-form-section' || h === '#careers') {
        navigate('/connect/careers');
      } else if (h === '#contact-form-section' || h === '#contact') {
        navigate('/connect/produce');
      }
    };

    window.addEventListener('hashchange', handleHashCheck);
    handleHashCheck();

    return () => {
      window.removeEventListener('storage', loadConfigs);
      window.removeEventListener('storage_updated_locations', loadConfigs);
      window.removeEventListener('storage_updated_verticals', loadConfigs);
      window.removeEventListener('storage_updated_contact', loadConfigs);
      window.removeEventListener('storage_updated_about', loadConfigs);
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  // Career open roles list
  const openRoles = useMemo(() => [
    { id: 'dop', title: 'Director of Photography', category: 'Cinematography', type: 'Full-time', location: 'Mumbai, India' },
    { id: 'editor', title: 'Senior Film Editor', category: 'Post-Production', type: 'Full-time', location: 'New Delhi, India' },
    { id: 'vfx', title: 'VFX Artist / Technical Director', category: 'Creative Tech', type: 'Contract', location: 'Remote / Hybrid' },
    { id: 'producer', title: 'Creative Producer', category: 'Production', type: 'Full-time', location: 'Bengaluru, India' }
  ], []);

  // Handle Brief File Attachment
  const handleBriefChange = async (file: File) => {
    const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".exe", ".jpg", ".jpeg", ".png", ".worl"];
    const ext = "." + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExts.includes(ext)) {
      setBriefUploadError("Only .pdf, .doc, .docx, .txt, .exe, .jpg, .jpeg, .png, and .worl files are allowed.");
      setBriefUploadProgress('error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB
      setBriefUploadError("File size limit exceeded. Max is 25MB.");
      setBriefUploadProgress('error');
      return;
    }

    setBriefFile(file);
    setBriefUploadProgress('uploading');
    setBriefUploadError('');

    try {
      const data = await uploadFileInChunks(file, 'brief');
      setBriefUrl(data.url);
      setBriefFilename(data.originalname || file.name);
      setBriefUploadProgress('uploaded');
    } catch (err: any) {
      console.error("Brief upload error:", err);
      setBriefUploadError(err.message || "Failed to upload project brief. Please try again.");
      setBriefUploadProgress('error');
    }
  };

  const removeBriefFile = () => {
    setBriefFile(null);
    setBriefUrl('');
    setBriefFilename('');
    setBriefUploadProgress('idle');
    setBriefUploadError('');
  };

  // Handle Inquiry Form Submission
  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInquiryFormError('');

    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryOrgName.trim() || !inquiryOrgType || !inquirySubject.trim() || !inquiryMessage.trim()) {
      setInquiryFormError("All fields are required (Name, Email/Phone, Organization Name, Organization Type, Subject, Message).");
      return;
    }

    if (briefUploadProgress === 'uploading') {
      setInquiryFormError("Please wait for your project brief file to finish uploading before submitting.");
      return;
    }

    setInquiryStatus('submitting');

    try {
      const inquiryId = 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newInquiry = {
        id: inquiryId,
        name: inquiryName.trim(),
        emailOrPhone: inquiryEmail.trim(),
        orgName: inquiryOrgName.trim(),
        orgType: inquiryOrgType,
        briefUrl: briefUrl,
        briefOriginalName: briefFilename,
        subject: inquirySubject.trim(),
        message: inquiryMessage.trim(),
        createdAt: new Date().toISOString()
      };

      // 1. Save directly into Firestore 'project_inquiries'
      await addDoc(collection(db, 'project_inquiries'), {
        ...newInquiry,
        createdAt: serverTimestamp()
      });

      // 2. Notify backend to trigger email transmission
      const emailRes = await fetch('/api/notify-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInquiry)
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.json().catch(() => ({}));
        throw new Error(emailErr.error || "Failed to dispatch email notification.");
      }

      const emailSuccess = await emailRes.json();
      console.log("Inquiry Email status:", emailSuccess);

      // Save to localStorage so Admin panel has immediate local copy
      const existingInquiriesStr = localStorage.getItem('dc_inquiries') || '[]';
      let inquiries = [];
      try {
        inquiries = JSON.parse(existingInquiriesStr);
        if (!Array.isArray(inquiries)) inquiries = [];
      } catch (error) {
        inquiries = [];
      }

      inquiries.unshift(newInquiry);
      localStorage.setItem('dc_inquiries', JSON.stringify(inquiries));
      
      window.dispatchEvent(new Event('storage_updated_inquiries'));
      
      setInquiryStatus('success');
      
      setInquiryName('');
      setInquiryEmail('');
      setInquiryOrgName('');
      setInquiryOrgType('brand');
      setInquirySubject('');
      setInquiryMessage('');
      removeBriefFile();
    } catch (err: any) {
      console.error("Failed to submit inquiry:", err);
      setInquiryFormError(err.message || "An unexpected error occurred. Please try again.");
      setInquiryStatus('error');
    }
  };

  // Handle Drag & Drop / Selection for Resume
  const handleResumeChange = async (file: File) => {
    const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
    const ext = "." + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExts.includes(ext)) {
      setUploadError("Only PDF, Word (DOC/DOCX), Text (TXT/RTF), and Image files are allowed.");
      setUploadProgress('error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB
      setUploadError("File size limit exceeded. Max is 15MB.");
      setUploadProgress('error');
      return;
    }

    setCandidateResume(file);
    setUploadProgress('uploading');
    setUploadError('');

    try {
      const data = await uploadFileInChunks(file, 'resume');
      setResumeUrl(data.url);
      setResumeFilename(data.originalname || file.name);
      setUploadProgress('uploaded');
    } catch (err: any) {
      console.error("Resume upload error:", err);
      setUploadError(err.message || "Failed to upload resume. Please try again.");
      setUploadProgress('error');
    }
  };

  const removeResumeFile = () => {
    setCandidateResume(null);
    setResumeUrl('');
    setResumeFilename('');
    setUploadProgress('idle');
    setUploadError('');
  };

  // Handle Job Application Form Submission
  const handleApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!candidateName.trim() || !candidateEmail.trim() || !candidateRole) {
      setFormError('Please fill in all required fields (Name, Email, Role).');
      return;
    }

    if (uploadProgress === 'uploading') {
      setFormError('Please wait for the resume file to finish uploading.');
      return;
    }

    setFormStatus('submitting');

    try {
      const applicationData = {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        role: candidateRole,
        message: candidateMessage,
        resumeUrl: resumeUrl,
        createdAt: new Date().toISOString()
      };

      // 1. Save directly into Firestore 'job_applications'
      await addDoc(collection(db, 'job_applications'), {
        ...applicationData,
        createdAt: serverTimestamp()
      });

      // 2. Notify backend to trigger email transmission
      const emailRes = await fetch('/api/notify-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.json().catch(() => ({}));
        throw new Error(emailErr.error || "Failed to dispatch email notification.");
      }

      const emailSuccess = await emailRes.json();
      console.log("Email status:", emailSuccess);
      
      // Reset form on success
      setFormStatus('success');
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
      setCandidateRole('');
      setCandidateMessage('');
      setCandidateResume(null);
      setResumeUrl('');
      setResumeFilename('');
      setUploadProgress('idle');
    } catch (err: any) {
      console.error("Failed to submit job application:", err);
      setFormError(err.message || "An unexpected error occurred. Please try again.");
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-x-hidden font-redhat">
      {/* Cinematic Star Field */}
      <div className="absolute inset-0 z-0">
        <StarField count={130} />
      </div>

      <Navbar />

      {/* Floating Ambient Atmosphere lights */}
      <div className="absolute top-[10%] left-[-20%] w-[60%] h-[60%] bg-blue-900/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] bg-orange-950/10 blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 flex-grow pt-24 md:pt-32">
        {/* Main Heading & Navigation Tabs */}
        {activeTab === null ? (
          <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-10 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                LET'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">CONNECT</span>
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto font-sans leading-relaxed">
                Whether you want to initiate a landmark production, explore creative partnerships, or join our world-class team, choose your path below.
              </p>
            </motion.div>

            {/* Tab Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-10 md:mt-12 px-4">
              {/* Box 1: Connect With Us */}
              <motion.button
                type="button"
                onClick={() => {
                  navigate('/connect/produce');
                }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 sm:p-8 md:p-10 rounded-[1.75rem] sm:rounded-[2.2rem] border text-left flex items-start gap-4 sm:gap-6 transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'connect'
                    ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.18)]'
                    : 'bg-zinc-950/40 border-white/5 hover:border-orange-500/30'
                }`}
              >
                {activeTab === 'connect' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                )}
                <div className={`p-5 rounded-2xl flex-shrink-0 transition-colors ${
                  activeTab === 'connect' ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400'
                }`}>
                  <Mail className="w-7 h-7" />
                </div>
                <div className="flex-grow min-w-0 font-redhat">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight font-redhat">
                    Partner With Us
                  </h3>
                  <span className="text-sm md:text-base font-bold text-orange-500 mt-1.5 block font-redhat">
                    Let's build something worth watching.
                  </span>
                  <p className="text-[13px] text-zinc-400 mt-2 font-redhat leading-relaxed italic">
                    Have a brief, a brand, an idea, or an ambitious project? We'd love to hear from you.
                  </p>
                </div>
              </motion.button>

              {/* Box 2: Work With Us */}
              <motion.button
                type="button"
                onClick={() => {
                  navigate('/connect/careers');
                }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 sm:p-8 md:p-10 rounded-[1.75rem] sm:rounded-[2.2rem] border text-left flex items-start gap-4 sm:gap-6 transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'work'
                    ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.18)]'
                    : 'bg-zinc-950/40 border-white/5 hover:border-orange-500/30'
                }`}
              >
                {activeTab === 'work' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                )}
                <div className={`p-5 rounded-2xl flex-shrink-0 transition-colors ${
                  activeTab === 'work' ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400'
                }`}>
                  <Briefcase className="w-7 h-7" />
                </div>
                <div className="flex-grow min-w-0 font-redhat">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight font-redhat">
                    Work With Us
                  </h3>
                  <span className="text-sm md:text-base font-bold text-orange-500 mt-1.5 block font-redhat">
                    Bring your craft. Leave your mark.
                  </span>
                  <p className="text-[13px] text-zinc-400 mt-2 font-redhat leading-relaxed italic">
                    Explore careers, freelance opportunities and creative collaborations.
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
            <motion.button
              type="button"
              onClick={() => navigate('/connect')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-zinc-850 bg-zinc-950/80 hover:border-orange-500 hover:text-orange-500 text-zinc-300 text-xs transition-all font-black uppercase tracking-wider group shadow-lg"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Connect Options</span>
            </motion.button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'connect' && (
            <motion.div
              key="connect-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {/* SECTION 1: CONNECT WITH US (Contact Inquiry Form + details) */}
              <section id="contact-form-section" className="py-12 md:py-20 border-t border-white/5 relative bg-zinc-950/20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Left Side: Contact Details & Image */}
              <div className="lg:col-span-5 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="text-orange-500 font-redhat text-xs uppercase tracking-widest block mb-2 font-bold">Contact Info</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    {contactTitleFirst} <span className="text-orange-500">{contactTitleOrange}</span>
                  </h2>
                </motion.div>

                {/* Contact Card Details Grid with Staggered Scroll Animation */}
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.2 }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.15
                      }
                    }
                  }}
                  className="grid grid-cols-2 gap-3 sm:gap-6"
                >
                  {/* Card 1: Email */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 40, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    whileHover={{ y: -6, borderColor: 'rgba(249,115,22,0.5)', boxShadow: '0 10px 30px -10px rgba(249,115,22,0.15)' }}
                    className="p-3.5 sm:p-5 bg-zinc-950/60 border border-orange-500/20 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-start transition-all duration-300 w-full overflow-hidden"
                  >
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-4 sm:mb-6 flex-shrink-0" />
                    <div className="text-left w-full overflow-hidden">
                      <p className="text-[8px] sm:text-[10px] font-redhat uppercase tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 font-bold mb-1">Email Us</p>
                      <a 
                        href={`mailto:${contactEmail}`} 
                        title={contactEmail}
                        className="text-[10px] xs:text-xs sm:text-xs md:text-sm lg:text-xs xl:text-sm min-[1300px]:text-base font-bold text-white hover:text-orange-400 transition-colors font-sans block truncate leading-tight w-full"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </motion.div>

                  {/* Card 2: Phone */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 40, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    whileHover={{ y: -6, borderColor: 'rgba(249,115,22,0.5)', boxShadow: '0 10px 30px -10px rgba(249,115,22,0.15)' }}
                    className="p-3.5 sm:p-5 bg-zinc-950/60 border border-orange-500/20 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-start transition-all duration-300 w-full overflow-hidden"
                  >
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-4 sm:mb-6 flex-shrink-0" />
                    <div className="text-left w-full overflow-hidden">
                      <p className="text-[8px] sm:text-[10px] font-redhat uppercase tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 font-bold mb-1">Call Us</p>
                      <a 
                        href={`tel:${contactPhone}`} 
                        title={contactPhone}
                        className="text-[10px] xs:text-xs sm:text-xs md:text-sm lg:text-xs xl:text-sm min-[1300px]:text-base font-bold text-white hover:text-orange-400 transition-colors font-sans block truncate leading-tight w-full"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Frameless Contact Custom Image */}
                {contactImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="w-full flex justify-center items-center pt-2 sm:pt-4"
                  >
                    <img 
                      src={transformGoogleDriveUrl(contactImage)} 
                      alt="Creative Studio Visual" 
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[160px] sm:max-h-[350px] object-contain rounded-none opacity-100 transition-all duration-300"
                    />
                  </motion.div>
                )}
              </div>

              {/* Right Side: Inquiry Form */}
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-black/40 border border-white/5 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <h3 className="text-xl font-bold uppercase tracking-wide text-white">Project Inquiry / Brief</h3>
                  </div>

                  {inquiryStatus === 'success' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 px-4 flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-6 text-orange-500">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                        Inquiry Submitted!
                      </h3>
                      <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Thank you for reaching out. Your inquiry and brief have been successfully received and emailed to our team.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInquiryStatus('idle')}
                        className="px-6 py-2.5 bg-orange-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors hover:bg-orange-600"
                      >
                        Submit another inquiry
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-5 text-left font-sans">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Your Name *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Enter your name"
                              value={inquiryName}
                              onChange={(e) => setInquiryName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Email/Number */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Your Email / Number *</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Enter email or contact number"
                              value={inquiryEmail}
                              onChange={(e) => setInquiryEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Org Name */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Name of Organisation *</label>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Enter organisation name"
                              value={inquiryOrgName}
                              onChange={(e) => setInquiryOrgName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Org Type */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Organisation Type *</label>
                          <div className="relative">
                            <select
                              required
                              value={inquiryOrgType}
                              onChange={(e) => setInquiryOrgType(e.target.value)}
                              className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 appearance-none text-white font-medium"
                            >
                              <option value="brand" className="bg-zinc-950 text-white">Brand</option>
                              <option value="agency" className="bg-zinc-950 text-white">Agency</option>
                              <option value="individual" className="bg-zinc-950 text-white">Individual Artist</option>
                              <option value="government" className="bg-zinc-950 text-white">Government / NGO</option>
                              <option value="other" className="bg-zinc-950 text-white">Other</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none rotate-90" />
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Subject *</label>
                        <input
                          type="text"
                          required
                          placeholder="Project inquiry subject"
                          value={inquirySubject}
                          onChange={(e) => setInquirySubject(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Message *</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Tell us about your project, target audience, timeline, or scope..."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 resize-none"
                        />
                      </div>

                      {/* Brief File Upload */}
                      <div>
                        <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
                          Project Brief (Optional - .pdf, .word, .txt, .exe, .jpg, up to 25MB)
                        </label>
                        <div className="border border-dashed border-white/10 rounded-xl p-4 bg-zinc-900/10 hover:border-orange-500/50 transition-colors relative flex flex-col items-center justify-center text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBriefChange(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <UploadCloud size={24} className="text-zinc-500 mb-1.5" />
                          <p className="text-xs font-bold text-zinc-300">
                            {briefUploadProgress === 'uploading' ? 'Uploading...' : 'Drag & drop or click to upload file'}
                          </p>
                        </div>

                        {briefUploadError && (
                          <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5">
                            <AlertCircle size={14} />
                            {briefUploadError}
                          </p>
                        )}

                        {briefUploadProgress === 'uploaded' && briefFilename && (
                          <div className="mt-3 flex items-center justify-between p-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <span className="text-xs text-green-400 font-bold font-redhat flex items-center gap-1.5">
                              <Paperclip size={14} />
                              {briefFilename} (Uploaded)
                            </span>
                            <button
                              type="button"
                              onClick={removeBriefFile}
                              className="text-red-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {inquiryFormError && (
                        <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          {inquiryFormError}
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={inquiryStatus === 'submitting' || briefUploadProgress === 'uploading'}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-extrabold uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.25)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {inquiryStatus === 'submitting' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Sending Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Inquiry</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              </div>

            </div>
          </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'work' && (
            <motion.div
              key="work-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {/* SECTION 2: CAREERS / JOIN US */}
              <section id="careers-form-section" className="py-12 md:py-20 border-t border-white/5 bg-black relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* Left Side: Copy & Careers image */}
              <div className="lg:col-span-5 flex flex-col justify-start gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="text-left"
                >
                  <span className="text-orange-500 font-redhat text-xs uppercase tracking-widest block mb-2 font-bold">Careers</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    Work with <span className="text-orange-500">us</span>
                  </h2>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                    We are always seeking obsessed creators, technical wizards, and poetic dreamers. If you thrive at the intersection of cinematic craft and digital-first storytelling, find your spot here.
                  </p>
                </motion.div>

                {joinUsImg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="relative w-full pt-2 sm:pt-4 flex justify-center items-center"
                  >
                    <img 
                      src={transformGoogleDriveUrl(joinUsImg, 'image')} 
                      alt="Join Dreamcatchers" 
                      className="w-full h-auto max-h-[220px] sm:max-h-[480px] object-contain rounded-2xl border border-white/5"
                    />
                  </motion.div>
                )}
              </div>

              {/* Right Side: Job application form */}
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-black/40 border border-white/5 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <Sparkles size={18} className="text-orange-500 animate-pulse" />
                    <h3 className="text-xl font-bold uppercase tracking-wide text-white">Apply for a Position</h3>
                  </div>

                  {formStatus === 'success' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 px-4 flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-6 text-orange-500">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                        Application Submitted!
                      </h3>
                      <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Thank you for applying. Your application has been successfully received and saved to the database.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormStatus('idle')}
                        className="px-6 py-2.5 bg-orange-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors hover:bg-orange-600"
                      >
                        Submit another application
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-5 text-left font-sans">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="text"
                              required
                              placeholder="Your Name"
                              value={candidateName}
                              onChange={(e) => setCandidateName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="email"
                              required
                              placeholder="yourname@gmail.com"
                              value={candidateEmail}
                              onChange={(e) => setCandidateEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                              type="tel"
                              placeholder="Enter your number"
                              value={candidatePhone}
                              onChange={(e) => setCandidatePhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Position */}
                        <div>
                          <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Position Applied For *</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <select
                              required
                              value={candidateRole}
                              onChange={(e) => setCandidateRole(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 appearance-none text-white font-medium"
                            >
                              <option value="" className="bg-zinc-950 text-zinc-400">Select a Role...</option>
                              {openRoles.map((role) => (
                                <option key={role.id} value={role.title} className="bg-zinc-950 text-white">
                                  {role.title}
                                </option>
                              ))}
                              <option value="General / Other" className="bg-zinc-950 text-white">General Application / Other</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none rotate-90" />
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Message / Cover Letter</label>
                        <textarea
                          rows={4}
                          placeholder="Tell us about yourself, your reels, and why you want to join our Dream Team..."
                          value={candidateMessage}
                          onChange={(e) => setCandidateMessage(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 resize-none"
                        />
                      </div>

                      {/* Resume Upload */}
                      <div>
                        <label className="block text-[11px] font-redhat uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
                          Resume Upload (PDF, WORD, TEXT, IMAGE up to 15MB)
                        </label>
                        <div className="border border-dashed border-white/10 rounded-xl p-4 bg-zinc-900/10 hover:border-orange-500/50 transition-colors relative flex flex-col items-center justify-center text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleResumeChange(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <UploadCloud size={24} className="text-zinc-500 mb-1.5" />
                          <p className="text-xs font-bold text-zinc-300">
                            {uploadProgress === 'uploading' ? 'Uploading...' : 'Drag & drop your resume file here, or browse'}
                          </p>
                        </div>

                        {uploadError && (
                          <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5">
                            <AlertCircle size={14} />
                            {uploadError}
                          </p>
                        )}

                        {uploadProgress === 'uploaded' && resumeFilename && (
                          <div className="mt-3 flex items-center justify-between p-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <span className="text-xs text-green-400 font-bold font-redhat flex items-center gap-1.5">
                              <Paperclip size={14} />
                              {resumeFilename} (Ready)
                            </span>
                            <button
                              type="button"
                              onClick={removeResumeFile}
                              className="text-red-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {formError && (
                        <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          {formError}
                        </p>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={formStatus === 'submitting' || uploadProgress === 'uploading'}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-extrabold uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.25)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {formStatus === 'submitting' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Sending application...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Application</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              </div>

            </div>
          </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === null && (
          <>
            {/* SECTION 3: SEAMLESS LOCATIONS / OFFICES */}
            <section id="locations-section" className="py-12 md:py-24 border-t border-white/5 bg-zinc-950/40 relative">
          <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12">
            <div className="text-left mb-10">
              <h2 className="text-4xl md:text-6xl font-black text-orange-500 uppercase tracking-tighter mb-1.5 leading-none">
                OFFICES
              </h2>
              <span className="text-zinc-500 font-redhat text-xs uppercase tracking-[0.25em] block font-bold">Our Locations</span>
            </div>

            <div className="grid grid-cols-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 xs:gap-2.5 sm:gap-6 w-full">
              {locations.map((loc, idx) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: idx % 2 === 0 ? 30 : -30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring",
                    stiffness: 50,
                    damping: 15,
                    delay: idx * 0.08 
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => window.open(loc.mapsUrl, '_blank')}
                  className={`group relative p-1.5 xs:p-2.5 sm:p-4 bg-zinc-950/40 border border-zinc-800 rounded-[1rem] sm:rounded-[1.8rem] hover:border-orange-500/40 hover:bg-black/80 transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[140px] xs:min-h-[160px] sm:min-h-[220px] md:min-h-[280px] shadow-lg md:w-auto md:flex-shrink ${
                    idx < 3 ? 'col-span-2' : 'col-span-3'
                  } md:col-span-1`}
                >
                  {/* Top Map Graphic Outline */}
                  <div className="h-[75px] xs:h-[100px] sm:h-[140px] md:h-[180px] w-full bg-zinc-950/90 rounded-[0.8rem] sm:rounded-[1.4rem] flex items-center justify-center relative overflow-hidden transition-all duration-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.02)_0%,transparent_100%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18)_0%,transparent_100%)] transition-all duration-500 pointer-events-none" />

                    {loc.mapImage ? (
                      <motion.img 
                        src={loc.mapImage} 
                        alt={loc.cityAlt}
                        animate={{
                          y: [2, -6, 2],
                          rotate: [-0.5, 0.5, -0.5]
                        }}
                        transition={{
                          duration: 4.5 + idx * 0.4,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 w-full h-full object-contain p-1.5 xs:p-2 md:p-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.75)] group-hover:scale-110 group-hover:rotate-[-2deg] transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <motion.svg 
                        viewBox="-20 -10 160 150" 
                        animate={{
                          y: [2, -4, 2],
                        }}
                        transition={{
                          duration: 5 + idx * 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                        className="w-[70px] h-[70px] xs:w-[90px] xs:h-[90px] sm:w-[120px] sm:h-[120px] md:w-[155px] md:h-[155px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(249,115,22,0.75)] relative z-10 select-none pointer-events-none group-hover:scale-[1.08] group-hover:rotate-[-2deg] transition-all duration-500"
                      >
                        <g transform="translate(10, 0)">
                          {/* Layer 5: Deepest wireframe trail (stroke only) */}
                          <g className="transition-transform duration-500 ease-out translate-x-[-10px] translate-y-[10px] group-hover:translate-x-[-15px] group-hover:translate-y-[15px]">
                            <motion.path 
                              d={loc.path} 
                              fill="none" 
                              stroke="rgba(255,255,255,0.06)" 
                              strokeWidth="0.8" 
                              strokeDasharray="20 15"
                              animate={{ strokeDashoffset: [0, 35] }}
                              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            />
                          </g>
                          {/* Layer 4: Deep wireframe trail */}
                          <g className="transition-transform duration-500 ease-out translate-x-[-8px] translate-y-[8px] group-hover:translate-x-[-12px] group-hover:translate-y-[12px]">
                            <motion.path 
                              d={loc.path} 
                              fill="none" 
                              stroke="rgba(255,255,255,0.1)" 
                              strokeWidth="0.8" 
                              strokeDasharray="15 15"
                              animate={{ strokeDashoffset: [0, -30] }}
                              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            />
                          </g>
                          {/* Layer 3: Medium wireframe trail */}
                          <g className="transition-transform duration-500 ease-out translate-x-[-6px] translate-y-[6px] group-hover:translate-x-[-9px] group-hover:translate-y-[9px]">
                            <motion.path 
                              d={loc.path} 
                              fill="none" 
                              stroke="rgba(255,255,255,0.18)" 
                              strokeWidth="0.8" 
                              strokeDasharray="12 10"
                              animate={{ strokeDashoffset: [0, 22] }}
                              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            />
                          </g>
                          {/* Layer 2: Shallow wireframe trail */}
                          <g className="transition-transform duration-500 ease-out translate-x-[-4px] translate-y-[4px] group-hover:translate-x-[-6px] group-hover:translate-y-[6px]">
                            <motion.path 
                              d={loc.path} 
                              fill="none" 
                              stroke="rgba(255,255,255,0.28)" 
                              strokeWidth="0.8" 
                              strokeDasharray="10 12"
                              animate={{ strokeDashoffset: [0, -22] }}
                              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                            />
                          </g>
                          {/* Layer 1: Closest wireframe trail */}
                          <g className="transition-transform duration-500 ease-out translate-x-[-2px] translate-y-[2px] group-hover:translate-x-[-3px] group-hover:translate-y-[3px]">
                            <motion.path 
                              d={loc.path} 
                              fill="none" 
                              stroke="rgba(255,255,255,0.45)" 
                              strokeWidth="0.8" 
                              strokeDasharray="8 8"
                              animate={{ strokeDashoffset: [0, 16] }}
                              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            />
                          </g>
                          {/* Layer 0: Main Solid Orange Map Layer */}
                          <g className="transition-transform duration-500 ease-out translate-x-0 translate-y-0 group-hover:translate-x-[1px] group-hover:translate-y-[-1px]">
                            <path 
                              d={loc.path} 
                              fill="#f97316" 
                              stroke="#000000" 
                              strokeWidth="1.2" 
                              className="group-hover:fill-[#ff7c17] transition-colors duration-300" 
                            />
                            <text 
                              x="60" 
                              y={loc.textY || 58} 
                              textAnchor="middle" 
                              fill="#000000" 
                              fontSize={loc.fontSize || 10} 
                              fontWeight="900" 
                              className="font-sans font-extrabold tracking-tight select-none pointer-events-none uppercase transition-all duration-300"
                            >
                              {loc.city.includes("DUBAI") ? "DUBAI" : loc.city.includes("KENYA") ? "NAIROBI" : loc.city}
                            </text>
                          </g>
                        </g>
                      </motion.svg>
                    )}
                  </div>

                  {/* Info and Address */}
                  <div className="pt-2 pb-0.5 text-left">
                    <div className="flex items-center justify-between gap-0.5 sm:gap-1">
                      <span className="text-white text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wide group-hover:text-orange-500 transition-colors duration-300 truncate">
                        {loc.cityAlt}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5 md:w-4 md:h-4 text-white/50 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

            <div className="py-8 bg-black">
              <InteractiveOptions />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
