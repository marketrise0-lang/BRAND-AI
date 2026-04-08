
import React, { useState } from 'react';
import { generateImagePro, editImageWithPrompt, generateVideoVeo } from '../services/geminiService';

const AdvancedLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'video'>('generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLandscape, setIsLandscape] = useState(true);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageFile(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOutput(null);
    setIsVideo(false);

    try {
      if (activeTab === 'generate') {
        const res = await generateImagePro(prompt, aspectRatio);
        setOutput(res);
      } else if (activeTab === 'edit' && imageFile) {
        const res = await editImageWithPrompt(imageFile, prompt);
        setOutput(res);
      } else if (activeTab === 'video' && imageFile) {
        const res = await generateVideoVeo(imageFile, prompt, isLandscape);
        setOutput(res);
        setIsVideo(true);
      }
    } catch (err) {
      alert("Erreur lors du traitement. Vérifiez votre clé API.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-20 p-12 bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-2 border-indigo-100">
      <div className="text-center mb-12 space-y-4">
        <h3 className="text-4xl font-serif font-black text-slate-900">Advanced Design Lab</h3>
        <p className="text-slate-500 font-medium">Outils d'élite propulsés par Gemini 3 Pro & Veo</p>
      </div>

      <div className="flex justify-center space-x-4 mb-10">
        {[
          { id: 'generate', label: 'Génération Pro', icon: '✨' },
          { id: 'edit', label: 'Édition IA', icon: '🎨' },
          { id: 'video', label: 'Vidéo Veo', icon: '🎬' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <span className="mr-2">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {(activeTab === 'edit' || activeTab === 'video') && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Image Source</label>
              <div className="relative group cursor-pointer h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                {imageFile ? (
                  <img src={imageFile || undefined} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <p className="text-slate-400 font-bold">Cliquez pour uploader</p>
                  </div>
                )}
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Instructions Master</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'generate' ? "Décrivez l'asset à créer..." : "Ex: Ajoutez un filtre néon rétro, retirez le fond..."}
              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none focus:border-indigo-600 transition-all font-bold text-slate-900 h-32 resize-none"
            />
          </div>

          {activeTab === 'generate' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Format (Aspect Ratio)</label>
              <div className="grid grid-cols-4 gap-2">
                {['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '21:9'].map(ar => (
                  <button 
                    key={ar} 
                    onClick={() => setAspectRatio(ar)}
                    className={`py-2 rounded-lg text-[10px] font-black border-2 transition-all ${aspectRatio === ar ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Orientation Vidéo</label>
              <div className="flex space-x-4">
                <button onClick={() => setIsLandscape(true)} className={`flex-1 py-3 rounded-xl font-bold border-2 ${isLandscape ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-100 text-slate-400'}`}>Landscape (16:9)</button>
                <button onClick={() => setIsLandscape(false)} className={`flex-1 py-3 rounded-xl font-bold border-2 ${!isLandscape ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-100 text-slate-400'}`}>Portrait (9:16)</button>
              </div>
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={isProcessing || !prompt}
            className="w-full py-6 bg-indigo-950 text-white font-black uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-black transition-all disabled:opacity-50"
          >
            {isProcessing ? "Algorithme en cours..." : "Lancer la Génération"}
          </button>
        </div>

        <div className="bg-slate-50 rounded-[3rem] border-2 border-indigo-50 flex items-center justify-center p-8 relative overflow-hidden min-h-[400px]">
          {isProcessing ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Vision...</p>
            </div>
          ) : output ? (
            isVideo ? (
              <video src={output || undefined} controls className="w-full h-full object-contain rounded-2xl shadow-2xl" autoPlay loop />
            ) : (
              <img src={output || undefined} referrerPolicy="no-referrer" className="w-full h-full object-contain rounded-2xl shadow-2xl" />
            )
          ) : (
            <div className="text-center text-slate-300">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="font-bold uppercase tracking-widest text-[10px]">Résultat Master Assets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedLab;
