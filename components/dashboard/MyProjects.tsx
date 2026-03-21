import React from 'react';
import { Project } from '../../types';

interface MyProjectsProps {
  projects: Project[];
  isLoading: boolean;
  onSelect?: (project: Project) => void;
}

const MyProjects: React.FC<MyProjectsProps> = ({ projects, isLoading, onSelect }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-dark p-6 rounded-3xl border border-white/10 animate-pulse">
            <div className="w-full h-40 bg-white/5 rounded-2xl mb-4"></div>
            <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 text-center">
        <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-2xl font-serif italic text-white mb-2">Aucun projet</h3>
        <p className="text-indigo-200/40 text-sm font-medium">Commencez par générer votre première identité visuelle.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <div 
          key={project.id} 
          onClick={() => onSelect?.(project)}
          className="glass-dark p-6 rounded-3xl border border-white/10 hover:border-indigo-500/50 transition-all group cursor-pointer shadow-xl hover:shadow-indigo-500/10"
        >
          <div className="relative w-full h-48 bg-white/5 rounded-2xl mb-6 overflow-hidden">
            {project.previewImage ? (
              <img src={project.previewImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {project.status === 'completed' ? 'Terminé' : 'Brouillon'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">{project.type}</span>
              <h4 className="text-xl font-serif italic text-white group-hover:text-indigo-300 transition-colors">{project.title}</h4>
            </div>
          </div>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-4">
            Mis à jour le {new Date(project.updatedAt?.toDate?.() || project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MyProjects;
