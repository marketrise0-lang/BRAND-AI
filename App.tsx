import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import InputForm from './components/InputForm';
import LogoBrandingForm from './components/LogoBrandingForm';
import BrandingResult from './components/BrandingResult';
import AdvancedLab from './components/AdvancedLab';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyEmail from './components/VerifyEmail';
import Home from './src/components/Home';
import Checkout from './src/components/Checkout';
import AdminDashboard from './src/components/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider, useAuth } from './AuthContext';
import { auth, db } from './src/firebase';
import { signOut } from 'firebase/auth';
import { 
  subscribeToProjects, 
  subscribeToProgress, 
  subscribeToActivity, 
  subscribeToDownloads,
  createProject,
  updateProgress,
  logActivity,
  recordDownload,
  updateProject,
  createUserProfile,
  subscribeToUserSubscription
} from './src/services/firestoreService';
import { createAdminProfile } from './src/services/adminService';
import MyProjects from './components/dashboard/MyProjects';
import DesignProgress from './components/dashboard/DesignProgress';
import MyDownloads from './components/dashboard/MyDownloads';
import ActivityHistory from './components/dashboard/ActivityHistory';
import CreateProjectModal from './components/dashboard/CreateProjectModal';
import ExportDesignModal from './components/dashboard/ExportDesignModal';
import { BrandProfile, BrandingResult as BrandingType, Project, DesignProgress as ProgressType, Activity, Download, Subscription } from './types';
import { generateBranding, generateBrandingFromLogo, generateImage, fastAnalyzeContent, generateVideoVeo } from './services/geminiService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Une erreur inattendue est survenue.";
      const errorMsg = this.state.error?.message || "";
      const errorName = this.state.error?.name || "";
      
      // Ignore AbortErrors in UI
      const isAbort = errorName === 'AbortError' || 
                      errorName === 'CanceledError' ||
                      errorMsg.toLowerCase().includes("aborted") || 
                      errorMsg.toLowerCase().includes("canceled") ||
                      errorMsg.toLowerCase().includes("the user aborted a request");
      
      if (isAbort) {
        return this.props.children;
      }

      try {
        if (errorMsg.startsWith('{') && errorMsg.endsWith('}')) {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error) message = `Erreur (${parsed.operationType}): ${parsed.error}`;
        } else if (errorMsg) {
          message = errorMsg;
        }
      } catch (e) {
        if (errorMsg) message = errorMsg;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">
          <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-red-500/30 max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-3xl font-serif italic text-white mb-4">Oups ! Quelque chose s'est mal passé.</h2>
            <p className="text-indigo-200/60 mb-8 font-medium">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<BrandingType | null>(null);
  const [error, setError] = useState<{ message: string; type: 'quota' | 'generic' | 'auth' } | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fastAnalysis, setFastAnalysis] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<'text' | 'logo'>('text');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  
  // Dashboard Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [progress, setProgress] = useState<ProgressType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'projects' | 'progress' | 'downloads' | 'history'>('generate');

  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    setIsVisible(true);
    setHasApiKey(true);

    if (user) {
      createUserProfile(user.uid, user.email || '', user.displayName || 'User');
      if (user.email === 'ngwanoloic256@gmail.com') {
        createAdminProfile(user);
      }
      
      const unsubProjects = subscribeToProjects(user.uid, (data) => {
        setProjects(data);
        setIsDashboardLoading(false);
      });
      const unsubProgress = subscribeToProgress(user.uid, setProgress);
      const unsubActivity = subscribeToActivity(user.uid, setActivities);
      const unsubDownloads = subscribeToDownloads(user.uid, setDownloads);
      const unsubSubscription = subscribeToUserSubscription(user.uid, setSubscription);

      return () => {
        unsubProjects();
        unsubProgress();
        unsubActivity();
        unsubDownloads();
        unsubSubscription();
      };
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };

  const handleApiError = (err: any) => {
    const message = err?.message || String(err);
    const isAbort = err.name === 'AbortError' || 
                   err.name === 'CanceledError' ||
                   err.code === 20 ||
                   message.toLowerCase().includes("aborted") || 
                   message.toLowerCase().includes("the user aborted a request") ||
                   message.toLowerCase().includes("signal is aborted") ||
                   message.toLowerCase().includes("canceled");
    
    if (isAbort) {
      console.log("Request aborted (handled in handleApiError)");
      return;
    }

    console.error("API Error context:", err);
    
    if (message.includes("Requested entity was not found") || message.includes("404")) {
      setHasApiKey(false);
      setError({
        type: 'auth',
        message: "Une erreur d'accès aux modèles avancés est survenue. Veuillez sélectionner une clé API valide."
      });
    } else if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      setError({
        type: 'quota',
        message: "Votre quota API est épuisé. Veuillez vérifier vos limites."
      });
    } else if (message.includes("API_KEY_INVALID")) {
      setError({
        type: 'auth',
        message: "Clé API invalide ou non trouvée. Assurez-vous que la clé est correctement configurée."
      });
    } else {
      setError({
        type: 'generic',
        message: "Une erreur technique inattendue est survenue. Veuillez réessayer ultérieurement."
      });
    }
  };

  const checkUsageLimit = () => {
    const isFree = !subscription || subscription.plan === 'free';
    if (isFree && projects.length >= 3) {
      setError({
        type: 'quota',
        message: "Vous avez atteint la limite de 3 générations gratuites pour le plan Starter. Veuillez passer au plan Pro pour continuer."
      });
      return false;
    }
    return true;
  };

  const handleLogoSubmit = async (companyName: string, logoFile: string) => {
    if (!checkUsageLimit()) return;
    setIsLoading(true);
    setLoadingStep("Vision par ordinateur : Analyse chromatique du logo...");
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Create project automatically
      const projectId = await createProject(user!.uid, {
        title: companyName,
        type: 'logo',
        status: 'draft',
        previewImage: logoFile
      });
      setCurrentProjectId(projectId!);

      const brandingData = await generateBrandingFromLogo(logoFile, companyName);
      await processBrandingVisuals(brandingData, companyName, logoFile, abortControllerRef.current.signal, projectId!);
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
        console.log("Generation aborted by user (Logo)");
        return;
      }
      handleApiError(err);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
      abortControllerRef.current = null;
    }
  };

  const handleTextSubmit = async (profileData: BrandProfile) => {
    if (!checkUsageLimit()) return;
    setIsLoading(true);
    setBrandProfile(profileData);
    setLoadingStep("Analyse stratégique de l'ADN de marque...");
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Create project automatically
      const projectId = await createProject(user!.uid, {
        title: profileData.companyName,
        type: 'logo',
        status: 'draft'
      });
      setCurrentProjectId(projectId!);

      fastAnalyzeContent(profileData.mission).then(setFastAnalysis).catch(err => console.warn("Fast analysis skipped due to quota:", err));
      const brandingData = await generateBranding(profileData);
      
      setLoadingStep("Ingénierie du logotype maître...");
      const colorString = brandingData.styleGuide.colors.map(c => c.hex).join(', ');
      const logoPrompt = `High-end professional minimal vector logo for "${profileData.companyName}". Colors: ${colorString}. Symbol: ${brandingData.logo.description}. Pure white background.`;
      const masterLogoUrl = await generateImage(logoPrompt);
      brandingData.logo.generatedImageUrl = masterLogoUrl;

      // Update project preview
      await updateProject(user!.uid, projectId!, { previewImage: masterLogoUrl });

      await processBrandingVisuals(brandingData, profileData.companyName, masterLogoUrl, abortControllerRef.current.signal, projectId!);
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
        console.log("Generation aborted by user (Text)");
        return;
      }
      handleApiError(err);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("The user aborted a request.");
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const processBrandingVisuals = async (brandingData: BrandingType, companyName: string, logoUrl: string, signal?: AbortSignal, projectId?: string) => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const primaryColor = brandingData.styleGuide.colors[0].hex;
    const secondaryColor = brandingData.styleGuide.colors[1]?.hex || primaryColor;

    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    if (!brandingData.logo.generatedImageUrl) {
      brandingData.logo.generatedImageUrl = logoUrl;
    }

    if (projectId) {
      await updateProgress(user!.uid, projectId, {
        totalSteps: 5,
        completedSteps: 2,
        progressPercent: 40,
        lastAction: 'Génération des variations techniques'
      });
    }

    setLoadingStep("Calcul des 5 variations techniques...");
    const variationsPrompts = [
      `Minimalist icon-only version of the logo. Flat design. White background.`,
      `Pure black silhouette of the logo on white background. No colors.`,
      `Logo variation: the logo is entirely white, placed on a solid background of color ${primaryColor}.`,
      `Logo on a deep charcoal black background. Modern high-end aesthetic.`,
      `Small square favicon version of the central symbol. High legibility.`
    ];
    
    const v1 = await generateImage(variationsPrompts[0], logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    await delay(2000);
    const v2 = await generateImage(variationsPrompts[1], logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    await delay(2000);
    const v3 = await generateImage(variationsPrompts[2], logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    await delay(2000);
    const v4 = await generateImage(variationsPrompts[3], logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    await delay(2000);
    const v5 = await generateImage(variationsPrompts[4], logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    brandingData.logo.simplifiedImageUrl = v1;
    brandingData.logo.monochromeImageUrl = v2;
    brandingData.logo.invertedImageUrl = v3;
    brandingData.logo.darkBgImageUrl = v4;
    brandingData.logo.faviconImageUrl = v5;

    if (projectId) {
      await updateProgress(user!.uid, projectId, {
        totalSteps: 5,
        completedSteps: 3,
        progressPercent: 60,
        lastAction: 'Génération des actifs Motion'
      });
    }

    await delay(3000);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    setLoadingStep("Génération des actifs Motion Design (Logo Animation)...");
    try {
        const motionPromptPrimary = language === 'fr' 
            ? `Animation cinématographique subtile avec respiration et reflets lumineux de ce logo. Contraste élevé, professionnel, 4k, boucle parfaite.`
            : `Cinematic subtle breathing and light sheen animation of this logo. High contrast, professional, 4k, loopable.`;
        
        const motionPromptMono = language === 'fr'
            ? `Animation de révélation minimaliste de ce logo. Lignes épurées, mouvement fluide, fond blanc.`
            : `Minimalist reveal animation of this logo. Clean lines, smooth motion, white background.`;
        
        const animPrimary = await generateVideoVeo(logoUrl, motionPromptPrimary, true, signal);
        if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
        await delay(5000);
        const animMono = await generateVideoVeo(v2, motionPromptMono, true, signal);
        
        brandingData.logo.animatedVariations = {
            primaryUrl: animPrimary,
            monochromeUrl: animMono
        };

        if (projectId) {
          await updateProgress(user!.uid, projectId, {
            totalSteps: 5,
            completedSteps: 4,
            progressPercent: 80,
            lastAction: 'Génération des supports Print'
          });
        }
    } catch (e: any) {
        const message = e?.message || String(e);
        if (e.name === 'AbortError' || message.toLowerCase().includes("aborted") || message.toLowerCase().includes("the user aborted a request")) throw e;
        console.warn("Motion Asset Generation Warning:", e);
    }

    await delay(4000);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    // Skip video generation for free users (Starter plan)
    const isFree = !subscription || subscription.plan === 'free';
    
    if (!isFree) {
      setLoadingStep(language === 'fr' ? "Production de la vidéo promotionnelle d'élite..." : "Producing elite promotional video...");
      try {
        const videoPrompt = language === 'fr'
          ? `Vidéo promotionnelle ultra-dynamique et cinématographique pour le logo de ${companyName}. 
             Fond visuellement riche avec des textures abstraites élégantes, des particules de lumière et des dégradés profonds. 
             Utilise les couleurs : ${primaryColor}, ${secondaryColor}. 
             Style : ${brandingData.styleGuide.visualStyle}. 
             Mouvement de caméra fluide et percutant, révélant le logo avec prestige.`
          : `Ultra-dynamic and cinematic promotional video for the ${companyName} logo. 
             Visually rich background with elegant abstract textures, light particles, and deep gradients. 
             Uses colors: ${primaryColor}, ${secondaryColor}. 
             Style: ${brandingData.styleGuide.visualStyle}. 
             Impactful camera movement, revealing the logo with prestige.`;
             
        brandingData.styleGuide.ecosystem.promoVideoUrl = await generateVideoVeo(logoUrl, videoPrompt, true, signal);
      } catch (e: any) { 
        const message = e?.message || String(e);
        if (e.name === 'AbortError' || message.toLowerCase().includes("aborted") || message.toLowerCase().includes("the user aborted a request")) throw e;
        console.warn("Veo/Video Generation Warning:", e); 
      }

      await delay(4000);
      if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    }

    setLoadingStep("Conception des supports Print de prestige...");
    const businessCardPrompt = `PRESTIGE MOCKUP: Luxury business card design for ${companyName}. Front and back view. Minimalist, using ${primaryColor} and ${secondaryColor}. Elegant typography.`;
    const flyerPrompt = `PRESTIGE MOCKUP: High-end professional A4 flyer for ${companyName}. Modern layout, clean sections, displaying the logo and brand pattern.`;
    
    const bcUrl = await generateImage(businessCardPrompt, logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    await delay(2500);
    const flyerUrl = await generateImage(flyerPrompt, logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    brandingData.styleGuide.ecosystem.print.businessCardImageUrl = bcUrl;
    brandingData.styleGuide.ecosystem.print.flyerImageUrl = flyerUrl;

    await delay(3000);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    setLoadingStep("Génération des 5 mockups contextuels...");
    const mockupPool = [
      `MOCKUP: Luxury website header on a Macbook Pro, logo "${companyName}" visible in nav. High-end UI.`,
      `MOCKUP: Modern smartphone showing a brand app icon and splash screen for ${companyName}.`,
      `MOCKUP: High-end shipping box with large logo print of ${companyName}.`,
      `MOCKUP: Interior office wall with 3D logo sign of ${companyName} and modern furniture.`,
      `MOCKUP: Premium Hoodie with a small discrete logo embroidery of ${companyName} on the chest. High resolution 2k detail.`,
      `MOCKUP: Professional T-shirt with a bold graphic print of the ${companyName} logo. High resolution 2k detail.`,
      `MOCKUP: Large outdoor street banner showcasing the ${companyName} brand identity. High resolution 2k detail.`,
      `MOCKUP: Minimalist tote bag with the ${companyName} logo.`,
      `MOCKUP: Luxury vehicle wrap with the ${companyName} branding.`,
      `MOCKUP: High-end stationery set with letterhead and envelopes for ${companyName}.`
    ];
    
    const shuffledMockups = [...mockupPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const mockups: string[] = [];
    for (const prompt of shuffledMockups) {
      const enhancedPrompt = `${prompt} Ultra-high resolution, 2k detail, professional photography, studio lighting.`;
      mockups.push(await generateImage(enhancedPrompt, logoUrl));
      if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
      await delay(2500); 
    }
    brandingData.styleGuide.extraMockups = mockups;

    setLoadingStep("Finalisation du Brand Book...");
    const colorString = brandingData.styleGuide.colors.map(c => c.hex).join(', ');
    const patternPrompt = `Seamless high-end brand pattern. Concept: ${brandingData.styleGuide.graphicElements.patternConcept}. Colors: ${colorString}.`;
    brandingData.styleGuide.graphicElements.patternImageUrl = await generateImage(patternPrompt, logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    
    await delay(2000);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    
    const mainMockupPrompt = `MASTER PRESTIGE MOCKUP: Complete stationery set for ${companyName} with envelopes and letterheads.`;
    brandingData.styleGuide.mockupImageUrl = await generateImage(mainMockupPrompt, logoUrl);
    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    if (projectId) {
      await updateProgress(user!.uid, projectId, {
        totalSteps: 5,
        completedSteps: 5,
        progressPercent: 100,
        lastAction: 'Projet Terminé'
      });
      await updateProject(user!.uid, projectId, { 
        status: 'completed',
        data: brandingData,
        previewImage: brandingData.logo.generatedImageUrl
      });
      await logActivity(user!.uid, {
        type: 'logo_generation',
        projectId
      });
    }

    setResult(brandingData);
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleUpdateMockups = (mockups: string[]) => {
    if (result) {
      setResult({
        ...result,
        styleGuide: { ...result.styleGuide, extraMockups: mockups }
      });
    }
  };

  const handleCreateProject = async (title: string, type: 'logo' | 'flyer' | 'mockup' | 'brandkit') => {
    const id = await createProject(user!.uid, {
      title,
      type,
      status: 'draft'
    });
    setCurrentProjectId(id!);
    setActiveTab('generate');
  };

  const handleSelectProject = (project: Project) => {
    if (project.status === 'completed' && project.data) {
      setResult(project.data);
      setBrandProfile({
        companyName: project.title,
        industry: '',
        mission: '',
        values: '',
        targetAudience: '',
        positioning: '',
        preferences: ''
      });
      setActiveTab('generate');
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      setCurrentProjectId(project.id);
      setActiveTab('generate');
    }
  };

  const handleExportDesign = async (format: 'PNG' | 'SVG' | 'PDF') => {
    if (!currentProjectId || !result) return;
    
    // Simulate export URL (in a real app, this would be a cloud storage URL)
    const fileUrl = result.logo.generatedImageUrl;
    
    await recordDownload(user!.uid, {
      projectId: currentProjectId,
      fileType: format,
      fileUrl: fileUrl
    });
  };

  const socialLinks = [
    { name: 'LinkedIn', icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>, url: 'https://linkedin.com' },
    { name: 'Instagram', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.62.074-3.14.391-4.3 1.551-1.159 1.159-1.477 2.68-1.551 4.3-.058 1.279-.072 1.688-.072 4.947s.014 3.667.072 4.947c.074 1.62.391 3.14 1.551 4.3 1.159 1.159 2.68 1.477 4.3 1.551 1.279.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.62-.074 3.14-.391 4.3-1.551 1.159-1.159 1.477-2.68 1.551-4.3.058-1.279.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.074-1.62-.391-3.14-1.551-4.3-1.159-1.159-2.68-1.477-4.3-1.551-1.279-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>, url: 'https://instagram.com' },
    { name: 'X', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>, url: 'https://x.com' },
    { name: 'Facebook', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>, url: 'https://facebook.com' },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white pb-40">
      <Header onLogout={handleLogout} />
      <main className="flex-grow max-w-7xl mx-auto px-6 relative z-10 w-full">
        
        {/* Dashboard Tabs */}
        <div className="flex justify-center mt-12 mb-12">
          <div className="glass-dark p-1 rounded-2xl flex border border-white/10 overflow-x-auto max-w-full">
            {[
              { id: 'generate', label: 'Générer', icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
              { id: 'projects', label: 'Projets', icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
              { id: 'progress', label: 'Progression', icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
              { id: 'downloads', label: 'Downloads', icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> },
              { id: 'history', label: 'Historique', icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center whitespace-nowrap text-emerald-500 hover:bg-emerald-500/10"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </button>
            )}
          </div>
        </div>

        {activeTab === 'generate' && (
          <>
            <div className={`text-center py-12 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex justify-center mb-8">
                <div className="glass-dark p-1 rounded-2xl flex border border-white/10">
                  <button 
                    onClick={() => setLanguage('fr')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'fr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                  >
                    Français
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                  >
                    English
                  </button>
                </div>
              </div>
              <div className="inline-block px-6 py-2 rounded-full glass-dark border-white/40 mb-10 shadow-2xl">
                 <span className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400">Engineering & Identity • 2026</span>
              </div>
              <h2 className="text-7xl md:text-[10rem] font-serif text-white mb-10 font-black tracking-tighter leading-[0.9] text-glow-strong">
                Design <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white italic">Absolute</span>
              </h2>
              <p className="text-indigo-50 text-xl md:text-3xl max-w-4xl mx-auto font-medium leading-relaxed mb-16 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                L'excellence visuelle propulsée par l'intelligence <span className="text-white font-bold underline decoration-indigo-500 underline-offset-8">générative d'élite</span>.
              </p>
            </div>

            <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              
              <div className="flex justify-center mb-12 space-x-6">
                <button 
                  onClick={() => setInputMethod('text')}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${inputMethod === 'text' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                >
                  Identité via Vision
                </button>
                <button 
                  onClick={() => setInputMethod('logo')}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${inputMethod === 'logo' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                >
                  Identité via Logo Existant
                </button>
              </div>

              {inputMethod === 'text' ? (
                <InputForm onSubmit={handleTextSubmit} isLoading={isLoading} />
              ) : (
                <LogoBrandingForm onSubmit={handleLogoSubmit} isLoading={isLoading} />
              )}

              {isLoading && (
                <div className="mt-20 flex flex-col items-center glass-dark rounded-[4rem] p-20 border-2 border-white/20 shadow-3xl text-center">
                  <div className="w-32 h-32 mb-12 relative">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-[8px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white text-3xl font-serif italic mb-4">{loadingStep}</p>
                  {fastAnalysis && <p className="text-indigo-300 text-sm max-w-md italic opacity-60 mb-8">Stratégie : {fastAnalysis}</p>}
                  <button 
                    onClick={handleCancelGeneration}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                  >
                    Annuler la génération
                  </button>
                </div>
              )}
              {error && (
                <div className="mt-12 p-12 bg-white rounded-[3.5rem] border-4 border-red-500 shadow-2xl text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-red-600 mb-4 uppercase tracking-widest">
                    {error.type === 'quota' ? "Limite de Quota Atteinte" : "Échec du Système"}
                  </h3>
                  <p className="text-slate-900 text-lg font-bold mb-8 max-w-md mx-auto">{error.message}</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {!hasApiKey && (
                      <button 
                        onClick={handleOpenKeyDialog}
                        className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                      >
                        Sélectionner une Clé API
                      </button>
                    )}
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-10 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Gérer la Facturation
                    </a>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div id="result-section" className="mt-40 pt-32">
                <div className="flex justify-center mb-12">
                  <button 
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-12 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exporter le Pack Complet
                  </button>
                </div>
                <BrandingResult 
                  data={result} 
                  onUpdateMockups={handleUpdateMockups}
                  companyName={brandProfile?.companyName || "Marque Absolue"}
                />
              </div>
            )}
            
            {!result && !isLoading && (!subscription || subscription.plan !== 'free') && <AdvancedLab />}
            {!result && !isLoading && (subscription?.plan === 'free' || !subscription) && (
              <div className="mt-20 p-12 glass-dark rounded-[3rem] border border-white/10 text-center">
                <h3 className="text-2xl font-serif italic text-white mb-4">Advanced Lab (Pro Only)</h3>
                <p className="text-white/40 mb-8">Passez au plan Pro pour accéder aux outils de génération d'élite (Gemini 3 Pro & Veo).</p>
                <button 
                  onClick={() => navigate('/')} 
                  className="px-8 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Voir les Plans
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <div className="py-12">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-5xl font-serif italic text-white">Mes Projets</h2>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
              >
                Nouveau Projet
              </button>
            </div>
            <MyProjects 
              projects={projects} 
              isLoading={isDashboardLoading} 
              onSelect={handleSelectProject}
            />
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="py-12 max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif italic text-white mb-12">Progression</h2>
            <DesignProgress progress={progress} projects={projects} />
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="py-12 max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif italic text-white mb-12">Mes Téléchargements</h2>
            <MyDownloads downloads={downloads} projects={projects} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="py-12 max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif italic text-white mb-12">Historique d'Activité</h2>
            <ActivityHistory activities={activities} projects={projects} />
          </div>
        )}

      </main>
      <ChatBot />

      {/* Modals */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onConfirm={handleCreateProject} 
      />
      <ExportDesignModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onConfirm={handleExportDesign} 
      />
      
      <footer className="bg-black py-32 flex flex-col items-center space-y-12">
        <div className="flex space-x-8">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Suivez-nous sur ${link.name}`}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-500/5 hover:scale-110 hover:-rotate-6 transition-all duration-500 group shadow-lg hover:shadow-indigo-500/20"
            >
              <svg className="w-6 h-6 fill-current group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" viewBox="0 0 24 24">
                {link.icon}
              </svg>
            </a>
          ))}
        </div>

        <div className="text-center text-white/20 font-black text-[10px] uppercase tracking-[1em]">
          <p>© 2026 Branding Lab Absolute • Confidentiality Guaranteed</p>
        </div>
      </footer>
    </div>
  );
};

const Auth: React.FC = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (user) {
    if (user.emailVerified) {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/verify-email" state={{ email: user.email }} />;
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {isLogin ? <Login onToggle={() => setIsLogin(false)} /> : <Signup onToggle={() => setIsLogin(true)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
