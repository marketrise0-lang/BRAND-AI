
import React, { useState } from 'react';

interface LogoBrandingFormProps {
  onSubmit: (companyName: string, logoFile: string) => void;
  isLoading: boolean;
}

const LogoBrandingForm: React.FC<LogoBrandingFormProps> = ({ onSubmit, isLoading }) => {
  const [companyName, setCompanyName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName && logoPreview) {
      onSubmit(companyName, logoPreview);
    }
  };

  const inputClasses = "w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all outline-none text-slate-900 placeholder-slate-400 font-bold shadow-sm text-lg";
  const labelClasses = "block text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-2";

  return (
    <div className="relative group">
      <form onSubmit={handleSubmit} className="relative bg-white rounded-[3.5rem] shadow-[0_25px_100px_rgba(0,0,0,0.5)] p-10 md:p-16 space-y-10 border-2 border-indigo-100">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-serif font-black text-slate-900 mb-2">Extraction d'Identité Visuelle</h3>
          <p className="text-slate-500 font-medium">Uploadez votre logo pour générer une charte graphique sur mesure.</p>
        </div>

        <div className="space-y-3">
          <label className={labelClasses}>Nom de la Compagnie</label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Luminia Tech"
            className={inputClasses}
          />
        </div>

        <div className="space-y-3">
          <label className={labelClasses}>Image du Logo</label>
          <div className="relative group cursor-pointer h-64 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
            {logoPreview ? (
              <img src={logoPreview} className="max-w-full max-h-full object-contain p-4" alt="Preview" />
            ) : (
              <div className="text-center p-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Glissez votre logo ou cliquez pour uploader</p>
                <p className="text-slate-300 text-[10px] mt-2 font-medium">PNG, JPG (fond uni recommandé)</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              required={!logoPreview}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !logoPreview || !companyName}
          className="w-full relative py-8 bg-indigo-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] text-base rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.5)] transition-all duration-500 flex items-center justify-center group/btn disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mr-4"></div>
              Analyse Visuelle...
            </div>
          ) : "Analyser & Générer la Charte"}
        </button>
      </form>
    </div>
  );
};

export default LogoBrandingForm;
