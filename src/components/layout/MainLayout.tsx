import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  MessageCircle,
  ChevronDown
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function MainLayout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Página Principal', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mis Cursos', path: '/dashboard', icon: BookOpen }, // Por ahora un placeholder
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans selection:bg-cyan-500/30">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            Espacio Virtual
          </span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/30 rounded-xl p-4 flex flex-col items-center text-center border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center mb-2">
              <span className="font-bold text-white">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-bold text-white line-clamp-1">{profile?.username || user?.email}</p>
            <p className="text-xs text-cyan-400 uppercase tracking-wider mt-1">{profile?.role}</p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block text-white text-sm font-medium">
              Espacio Virtual
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-cyan-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
            <button className="text-slate-400 hover:text-cyan-400 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
            
            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 hover:bg-slate-800/50 py-1 px-2 rounded-lg transition-colors"
              >
                <span className="hidden md:block text-sm font-medium text-slate-300">
                  {profile?.username || user?.email?.split('@')[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                   {/* Avatar Placeholder */}
                   <span className="font-bold text-cyan-400 text-sm">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                   </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl shadow-black/50 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                        <p className="text-sm font-bold text-white line-clamp-1">{profile?.username}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          Mi Perfil
                        </Link>
                        <Link 
                          to="#"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Ajustes
                        </Link>
                      </div>
                      <div className="p-2 border-t border-slate-800">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
