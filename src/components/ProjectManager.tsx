import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Edit, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Image as ImageIcon,
  PenTool,
  Layout,
  Briefcase
} from 'lucide-react';
import { subscribeToAllProjects } from '../services/adminService';
import { Project } from '../../types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface ProjectManagerProps {
  searchTerm?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ searchTerm: globalSearchTerm = '' }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeToAllProjects((data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const searchTerm = globalSearchTerm || localSearchTerm;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || project.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'logo': return <PenTool className="w-4 h-4" />;
      case 'flyer': return <Layout className="w-4 h-4" />;
      case 'mockup': return <ImageIcon className="w-4 h-4" />;
      case 'brandkit': return <Briefcase className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text" 
            placeholder="Search projects by title..." 
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="logo">Logo</option>
            <option value="flyer">Flyer</option>
            <option value="mockup">Mockup</option>
            <option value="brandkit">Brand Kit</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all"
          >
            <div className="aspect-video bg-white/5 relative overflow-hidden">
              {project.previewImage ? (
                <img 
                  src={project.previewImage} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <Layers className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                  {getIcon(project.type)}
                  {project.type}
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <div className={`px-2 py-1 rounded-lg backdrop-blur-md border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  project.status === 'completed' 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' 
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                }`}>
                  {project.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {project.status}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h4 className="font-bold text-lg truncate flex-1">{project.title}</h4>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar className="w-3.5 h-3.5" />
                  {project.createdAt ? format(project.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <User className="w-3.5 h-3.5" />
                  ID: {project.id.slice(0, 8)}...
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
