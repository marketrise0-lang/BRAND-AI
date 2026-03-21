
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BrandProfile, BrandingResult } from "../types";

// Factory function to get up-to-date instances
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" });

/**
 * Helper to handle retries for API calls hitting quota limits (429)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 5, backoff = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const message = error?.message || String(error);
    const isAbort = error.name === 'AbortError' || 
                   error.name === 'CanceledError' ||
                   error.code === 20 ||
                   message.toLowerCase().includes("aborted") || 
                   message.toLowerCase().includes("the user aborted a request") ||
                   message.toLowerCase().includes("signal is aborted") ||
                   message.toLowerCase().includes("canceled");
    
    if (isAbort) {
      throw error;
    }
    const errorStr = JSON.stringify(error);
    const errorMsg = error?.message || String(error);
    
    // Check for 429 or RESOURCE_EXHAUSTED in message, status, or JSON string
    const isQuotaError = 
      errorMsg.includes("429") || 
      errorMsg.includes("RESOURCE_EXHAUSTED") || 
      errorMsg.includes("quota") ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.code === 429 ||
      errorStr.includes("429") ||
      errorStr.includes("RESOURCE_EXHAUSTED");
    
    if (isQuotaError && retries > 0) {
      console.warn(`Quota exceeded, retrying in ${backoff}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      // Exponential backoff with jitter
      const nextBackoff = backoff * 2 + Math.floor(Math.random() * 2000);
      return withRetry(fn, retries - 1, nextBackoff);
    }
    throw error;
  }
}

const SYSTEM_INSTRUCTION = `
Tu es un Directeur Artistique Visionnaire de niveau "World-Class" et Expert en Stratégie de Différenciation.
Ton objectif absolu est l'UNICITÉ TOTALE. Une marque qui ressemble à une autre est un échec stratégique.

Sois concis mais percutant dans tes descriptions. Évite les répétitions. Ne génère pas de textes inutilement longs.

RÈGLES D'OR POUR LE SVG (TRACÉ VECTORIEL) :
1. Le champ 'svgPath' DOIT contenir UNIQUEMENT la chaîne de caractères de l'attribut 'd' d'un élément <path> SVG.
2. Les coordonnées du tracé doivent impérativement s'inscrire dans un canevas de 0 0 512 512.
3. Le tracé doit être centré et occuper environ 70-80% de l'espace.
4. Utilise des courbes propres (M, L, C, Q, Z).

DIRECTIVES DE LOGO :
- Définis une "Zone d'exclusion" claire (ex: 20% de la hauteur du logo).
- Définis des tailles minimales (ex: 20mm pour le print, 40px pour le web).

RÈGLES DE DIFFÉRENCIATION :
- ANTI-CLICHÉS : Pas de symboles évidents.
- PIVOT CRÉATIF : Radicalité et innovation.
`;

const BRANDING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    logo: {
      type: Type.OBJECT,
      properties: {
        concept: { type: Type.STRING },
        type: { type: Type.STRING },
        symbolism: { type: Type.STRING },
        description: { type: Type.STRING },
        svgPath: { type: Type.STRING },
        uniquenessFactor: { type: Type.STRING },
        differentiationStrategy: { type: Type.STRING },
        variations: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING },
            black: { type: Type.STRING },
            white: { type: Type.STRING },
            backgrounds: { type: Type.STRING },
          },
          required: ["color", "black", "white", "backgrounds"],
        },
      },
      required: ["concept", "type", "symbolism", "description", "variations", "uniquenessFactor", "differentiationStrategy", "svgPath"],
    },
    styleGuide: {
      type: Type.OBJECT,
      properties: {
        colors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hex: { type: Type.STRING },
              name: { type: Type.STRING },
              rgb: { type: Type.STRING },
              cmyk: { type: Type.STRING },
              usage: { type: Type.STRING },
            },
            required: ["hex", "name", "rgb", "cmyk", "usage"],
          },
        },
        typography: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.OBJECT,
              properties: {
                fontFamily: { type: Type.STRING },
                usage: { type: Type.STRING },
                style: { type: Type.STRING },
              },
              required: ["fontFamily", "usage", "style"],
            },
            body: {
              type: Type.OBJECT,
              properties: {
                fontFamily: { type: Type.STRING },
                usage: { type: Type.STRING },
                style: { type: Type.STRING },
              },
              required: ["fontFamily", "usage", "style"],
            },
          },
          required: ["titles", "body"],
        },
        graphicElements: {
          type: Type.OBJECT,
          properties: {
            patternConcept: { type: Type.STRING },
            textureDescription: { type: Type.STRING },
          },
          required: ["patternConcept", "textureDescription"],
        },
        ecosystem: {
          type: Type.OBJECT,
          properties: {
            socialMedia: {
              type: Type.OBJECT,
              properties: {
                avatarStyle: { type: Type.STRING },
                bannerConcept: { type: Type.STRING },
                postTemplate: { type: Type.STRING },
              },
              required: ["avatarStyle", "bannerConcept", "postTemplate"],
            },
            digital: {
              type: Type.OBJECT,
              properties: {
                webInterface: { type: Type.STRING },
                appDesign: { type: Type.STRING },
                faviconUsage: { type: Type.STRING },
              },
              required: ["webInterface", "appDesign", "faviconUsage"],
            },
            print: {
              type: Type.OBJECT,
              properties: {
                businessCard: { type: Type.STRING },
                flyerLayout: { type: Type.STRING },
                stationery: { type: Type.STRING },
              },
              required: ["businessCard", "flyerLayout", "stationery"],
            },
            packaging: {
              type: Type.OBJECT,
              properties: {
                materialSuggestion: { type: Type.STRING },
                labelingStyle: { type: Type.STRING },
              },
              required: ["materialSuggestion", "labelingStyle"],
            },
          },
          required: ["socialMedia", "digital", "print", "packaging"],
        },
        rules: {
          type: Type.OBJECT,
          properties: {
            allowed: { type: Type.ARRAY, items: { type: Type.STRING } },
            forbidden: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["allowed", "forbidden"],
        },
        visualStyle: { type: Type.STRING },
      },
      required: ["colors", "typography", "graphicElements", "ecosystem", "rules", "visualStyle"],
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        credibilityScore: { type: Type.NUMBER },
        coherenceStrategy: { type: Type.STRING },
        futureRecommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["credibilityScore", "coherenceStrategy", "futureRecommendations"]
    }
  },
  required: ["logo", "styleGuide", "analysis"],
};

export const generateBranding = async (profile: BrandProfile): Promise<BrandingResult> => {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `
      Génère une identité de marque EXCLUSIVE pour "${profile.companyName}".
      Secteur : ${profile.industry}
      Positionnement : ${profile.positioning}

      Inclus dans le JSON :
      - uniquenessFactor : Pourquoi ce logo est structurellement unique ?
      - differentiationStrategy : Stratégie visuelle.
      - svgPath : CHAÎNE DE CARACTÈRES 'D' (viewBox 0 0 512 512).
      - Des spécifications pour les cartes de visite et flyers incluant la disposition.
      
      Réponds en JSON uniquement.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: BRANDING_SCHEMA,
        maxOutputTokens: 8192,
      },
    });

    return JSON.parse(response.text.trim());
  });
};

export const generateBrandingFromLogo = async (logoBase64: string, companyName: string): Promise<BrandingResult> => {
  return withRetry(async () => {
    const ai = getAI();
    const cleanBase64 = logoBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const prompt = `
      Analyse visuellement ce logo pour la marque "${companyName}".
      Extrais les couleurs exactes (HEX), le style typographique, l'ambiance visuelle et l'intention de design.
      Sur la base de cette analyse, génère une charte graphique complète, cohérente et premium.
      
      Inclus dans le JSON :
      - uniquenessFactor : Analyse de la structure visuelle actuelle.
      - differentiationStrategy : Comment renforcer l'identité existante.
      - svgPath : Tente de recréer un tracé simplifié du symbole principal (chaîne 'D').
      
      Réponds en JSON uniquement.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: BRANDING_SCHEMA,
        maxOutputTokens: 8192,
      },
    });

    return JSON.parse(response.text.trim());
  });
};

export const generateImagePro = async (prompt: string, aspectRatio: any = "1:1"): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const enhancedPrompt = `
      MASTERPIECE BRANDING ASSET: ${prompt}. 
      Style: Ultra-premium, high-end commercial photography, 8k resolution, cinematic lighting, sharp focus on textures. 
      Aesthetic: Minimalist yet sophisticated, iconic and unmistakable. 
      Background: Clean, professional studio setting.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: enhancedPrompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Erreur de génération d'image Pro.");
  });
};

export const generateImage = async (prompt: string, base64ReferenceImage?: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const enhancedPrompt = `
      PREMIUM BRANDING VISUAL: ${prompt}. 
      Technical specs: 2k resolution, ultra-detailed textures, sharp focus, professional studio lighting. 
      Vibe: High-end, modern, clean, and commercially viable. 
      Background: Pure white or elegant minimalist context.
    `;
    const parts: any[] = [{ text: enhancedPrompt }];
    if (base64ReferenceImage) {
      const cleanBase64 = base64ReferenceImage.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({
        inlineData: { mimeType: 'image/png', data: cleanBase64 },
      });
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Erreur de génération d'image.");
  });
};

export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
          { text: prompt }
        ]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Erreur lors de l'édition de l'image.");
  });
};

export const generateVideoVeo = async (base64Image: string, prompt: string, isLandscape: boolean = true, signal?: AbortSignal): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: isLandscape ? '16:9' : '9:16'
      }
    });

    while (!operation.done) {
      if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
      await new Promise(resolve => setTimeout(resolve, 10000));
      if (signal?.aborted) throw new DOMException("The user aborted a request.", "AbortError");
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video download link not found.");
    
    try {
      console.log(`Attempting to download video from: ${downloadLink}`);
      const videoResponse = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY || process.env.API_KEY || "",
        },
        signal
      });

      if (!videoResponse.ok) {
        console.error(`Video download failed for ${downloadLink}: ${videoResponse.status} ${videoResponse.statusText}`);
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      console.log(`Successfully downloaded video from: ${downloadLink}`);
      const videoBlob = await videoResponse.blob();
      return URL.createObjectURL(videoBlob);
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
        console.log("Video download aborted intentionally");
        throw err;
      }
      console.error("Error downloading video:", err);
      throw new Error(`Erreur lors du téléchargement de la vidéo: ${err.message}`);
    }
  });
};

export const startStrategyChat = async (message: string, history: any[] = []) => {
  return withRetry(async () => {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: 'Tu es un expert en branding senior et consultant en stratégie de marque. Réponds de manière concise, professionnelle et inspirante.',
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  });
};

export const fastAnalyzeContent = async (text: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Analyse rapidement ce contenu pour en extraire l'essence stratégique en 3 points clés : ${text}`,
    });
    return response.text || "Aucune analyse disponible.";
  });
};

export const generateBrandLaunchPost = async (companyName: string, industry: string, visualStyle: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `
      Rédige un post LinkedIn de lancement officiel pour la marque "${companyName}".
      Secteur: ${industry}.
      Ton: ${visualStyle} (ex: Luxe, Tech, Minimaliste).
      
      Structure:
      1. Une accroche percutante.
      2. Une révélation de la nouvelle identité (pourquoi ce changement/création).
      3. Un appel à l'action subtil.
      
      Utilise des emojis pertinents mais avec parcimonie (style professionnel).
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Erreur de génération du texte.";
  });
};
