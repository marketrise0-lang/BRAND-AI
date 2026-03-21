import React from 'react';
import { Activity, Project } from '../../types';

interface ActivityHistoryProps {
  activities: Activity[];
  projects: Project[];
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ activities, projects }) => {
  const getProjectTitle = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title || "Projet Inconnu";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'logo_generation':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'export':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
      case 'edit':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
      case 'download':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'logo_generation': return 'Génération de logo';
      case 'export': return 'Exportation de design';
      case 'edit': return 'Modification de design';
      case 'download': return 'Téléchargement d\'asset';
      default: return 'Activité inconnue';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 text-center">
        <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-serif italic text-white mb-2">Aucune activité</h3>
        <p className="text-indigo-200/40 text-sm font-medium">Votre historique d'activité s'affichera ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="glass-dark p-6 rounded-3xl border border-white/10 flex items-center space-x-6 hover:border-indigo-500/30 transition-all shadow-xl">
          <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white font-serif italic text-lg">{getActivityLabel(activity.type)}</h4>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{getProjectTitle(activity.projectId)}</p>
              </div>
              <div className="text-right">
                <span className="text-white/20 text-[10px] font-black uppercase tracking-widest block">
                  {new Date(activity.createdAt?.toDate?.() || activity.createdAt).toLocaleDateString()}
                </span>
                <span className="text-white/10 text-[10px] font-black uppercase tracking-widest block">
                  {new Date(activity.createdAt?.toDate?.() || activity.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityHistory;
