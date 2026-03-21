import React from 'react';
import { DesignProgress as ProgressType, Project } from '../../types';

interface DesignProgressProps {
  progress: ProgressType[];
  projects: Project[];
}

const DesignProgress: React.FC<DesignProgressProps> = ({ progress, projects }) => {
  const getProjectTitle = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title || "Projet Inconnu";
  };

  if (progress.length === 0) {
    return (
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 text-center">
        <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-serif italic text-white mb-2">Aucune progression</h3>
        <p className="text-indigo-200/40 text-sm font-medium">Lancez une génération pour voir votre progression en temps réel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {progress.map(item => (
        <div key={item.projectId} className="glass-dark p-8 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-xl font-serif italic text-white mb-1">{getProjectTitle(item.projectId)}</h4>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{item.lastAction}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif italic text-white">{item.progressPercent}%</span>
            </div>
          </div>
          
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-400 transition-all duration-1000 ease-out"
              style={{ width: `${item.progressPercent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span>{item.completedSteps} étapes complétées</span>
            <span>{item.totalSteps} étapes au total</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DesignProgress;
