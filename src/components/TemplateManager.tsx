import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Layout, 
  Image as ImageIcon, 
  Briefcase,
  X,
  Loader2
} from 'lucide-react';
import { subscribeToTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/adminService';
import { Template } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../AuthContext';

const TemplateManager: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Omit<Template, 'id' | 'createdAt'>>({
    type: 'logo',
    category: '',
    premium: false,
    createdBy: user?.uid || '',
    imageUrl: ''
  });

  useEffect(() => {
    const unsub = subscribeToTemplates((data) => {
      setTemplates(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        type: template.type,
        category: template.category,
        premium: template.premium,
        createdBy: template.createdBy,
        imageUrl: template.imageUrl || ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        type: 'logo',
        category: '',
        premium: false,
        createdBy: user?.uid || '',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(id);
      } catch (error) {
        console.error("Error deleting template:", error);
      }
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
            placeholder="Search templates..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-black rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all"
          >
            <div className="aspect-square bg-white/5 relative">
              {template.imageUrl ? (
                <img 
                  src={template.imageUrl} 
                  alt={template.category} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <PenTool className="w-16 h-16" />
                </div>
              )}
              
              <div className="absolute top-3 left-3">
                <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                  {template.type}
                </div>
              </div>
              
              {template.premium && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => handleOpenModal(template)}
                  className="p-3 rounded-full bg-white text-black hover:bg-emerald-500 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="p-3 rounded-full bg-white text-black hover:bg-rose-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-bold text-sm truncate">{template.category}</h4>
              <p className="text-xs text-white/40 mt-1 capitalize">{template.type} Template</p>
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <PenTool className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No templates found</p>
          <p className="text-sm">Start by creating your first design template</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Template Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['logo', 'flyer', 'mockup'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type as any })}
                          className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                            formData.type === type 
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Category / Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Minimalist Tech Logo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Image URL</label>
                    <input 
                      type="url" 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-bold">Premium Template</p>
                      <p className="text-xs text-white/40">Only available for PRO subscribers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, premium: !formData.premium })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${formData.premium ? 'bg-emerald-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.premium ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Template'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateManager;
