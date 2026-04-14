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
  subscribeToUserSubscription,
  deleteAllUserProjects
} from './src/services/firestoreService';
import { createAdminProfile } from './src/services/adminService';
import { uploadBase64Image, processBrandingImages } from './src/services/storageService';
import MyProjects from './components/dashboard/MyProjects';
import DesignProgress from './components/dashboard/DesignProgress';
import MyDownloads from './components/dashboard/MyDownloads';
import ActivityHistory from './components/dashboard/ActivityHistory';
import CreateProjectModal from './components/dashboard/CreateProjectModal';
import ExportDesignModal from './components/dashboard/ExportDesignModal';
import { BrandProfile, BrandingResult as BrandingType, Project, DesignProgress as ProgressType, Activity, Download, Subscription } from './types';
import { generateBranding, generateBrandingFromLogo, generateImage, generateImagePro, fastAnalyzeContent, generateVideoVeo } from './services/geminiService';

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
  const [quotaWarning, setQuotaWarning] = useState<boolean>(false);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'projects' | 'progress' | 'downloads' | 'history'>('generate');

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const smartGenerateImage = async (prompt: string, refImage?: string, aspectRatio: any = "1:1") => {
    // Always use standard free model as requested
    return await generateImage(prompt, refImage, aspectRatio);
  };

  useEffect(() => {
    setIsVisible(true);
    
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true); // Fallback for local dev or if not in AI Studio environment
      }
    };
    checkApiKey();

    const testConnection = async () => {
      try {
        const { getDocFromServer, doc } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection test: SUCCESS");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore connection test: OFFLINE. Please check your Firebase configuration.");
        } else {
          console.log("Firestore connection test (ignoring non-offline error):", error);
        }
      }
    };
    testConnection();

    if (user) {
      const initUser = async () => {
        try {
          await createUserProfile(user.uid, user.email || '', user.displayName || 'User');
          if (user.email === 'ngwanoloic256@gmail.com') {
            await createAdminProfile(user);
          }
        } catch (e) {
          console.error("User initialization failed:", e);
        }
      };
      initUser();
      
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

  useEffect(() => {
    if (!isAdmin && projects.length === 2) {
      setQuotaWarning(true);
    } else {
      setQuotaWarning(false);
    }
  }, [projects, isAdmin]);

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
    } else if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota") || JSON.stringify(err).includes("429")) {
      setError({
        type: 'quota',
        message: "Limite de quota API atteinte. Le système est actuellement très sollicité. Veuillez patienter 1 à 2 minutes avant de relancer une génération pour permettre au quota de se réinitialiser."
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
    if (isAdmin) return true;
    const isFree = !subscription || subscription.plan === 'free';
    if (isFree && projects.length >= 3) {
      setError({
        type: 'quota',
        message: "Vous avez atteint la limite de 3 générations gratuites pour le plan Starter. Veuillez passer au plan Pro pour continuer ou supprimer d'anciens projets."
      });
      return false;
    }
    return true;
  };

  const handleClearAllGenerations = async () => {
    if (!user) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer TOUTES vos générations ? Cette action est irréversible.")) {
      try {
        setIsLoading(true);
        setLoadingStep("Suppression de toutes les données de génération...");
        await deleteAllUserProjects(user.uid);
        setResult(null);
        setBrandProfile(null);
      } catch (err) {
        handleApiError(err);
      } finally {
        setIsLoading(false);
        setLoadingStep("");
      }
    }
  };

  const handleLogoSubmit = async (companyName: string, logoFile: string) => {
    if (!checkUsageLimit()) return;
    setIsLoading(true);
    setLoadingStep("Vision par ordinateur : Analyse chromatique du logo...");
    setError(null);
    setQuotaWarning(false);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Create project automatically
      const projectId = await createProject(user!.uid, {
        title: companyName,
        type: 'logo',
        status: 'draft'
      });
      setCurrentProjectId(projectId!);

      // 1. Start uploading initial logo AND generating branding data IN PARALLEL
      const uploadLogoTask = uploadBase64Image(user!.uid, projectId!, 'initial_logo.png', logoFile);
      const brandingDataTask = generateBrandingFromLogo(logoFile, companyName, isAdmin && hasApiKey);
      
      // Wait for branding data (needed for visuals) but not necessarily for upload
      const brandingData = await brandingDataTask;
      
      // 2. Start generating other visuals using the base64 logo immediately
      await processBrandingVisuals(brandingData, companyName, logoFile, abortControllerRef.current.signal, projectId!);
      
      // Ensure the project preview is updated with the final stored URL
      const storedLogoUrl = await uploadLogoTask;
      await updateProject(user!.uid, projectId!, { previewImage: storedLogoUrl });
      brandingData.logo.generatedImageUrl = storedLogoUrl;
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
    setQuotaWarning(false);
    
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
      const brandingData = await generateBranding(profileData, isAdmin && hasApiKey);
      
      setLoadingStep("Ingénierie du logotype maître...");
      const colorString = brandingData.styleGuide?.colors?.map(c => c.hex).join(', ') || "#4f46e5";
      const logoPrompt = `Professional, solid and high-end minimal vector logo for "${profileData.companyName}". Colors: ${colorString}. Symbol: ${brandingData.logo.description}. Pure white background.`;
      
      // 1. Generate the master logo (Base64)
      const masterLogoBase64 = await smartGenerateImage(logoPrompt);
      
      // 2. Start uploading master logo AND generating other visuals IN PARALLEL
      // We don't wait for the upload to start generating variations/mockups
      const uploadMasterTask = uploadBase64Image(user!.uid, projectId!, 'master_logo.png', masterLogoBase64);
      
      // We pass the base64 directly to speed up the start of other generations
      await processBrandingVisuals(brandingData, profileData.companyName, masterLogoBase64, abortControllerRef.current.signal, projectId!);
      
      // Ensure the master logo URL is updated with the stored version at the end
      const storedMasterLogoUrl = await uploadMasterTask;
      brandingData.logo.generatedImageUrl = storedMasterLogoUrl;
      
      // Update project preview with the final stored URL
      await updateProject(user!.uid, projectId!, { previewImage: storedMasterLogoUrl });
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
    const primaryColor = brandingData.styleGuide?.colors?.[0]?.hex || "#4f46e5";
    const secondaryColor = brandingData.styleGuide?.colors?.[1]?.hex || primaryColor;

    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

    if (!brandingData.logo.generatedImageUrl) {
      brandingData.logo.generatedImageUrl = logoUrl;
    }

    setLoadingStep("Génération simultanée de l'écosystème de marque...");

    try {
      // PROMPTS PREPARATION
      const variationsPrompts = [
        `Professional icon-only version of the logo. Flat design. White background.`,
        `Pure black silhouette of the logo on white background. Solid and clean.`,
        `Logo variation: the logo is entirely white, placed on a solid background of color ${primaryColor}.`,
        `Logo on a deep charcoal black background. Modern professional aesthetic.`,
        `Small square favicon version of the central symbol. High legibility.`
      ];

      const businessCardPrompt = `PROFESSIONAL MOCKUP: Luxury business card design for ${companyName}. Front and back view. Minimalist, using ${primaryColor} and ${secondaryColor}. Elegant typography.`;
      const flyerPrompt = `PROFESSIONAL MOCKUP: High-end professional A4 flyer for ${companyName}. Modern layout, clean sections, displaying the logo and brand pattern.`;

      const mockupPool = [
        `MOCKUP: Professional website header on a Macbook Pro with the logo of ${companyName} in a clean navigation bar.`,
        `MOCKUP: Social media profile mockup for ${companyName} showing the logo on a smartphone screen.`,
        `MOCKUP: Premium business card mockup for ${companyName} on a textured paper background.`,
        `MOCKUP: Luxury product packaging mockup for ${companyName} with the logo embossed on a high-quality box.`,
        `MOCKUP: Modern shop sign mockup for ${companyName} on a sleek storefront in a premium urban location.`
      ];
      const shuffledMockups = [...mockupPool].sort(() => 0.5 - Math.random()).slice(0, 5);

      const colorString = (brandingData.styleGuide?.colors || []).map(c => c.hex).join(', ');
      const patternPrompt = `Seamless high-end brand pattern. Concept: ${brandingData.styleGuide?.graphicElements?.patternConcept || "Geometric elegance"}. Colors: ${colorString}.`;
      const mainMockupPrompt = `MASTER PRESTIGE MOCKUP: Complete stationery set for ${companyName} with envelopes and letterheads.`;

      // BATCHED SEQUENTIAL GENERATION (to avoid hitting quota limits simultaneously)
      // Increased delays for free tier users to ensure they can complete at least 2 generations
      const faviconUrl = await smartGenerateImage(variationsPrompts[4], logoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setLoadingStep("Génération du système d'identité monochrome...");
      const monochromeUrl = await smartGenerateImage(variationsPrompts[1], logoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setLoadingStep("Création du motif de marque exclusif...");
      const patternUrl = await smartGenerateImage(patternPrompt, logoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setLoadingStep("Mise en situation de la marque (Mockup Maître)...");
      const mainMockupUrl = await smartGenerateImage(mainMockupPrompt, logoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setLoadingStep("Conception des supports imprimés (Cartes & Flyers)...");
      const businessCardUrl = await smartGenerateImage(businessCardPrompt, logoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const flyerUrl = await smartGenerateImage(flyerPrompt, logoUrl);
      
      if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");

      // ASSIGN RESULTS
      if (!brandingData.logo) brandingData.logo = {} as any;
      if (!brandingData.styleGuide) brandingData.styleGuide = {} as any;
      if (!brandingData.styleGuide.graphicElements) brandingData.styleGuide.graphicElements = {} as any;
      if (!brandingData.styleGuide.ecosystem) brandingData.styleGuide.ecosystem = {} as any;
      if (!brandingData.styleGuide.ecosystem.print) brandingData.styleGuide.ecosystem.print = {} as any;

      brandingData.logo.faviconImageUrl = faviconUrl || logoUrl;
      brandingData.logo.monochromeImageUrl = monochromeUrl || null;
      brandingData.styleGuide.graphicElements.patternImageUrl = patternUrl || null;
      brandingData.styleGuide.mockupImageUrl = mainMockupUrl || null;
      brandingData.styleGuide.ecosystem.print.businessCardImageUrl = businessCardUrl || null;
      brandingData.styleGuide.ecosystem.print.flyerImageUrl = flyerUrl || null;

      // Initialize others as null for on-demand generation
      brandingData.logo.simplifiedImageUrl = null;
      brandingData.logo.invertedImageUrl = null;
      brandingData.logo.darkBgImageUrl = null;
      brandingData.styleGuide.extraMockups = [];

    } catch (e: any) {
      const message = e?.message || String(e);
      if (e.name === 'AbortError' || message.toLowerCase().includes("aborted") || message.toLowerCase().includes("the user aborted a request")) throw e;
      console.warn("Massive Generation Warning:", e);
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
        setQuotaWarning(true);
      }
    }

    if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
    
    if (projectId) {
      try {
        await updateProgress(user!.uid, projectId, {
          totalSteps: 5,
          completedSteps: 5,
          progressPercent: 100,
          lastAction: 'Génération terminée'
        });
      } catch (e) { console.warn("Final progress update failed:", e); }

      // We don't await the final saving/storage step to let the user see the result immediately
      // This addresses the user's request to "skip" the waiting time for the saving part
      (async () => {
        try {
          console.log("Starting background saving and asset optimization...");
          const processedBrandingData = await processBrandingImages(user!.uid, projectId, brandingData);

          await updateProject(user!.uid, projectId, { 
            status: 'completed',
            data: processedBrandingData,
            previewImage: processedBrandingData.logo.generatedImageUrl
          });
          await logActivity(user!.uid, {
            type: 'logo_generation',
            projectId
          });
          console.log("Project saved successfully in background.");
        } catch (e) {
          console.error("Background project saving failed:", e);
          // Fallback: update with raw data if storage fails (might hit limit but better than nothing)
          try {
            await updateProject(user!.uid, projectId, { 
              status: 'completed',
              data: brandingData,
              previewImage: brandingData.logo.generatedImageUrl
            });
          } catch (innerE) { console.error("Critical: Background fallback update failed:", innerE); }
        }
      })();
    }

    setResult(brandingData);
    setIsLoading(false);
    setLoadingStep("");
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
    { name: 'LinkedIn', icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>, url: 'https://linkedin.com/company/brandgenius-ai' },
    { name: 'Instagram', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.62.074-3.14.391-4.3 1.551-1.159 1.159-1.477 2.68-1.551 4.3-.058 1.279-.072 1.688-.072 4.947s.014 3.667.072 4.947c.074 1.62.391 3.14 1.551 4.3 1.159 1.159 2.68 1.477 4.3 1.551 1.279.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.62-.074 3.14-.391 4.3-1.551 1.159-1.159 1.477-2.68 1.551-4.3.058-1.279.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.074-1.62-.391-3.14-1.551-4.3-1.159-1.159-2.68-1.477-4.3-1.551-1.279-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>, url: 'https://instagram.com/brandgenius_ai' },
    { name: 'X', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>, url: 'https://x.com/brandgenius_ai' },
    { name: 'Facebook', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>, url: 'https://facebook.com/brandgeniusai' },
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

              {quotaWarning && !isLoading && !error && (
                <div className="mt-8 p-6 glass-dark border border-amber-500/30 rounded-3xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-amber-200/80 text-sm font-medium">Attention : Il ne vous reste qu'une seule génération gratuite sur votre plan Starter.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                  >
                    Passer au Pro
                  </button>
                </div>
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
                    {error.message.includes("supprimer d'anciens projets") ? (
                      <button 
                        onClick={() => {
                          setError(null);
                          setActiveTab('projects');
                        }}
                        className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
                      >
                        Gérer mes projets
                      </button>
                    ) : (
                      <button 
                        onClick={() => setError(null)}
                        className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
                      >
                        Réessayer
                      </button>
                    )}
                    
                    {!hasApiKey && (
                      <button 
                        onClick={handleOpenKeyDialog}
                        className="px-10 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-lg"
                      >
                        Sélectionner une Clé API
                      </button>
                    )}

                    {error.type === 'quota' && !error.message.includes("supprimer d'anciens projets") && (
                      <button 
                        onClick={() => navigate('/')}
                        className="px-10 py-4 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        Passer au Plan Pro
                      </button>
                    )}
                  </div>
                </div>
              )}

              {quotaWarning && (
                <div className="mt-12 p-8 bg-amber-500/10 border-2 border-amber-500/30 rounded-[2.5rem] flex items-center gap-6 text-amber-500 animate-in slide-in-from-top duration-700 shadow-xl">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-wider mb-1">Attention : Quota Partiel Atteint</p>
                    <p className="text-sm font-medium opacity-80">La limite de requêtes a été atteinte. Certains visuels secondaires n'ont pas pu être générés automatiquement. Vous pouvez tenter de les générer individuellement plus tard.</p>
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
                  isAdmin={isAdmin}
                  hasApiKey={hasApiKey}
                />
              </div>
            )}
            
            {!result && !isLoading && (!subscription || subscription.plan !== 'free') && <AdvancedLab />}
            {!result && !isLoading && !isDashboardLoading && (subscription?.plan === 'free' || !subscription) && (
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
              <div className="flex flex-col">
                <h2 className="text-5xl font-serif italic text-white">Mes Projets</h2>
                <p className="text-white/40 text-sm mt-2">Gérez vos identités visuelles générées</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleClearAllGenerations}
                  className="px-8 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-500/20 transition-all shadow-xl flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Tout Effacer
                </button>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
                >
                  Nouveau Projet
                </button>
              </div>
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
    const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
    if (user.emailVerified || isGoogleUser) {
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
