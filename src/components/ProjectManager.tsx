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
  XCircle,
  FileText,
  Image as ImageIcon,
  PenTool,
  Layout,
  Briefcase,
  Download
} from 'lucide-react';
import { subscribeToAllProjects, deleteAllSystemProjects, updateSystemProject, deleteSystemProject } from '../services/adminService';
import { Project } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectManagerProps {
  searchTerm?: string;
}

interface ProjectWithId extends Project {
  path: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ searchTerm: globalSearchTerm = '' }) => {
  const [projects, setProjects] = useState<ProjectWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectWithId | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editJson, setEditJson] = useState('');

  useEffect(() => {
    const unsub = subscribeToAllProjects((data) => {
      setProjects(data as ProjectWithId[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEditProject = async (project: ProjectWithId) => {
    const newTitle = window.prompt("Nouveau titre du projet :", project.title);
    if (newTitle === null) return; // Cancelled

    const newStatus = window.confirm(`Marquer comme "${project.status === 'completed' ? 'Brouillon' : 'Terminé'}" ?`) 
      ? (project.status === 'completed' ? 'draft' : 'completed')
      : project.status;

    if (newTitle !== project.title || newStatus !== project.status) {
      try {
        await updateSystemProject(project.path, { 
          title: newTitle || project.title,
          status: newStatus as 'draft' | 'completed'
        });
      } catch (err) {
        console.error("Failed to update project:", err);
        alert("Erreur lors de la mise à jour.");
      }
    }
  };

  const handleDeleteProject = async (project: ProjectWithId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      try {
        await deleteSystemProject(project.path);
      } catch (err) {
        console.error("Failed to delete project:", err);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleDownloadProjectData = (project: ProjectWithId) => {
    if (!project.data) {
      alert("Aucune donnée de branding disponible pour ce projet.");
      return;
    }
    
    const dataStr = JSON.stringify(project.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}_branding.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadProjectImage = async (project: ProjectWithId) => {
    if (!project.previewImage) {
      alert("Aucune image de prévisualisation disponible pour ce projet.");
      return;
    }
    
    try {
      const response = await fetch(project.previewImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, '_')}_logo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download project:", err);
      alert("Erreur lors du téléchargement de l'image.");
    }
  };

  const handleOpenEditModal = (project: ProjectWithId) => {
    setSelectedProject(project);
    setEditJson(JSON.stringify(project.data || {}, null, 2));
    setIsEditModalOpen(true);
  };

  const handleSaveJson = async () => {
    if (!selectedProject) return;
    try {
      const parsedData = JSON.parse(editJson);
      await updateSystemProject(selectedProject.path, { data: parsedData });
      setIsEditModalOpen(false);
      alert("Données du projet mises à jour avec succès.");
    } catch (err) {
      console.error("Failed to parse or save JSON:", err);
      alert("Erreur : Format JSON invalide ou échec de la sauvegarde.");
    }
  };

  const handleClearAllSystemProjects = async () => {
    if (window.confirm("CRITIQUE : Êtes-vous sûr de vouloir supprimer TOUTES les générations de TOUS les utilisateurs ? Cette action est irréversible.")) {
      try {
        setIsDeleting(true);
        await deleteAllSystemProjects();
        alert("Toutes les générations du système ont été effacées.");
      } catch (err) {
        console.error("Failed to clear system projects:", err);
        alert("Erreur lors de la suppression des projets.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const searchTerm = globalSearchTerm || localSearchTerm;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || project.type === filterType;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
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
          <button 
            onClick={handleClearAllSystemProjects}
            disabled={isDeleting || projects.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Suppression..." : "Tout Effacer"}
          </button>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="all">Tous les Types</option>
            <option value="logo">Logo</option>
            <option value="flyer">Flyer</option>
            <option value="mockup">Mockup</option>
            <option value="brandkit">Brand Kit</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="all">Tous les Statuts</option>
            <option value="completed">Terminés</option>
            <option value="draft">Brouillons</option>
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
                <button 
                  onClick={() => handleOpenEditModal(project)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Details
                </button>
                <button 
                  onClick={() => handleEditProject(project)}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Metadata"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleDownloadProjectImage(project)}
                    className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                    title="Download Preview Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDownloadProjectData(project)}
                    className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-500/20 transition-colors"
                    title="Download Branding Data (JSON)"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => handleDeleteProject(project)}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Delete</span>
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

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProject.title}</h3>
                  <p className="text-sm text-white/40">ID: {selectedProject.id}</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Aperçu</h4>
                    <div className="aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                      {selectedProject.previewImage ? (
                        <img 
                          src={selectedProject.previewImage} 
                          alt={selectedProject.title} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Informations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Type</p>
                        <p className="text-sm font-medium capitalize">{selectedProject.type}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Status</p>
                        <p className="text-sm font-medium capitalize">{selectedProject.status}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Créé le</p>
                        <p className="text-sm font-medium">
                          {selectedProject.createdAt ? format(selectedProject.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Mis à jour</p>
                        <p className="text-sm font-medium">
                          {selectedProject.updatedAt ? format(selectedProject.updatedAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Éditeur de Données (JSON)</h4>
                    <span className="text-[10px] text-white/20">Attention : Modifiez avec prudence</span>
                  </div>
                  <textarea
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                    className="w-full h-96 bg-black border border-white/10 rounded-2xl p-6 font-mono text-xs text-emerald-500/80 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="p-8 border-t border-white/10 bg-white/5 flex items-center justify-between gap-4">
                <button 
                  onClick={() => {
                    handleDeleteProject(selectedProject);
                    setIsEditModalOpen(false);
                  }}
                  className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
                >
                  Supprimer le Projet
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveJson}
                    className="px-8 py-3 bg-emerald-500 text-black rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManager;
