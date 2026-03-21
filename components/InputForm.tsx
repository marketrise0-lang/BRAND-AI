
import React, { useState } from 'react';
import { BrandProfile } from '../types';

interface InputFormProps {
  onSubmit: (profile: BrandProfile) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [profile, setProfile] = useState<BrandProfile>({
    companyName: '',
    industry: '',
    mission: '',
    values: '',
    targetAudience: '',
    positioning: 'Minimaliste / Épuré',
    preferences: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  const inputClasses = "w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all outline-none text-slate-900 placeholder-slate-400 font-bold shadow-sm text-lg";
  const labelClasses = "block text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-2";

  return (
    <div className="relative group">
      <form onSubmit={handleSubmit} className="relative bg-white rounded-[3.5rem] shadow-[0_25px_100px_rgba(0,0,0,0.5)] p-10 md:p-16 space-y-10 border-2 border-indigo-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className={labelClasses}>Identité Commerciale</label>
            <input
              required
              name="companyName"
              value={profile.companyName}
              onChange={handleChange}
              placeholder="Ex: Luminia Tech"
              className={inputClasses}
            />
          </div>
          <div className="space-y-3">
            <label className={labelClasses}>Secteur & Marché</label>
            <input
              required
              name="industry"
              value={profile.industry}
              onChange={handleChange}
              placeholder="Ex: Énergie solaire innovante"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className={labelClasses}>Essence Stratégique (Vision)</label>
          <textarea
            required
            name="mission"
            value={profile.mission}
            onChange={handleChange}
            rows={3}
            placeholder="Quelle est la raison d'être unique de votre entreprise ?"
            className={`${inputClasses} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className={labelClasses}>Valeurs Directrices</label>
            <input
              required
              name="values"
              value={profile.values}
              onChange={handleChange}
              placeholder="Ex: Innovation, Éthique, Excellence"
              className={inputClasses}
            />
          </div>
          <div className="space-y-3">
            <label className={labelClasses}>Archétype de Positionnement</label>
            <select
              name="positioning"
              value={profile.positioning}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="Luxe / Haut de gamme">Luxe / Haut de gamme</option>
              <option value="Moderne / Technologique">Moderne / Technologique</option>
              <option value="Accessible / Familial">Accessible / Familial</option>
              <option value="Institutionnel / Sérieux">Institutionnel / Sérieux</option>
              <option value="Minimaliste / Épuré">Minimaliste / Épuré</option>
              <option value="Créatif / Audacieux">Créatif / Audacieux</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className={labelClasses}>Clientèle de Référence</label>
            <input
              required
              name="targetAudience"
              value={profile.targetAudience}
              onChange={handleChange}
              placeholder="Ex: Professionnels urbains"
              className={inputClasses}
            />
          </div>
          <div className="space-y-3">
            <label className={labelClasses}>Directives Visuelles</label>
            <input
              name="preferences"
              value={profile.preferences}
              onChange={handleChange}
              placeholder="Couleurs, symboles, styles"
              className={inputClasses}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative py-8 bg-indigo-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] text-base rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.5)] transition-all duration-500 flex items-center justify-center group/btn disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mr-4"></div>
              Traitement Design...
            </div>
          ) : "Générer l'Identité Maîtresse"}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
