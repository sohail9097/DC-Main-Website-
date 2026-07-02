import { createContext, useContext, useEffect, useState, ReactNode, FC, FormEvent } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Chrome, X, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface AuthContextType {
  user: any;
  isAdmin: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'sohailgaji9097@gmail.com';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'google' | 'passcode'>('google');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);

    // Check if there is a local bypass session
    const localBypass = localStorage.getItem('admin_bypass_user');
    if (localBypass) {
      try {
        setUser(JSON.parse(localBypass));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('admin_bypass_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Only set user if there is no current bypass active
      if (!localStorage.getItem('admin_bypass_user')) {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = () => {
    setShowModal(true);
    setPasscodeError('');
    setGoogleError('');
    setSuccessMsg('');
  };

  const logout = async () => {
    localStorage.removeItem('admin_bypass_user');
    setUser(null);
    await signOut();
  };

  const handleGoogleLogin = async () => {
    setGoogleError('');
    try {
      const gUser = await signInWithGoogle();
      if (gUser.email === ADMIN_EMAIL && gUser.emailVerified) {
        setSuccessMsg('Successfully logged in with Google!');
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg('');
        }, 1200);
      } else {
        await logout();
        setGoogleError(`Access Denied: Only ${ADMIN_EMAIL} can sign in.`);
      }
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      let errMsg = err.message || "Sign in failed";
      
      const isDomainErr = errMsg.includes("auth/unauthorized-domain") || errMsg.includes("unauthorized-client");
      const isPopupErr = errMsg.includes("cross-origin-opener-policy") || errMsg.includes("iframe") || errMsg.includes("cancelled-popup-request") || errMsg.includes("popup-closed-by-user");
      const isNetworkErr = errMsg.includes("network-request-failed") || errMsg.includes("auth/network-request-failed");
      
      if (isDomainErr) {
        errMsg = "Domain not authorized. Please use the Passcode bypass option below!";
      } else if (isPopupErr) {
        errMsg = "Google Sign-In was blocked or cancelled. Because this preview runs in an iframe, standard popups are restricted. Please click 'Open in New Tab' below to sign in, or use the Admin Passcode bypass!";
      } else if (isNetworkErr) {
        errMsg = "Google login blocked by browser iframe boundaries. Please click 'Open in New Tab' below to sign in, or use the Admin Passcode bypass!";
      }
      setGoogleError(errMsg);
    }
  };

  const handlePasscodeLogin = (e: FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    
    const validCodes = ['dc@9097', '9097', 'dreamcatchers', 'dreamcatchers2026', 'sohail9097'];
    const cleanCode = passcode.trim().toLowerCase();

    if (!passcode) {
      setPasscodeError('Please enter the security passcode');
      return;
    }

    if (validCodes.includes(cleanCode)) {
      const bypassUser = {
        uid: 'admin-bypass',
        email: ADMIN_EMAIL,
        displayName: 'Sohail Gaji (Admin)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        emailVerified: true
      };

      localStorage.setItem('admin_bypass_user', JSON.stringify(bypassUser));
      setUser(bypassUser);
      setSuccessMsg('Passcode verified! Studio Admin granted.');
      setPasscode('');
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
      }, 1200);
    } else {
      setPasscodeError('Invalid passcode. Hint: Use DC@9097');
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}

      {/* Aesthetic Cinematic Login Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl z-10"
            >
              {/* Top ambient glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-orange-500/20 bg-orange-500/5 flex items-center justify-center text-orange-500">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-white font-black tracking-tight uppercase text-sm">Verified Studio Login</h3>
                    <p className="text-white/40 text-[10px] font-mono tracking-wider uppercase">Dreamcatchers Crew Auth</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full border border-white/5 hover:border-white/10 hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/50 border border-white/5 rounded-full mb-6 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className={`py-2 px-4 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                    activeTab === 'google'
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Google Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('passcode')}
                  className={`py-2 px-4 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                    activeTab === 'passcode'
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Admin Passcode
                </button>
              </div>

              {/* Form Content */}
              <div className="relative z-10">
                {successMsg ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center animate-bounce">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{successMsg}</p>
                    <p className="text-xs text-white/40 font-mono">Granting secure access credentials...</p>
                  </motion.div>
                ) : activeTab === 'google' ? (
                  <div className="space-y-6 py-2">
                    <p className="text-xs text-white/40 leading-relaxed font-medium">
                      Authenticate with your authorized Google Admin Account (<span className="text-white/80">{ADMIN_EMAIL}</span>) to unlock the live editor dashboard.
                    </p>

                    {isIframe && (
                      <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-2xl flex gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 animate-pulse" />
                        <span className="leading-normal font-medium">
                          Google Login is restricted inside preview iframes. Click <strong>Open in New Tab</strong> below or use <strong>Admin Passcode</strong>.
                        </span>
                      </div>
                    )}

                    {googleError && (
                      <div className="space-y-3">
                        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex gap-3 text-red-500 text-xs">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{googleError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('passcode');
                            setGoogleError('');
                          }}
                          className="w-full text-center py-1.5 px-3 border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 rounded-xl text-[10px] font-bold transition-all font-mono uppercase tracking-wider cursor-pointer"
                        >
                          ⚡ Switch to Admin Passcode Bypass
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-orange-500 text-black hover:text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-full transition-all cursor-pointer shadow-lg outline-none"
                      >
                        <Chrome size={14} />
                        <span>Authenticate with Google</span>
                      </button>

                      {isIframe && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-full transition-all cursor-pointer shadow-lg outline-none text-center"
                        >
                          <span>Open in New Tab</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePasscodeLogin} className="space-y-6 py-2">
                    <p className="text-xs text-white/40 leading-relaxed font-medium">
                      Bypass iframe popup & unauthorized domain blocks on shared preview pages instantly using the safe studio passcode.
                    </p>

                    <div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                          <Key size={14} />
                        </div>
                        <input
                          type="password"
                          placeholder="ENTER SECURE PASSCODE"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-zinc-900 border border-white/5 focus:border-orange-500/50 rounded-full text-white text-xs tracking-widest uppercase font-mono font-bold focus:outline-none transition-all placeholder:text-[10px] placeholder:tracking-wider placeholder:text-white/20"
                        />
                      </div>
                      
                      {/* Hint section */}
                      <p className="mt-2 text-[10px] text-orange-500/80 font-semibold font-mono flex items-center gap-1.5 px-1">
                        <span>💡 Bypass Hint:</span>
                        <code className="bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-orange-400">DC@9097</code>
                      </p>
                    </div>

                    {passcodeError && (
                      <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex gap-3 text-red-500 text-xs">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{passcodeError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-[0.15em] text-[10px] rounded-full transition-all cursor-pointer shadow-lg shadow-orange-500/10 outline-none"
                    >
                      <span>Verify Passcode & Login</span>
                      <ChevronRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

