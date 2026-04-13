import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleNavClick = (id: string) => {
    if (window.location.pathname !== '/') {
      navigate('/' + id);
      return;
    }
    document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
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
            onClick={() => handleNavClick('#features')}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Solutions
          </button>
          <button 
            onClick={() => handleNavClick('#showcase')}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Showcase
          </button>
          <button 
            onClick={() => handleNavClick('#pricing')}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Tarifs
          </button>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-widest"
            >
              Déconnexion
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
