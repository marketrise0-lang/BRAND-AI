import React, { useState } from 'react';

interface ExportDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (format: 'PNG' | 'SVG' | 'PDF') => Promise<void>;
}

const ExportDesignModal: React.FC<ExportDesignModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [format, setFormat] = useState<'PNG' | 'SVG' | 'PDF'>('PNG');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onConfirm(format);
      onClose();
    } catch (err) {
      console.error("Error exporting design:", err);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif italic text-white mb-2">Exporter le Design</h2>
          <p className="text-indigo-200/40 text-sm font-medium">Choisissez le format idéal pour votre projet.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {['PNG', 'SVG', 'PDF'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f as any)}
                className={`flex flex-col items-center justify-center py-6 rounded-2xl transition-all border ${format === f ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                <span className="text-lg font-serif italic mb-2">{f}</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-50">
                  {f === 'PNG' ? 'Raster' : f === 'SVG' ? 'Vector' : 'Print'}
                </span>
              </button>
            ))}
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
              disabled={isLoading}
              className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
            >
              {isLoading ? "EXPORTATION..." : "EXPORTER MAINTENANT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportDesignModal;
