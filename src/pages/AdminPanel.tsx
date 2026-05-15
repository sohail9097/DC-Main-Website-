import { FC } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Users, Layout, Settings, LogOut, Home } from 'lucide-react';

const AdminPanel: FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-white/5 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-3xl font-black italic tracking-tighter text-orange-500">DC</span>
          <span className="text-xl font-bold tracking-widest">ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <Home size={20} />
            <span>View Site</span>
          </Link>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <Layout size={20} />
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <Users size={20} />
            <span>Clients</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Admin Dashboard</h1>
            <p className="text-white/40 mt-1 font-medium tracking-tight">Welcome back, {user.displayName || 'Admin'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user.email}</p>
              <p className="text-xs font-medium text-orange-500 uppercase tracking-widest">Verified Admin</p>
            </div>
            <img src={user.photoURL || ''} className="w-12 h-12 rounded-full border border-white/10" alt="" />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Clients', value: '42', icon: Users, trend: '+12%' },
            { label: 'Active Projects', value: '18', icon: Layout, trend: '+5%' },
            { label: 'Avg Rating', value: '4.9', icon: Settings, trend: 'Stable' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-orange-500/20 transition-colors">
                  <stat.icon size={24} className="text-orange-500" />
                </div>
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{stat.trend}</span>
              </div>
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-4xl font-black italic text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Content Area Placeholder */}
        <div className="bg-zinc-900/50 rounded-[3rem] border border-white/5 p-12 min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
            <Layout size={40} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Content Management</h2>
          <p className="text-white/40 max-w-sm mb-8 font-medium tracking-tight">
            Use this panel to manage your films, clients, and site content. More features coming soon.
          </p>
          <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-full hover:scale-105 transition-all">
            Add New Project
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
