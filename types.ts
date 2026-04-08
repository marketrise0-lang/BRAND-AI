
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: any;
}

export interface Project {
  id: string;
  type: 'logo' | 'flyer' | 'mockup' | 'brandkit';
  title: string;
  createdAt: any;
  updatedAt: any;
  status: 'draft' | 'completed';
  previewImage?: string;
  data?: BrandingResult;
}

export interface DesignProgress {
  projectId: string;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  lastAction: string;
  updatedAt: any;
}

export interface Activity {
  id: string;
  type: 'logo_generation' | 'export' | 'edit' | 'download';
  projectId: string;
  duration?: number;
  createdAt: any;
}

export interface Download {
  id: string;
  projectId: string;
  fileType: 'PNG' | 'SVG' | 'PDF';
  createdAt: any;
  fileUrl?: string;
}

export interface BrandProfile {
  companyName: string;
  industry: string;
  mission: string;
  values: string;
  targetAudience: string;
  positioning: string;
  preferences: string;
}

export interface BrandingResult {
  logo: {
    concept: string;
    type: string;
    symbolism: string;
    description: string;
    svgPath?: string;
    uniquenessFactor: string;
    differentiationStrategy: string;
    variations: {
      color: string;
      black: string;
      white: string;
      backgrounds: string;
      simplified: string;
      favicon: string;
    };
    generatedImageUrl?: string;
    simplifiedImageUrl?: string;
    monochromeImageUrl?: string;
    faviconImageUrl?: string;
    socialAvatarUrl?: string;
    invertedImageUrl?: string;
    darkBgImageUrl?: string;
    animatedVariations?: {
      primaryUrl?: string;
      monochromeUrl?: string;
    };
  };
  styleGuide: {
    colors: Array<{
      hex: string;
      name: string;
      rgb: string;
      cmyk: string;
      usage: string;
    }>;
    typography: {
      titles: {
        fontFamily: string;
        usage: string;
        style: string;
      };
      body: {
        fontFamily: string;
        usage: string;
        style: string;
      };
    };
    graphicElements: {
      patternConcept: string;
      textureDescription: string;
      patternImageUrl?: string;
    };
    rules: {
      allowed: string[];
      forbidden: string[];
    };
    visualStyle: string;
    ecosystem: {
      socialMedia: {
        avatarStyle: string;
        bannerConcept: string;
        postTemplate: string;
      };
      digital: {
        webInterface: string;
        appDesign: string;
        faviconUsage: string;
      };
      print: {
        businessCard: string;
        flyerLayout: string;
        stationery: string;
        businessCardImageUrl?: string;
        flyerImageUrl?: string;
      };
      packaging: {
        materialSuggestion: string;
        labelingStyle: string;
      };
      promoVideoUrl?: string;
    };
    mockupImageUrl?: string;
    extraMockups?: string[];
  };
  analysis: {
    credibilityScore: number;
    coherenceStrategy: string;
    futureRecommendations: string[];
  };
}

export interface AdminProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin';
  createdAt: any;
  lastLoginAt: any;
}

export interface Template {
  id: string;
  type: 'logo' | 'flyer' | 'mockup';
  category: string;
  premium: boolean;
  createdBy: string;
  createdAt: any;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentMethod: 'card' | 'mobile money';
  createdAt: any;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled';
  startedAt: any;
  expiresAt: any;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  authorId: string;
  createdAt: any;
  publishedAt?: any;
}

export interface AdminMetrics {
  totalUsers: number;
  totalDesigns: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newOrdersToday: number;
  recentSales: Order[];
  popularDesignType: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
