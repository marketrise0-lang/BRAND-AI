
import React from 'react';
import { auth } from '../src/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 py-6 px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center glass rounded-3xl px-8 py-4 shadow-sm border-white/50">
        <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-all duration-300">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              BrandGenius <span className="text-indigo-600">AI</span>
            </h1>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">Master Design Lab</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => {
              if (window.location.pathname === '/') {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/');
                setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Solutions
          </button>
          <button 
            onClick={() => {
              if (window.location.pathname === '/') {
                document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/');
                setTimeout(() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Showcase
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
              >
                Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-indigo-100"
            >
              Commencer
            </button>
          )}
        </nav>

        <button className="md:hidden w-10 h-10 flex flex-col items-center justify-center space-y-1">
          <span className="w-6 h-0.5 bg-slate-900"></span>
          <span className="w-6 h-0.5 bg-slate-900"></span>
          <span className="w-4 h-0.5 bg-slate-900 ml-auto"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
