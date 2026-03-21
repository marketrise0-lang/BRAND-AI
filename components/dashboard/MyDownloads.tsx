import React from 'react';
import { Download, Project } from '../../types';

interface MyDownloadsProps {
  downloads: Download[];
  projects: Project[];
}

const MyDownloads: React.FC<MyDownloadsProps> = ({ downloads, projects }) => {
  const getProjectTitle = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title || "Projet Inconnu";
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'PNG': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[8px] font-black uppercase tracking-widest">PNG</span>;
      case 'SVG': return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[8px] font-black uppercase tracking-widest">SVG</span>;
      case 'PDF': return <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[8px] font-black uppercase tracking-widest">PDF</span>;
      default: return <span className="px-2 py-1 bg-white/10 text-white/40 border border-white/20 rounded text-[8px] font-black uppercase tracking-widest">FILE</span>;
    }
  };

  if (downloads.length === 0) {
    return (
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 text-center">
        <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h3 className="text-2xl font-serif italic text-white mb-2">Aucun téléchargement</h3>
        <p className="text-indigo-200/40 text-sm font-medium">Vos assets exportés s'afficheront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map(download => (
        <div key={download.id} className="glass-dark p-6 rounded-3xl border border-white/10 flex items-center justify-between hover:border-indigo-500/30 transition-all shadow-xl group">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-serif italic text-lg">{getProjectTitle(download.projectId)}</h4>
              <div className="flex items-center space-x-3 mt-1">
                {getFileTypeIcon(download.fileType)}
                <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                  {new Date(download.createdAt?.toDate?.() || download.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
              Visualiser
            </button>
            <a 
              href={download.fileUrl || '#'} 
              download 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Télécharger
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyDownloads;
