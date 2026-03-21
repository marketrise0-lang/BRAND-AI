import React, { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, type: 'logo' | 'flyer' | 'mockup' | 'brandkit') => Promise<void>;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'logo' | 'flyer' | 'mockup' | 'brandkit'>('logo');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(title, type);
      onClose();
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 max-w-md w-full shadow-3xl animate-in zoom-in-95 duration-300">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif italic text-white mb-2">Nouveau Projet</h2>
          <p className="text-indigo-200/40 text-sm font-medium">Définissez les bases de votre prochaine création.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 ml-4">Titre du Projet</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Refonte Identité 2026"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 ml-4">Type de Design</label>
            <div className="grid grid-cols-2 gap-3">
              {['logo', 'flyer', 'mockup', 'brandkit'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t as any)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${type === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-5 bg-white/5 text-white/40 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-white/10 transition-all border border-white/10"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
            >
              {isLoading ? "CRÉATION..." : "CONFIRMER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
