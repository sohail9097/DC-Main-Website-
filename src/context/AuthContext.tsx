import { createContext, useContext, useEffect, useState, ReactNode, FC } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'sohailgaji9097@gmail.com';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const user = await signInWithGoogle();
      if (user.email !== ADMIN_EMAIL || !user.emailVerified) {
        await logout();
        alert('Access denied. Only the verified administrator can log in.');
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const isAdmin = user?.email === ADMIN_EMAIL && user?.emailVerified;

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
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
