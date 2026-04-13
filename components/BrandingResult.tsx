
import React, { useRef, useState } from 'react';
import { BrandProfile, BrandingResult as BrandingType } from '../types';
import { generateImage, generateBrandLaunchPost, generateVideoVeo } from '../services/geminiService';
// @ts-ignore
import JSZip from 'jszip';

interface BrandingResultProps {
  data: BrandingType;
  onUpdateMockups?: (mockups: string[]) => void;
  companyName: string;
  profile?: BrandProfile;
  language?: 'fr' | 'en';
  isAdmin?: boolean;
  hasApiKey?: boolean;
}

type SectionKey = 'cover' | 'toc' | 'dna' | 'manifesto' | 'visualIdentity' | 'geometricBlueprint' | 'usage' | 'typography' | 'elements' | 'print' | 'ecosystem' | 'social' | 'packaging' | 'mockups' | 'palette' | 'logic' | 'strategy' | 'future' | 'thanks';

const BrandingResult: React.FC<BrandingResultProps> = ({ data, onUpdateMockups, companyName, profile, language = 'fr', isAdmin = false, hasApiKey = false }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedSections, setSelectedSections] = useState<SectionKey[]>(['cover', 'toc', 'dna', 'manifesto', 'visualIdentity', 'geometricBlueprint', 'usage', 'typography', 'elements', 'print', 'ecosystem', 'social', 'packaging', 'mockups', 'palette', 'logic', 'strategy', 'future', 'thanks']);
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [launchPost, setLaunchPost] = useState<string | null>(null);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const CopyButton: React.FC<{ text: string, id: string, className?: string }> = ({ text, id, className = "" }) => (
    <button 
      onClick={() => handleCopyText(text, id)}
      className={`p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${className}`}
      title="Copy to clipboard"
    >
      {copySuccess === id ? (
        <>
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
  const [contextualMockups, setContextualMockups] = useState<string[]>(data.styleGuide?.extraMockups || []);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(data.logo.animatedVariations?.primaryUrl || null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const zipAbortControllerRef = useRef<AbortController | null>(null);

  // Local state for on-demand images
  const [localImages, setLocalImages] = useState({
    simplified: data.logo.simplifiedImageUrl || null,
    inverted: data.logo.invertedImageUrl || null,
    monochrome: data.logo.monochromeImageUrl || null,
    darkBg: data.logo.darkBgImageUrl || null,
    businessCard: data.styleGuide?.ecosystem?.print?.businessCardImageUrl || null,
    flyer: data.styleGuide?.ecosystem?.print?.flyerImageUrl || null,
    pattern: data.styleGuide?.graphicElements?.patternImageUrl || null,
  });
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});

  const handleGenerateSpecificImage = async (key: keyof typeof localImages, prompt: string) => {
    if (generatingImages[key]) return;
    
    setGeneratingImages(prev => ({ ...prev, [key]: true }));
    try {
      const result = await generateImage(prompt, data.logo.generatedImageUrl);
      if (result) {
        setLocalImages(prev => ({ ...prev, [key]: result }));
      }
    } catch (error) {
      console.error(`Error generating ${key}:`, error);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const GenerateButton = ({ onClick, isGenerating, label }: { onClick: () => void, isGenerating: boolean, label: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={isGenerating}
      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
    >
      {isGenerating ? (
        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )}
      {label}
    </button>
  );

  const getCleanPath = (rawPath: string | undefined): string => {
    if (!rawPath) return "";
    
    // Handle full SVG tags if the AI returned one instead of just the path
    if (rawPath.includes('<path')) {
      const match = rawPath.match(/d="([^"]+)"/);
      if (match) return match[1];
    }
    
    // Handle cases where it's just the 'd' attribute value but might have quotes
    if (rawPath.startsWith('"') && rawPath.endsWith('"')) {
      return rawPath.slice(1, -1);
    }

    // Basic cleanup
    return rawPath.replace(/<[^>]*>/g, '').trim();
  };

  const cleanSvgPath = getCleanPath(data.logo.svgPath);

  const toggleSection = (section: SectionKey) => {
    setSelectedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const createSVGFile = (color: string = data.styleGuide?.colors?.[0]?.hex || "#4f46e5"): Blob => {
    const svgHeader = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1024px" height="1024px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>${companyName} Master Logo Vector</title>
    <desc>Generated by BrandGenius AI</desc>
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="${cleanSvgPath}" id="Logo-Path" fill="${color}"></path>
    </g>
</svg>`;
    return new Blob([svgHeader], { type: 'image/svg+xml' });
  };

  const createLogoWithTextSVGFile = (color: string = data.styleGuide?.colors?.[0]?.hex || "#4f46e5"): Blob => {
    const font = data.styleGuide?.typography?.titles?.fontFamily || 'sans-serif';
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200px" height="400px" viewBox="0 0 600 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>${companyName} Logo with Text</title>
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g transform="translate(50, 50)">
            <path d="${cleanSvgPath}" fill="${color}" transform="scale(0.2)"></path>
        </g>
        <text x="180" y="115" fill="${color}" font-family="${font}" font-size="48" font-weight="900" text-transform="uppercase">${companyName}</text>
    </g>
</svg>`;
    return new Blob([svgContent], { type: 'image/svg+xml' });
  };

  const createGeometricSVGFile = (color: string = data.styleGuide?.colors?.[0]?.hex || "#4f46e5"): Blob => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1024px" height="1024px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>${companyName} Geometric Blueprint</title>
    <rect width="512" height="512" fill="white" />
    <g stroke="#6366f1" stroke-width="0.5" fill="none" opacity="0.3">
        <circle cx="256" cy="256" r="200" stroke-dasharray="4,4" />
        <circle cx="256" cy="256" r="123.6" stroke-dasharray="2,2" opacity="0.5" />
        <line x1="256" y1="0" x2="256" y2="512" />
        <line x1="0" y1="256" x2="512" y2="256" />
        <line x1="0" y1="0" x2="512" y2="512" stroke-width="0.3" stroke-dasharray="1,2" opacity="0.3" />
        <line x1="512" y1="0" x2="0" y2="512" stroke-width="0.3" stroke-dasharray="1,2" opacity="0.3" />
    </g>
    <path d="${cleanSvgPath}" fill="none" stroke="${color === '#FFFFFF' ? '#6366f1' : color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <g fill="#6366f1" opacity="0.5">
        <rect x="252" y="52" width="8" height="8" />
        <rect x="252" y="452" width="8" height="8" />
        <rect x="52" y="252" width="8" height="8" />
        <rect x="452" y="252" width="8" height="8" />
    </g>
    <g font-family="monospace" font-size="10" fill="#6366f1" opacity="0.6">
        <text x="265" y="65">y</text>
        <text x="265" y="445">y'</text>
        <text x="65" y="250">x</text>
        <text x="435" y="250">x'</text>
        <text x="10" y="500">SCALE 1:1 | PHI 1.618</text>
    </g>
</svg>`;
    return new Blob([svgContent], { type: 'image/svg+xml' });
  };

  const handleDownloadSVGSource = (suffix: string = 'MASTER_SOURCE', color?: string, isGeometric: boolean = false) => {
    if (!cleanSvgPath) return;
    const blob = isGeometric ? createGeometricSVGFile(color) : createSVGFile(color);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, '_')}_${suffix}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateLaunchPost = async () => {
    setIsGeneratingPost(true);
    try {
      const post = await generateBrandLaunchPost(
        companyName, 
        data.styleGuide?.ecosystem?.digital?.webInterface || "Innovation", 
        data.styleGuide?.visualStyle || "Modern",
        isAdmin && hasApiKey
      );
      setLaunchPost(post);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const handleCopyPost = () => {
    if (launchPost) {
      navigator.clipboard.writeText(launchPost);
      setCopySuccess('post');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleGenerateMockups = async () => {
    setIsGeneratingMockups(true);
    try {
      const prompts = [
        `Professional website header mockup with the logo of ${companyName} in a clean, modern navigation bar. High-end UI design.`,
        `Social media profile mockup for ${companyName} showing the logo on a smartphone screen. Instagram/LinkedIn style.`,
        `Premium business card mockup for ${companyName} on a textured paper background. Minimalist and elegant.`,
        `Luxury product packaging mockup for ${companyName} with the logo embossed on a high-quality box or container.`,
        `Modern shop sign mockup for ${companyName} on a sleek storefront in a premium urban location. High-end signage.`
      ];
      
      const results = [];
      for (const p of prompts) {
        const res = await generateImage(p, data.logo.generatedImageUrl);
        results.push(res);
        // Update state incrementally so user sees progress and we don't lose everything if one fails
        setContextualMockups([...results]);
      }
      if (onUpdateMockups) onUpdateMockups(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMockups(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!data.logo.generatedImageUrl || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    try {
      const prompt = `Cinematic logo animation for ${companyName}. The logo reveals itself through elegant light streaks and fluid motion. High-end motion graphics, professional reveal.`;
      const videoUrl = await generateVideoVeo(data.logo.generatedImageUrl, prompt);
      if (videoUrl) {
        setGeneratedVideoUrl(videoUrl);
      }
    } catch (e) {
      console.error("Failed to generate video:", e);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownloadAssets = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    
    const colors = data.styleGuide?.colors || [];
    const primaryColor = colors[0]?.hex || "#4f46e5";
    const identity = zip.folder("01_Identity");
    const source = identity.folder("Source");
    
    // Add SVG
    if (cleanSvgPath) {
        source.file(`${companyName.replace(/\s+/g, '_')}_Vector.svg`, createSVGFile());
        source.file(`${companyName.replace(/\s+/g, '_')}_With_Text.svg`, createLogoWithTextSVGFile());
    }

    // Helper to add assets (handles both base64 and URLs)
    const addAsset = async (folder: any, name: string, url?: string) => {
        if (!url) return;
        
        try {
            if (url.startsWith('data:')) {
                const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
                folder.file(name, base64Data, { base64: true });
            } else {
                const response = await fetch(url);
                if (response.ok) {
                    const blob = await response.blob();
                    folder.file(name, blob);
                }
            }
        } catch (err) {
            console.error(`Failed to add asset ${name}:`, err);
        }
    };

    const assetPromises: Promise<void>[] = [];

    assetPromises.push(addAsset(identity, "logo_master.png", data.logo.generatedImageUrl));
    assetPromises.push(addAsset(identity, "logo_monochrome.png", localImages.monochrome || data.logo.monochromeImageUrl));
    assetPromises.push(addAsset(identity, "logo_inverted.png", localImages.inverted || data.logo.invertedImageUrl));
    assetPromises.push(addAsset(identity, "logo_simplified.png", localImages.simplified || data.logo.simplifiedImageUrl));
    assetPromises.push(addAsset(identity, "logo_dark_bg.png", localImages.darkBg || data.logo.darkBgImageUrl));
    assetPromises.push(addAsset(identity, "favicon.png", data.logo.faviconImageUrl));

    // 2. Mockups Folder
    const mockups = zip.folder("02_Mockups");
    assetPromises.push(addAsset(mockups, "business_card.png", localImages.businessCard || data.styleGuide?.ecosystem?.print?.businessCardImageUrl));
    assetPromises.push(addAsset(mockups, "flyer.png", localImages.flyer || data.styleGuide?.ecosystem?.print?.flyerImageUrl));
    assetPromises.push(addAsset(mockups, "stationery_set.png", data.styleGuide?.mockupImageUrl));
    
    contextualMockups.forEach((m, i) => {
        assetPromises.push(addAsset(mockups, `mockup_${i+1}.png`, m));
    });

    // 3. Elements
    const elements = zip.folder("03_Elements");
    assetPromises.push(addAsset(elements, "brand_pattern.png", localImages.pattern || data.styleGuide?.graphicElements?.patternImageUrl));

    await Promise.all(assetPromises);

    // 4. Motion (Async Fetch)
    if (data.logo.animatedVariations) {
        const motion = zip.folder("04_Motion");
        zipAbortControllerRef.current = new AbortController();
        const signal = zipAbortControllerRef.current.signal;

        try {
            const fetchBlob = async (url: string) => {
                try {
                    // If it's a blob URL, we can fetch it directly
                    if (url.startsWith('blob:')) {
                        const res = await fetch(url);
                        return await res.blob();
                    }

                    console.log(`Attempting to fetch asset: ${url}`);
                    // For external URLs, we might hit CORS issues in the browser
                    // If it fails, we log it but don't crash the whole zip process
                    const response = await fetch(url, { 
                        signal,
                        // mode: 'no-cors' // This would return an opaque response which we can't use for blob()
                    });
                    
                    if (!response.ok) {
                        console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
                        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
                    }
                    console.log(`Successfully fetched asset: ${url}`);
                    return await response.blob();
                } catch (err: any) {
                    const message = err?.message || String(err);
                    const isAbort = err.name === 'AbortError' || 
                                   err.name === 'CanceledError' ||
                                   err.code === 20 ||
                                   message.toLowerCase().includes("aborted") || 
                                   message.toLowerCase().includes("the user aborted a request") ||
                                   message.toLowerCase().includes("signal is aborted") ||
                                   message.toLowerCase().includes("canceled");
                    
                    if (isAbort) {
                        console.log(`Fetch aborted for ${url}`);
                    } else {
                        console.error(`Fetch error for ${url}:`, err);
                    }
                    throw err;
                }
            };

            const fetchPromises = [];
            if (data.logo.animatedVariations.primaryUrl) {
                fetchPromises.push(
                    fetchBlob(data.logo.animatedVariations.primaryUrl)
                        .then(vid => motion.file("logo_animation_primary.mp4", vid))
                        .catch(err => console.warn("Skipping primary animation due to error", err))
                );
            }
            if (data.logo.animatedVariations.monochromeUrl) {
                fetchPromises.push(
                    fetchBlob(data.logo.animatedVariations.monochromeUrl)
                        .then(vid => motion.file("logo_animation_monochrome.mp4", vid))
                        .catch(err => console.warn("Skipping monochrome animation due to error", err))
                );
            }
            
            await Promise.all(fetchPromises);
        } catch (e) {
            console.error("Error zipping motion assets", e);
        }
    }

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${companyName.replace(/\s+/g, '_')}_BRAND_ASSETS_PACK.zip`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Zip error", e);
    } finally {
        setIsZipping(false);
        zipAbortControllerRef.current = null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGeneratingPDF(true);
    
    // Small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = contentRef.current;
      const opt = {
        margin: 0,
        filename: `${companyName.replace(/\s+/g, '_')}_BRAND_GUIDELINES.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF generation error", e);
      // Fallback to print if html2pdf fails
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (zipAbortControllerRef.current) {
        zipAbortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-40">
      <div 
        ref={contentRef} 
        id="branding-export-container" 
        className="bg-white text-indigo-950 overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.2)] md:rounded-[5rem] border border-gray-100"
        style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* COUVERTURE PRESTIGE */}
        {selectedSections.includes('cover') && (
          <section id="section-cover" className="h-[1120px] flex flex-col justify-between bg-[#050810] text-white p-24 relative overflow-hidden font-display">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[180px] rounded-full"></div>
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/40">
                Identity System / v4.6
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/40">Confidential</p>
                <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-indigo-500 mt-1">© 2026 BrandGenius</p>
              </div>
            </div>

            <div className="relative z-10 space-y-16 text-center">
              <div className="w-64 h-64 bg-white rounded-[4rem] flex items-center justify-center mx-auto shadow-[0_0_100px_rgba(79,70,229,0.4)] border-8 border-white/5 p-12 transform hover:scale-105 transition-transform duration-700">
                 {data.logo.faviconImageUrl && <img src={data.logo.faviconImageUrl} className="w-full h-full object-contain" alt="Master Symbol" />}
              </div>
              <div className="space-y-8">
                <h1 className="text-[10rem] font-black tracking-tighter text-white leading-[0.8] uppercase drop-shadow-2xl">{companyName}</h1>
                <div className="h-1 w-64 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mt-12"></div>
                <p className="text-4xl text-indigo-400 font-light tracking-[0.8em] uppercase mt-10 opacity-80">Brand Guidelines</p>
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">Created by</p>
                <p className="font-display text-[14px] tracking-[0.2em] uppercase text-white font-bold">BrandGenius Absolute AI</p>
              </div>
              <div className="text-right space-y-3">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">Date of Issue</p>
                <p className="font-display text-[14px] tracking-[0.2em] uppercase text-white font-bold">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </section>
        )}

        {/* TABLE OF CONTENTS */}
        {selectedSections.includes('toc') && (
          <>
            <div className="page-break"></div>
            <section id="section-toc" className="h-[1120px] p-32 bg-white flex flex-col justify-between font-display">
              <div className="space-y-24">
                <div className="flex justify-between items-end border-b-2 border-indigo-50 pb-12">
                  <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">
                    {language === 'fr' ? 'Sommaire' : 'Table of Contents'}
                  </h2>
                  <span className="font-mono text-xs text-indigo-300 tracking-widest uppercase">
                    {language === 'fr' ? 'Index des Directives' : 'Guidelines Index'}
                  </span>
                </div>
                                <div className="grid grid-cols-2 gap-x-16 gap-y-8 max-w-5xl">
                  {[
                    { id: '01', title: language === 'fr' ? 'ADN & Manifesto' : 'DNA & Manifesto', desc: language === 'fr' ? 'Vision, Valeurs et Âme de la Marque' : 'Vision, Values and Brand Soul', page: '03-04' },
                    { id: '02', title: language === 'fr' ? 'Identité Visuelle' : 'Visual Identity', desc: language === 'fr' ? 'Logo Master & Variations' : 'Master Logo & Variations', page: '05' },
                    { id: '03', title: language === 'fr' ? 'Blueprint Géométrique' : 'Geometric Blueprint', desc: language === 'fr' ? 'Tracés & Proportions' : 'Traces & Proportions', page: '06' },
                    { id: '04', title: language === 'fr' ? 'Usage du Logo' : 'Logo Usage', desc: language === 'fr' ? 'Règles d\'Intégrité et Zones de Protection' : 'Integrity Rules and Protection Zones', page: '07' },
                    { id: '05', title: language === 'fr' ? 'Typographie' : 'Typography', desc: language === 'fr' ? 'Système de Polices et Hiérarchie' : 'Font System and Hierarchy', page: '08' },
                    { id: '06', title: language === 'fr' ? 'Éléments Graphiques' : 'Graphic Elements', desc: language === 'fr' ? 'Motifs, Textures et Formes' : 'Patterns, Textures and Shapes', page: '09' },
                    { id: '07', title: language === 'fr' ? 'Supports Print' : 'Print Materials', desc: language === 'fr' ? 'Papeterie et Matériel Promotionnel' : 'Stationery and Promotional Material', page: '10' },
                    { id: '08', title: language === 'fr' ? 'Écosystème Digital' : 'Digital Ecosystem', desc: language === 'fr' ? 'Présence Web et Motion Design' : 'Web Presence and Motion Design', page: '11' },
                    { id: '09', title: language === 'fr' ? 'Stratégie Sociale' : 'Social Strategy', desc: language === 'fr' ? 'Engagement et Présence Sociale' : 'Engagement and Social Presence', page: '12' },
                    { id: '10', title: language === 'fr' ? 'Packaging & Matériaux' : 'Packaging & Materials', desc: language === 'fr' ? 'Expérience Produit et Finitions' : 'Product Experience and Finishes', page: '13' },
                    { id: '11', title: language === 'fr' ? 'Mockups Contextuels' : 'Contextual Mockups', desc: language === 'fr' ? 'Projections Réelles et Immersion' : 'Real Projections and Immersion', page: '14' },
                    { id: '12', title: language === 'fr' ? 'Nuancier Technique' : 'Technical Palette', desc: language === 'fr' ? 'Spécifications Chromatiques' : 'Chromatic Specifications', page: '15' },
                    { id: '13', title: language === 'fr' ? 'Logique de Conception' : 'Design Logic', desc: language === 'fr' ? 'Standards et Règles de Design' : 'Design Standards and Rules', page: '16' },
                    { id: '14', title: language === 'fr' ? 'Stratégie de Lancement' : 'Launch Strategy', desc: language === 'fr' ? 'Plan de Déploiement AI' : 'AI Deployment Plan', page: '17' },
                    { id: '15', title: language === 'fr' ? 'Recommandations' : 'Recommendations', desc: language === 'fr' ? 'Évolutions et Futur de la Marque' : 'Brand Evolution and Future', page: '18' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-8 group cursor-default">
                      <span className="text-3xl font-serif font-black text-indigo-50 group-hover:text-indigo-500 transition-colors duration-500">{item.id}</span>
                      <div className="flex-grow border-b border-dashed border-indigo-100 pb-2">
                        <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight">{item.title}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                      </div>
                      <span className="text-sm font-mono text-indigo-200">P. {item.page}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 02</span>
              </div>
            </section>
          </>
        )}

        {/* BRAND DNA */}
        {selectedSections.includes('dna') && (
          <>
            <div className="page-break"></div>
            <section id="section-dna" className="h-[1120px] p-32 bg-white flex flex-col justify-between font-display">
              <div className="space-y-32">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[14rem] font-serif text-indigo-50/80 font-black leading-none select-none">01</span>
                  <div className="pb-6">
                    <h2 className="text-7xl font-black text-indigo-950 uppercase tracking-tighter">ADN de Marque</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Fondations Stratégiques</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
                  <div className="space-y-16">
                    <div className="space-y-8 group relative">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-widest border-l-8 border-indigo-500 pl-8">Mission</h3>
                        <CopyButton text={profile?.mission || ""} id="mission" className="opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-2xl text-slate-600 leading-relaxed font-serif italic">
                        "{profile?.mission || "Propulser l'innovation par un design d'excellence et une vision stratégique sans compromis."}"
                      </p>
                    </div>
                    <div className="space-y-8 group relative">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-widest border-l-8 border-indigo-500 pl-8">Valeurs</h3>
                        <CopyButton text={profile?.values || ""} id="values" className="opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="flex flex-wrap gap-6">
                        {(profile?.values || "Excellence, Innovation, Intégrité").split(',').map((v, i) => (
                          <div key={i} className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                            {v.trim()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-16">
                    <div className="space-y-8 group relative">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-widest border-l-8 border-indigo-500 pl-8">Positionnement</h3>
                        <CopyButton text={profile?.positioning || ""} id="positioning" className="opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-xl text-slate-600 leading-relaxed font-medium">
                        {profile?.positioning || "Une marque d'élite conçue pour les leaders qui exigent une identité visuelle à la hauteur de leurs ambitions mondiales."}
                      </p>
                    </div>
                    <div className="p-12 bg-indigo-950 rounded-[4rem] text-white space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Score de Crédibilité AI</p>
                      <div className="flex items-end gap-6">
                        <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-400">{data.analysis?.credibilityScore || 95}%</span>
                        <p className="text-xs text-white/60 font-medium pb-4">Indice de cohérence stratégique</p>
                      </div>
                      <p className="text-lg text-white/80 leading-relaxed italic border-t border-white/10 pt-8 mt-4 font-serif">
                        {data.analysis?.coherenceStrategy || "Une identité visuelle conçue pour l'excellence et la mémorabilité."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 03</span>
              </div>
            </section>
          </>
        )}

        {/* BRAND MANIFESTO */}
        {selectedSections.includes('manifesto') && (
          <>
            <div className="page-break"></div>
            <section id="section-manifesto" className="h-[1120px] p-32 bg-[#050810] text-white flex flex-col justify-between font-display relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_70%)]"></div>
              </div>
              
              <div className="space-y-24 relative z-10">
                <div className="flex items-end gap-10 border-b-4 border-white/10 pb-16">
                  <span className="text-[14rem] font-serif text-white/5 font-black leading-none select-none">02</span>
                  <div className="pb-6">
                    <h2 className="text-7xl font-black text-white uppercase tracking-tighter">Manifeste</h2>
                    <p className="text-indigo-400 font-black tracking-[0.5em] uppercase text-sm mt-4">L'Âme de la Marque</p>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-16 py-20">
                  <p className="text-5xl font-serif italic leading-[1.4] text-indigo-100">
                    "Nous ne créons pas seulement une identité. Nous forgeons un héritage visuel qui transcende les tendances pour atteindre l'intemporel."
                  </p>
                  <div className="h-1 w-32 bg-indigo-500 mx-auto"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                    <div className="space-y-8 group relative">
                      <div className="flex justify-between items-center">
                        <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Vision</h4>
                        <CopyButton text="Redéfinir les standards de l'industrie par une audace créative constante." id="vision-manifesto" className="opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">Redéfinir les standards de l'industrie par une audace créative constante.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Engagement</h4>
                      <p className="text-sm text-white/60 leading-relaxed">Une précision mathématique au service d'une émotion pure.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Héritage</h4>
                      <p className="text-sm text-white/60 leading-relaxed">Construire aujourd'hui ce qui sera la référence de demain.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-[0.5em] relative z-10">
                <span>{companyName} / Brand Book</span>
                <span>Page 04</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 02: ARCHITECTURE VISUELLE (BLUEPRINT & TRACÉS) */}
        <div className="page-break"></div>
        <section id="section-blueprint" className="min-h-[1120px] p-32 bg-white flex flex-col justify-between">
          <div className="space-y-24">
            <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
              <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">02</span>
              <div className="pb-4">
                <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">
                  {language === 'fr' ? 'Le Logo' : 'The Logo'}
                </h2>
                <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">
                  {language === 'fr' ? 'Architecture Visuelle & Blueprint' : 'Visual Architecture & Blueprint'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
               <div className="lg:col-span-8">
                  <div className="bg-[#0b1120] rounded-[4rem] p-24 aspect-square relative flex items-center justify-center overflow-hidden border-[16px] border-[#1e293b] shadow-inner shadow-black/50 group">
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #38bdf8 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
                   <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {cleanSvgPath && (
                      <svg viewBox="0 0 512 512" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="256" cy="256" r="230" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="15,10" opacity="0.3" />
                        <circle cx="256" cy="256" r="150" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="5,5" opacity="0.2" />
                        <line x1="256" y1="0" x2="256" y2="512" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
                        <line x1="0" y1="256" x2="512" y2="256" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
                        <path d="M 50 256 A 206 206 0 0 1 462 256" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.2" />
                        <path d={cleanSvgPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
                        {/* Vector markers */}
                        <circle cx="256" cy="256" r="4" fill="#38bdf8" />
                        <rect x="252" y="30" width="8" height="8" fill="#38bdf8" opacity="0.5" />
                        <rect x="252" y="474" width="8" height="8" fill="#38bdf8" opacity="0.5" />
                      </svg>
                    )}
                   </div>
                   <div className="absolute top-16 left-16 space-y-2">
                      <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div><span className="font-mono text-[10px] text-sky-400/80 uppercase">Node_Stability: 100%</span></div>
                      <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div><span className="font-mono text-[10px] text-sky-400/80 uppercase">Ratio: Phi_1.618</span></div>
                   </div>
                   <div className="absolute bottom-16 right-16 text-right font-mono text-[10px] text-sky-400/50 uppercase leading-relaxed">
                      SYSTÈME DE GRILLE : 32x32<br/>TYPE : VECTOR_MASTER_V2
                   </div>
                   <button 
                     onClick={() => handleDownloadSVGSource()}
                     className="absolute top-16 right-16 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3 backdrop-blur-md opacity-0 group-hover:opacity-100"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Download Source (SVG)
                   </button>
                </div>
             </div>
             <div className="lg:col-span-4 space-y-16">
                <h3 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-500 pl-6">Variations de Système</h3>
                <div className="grid grid-cols-1 gap-10">
                   {[
                     { img: data.logo.generatedImageUrl, name: language === 'fr' ? "LOGO PRINCIPAL" : "MASTER FULL COLOR", desc: language === 'fr' ? "Digital & Impact Élevé" : "Digital & High Impact" },
                     { 
                       svg: createLogoWithTextSVGFile(), 
                       name: language === 'fr' ? "LOGO AVEC TEXTE" : "LOGO WITH TEXT", 
                       desc: language === 'fr' ? "Variante de Signature" : "Brand Signature Variant",
                       isSvg: true 
                     },
                     { img: localImages.monochrome, name: language === 'fr' ? "VERSION MONOCHROME" : "SOLID MONOCHROME", desc: language === 'fr' ? "Impression & Papeterie" : "Print & Professional Stationery", key: 'monochrome' as const, prompt: `SOLID MONOCHROME LOGO: A single-color black version of the logo for ${companyName} on a white background. High contrast, clean lines.` },
                     { img: localImages.inverted, name: language === 'fr' ? "VERSION INVERSÉE" : "NEGATIVE REVERSE", desc: language === 'fr' ? "Réseaux Sociaux & UI Sombre" : "Social Media & Dark UI", key: 'inverted' as const, prompt: `NEGATIVE REVERSE LOGO: A white version of the logo for ${companyName} on a solid black background. High contrast, clean lines.` },
                     { img: localImages.simplified, name: language === 'fr' ? "VERSION SIMPLIFIÉE" : "UI SYMBOL", desc: language === 'fr' ? "Favicons & Contextes Minimaux" : "Favicons & Minimal Contexts", key: 'simplified' as const, prompt: `SIMPLIFIED UI SYMBOL: A minimalist version of the ${companyName} logo, optimized for small sizes like 16x16 or 32x32 pixels.` }
                   ].map((v, i) => (
                     <div key={i} className="flex items-center gap-8 group">
                        <div className="w-24 h-24 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center p-4 group-hover:bg-indigo-50 transition-colors shadow-sm overflow-hidden relative">
                           {v.isSvg ? (
                             <img 
                               src={URL.createObjectURL(v.svg as Blob)} 
                               className="max-h-full object-contain" 
                               alt={v.name} 
                               onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                             />
                           ) : v.img ? (
                             <img src={v.img as string} className="max-h-full object-contain" alt={v.name} />
                           ) : (
                             <div className="flex flex-col items-center gap-2">
                               <GenerateButton 
                                 onClick={() => handleGenerateSpecificImage(v.key!, v.prompt!)} 
                                 isGenerating={generatingImages[v.key!]} 
                                 label="Générer" 
                               />
                             </div>
                           )}
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">{v.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{v.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="pt-8 space-y-4">
                    <button 
                      onClick={handleGenerateMockups}
                      disabled={isGeneratingMockups}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                    >
                      {isGeneratingMockups ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {language === 'fr' ? 'Génération en cours...' : 'Generating...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {language === 'fr' ? 'Générer Mockups Contextuels' : 'Generate Contextual Mockups'}
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadSVGSource('MASTER_SOURCE', data.styleGuide?.colors?.[0]?.hex || "#4f46e5")}
                      className="w-full py-4 bg-indigo-950 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-950/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {language === 'fr' ? 'Télécharger Source (SVG)' : 'Download Source (SVG)'}
                    </button>
                 </div>
             </div>
          </div>

          {/* SOUS-MENU: VARIATIONS DU LOGOTYPE */}
          <div className="pt-32 space-y-16">
             <div className="flex items-center gap-8">
                <div className="h-1 flex-grow bg-indigo-50"></div>
                <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">
                  {language === 'fr' ? 'Variations du Logo' : 'Logo Variations'}
                </h3>
                <div className="h-1 flex-grow bg-indigo-50"></div>
             </div>

             <p className="text-lg text-slate-600 max-w-3xl mx-auto text-center font-medium leading-relaxed">
               {language === 'fr' 
                 ? "Pour garantir une lisibilité optimale sur tous les supports, le logotype a été décliné en plusieurs variantes adaptées à des contextes d'utilisation spécifiques."
                 : "To ensure optimal readability across all media, the logotype has been developed in several variants adapted to specific usage contexts."}
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[
                  { 
                    id: 'master', 
                    name: language === 'fr' ? 'Logo Principal' : 'Master Logo', 
                    img: data.logo.generatedImageUrl, 
                    color: data.styleGuide?.colors?.[0]?.hex || "#4f46e5", 
                    suffix: 'MASTER', 
                    usage: data.logo.variations.color || (language === 'fr' ? "Utilisation principale sur fonds clairs pour un impact maximal." : "Primary use on light backgrounds for maximum impact.")
                  },
                  { 
                    id: 'simplified', 
                    name: language === 'fr' ? 'Version Simplifiée' : 'Simplified Version', 
                    img: localImages.simplified, 
                    color: data.styleGuide?.colors?.[0]?.hex || "#4f46e5", 
                    suffix: 'SIMPLIFIED', 
                    key: 'simplified' as const, 
                    prompt: `SIMPLIFIED UI SYMBOL: A minimalist version of the ${companyName} logo, optimized for small sizes.`, 
                    usage: data.logo.variations.simplified || (language === 'fr' ? "Version épurée pour les petits formats (UI, icônes) où la lisibilité est critique." : "Simplified version for small formats (UI, icons) where legibility is critical.")
                  },
                  { 
                    id: 'monochrome', 
                    name: language === 'fr' ? 'Version Monochrome' : 'Monochrome Version', 
                    img: localImages.monochrome, 
                    color: '#000000', 
                    suffix: 'MONOCHROME', 
                    key: 'monochrome' as const, 
                    prompt: `SOLID MONOCHROME LOGO: A single-color black version of the logo for ${companyName} on a white background.`, 
                    usage: data.logo.variations.black || (language === 'fr' ? "Version noir et blanc pour l'impression économique ou les documents officiels." : "Black and white version for economical printing or official documents.")
                  },
                  { 
                    id: 'inverted', 
                    name: language === 'fr' ? 'Version Inversée' : 'Inverted Version', 
                    img: localImages.inverted, 
                    color: '#FFFFFF', 
                    suffix: 'INVERTED', 
                    dark: true, 
                    key: 'inverted' as const, 
                    prompt: `NEGATIVE REVERSE LOGO: A white version of the logo for ${companyName} on a solid black background.`, 
                    usage: data.logo.variations.white || (language === 'fr' ? "Version négative pour une visibilité parfaite sur fonds sombres ou colorés." : "Negative version for perfect visibility on dark or colored backgrounds.")
                  },
                  { 
                    id: 'dark', 
                    name: language === 'fr' ? 'Fond Sombre' : 'Dark Background', 
                    img: localImages.darkBg, 
                    color: data.styleGuide?.colors?.[0]?.hex || "#4f46e5", 
                    suffix: 'DARK_BG', 
                    dark: true, 
                    key: 'darkBg' as const, 
                    prompt: `DARK BACKGROUND LOGO: The ${companyName} logo professionally placed on a dark, premium background with appropriate contrast.`, 
                    usage: data.logo.variations.backgrounds || (language === 'fr' ? "Adaptation spécifique pour les environnements à faible luminosité ou premium." : "Specific adaptation for low-light or premium environments.")
                  },
                  { 
                    id: 'favicon', 
                    name: language === 'fr' ? 'Version Favicon' : 'Favicon Version', 
                    img: data.logo.faviconImageUrl, 
                    color: data.styleGuide?.colors?.[0]?.hex || "#4f46e5", 
                    suffix: 'FAVICON', 
                    usage: data.logo.variations.favicon || (language === 'fr' ? "Icône de navigation pour les navigateurs web et applications mobiles." : "Navigation icon for web browsers and mobile applications.")
                  }
                ].map((v, i) => (
                  <div key={i} className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 space-y-6 group/item">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h4 className="text-sm font-black text-indigo-950 uppercase tracking-widest">{v.name}</h4>
                           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Variation {i+1}</p>
                        </div>
                        <div className="flex gap-2">
                          {v.img && (
                            <>
                              <button 
                                onClick={() => handleDownloadSVGSource(v.suffix, v.color)}
                                className="p-3 bg-white rounded-full shadow-md hover:scale-110 transition-all text-indigo-600"
                                title="Download SVG"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </button>
                              <button 
                                onClick={() => handleDownloadSVGSource(v.suffix + '_GEOMETRIC', v.color, true)}
                                className="p-3 bg-white rounded-full shadow-md hover:scale-110 transition-all text-indigo-400"
                                title="Download Geometric SVG"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A2 2 0 013 15.483V4.517a2 2 0 011.553-1.943L9 2l6 3 5.447-2.724A2 2 0 0121 4.517v10.966a2 2 0 01-1.553 1.943L15 20l-6-3z" /></svg>
                              </button>
                            </>
                          )}
                          {!v.img && v.key && (
                            <GenerateButton 
                              onClick={() => handleGenerateSpecificImage(v.key!, v.prompt!)} 
                              isGenerating={generatingImages[v.key!]} 
                              label="Générer" 
                            />
                          )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        {/* Image Preview */}
                        <div className={`aspect-square rounded-2xl overflow-hidden border border-white shadow-sm flex items-center justify-center p-4 ${v.dark ? 'bg-[#0b1120]' : 'bg-white'}`}>
                           {v.img ? (
                             <img src={v.img} className="max-h-full object-contain" alt={v.name} />
                           ) : (
                             <div className="text-indigo-200/30 font-black uppercase text-[8px] text-center">En attente</div>
                           )}
                        </div>
                        
                        {/* Geometric Trace Preview */}
                        <div className="aspect-square rounded-2xl overflow-hidden border border-indigo-100 bg-white relative group/trace">
                           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                           <svg viewBox="0 0 512 512" className="w-full h-full p-6 relative z-10">
                              {/* Construction Circles */}
                              <circle cx="256" cy="256" r="200" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
                              <circle cx="256" cy="256" r="123.6" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" /> {/* 200 / 1.618 */}
                              
                              {/* Axis */}
                              <line x1="256" y1="0" x2="256" y2="512" stroke="#6366f1" strokeWidth="0.5" opacity="0.2" />
                              <line x1="0" y1="256" x2="512" y2="256" stroke="#6366f1" strokeWidth="0.5" opacity="0.2" />
                              
                              {/* Diagonals */}
                              <line x1="0" y1="0" x2="512" y2="512" stroke="#6366f1" strokeWidth="0.3" strokeDasharray="1,2" opacity="0.1" />
                              <line x1="512" y1="0" x2="0" y2="512" stroke="#6366f1" strokeWidth="0.3" strokeDasharray="1,2" opacity="0.1" />

                              {/* The Logo Path */}
                              <path d={cleanSvgPath} fill="none" stroke={v.color === '#FFFFFF' ? '#6366f1' : v.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              
                              {/* Stylized Anchor Points */}
                              <rect x="252" y="56" width="8" height="8" fill="#6366f1" opacity="0.5" />
                              <rect x="252" y="448" width="8" height="8" fill="#6366f1" opacity="0.5" />
                              <rect x="56" y="252" width="8" height="8" fill="#6366f1" opacity="0.5" />
                              <rect x="448" y="252" width="8" height="8" fill="#6366f1" opacity="0.5" />

                              {/* Proportion Indicators */}
                              <g className="opacity-40 font-mono text-[10px] fill-indigo-500">
                                 <text x="265" y="65">y</text>
                                 <text x="265" y="445">y'</text>
                                 <text x="65" y="250">x</text>
                                 <text x="435" y="250">x'</text>
                              </g>
                           </svg>
                           <div className="absolute bottom-2 left-2 font-mono text-[7px] text-indigo-400 uppercase opacity-60">
                              Trace_V.0{i+1} • Scale: 1:1
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/50 rounded-2xl p-4 space-y-2 border border-white">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <span>Dimensions</span>
                           <span className="text-indigo-600">512 x 512 px</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <span>Ratio</span>
                           <span className="text-indigo-600">1 : 1.618</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <span>Nodes</span>
                           <span className="text-indigo-600">Stable</span>
                        </div>
                        <div className="pt-2 border-t border-indigo-50">
                           <p className="text-[8px] font-medium text-slate-500 leading-relaxed italic">
                              {v.usage}
                           </p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em] mt-12">
            <span>{companyName} / Brand Book</span>
            <span>Page 04</span>
          </div>
        </section>

        {/* SECTION 03: MODE D'UTILISATION (RÈGLES D'USAGE) */}
        <div className="page-break"></div>
        <section id="section-usage" className="h-[1120px] p-32 bg-indigo-50/30 flex flex-col justify-between">
          <div className="space-y-24">
            <div className="flex items-end gap-10 border-b-4 border-indigo-100 pb-16">
              <span className="text-[12rem] font-serif text-indigo-100 font-black leading-none select-none">03</span>
              <div className="pb-4">
                <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Usage du Logo</h2>
                <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Intégrité Visuelle et Protection</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
               <div className="space-y-12">
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Zone d'Exclusion</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">Une zone de protection égale à 25% de la hauteur du logo doit être respectée tout autour du symbole. Aucun élément graphique ou textuel ne doit pénétrer cet espace.</p>
                     <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-indigo-200 flex items-center justify-center relative group overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute inset-6 border border-indigo-400/20 bg-indigo-500/5 rounded-2xl"></div>
                        {data.logo.generatedImageUrl && (
                           <img src={data.logo.generatedImageUrl} className="w-32 h-32 relative z-10" />
                        )}
                        
                        {/* Clear Space Visualization */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                          <div className="absolute top-0 left-0 w-full h-6 bg-red-500/10 flex items-center justify-center"><span className="text-[8px] text-red-500 font-black">X</span></div>
                          <div className="absolute bottom-0 left-0 w-full h-6 bg-red-500/10 flex items-center justify-center"><span className="text-[8px] text-red-500 font-black">X</span></div>
                          <div className="absolute top-0 left-0 w-6 h-full bg-red-500/10 flex items-center justify-center"><span className="text-[8px] text-red-500 font-black">X</span></div>
                          <div className="absolute top-0 right-0 w-6 h-full bg-red-500/10 flex items-center justify-center"><span className="text-[8px] text-red-500 font-black">X</span></div>
                        </div>

                        <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] px-3 py-1 rounded-full uppercase font-black tracking-widest z-20">Zone X Security</span>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Taille Minimale</h3>
                     <div className="flex items-center gap-12">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Print</p>
                           <p className="text-2xl font-black text-indigo-950">20 mm</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital</p>
                           <p className="text-2xl font-black text-indigo-950">40 px</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-12">
                  <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight text-red-600">Interdictions</h3>
                  <div className="grid grid-cols-2 gap-8">
                     {[
                       { label: "Ne pas déformer", icon: "🚫" },
                       { label: "Ne pas pivoter", icon: "🚫" },
                       { label: "Pas de dégradé", icon: "🚫" },
                       { label: "Pas d'ombre portée", icon: "🚫" }
                     ].map((rule, i) => (
                       <div key={i} className="p-8 bg-white rounded-3xl border border-gray-100 flex flex-col items-center text-center space-y-4">
                          <span className="text-2xl">{rule.icon}</span>
                          <p className="text-[10px] font-black text-indigo-950 uppercase tracking-widest leading-tight">{rule.label}</p>
                       </div>
                     ))}
                  </div>
                  <div className="p-10 bg-indigo-900 rounded-[3rem] text-white">
                     <p className="text-sm font-bold leading-relaxed">"Le logo est l'atout le plus précieux de la marque. Toute altération diminue sa force de reconnaissance et sa valeur stratégique."</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
            <span>{companyName} / Brand Book</span>
            <span>Page 05</span>
          </div>
        </section>

        {/* SECTION 04: TYPOGRAPHIE */}
        <div className="page-break"></div>
        <section id="section-typography" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
          <div className="space-y-24">
            <div className="flex items-end gap-10 border-b-4 border-gray-200 pb-16">
              <span className="text-[12rem] font-serif text-gray-100 font-black leading-none select-none">04</span>
              <div className="pb-4">
                <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Typographie</h2>
                <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Hiérarchie, Rythme et Lisibilité</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
               <div className="space-y-12">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Police de Titrage</p>
                     <h3 className="text-8xl font-black text-indigo-950 leading-none">{data.styleGuide.typography.titles.fontFamily}</h3>
                     <p className="text-sm text-slate-500 font-medium italic">{data.styleGuide.typography.titles.usage}</p>
                  </div>
                  <div className="p-12 bg-gray-50 rounded-[3rem] shadow-sm font-mono text-indigo-900/60 leading-loose">
                     A B C D E F G H I J K L M N O P Q R S T U V W X Y Z <br/>
                     a b c d e f g h i j k l m n o p q r s t u v w x y z <br/>
                     0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( ) _ +
                  </div>
               </div>
               <div className="space-y-12">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Police de Labeur</p>
                     <h3 className="text-6xl font-bold text-indigo-950">{data.styleGuide.typography.body.fontFamily}</h3>
                     <p className="text-sm text-slate-500 font-medium italic">{data.styleGuide.typography.body.usage}</p>
                  </div>
                  <div className="space-y-6 text-2xl text-slate-600 leading-relaxed font-light">
                     <p>Le rythme typographique est l'âme du branding. Nous avons sélectionné {data.styleGuide.typography.body.fontFamily} pour son équilibre entre autorité institutionnelle et modernité technologique.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
            <span>{companyName} / Brand Book</span>
            <span>Page 06</span>
          </div>
        </section>

        {/* SECTION 05: ÉLÉMENTS GRAPHIQUES */}
        <div className="page-break"></div>
        <section id="section-elements" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
          <div className="space-y-24">
            <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
              <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">05</span>
              <div className="pb-4">
                <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Éléments Graphiques</h2>
                <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Motifs, Textures & Univers Visuel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
               <div className="space-y-12">
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Motif de Marque (Pattern)</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.graphicElements?.patternConcept || "Un motif géométrique sophistiqué reflétant la précision de la marque."}</p>
                     <div className="aspect-video rounded-[3rem] overflow-hidden border-8 border-gray-50 shadow-2xl relative">
                        {localImages.pattern ? (
                          <img src={localImages.pattern} className="w-full h-full object-cover" alt="Brand Pattern" />
                        ) : (
                          <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                             <GenerateButton 
                               onClick={() => handleGenerateSpecificImage('pattern', `BRAND PATTERN DESIGN: A professional, high-end repeating pattern for the brand ${companyName}. Based on the concept: ${data.styleGuide?.graphicElements?.patternConcept || "Geometric elegance"}. Clean, elegant, and modern.`)} 
                               isGenerating={generatingImages.pattern} 
                               label="Générer le Motif" 
                             />
                          </div>
                        )}
                     </div>
                  </div>
               </div>
               <div className="space-y-12">
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Textures & Ambiance</h3>
                     <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.graphicElements?.textureDescription || "Une texture subtile et raffinée évoquant le luxe et la qualité."}</p>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="h-48 bg-slate-100 rounded-3xl border border-slate-200 flex items-center justify-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texture A</span>
                        </div>
                        <div className="h-48 bg-indigo-900 rounded-3xl border border-indigo-800 flex items-center justify-center">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Texture B</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
            <span>{companyName} / Brand Book</span>
            <span>Page 07</span>
          </div>
        </section>

        {/* SECTION 06: APPLICATIONS PRINT */}
        {selectedSections.includes('print') && (
          <>
            <div className="page-break"></div>
            <section id="section-print" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">06</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Applications Print</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Tangibilité et Présence Physique</p>
                  </div>
                </div>

                <div className="space-y-24">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div className="rounded-[4rem] overflow-hidden shadow-3xl border-8 border-gray-50 bg-gray-100 flex items-center justify-center min-h-[300px]">
                         {localImages.businessCard ? (
                           <img src={localImages.businessCard} className="w-full h-full object-cover" alt="Carte de Visite" />
                         ) : (
                           <GenerateButton 
                             onClick={() => handleGenerateSpecificImage('businessCard', `BUSINESS CARD MOCKUP: A professional business card design for ${companyName}. Premium feel, clean typography, showing the logo clearly.`)} 
                             isGenerating={generatingImages.businessCard} 
                             label="Générer Carte de Visite" 
                           />
                         )}
                      </div>
                      <div className="space-y-8">
                         <h4 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Carte de Visite Master</h4>
                         <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-500 pl-6 text-lg">
                            {data.styleGuide?.ecosystem?.print?.businessCard || "Design minimaliste avec logo centré et typographie élégante."}
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-row-reverse">
                      <div className="space-y-8 text-right order-2 lg:order-1">
                         <h4 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Flyer Promotionnel A4</h4>
                         <p className="text-slate-600 font-medium leading-relaxed italic border-r-4 border-indigo-500 pr-6 text-lg">
                            {data.styleGuide?.ecosystem?.print?.flyerLayout || "Grille moderne avec sections claires et utilisation du motif de marque."}
                         </p>
                      </div>
                      <div className="rounded-[4rem] overflow-hidden shadow-3xl border-8 border-gray-50 bg-gray-100 order-1 lg:order-2 aspect-[1/1.4] flex items-center justify-center min-h-[400px]">
                         {localImages.flyer ? (
                           <img src={localImages.flyer} className="w-full h-full object-cover" alt="Flyer A4" />
                         ) : (
                           <GenerateButton 
                             onClick={() => handleGenerateSpecificImage('flyer', `PROMOTIONAL FLYER MOCKUP: A high-end A4 flyer design for ${companyName}. Modern layout, impactful visuals, and clear brand identity.`)} 
                             isGenerating={generatingImages.flyer} 
                             label="Générer Flyer" 
                           />
                         )}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 08</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 07: ÉCOSYSTÈME DIGITAL */}
        {selectedSections.includes('ecosystem') && (
          <>
            <div className="page-break"></div>
            <section id="section-ecosystem" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">06</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Écosystème Digital</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Expérience & Bannières Dynamiques</p>
                  </div>
                </div>
                <div className="space-y-24">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {(data.styleGuide?.extraMockups || []).slice(0, 4).map((m, i) => (
                        <div key={i} className="rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/3] border-8 border-gray-50 group">
                           {m && (
                             <img src={m} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={`Mockup ${i+1}`} />
                           )}
                        </div>
                      ))}
                   </div>

                   {/* DIGITAL MOTION SECTION */}
                   {(generatedVideoUrl || data.styleGuide?.ecosystem?.promoVideoUrl || (isAdmin && hasApiKey)) && (
                     <div className="space-y-12 pt-12 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                           <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Digital Motion Assets</h3>
                           {isAdmin && hasApiKey && !generatedVideoUrl && (
                              <button 
                                onClick={handleGenerateVideo}
                                disabled={isGeneratingVideo}
                                className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                              >
                                {isGeneratingVideo ? (
                                   <>
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      Génération...
                                   </>
                                ) : (
                                   <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                      Générer l'Animation
                                   </>
                                )}
                              </button>
                           )}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                           {generatedVideoUrl && (
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Logo Animation Master</p>
                                <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-video border-8 border-gray-50">
                                   <video src={generatedVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                </div>
                             </div>
                           )}
                           {data.styleGuide.ecosystem.promoVideoUrl && (
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Promotional Video</p>
                                <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-video border-8 border-gray-50">
                                   <video src={data.styleGuide.ecosystem.promoVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                   )}

                   {/* ÉCOSYSTÈME VISUEL SUBSECTION */}
                   <div className="space-y-12 pt-12 border-t border-gray-100">
                      <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Écosystème Visuel</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="bg-slate-50 rounded-[2rem] p-8 space-y-4 hover:bg-indigo-50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                               </div>
                               <h4 className="text-lg font-black text-indigo-950 uppercase tracking-tight">Interface Web</h4>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                               {data.styleGuide?.ecosystem?.digital?.webInterface || "Interface épurée axée sur l'expérience utilisateur et la clarté visuelle."}
                            </p>
                         </div>
                         <div className="bg-slate-50 rounded-[2rem] p-8 space-y-4 hover:bg-indigo-50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                               </div>
                               <h4 className="text-lg font-black text-indigo-950 uppercase tracking-tight">App Mobile</h4>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                               {data.styleGuide?.ecosystem?.digital?.appDesign || "Design mobile-first avec une navigation intuitive et des micro-interactions."}
                            </p>
                         </div>
                         <div className="bg-slate-50 rounded-[2rem] p-8 space-y-4 hover:bg-indigo-50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                               </div>
                               <h4 className="text-lg font-black text-indigo-950 uppercase tracking-tight">Réseaux Sociaux</h4>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                               {data.styleGuide?.ecosystem?.socialMedia?.postTemplate || "Template flexible permettant une communication cohérente sur tous les réseaux."}
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* AI LAUNCH POST SECTION */}
                   <div className="space-y-12 pt-12 border-t border-gray-100">
                      <div className="flex justify-between items-end">
                        <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">AI Copywriting</h3>
                        <button 
                          onClick={handleGenerateLaunchPost}
                          disabled={isGeneratingPost}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isGeneratingPost ? 'Génération...' : 'Générer Post de Lancement'}
                        </button>
                      </div>
                      
                      {launchPost ? (
                        <div className="bg-slate-50 rounded-[3rem] p-12 relative group">
                           <button 
                             onClick={handleCopyPost}
                             className="absolute top-8 right-8 p-4 bg-white rounded-2xl shadow-lg hover:scale-110 transition-all text-indigo-600"
                             title="Copier le texte"
                           >
                             {copySuccess === 'post' ? (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                             ) : (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             )}
                           </button>
                           <div className="prose prose-indigo max-w-none whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                              {launchPost}
                           </div>
                        </div>
                      ) : (
                        <div className="h-40 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex items-center justify-center">
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Prêt pour la stratégie de contenu</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 09</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 08: STRATÉGIE SOCIALE */}
        {selectedSections.includes('social') && (
          <>
            <div className="page-break"></div>
            <section id="section-social" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">08</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Stratégie Sociale</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Engagement & Cohérence de Flux</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                   <div className="space-y-12">
                      <div className="space-y-6 group relative">
                         <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Style d'Avatar</h3>
                            <CopyButton text={data.styleGuide?.ecosystem?.socialMedia?.avatarStyle || ""} id="avatar-style" className="opacity-0 group-hover:opacity-100" />
                         </div>
                         <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.ecosystem?.socialMedia?.avatarStyle || "Utilisation du symbole simplifié sur fond de couleur primaire."}</p>
                         <div className="flex gap-8">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 shadow-xl">
                                {data.logo.faviconImageUrl && (
                                 <img src={data.logo.faviconImageUrl} className="w-full h-full object-contain p-4 bg-white" alt="Social Avatar" />
                               )}
                            </div>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-900 shadow-xl bg-indigo-950 flex items-center justify-center p-4">
                                {data.logo.invertedImageUrl && (
                                 <img src={data.logo.invertedImageUrl} className="w-full h-full object-contain" alt="Social Avatar Inverted" />
                               )}
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6 group relative">
                         <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Concept de Bannière</h3>
                            <CopyButton text={data.styleGuide?.ecosystem?.socialMedia?.bannerConcept || ""} id="banner-concept" className="opacity-0 group-hover:opacity-100" />
                         </div>
                         <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.ecosystem?.socialMedia?.bannerConcept || "Composition dynamique utilisant le motif de marque et le logo secondaire."}</p>
                         <div className="h-32 bg-indigo-900 rounded-3xl border border-indigo-800 flex items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${data.styleGuide?.graphicElements?.patternImageUrl || ""})`, backgroundSize: 'cover' }}></div>
                            <span className="relative z-10 text-white font-black uppercase tracking-[1em] text-[10px]">{companyName}</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-12">
                      <div className="space-y-6 group relative">
                         <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Template de Post</h3>
                            <CopyButton text={data.styleGuide?.ecosystem?.socialMedia?.postTemplate || ""} id="post-template" className="opacity-0 group-hover:opacity-100" />
                         </div>
                         <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.ecosystem?.socialMedia?.postTemplate || "Un design épuré mettant en avant le message central avec une typographie forte."}</p>
                         <div className="aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 p-8 flex flex-col justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-full border border-slate-200"></div>
                               <div className="space-y-1">
                                  <div className="w-24 h-2 bg-slate-200 rounded"></div>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded"></div>
                               </div>
                            </div>
                            <div className="flex-grow flex items-center justify-center">
                                {data.logo.generatedImageUrl && (
                                 <img src={data.logo.generatedImageUrl} className="w-24 opacity-20" />
                               )}
                            </div>
                            <div className="space-y-2">
                               <div className="w-full h-2 bg-slate-200 rounded"></div>
                               <div className="w-3/4 h-2 bg-slate-200 rounded"></div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 10</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 09: PACKAGING & MATÉRIAUX */}
        {selectedSections.includes('packaging') && (
          <>
            <div className="page-break"></div>
            <section id="section-packaging" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">09</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Packaging & Matériaux</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Expérience Tactile & Finitions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Suggestions de Matériaux</h3>
                         <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.ecosystem?.packaging?.materialSuggestion || "Papier de création texturé avec finitions métallisées."}</p>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
                               <p className="text-[10px] font-black text-indigo-600 uppercase">Primaire</p>
                               <p className="text-sm font-bold text-indigo-950">Papier Texturé 350g</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
                               <p className="text-[10px] font-black text-indigo-600 uppercase">Secondaire</p>
                               <p className="text-sm font-bold text-indigo-950">Finition Soft Touch</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Style d'Étiquetage</h3>
                         <p className="text-slate-600 leading-relaxed font-medium">{data.styleGuide?.ecosystem?.packaging?.labelingStyle || "Minimaliste, centré, avec une hiérarchie typographique claire."}</p>
                         <div className="h-64 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex items-center justify-center p-12">
                            <div className="w-full max-w-xs bg-white p-8 rounded-xl shadow-xl border border-slate-100 space-y-4">
                               <div className="flex justify-between items-center">
                                  {data.logo.faviconImageUrl && (
                                     <img src={data.logo.faviconImageUrl} className="w-8" />
                                  )}
                                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Premium Batch</span>
                               </div>
                               <div className="h-0.5 bg-slate-100 w-full"></div>
                               <h4 className="text-lg font-black text-indigo-950 uppercase tracking-tighter">{companyName}</h4>
                               <div className="space-y-1">
                                  <div className="w-full h-1 bg-slate-100 rounded"></div>
                                  <div className="w-2/3 h-1 bg-slate-100 rounded"></div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 11</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 10: MOCKUPS CONTEXTUELS */}
        {selectedSections.includes('mockups') && (
          <>
            <div className="page-break"></div>
            <section id="section-mockups" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">10</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Mockups Contextuels</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Projections Réelles & Immersion</p>
                  </div>
                </div>
                
                {contextualMockups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2 h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-50">
                      {contextualMockups[0] && (
                        <img src={contextualMockups[0]} className="w-full h-full object-cover" alt="Website Header" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-8 col-span-2">
                       {contextualMockups.slice(1, 5).map((m, i) => (
                         <div key={i} className="h-[250px] rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-gray-50">
                           {m && (
                             <img src={m} className="w-full h-full object-cover" alt={`Mockup ${i+2}`} />
                           )}
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-200 space-y-8">
                     <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div className="text-center space-y-2">
                        <h4 className="text-xl font-black text-indigo-950 uppercase">Générer les Projections</h4>
                        <p className="text-slate-400 font-medium max-w-sm">Utilisez l'IA pour projeter votre marque dans le monde réel avec 5 mockups haute fidélité.</p>
                     </div>
                     <button 
                       onClick={handleGenerateMockups}
                       disabled={isGeneratingMockups}
                       className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-50 flex items-center gap-4"
                     >
                       {isGeneratingMockups ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           Génération en cours...
                         </>
                       ) : "Lancer la Génération"}
                     </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 12</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 11: NUANCIER TECHNIQUE */}
        {selectedSections.includes('palette') && (
          <>
            <div className="page-break"></div>
            <section id="section-palette" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
               <div className="space-y-24">
                  <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                    <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">11</span>
                    <div className="pb-4">
                      <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Nuancier Technique</h2>
                      <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Spécifications Chromatiques</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     {(data.styleGuide?.colors || []).map((c, i) => (
                       <div key={i} className="space-y-6">
                          <div className="h-48 w-full rounded-[3rem] shadow-xl" style={{ backgroundColor: c.hex }}></div>
                          <div className="space-y-2">
                             <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">{c.name}</h4>
                             <p className="font-mono text-[10px] text-indigo-400 font-bold">{c.hex} • {c.rgb}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 13</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 12: LOGIQUE DE CONCEPTION */}
        {selectedSections.includes('logic') && (
          <>
            <div className="page-break"></div>
            <section id="section-logic" className="h-[1120px] p-32 bg-white flex flex-col justify-between overflow-hidden">
               <div className="space-y-16">
                  <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                    <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">12</span>
                    <div className="pb-4">
                      <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">
                        {language === 'fr' ? 'Logique de Conception' : 'Design Logic'}
                      </h2>
                      <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">
                        {language === 'fr' ? 'Standards & Règles de Design' : 'Design Standards & Rules'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                     <div className="space-y-12">
                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             01. {language === 'fr' ? 'Hiérarchie Visuelle' : 'Visual Hierarchy'}
                           </h4>
                           <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                              <p className="text-sm text-slate-600 leading-relaxed italic">
                                {language === 'fr' 
                                  ? '"Le mot le plus important doit dominer le logo pour une lecture instantanée."'
                                  : '"The most important word must dominate the logo for instant reading."'}
                              </p>
                              <ul className="text-xs font-bold text-indigo-900 space-y-2 uppercase tracking-wider">
                                 <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-600 rounded-full"></span> {language === 'fr' ? 'Marque' : 'Brand'} : 100%</li>
                                 <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span> Slogan : ~40%</li>
                                 <li className="flex items-center gap-3"><span className="w-2 h-2 bg-indigo-200 rounded-full"></span> {language === 'fr' ? 'Texte Secondaire' : 'Secondary Text'} : ~20%</li>
                              </ul>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             02. {language === 'fr' ? 'Règle des 60-30-10' : '60-30-10 Rule'}
                           </h4>
                           <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {language === 'fr' ? 'Distribution chromatique pour une harmonie parfaite :' : 'Chromatic distribution for perfect harmony:'}
                              </p>
                              <div className="flex h-8 rounded-full overflow-hidden border border-slate-200">
                                 <div className="w-[60%] bg-indigo-900"></div>
                                 <div className="w-[30%] bg-indigo-400"></div>
                                 <div className="w-[10%] bg-amber-400"></div>
                              </div>
                              <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                 <span>60% {language === 'fr' ? 'Principal' : 'Primary'}</span>
                                 <span className="text-center">30% {language === 'fr' ? 'Secondaire' : 'Secondary'}</span>
                                 <span className="text-right">10% Accent</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             03. {language === 'fr' ? 'Nombre d\'Or (Golden Ratio)' : 'Golden Ratio (1:1.618)'}
                           </h4>
                           <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {language === 'fr' 
                                  ? 'L\'équilibre parfait de la nature appliqué au design pour une esthétique intemporelle.'
                                  : 'Nature\'s perfect balance applied to design for a timeless aesthetic.'}
                              </p>
                              <div className="flex justify-center py-2">
                                 <svg viewBox="0 0 161.8 100" className="w-32 h-20 text-indigo-200 fill-none stroke-current stroke-1">
                                    <rect x="0" y="0" width="161.8" height="100" />
                                    <rect x="100" y="0" width="61.8" height="61.8" />
                                    <path d="M0,100 A100,100 0 0,1 100,0 A61.8,61.8 0 0,1 161.8,61.8" />
                                 </svg>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-12">
                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             04. {language === 'fr' ? 'Standards Typographiques' : 'Typography Standards'}
                           </h4>
                           <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                              <ul className="text-xs font-bold text-slate-600 space-y-3 uppercase tracking-wider">
                                 <li className="flex items-center gap-3">
                                   <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> 
                                   {language === 'fr' ? 'Max 3 couleurs distinctes' : 'Max 3 distinct colors'}
                                 </li>
                                 <li className="flex items-center gap-3">
                                   <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> 
                                   {language === 'fr' ? 'Limitation à 2 polices' : 'Limit to 2 fonts'}
                                 </li>
                                 <li className="flex items-center gap-3">
                                   <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> 
                                   {language === 'fr' ? 'Approche (Kerning) équilibrée' : 'Balanced Kerning'}
                                 </li>
                              </ul>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             05. {language === 'fr' ? 'Tests de Validation' : 'Validation Tests'}
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-indigo-50 p-6 rounded-2xl text-center">
                                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">5-Second Test</p>
                                 <p className="text-[9px] text-indigo-900 leading-tight">
                                   {language === 'fr' ? 'Compréhension immédiate de la marque.' : 'Immediate brand understanding.'}
                                 </p>
                              </div>
                              <div className="bg-indigo-50 p-6 rounded-2xl text-center">
                                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">B&W Test</p>
                                 <p className="text-[9px] text-indigo-900 leading-tight">
                                   {language === 'fr' ? 'Lisibilité parfaite sans couleur.' : 'Perfect legibility without color.'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xl font-black text-indigo-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-6">
                             06. {language === 'fr' ? 'Règle SMT-VR' : 'SMT-VR Rule'}
                           </h4>
                           <div className="bg-indigo-950 p-8 rounded-3xl">
                              <div className="grid grid-cols-1 gap-4">
                                 {[
                                    { k: 'S', v: language === 'fr' ? 'Simple' : 'Simple', d: language === 'fr' ? 'Élimination du superflu' : 'Eliminate the superfluous' },
                                    { k: 'M', v: language === 'fr' ? 'Mémorable' : 'Memorable', d: language === 'fr' ? 'Impact visuel immédiat' : 'Immediate visual impact' },
                                    { k: 'T', v: language === 'fr' ? 'Timeless' : 'Timeless', d: language === 'fr' ? 'Résiste aux modes' : 'Resists trends' },
                                    { k: 'V', v: language === 'fr' ? 'Versatile' : 'Versatile', d: language === 'fr' ? 'Adaptable tout support' : 'Adaptable to all media' },
                                    { k: 'R', v: language === 'fr' ? 'Relevant' : 'Relevant', d: language === 'fr' ? 'Aligné avec l\'audience' : 'Aligned with audience' }
                                 ].map((rule, i) => (
                                    <div key={i} className="flex items-center gap-6 group">
                                       <span className="text-2xl font-black text-indigo-500 group-hover:text-white transition-colors">{rule.k}</span>
                                       <div>
                                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{rule.v}</p>
                                          <p className="text-[9px] text-white/40 font-medium">{rule.d}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 14</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 13: STRATÉGIE DE LANCEMENT */}
        {selectedSections.includes('strategy') && (
          <>
            <div className="page-break"></div>
            <section id="section-strategy" className="h-[1120px] p-32 bg-white flex flex-col justify-between">
              <div className="space-y-24">
                <div className="flex items-end gap-10 border-b-4 border-indigo-50 pb-16">
                  <span className="text-[12rem] font-serif text-indigo-50/80 font-black leading-none select-none">13</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">Stratégie de Lancement</h2>
                    <p className="text-indigo-500 font-black tracking-[0.5em] uppercase text-sm mt-4">Plan de Déploiement AI & Communication</p>
                  </div>
                </div>

                <div className="space-y-16">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-8">
                         <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Post de Lancement LinkedIn</h3>
                         <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 relative">
                            <div className="prose prose-sm prose-indigo max-w-none whitespace-pre-wrap font-medium text-slate-700 leading-relaxed italic">
                               {launchPost || "Générez votre post de lancement dans l'interface pour le voir ici."}
                            </div>
                         </div>
                      </div>
                      <div className="space-y-8">
                         <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">Checklist de Déploiement</h3>
                         <div className="space-y-4">
                            {[
                              "Mise à jour des profils sociaux (Avatar & Bannière)",
                              "Intégration du Favicon sur le site web",
                              "Impression des cartes de visite Master",
                              "Publication du post de lancement officiel",
                              "Mise à jour de la signature mail"
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                                 <div className="w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                                 </div>
                                 <span className="text-sm font-bold text-indigo-900 uppercase tracking-tight">{item}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em]">
                <span>{companyName} / Brand Book</span>
                <span>Page 15</span>
              </div>
            </section>
          </>
        )}

        {/* SECTION 14: RECOMMANDATIONS FUTURES */}
        {selectedSections.includes('future') && (
          <>
            <div className="page-break"></div>
            <section id="section-future" className="h-[1120px] p-32 bg-[#050810] text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/30 blur-[200px] rounded-full"></div>
              </div>
              
              <div className="space-y-24 relative z-10">
                <div className="flex items-end gap-10 border-b-4 border-white/10 pb-16">
                  <span className="text-[12rem] font-serif text-white/10 font-black leading-none select-none">14</span>
                  <div className="pb-4">
                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter">Recommandations</h2>
                    <p className="text-indigo-400 font-black tracking-[0.5em] uppercase text-sm mt-4">Évolutions & Futur de la Marque</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                   <div className="space-y-12">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight border-l-8 border-indigo-500 pl-8">Vision à Long Terme</h3>
                      <div className="space-y-8">
                         {(data.analysis?.futureRecommendations || []).map((rec, i) => (
                           <div key={i} className="flex gap-8 group relative">
                              <span className="text-4xl font-serif font-black text-indigo-500/30 group-hover:text-indigo-500 transition-colors">0{i+1}</span>
                              <div className="flex-grow flex justify-between items-start gap-4">
                                <p className="text-xl text-white/70 leading-relaxed font-medium">{rec}</p>
                                <CopyButton text={rec} id={`future-rec-${i}`} className="opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 text-white" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="flex items-center justify-center">
                      <div className="w-80 h-80 bg-white/5 rounded-[5rem] border border-white/10 flex items-center justify-center p-16 backdrop-blur-3xl relative">
                         <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                         {data.logo.faviconImageUrl && (
                           <img src={data.logo.faviconImageUrl} className="w-full h-full object-contain relative z-10 opacity-50 grayscale" alt="Future Vision" />
                        )}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-[0.5em] relative z-10">
                <span>{companyName} / Brand Book</span>
                <span>Page 16</span>
              </div>
            </section>
          </>
        )}

        {/* THANK YOU PAGE */}
        {selectedSections.includes('thanks') && (
          <>
            <div className="page-break"></div>
            <section id="section-thanks" className="h-[1120px] p-32 bg-[#050810] text-white flex flex-col justify-center items-center font-display relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-600/20 blur-[200px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600/10 blur-[200px] rounded-full"></div>
              </div>
              
              <div className="text-center space-y-16 relative z-10">
                <div className="w-48 h-48 bg-white rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl p-10 mb-12">
                   {data.logo.faviconImageUrl && (
                    <img src={data.logo.faviconImageUrl} className="w-full h-full object-contain" alt="Final Symbol" />
                 )}
                </div>
                <h2 className="text-8xl font-black tracking-tighter uppercase leading-none">Merci.</h2>
                <p className="text-2xl text-indigo-400 font-light tracking-[0.5em] uppercase opacity-60">Identity System Complete</p>
                <div className="h-1 w-24 bg-indigo-500 mx-auto mt-12"></div>
                <div className="pt-24 space-y-4">
                  <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/30">Contact Support</p>
                  <p className="text-lg font-bold">studio@brandgenius.ai</p>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="p-24 bg-indigo-950 text-white flex justify-between items-center text-[10px] font-black uppercase tracking-[0.6em]">
           <p>© 2026 BrandGenius Absolute • Tous Droits Réservés</p>
           <p>Master Bundle Pack v4.6</p>
        </div>
      </div>

      {/* FLOATING ACTION PANEL */}
      <div className="max-w-5xl mx-auto space-y-12 px-6 print:hidden">
         <div className="glass-dark rounded-[3rem] p-10 border border-white/20">
            <h3 className="text-center text-white text-[12px] font-black uppercase tracking-[0.4em] mb-8">Composition de l'Export PDF</h3>
            <div className="flex flex-wrap justify-center gap-4">
               {[
                 { id: 'cover', label: 'Couverture' },
                 { id: 'toc', label: 'Sommaire' },
                 { id: 'dna', label: 'ADN' },
                 { id: 'manifesto', label: 'Manifeste' },
                 { id: 'blueprint', label: 'Blueprint Logo' },
                 { id: 'usage', label: 'Mode d\'Utilisation' },
                 { id: 'typography', label: 'Typographie' },
                 { id: 'elements', label: 'Éléments' },
                 { id: 'print', label: 'Supports Print' },
                 { id: 'ecosystem', label: 'Écosystème' },
                 { id: 'social', label: 'Social' },
                 { id: 'packaging', label: 'Packaging' },
                 { id: 'mockups', label: 'Mockups' },
                 { id: 'palette', label: 'Nuancier' },
                 { id: 'logic', label: 'Logique' },
                 { id: 'strategy', label: 'Lancement' },
                 { id: 'future', label: 'Futur' },
                 { id: 'thanks', label: 'Remerciements' }
               ].map((sec) => (
                 <button 
                   key={sec.id}
                   onClick={() => toggleSection(sec.id as SectionKey)}
                   className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                     selectedSections.includes(sec.id as SectionKey) 
                       ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                       : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80'
                   }`}
                 >
                   {sec.label}
                 </button>
               ))}
            </div>
         </div>
         <div className="flex flex-col sm:flex-row gap-8">
            <button 
                onClick={handleDownloadAssets}
                disabled={isZipping}
                className="flex-grow py-10 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 font-black rounded-[3rem] hover:scale-105 transition-all text-xl uppercase tracking-tighter shadow-[0_0_40px_rgba(251,191,36,0.3)] flex items-center justify-center gap-6 disabled:opacity-50"
            >
                {isZipping ? (
                    <>
                        <div className="w-6 h-6 border-4 border-amber-900/30 border-t-amber-900 rounded-full animate-spin"></div>
                        Compression...
                    </>
                ) : (
                    <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Télécharger le Brand Pack (ZIP)
                    </>
                )}
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={selectedSections.length === 0 || isGeneratingPDF} 
              className="px-12 py-10 bg-indigo-600 text-white font-black rounded-[3rem] hover:bg-indigo-700 shadow-2xl transition-all text-lg uppercase tracking-tighter flex items-center justify-center gap-4 disabled:opacity-50 border border-white/10"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Export PDF
                </>
              )}
            </button>
         </div>
      </div>
    </div>
  );
};

export default BrandingResult;
