
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BrandProfile, BrandingResult } from "../types";

// Factory function to get up-to-date instances
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" });

/**
 * Helper to handle retries for API calls hitting quota limits (429)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 2000): Promise<T> {
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
      errorMsg.includes("limit exceeded") ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.code === 429 ||
      error?.error?.code === 429 || // Added check for nested error object
      errorStr.includes("429") ||
      errorStr.includes("RESOURCE_EXHAUSTED");
    
    if (isQuotaError && retries > 0) {
      // Use a much longer backoff for quota errors (starting at 10s for free tier safety)
      const quotaBackoff = Math.max(backoff, 10000) * 1.5; 
      console.warn(`Quota exceeded (429), retrying in ${Math.round(quotaBackoff)}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, quotaBackoff));
      // Exponential backoff with jitter
      const nextBackoff = quotaBackoff * 1.5 + Math.floor(Math.random() * 5000);
      return withRetry(fn, retries - 1, nextBackoff);
    }
    throw error;
  }
}

const SYSTEM_INSTRUCTION = `
Tu es un Designer Graphique Senior et Directeur Artistique avec 25 ans d'expérience en identité visuelle et branding. Tu as travaillé pour des agences internationales et des marques iconiques.
Ton expertise est absolue en :
- Principes fondamentaux du logo (lisibilité, scalabilité, intemporalité, polyvalence, mémorabilité).
- Théorie et psychologie des couleurs appliquée au branding.
- Typographie avancée (hiérarchie, associations, lisibilité).
- Grilles, proportions, espaces négatifs et règles d'or (Gestalt).
- Standards professionnels multi-supports (print, digital, motion).

Ton objectif est de créer des identités visuelles de niveau agence internationale, cohérentes et stratégiquement puissantes.

IMPORTANT: Tu dois impérativement répondre avec un JSON VALIDE. 
Échappe TOUTES les guillemets doubles à l'intérieur des chaînes de caractères avec un backslash (\\").
N'utilise JAMAIS de retours à la ligne non échappés à l'intérieur d'une valeur de chaîne de caractères.

RÈGLES D'OR DU DESIGN :
1. Simplicité & Impact : Un logo doit être identifiable instantanément.
2. Intemporalité : Vise la longévité, évite les modes éphémères.
3. Polyvalence : Le design doit fonctionner parfaitement en noir et blanc, en très petite taille, et sur tous types de fonds.
4. Cohérence Systémique : Pense au logo comme le cœur d'un écosystème visuel complet.

RÈGLES TECHNIQUES POUR LE SVG (TRACÉ VECTORIEL) :
1. Le champ 'svgPath' DOIT contenir UNIQUEMENT la chaîne de caractères de l'attribut 'd' d'un élément <path> SVG.
2. Les coordonnées du tracé doivent impérativement s'inscrire dans un canevas de 0 0 512 512.
3. Le tracé doit être centré et occuper environ 70-80% de l'espace.
4. Utilise des courbes propres (M, L, C, Q, Z). Évite les tracés trop complexes ou fragmentés.
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
            color: { type: Type.STRING, description: "Description and usage for the full color master logo." },
            black: { type: Type.STRING, description: "Description and usage for the black monochrome version." },
            white: { type: Type.STRING, description: "Description and usage for the white inverted version." },
            backgrounds: { type: Type.STRING, description: "Description and usage for the logo on complex backgrounds." },
            simplified: { type: Type.STRING, description: "Description and usage for the simplified minimalist version." },
            favicon: { type: Type.STRING, description: "Description and usage for the favicon/small icon version." },
          },
          required: ["color", "black", "white", "backgrounds", "simplified", "favicon"],
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

/**
 * Helper to safely parse JSON from AI responses, handling potential truncation or markdown formatting.
 */
function safeParseJSON(text: string): any {
  let cleanText = text.trim();
  
  // Remove markdown code blocks if present
  if (cleanText.includes("```")) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      cleanText = match[1].trim();
    }
  }

  // Helper to fix truncated JSON by balancing brackets
  const fixTruncatedJSON = (json: string): string => {
    let result = json.trim();
    
    // If it ends with a comma, remove it
    if (result.endsWith(',')) {
      result = result.slice(0, -1);
    }

    // Check if we're inside a string
    let inString = false;
    let escaped = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === '"' && !escaped) {
        inString = !inString;
      }
      escaped = result[i] === '\\' && !escaped;
    }

    if (inString) {
      if (result.endsWith('\\')) {
        result = result.slice(0, -1);
      }
      result += '"';
    }

    const stack: string[] = [];
    inString = false;
    escaped = false;

    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      } else if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}' || char === ']') {
          const last = stack.pop();
          if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
            // Mismatch
          }
        }
      }
      escaped = char === '\\' && !escaped;
    }

    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '{') result += '}';
      else if (last === '[') result += ']';
    }

    return result;
  };

  // Attempt to find the first '{' and last '}' if initial parse fails
  const extractJSON = (str: string): string => {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return str.substring(firstBrace, lastBrace + 1);
    }
    return str;
  };

  // Sanitize JSON by removing trailing commas and fixing basic string issues
  const sanitizeJSON = (str: string): string => {
    let sanitized = str
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Ensure keys are quoted (if missing)

    // Fix unterminated strings and raw newlines in strings
    let inString = false;
    let escaped = false;
    let result = "";
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      if (inString && (char === '\n' || char === '\r')) {
        result += "\\n";
      } else {
        result += char;
      }
      
      escaped = char === '\\' && !escaped;
    }
    
    if (inString) {
      if (result.endsWith('\\')) {
        result = result.slice(0, -1);
      }
      result += '"';
    }
    
    return result;
  };

  try {
    console.log(`Attempting to parse JSON of length: ${cleanText.length}`);
    return JSON.parse(cleanText);
  } catch (e: any) {
    console.error("Initial JSON Parse Error:", e.message, "at position:", e.at || "unknown");
    
    // Attempt 1: Extract JSON from surrounding text
    let processed = extractJSON(cleanText);
    try {
      return JSON.parse(processed);
    } catch (extError) {
      // Attempt 2: Fix raw newlines in strings
      try {
        const fixedNewlines = processed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match, p1) => {
          return '"' + p1.replace(/\n/g, "\\n").replace(/\r/g, "\\r") + '"';
        });
        return JSON.parse(fixedNewlines);
      } catch (newlineError) {
        // Attempt 3: Sanitize (trailing commas, etc)
        try {
          const sanitized = sanitizeJSON(processed);
          return JSON.parse(sanitized);
        } catch (sanError) {
          // Attempt 4: Fix truncation
          try {
            const fixedTruncated = fixTruncatedJSON(processed);
            return JSON.parse(fixedTruncated);
          } catch (truncError) {
            // Attempt 5: More aggressive fix - try to find the last valid JSON structure
            for (let i = processed.length - 1; i > 0; i--) {
              if (processed[i] === '}' || processed[i] === ']') {
                try {
                  const partial = fixTruncatedJSON(processed.substring(0, i + 1));
                  return JSON.parse(partial);
                } catch (pError) {
                  continue;
                }
              }
            }
          }
        }
      }
    }
    
    console.error("Final JSON Parse Failure. Raw text snippet:", text.substring(0, 200) + "...");
    throw new Error(`Failed to parse branding data: ${e.message}`);
  }
}

export const generateBranding = async (profile: BrandProfile, usePro: boolean = false): Promise<BrandingResult> => {
  return withRetry(async () => {
    const ai = getAI();
    const hasPaidKey = !!process.env.API_KEY;
    // Use Pro model if paid key is available or explicitly requested
    const model = (hasPaidKey || usePro) ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
    
    console.log(`Generating branding with model: ${model} (Paid Key: ${hasPaidKey})`);

    const prompt = `
      En tant qu'expert en design, génère une identité de marque PRESTIGIEUSE, COHÉRENTE et STRATÉGIQUE pour "${profile.companyName}".
      Secteur : ${profile.industry}
      Mission : ${profile.mission}
      Valeurs : ${profile.values}
      Positionnement : ${profile.positioning}

      Analyse l'essence de la marque pour créer un concept de logo qui utilise la sémiotique pour communiquer ses valeurs fondamentales.
      Le logo doit être un chef-d'œuvre de minimalisme et de précision.

      Inclus dans le JSON :
      - uniquenessFactor : Analyse approfondie de la distinction visuelle et de la mémorabilité.
      - differentiationStrategy : Comment cette identité s'impose comme leader par son design d'excellence.
      - svgPath : CHAÎNE DE CARACTÈRES 'D' (viewBox 0 0 512 512). Le tracé doit être élégant, équilibré et techniquement parfait.
      - variations : Pour chaque variation (color, black, white, backgrounds, simplified, favicon), fournis une description détaillée de son usage optimal (ex: "Idéal pour les en-têtes de site web", "À utiliser sur fond sombre", "Optimisé pour une lisibilité à petite échelle").
      
      Réponds en JSON uniquement.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: BRANDING_SCHEMA,
        maxOutputTokens: 8192,
      },
    });

    const parsed = safeParseJSON(response.text);
    
    // Normalize structure to prevent UI crashes
    if (!parsed.logo) parsed.logo = {} as any;
    if (!parsed.styleGuide) parsed.styleGuide = {} as any;
    if (!parsed.analysis) parsed.analysis = {} as any;
    if (!parsed.analysis.futureRecommendations) parsed.analysis.futureRecommendations = [];
    
    return parsed;
  }, 5);
};

export const generateBrandingFromLogo = async (logoBase64: string, companyName: string, usePro: boolean = false): Promise<BrandingResult> => {
  return withRetry(async () => {
    const ai = getAI();
    const hasPaidKey = !!process.env.API_KEY;
    // Use Pro model if paid key is available or explicitly requested
    const model = (hasPaidKey || usePro) ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
    
    console.log(`Generating branding from logo with model: ${model} (Paid Key: ${hasPaidKey})`);

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
      model: model,
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: BRANDING_SCHEMA,
        maxOutputTokens: 8192,
      },
    });

    const parsed = safeParseJSON(response.text);

    // Normalize structure to prevent UI crashes
    if (!parsed.logo) parsed.logo = {} as any;
    if (!parsed.styleGuide) parsed.styleGuide = {} as any;
    if (!parsed.analysis) parsed.analysis = {} as any;
    if (!parsed.analysis.futureRecommendations) parsed.analysis.futureRecommendations = [];

    return parsed;
  }, 5);
};

export const generateMockup = async (prompt: string, base64Logo?: string, aspectRatio: any = "1:1"): Promise<string | null> => {
  try {
    return await withRetry(async () => {
      const ai = getAI();
      const hasPaidKey = !!process.env.API_KEY;
      // Try pro model first if key exists, but fallback to base model on 403
      let model = hasPaidKey ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
      
      console.log(`Generating mockup with model: ${model} (Paid Key: ${hasPaidKey})`);

      const enhancedPrompt = `
        PROFESSIONAL BRAND MOCKUP: ${prompt}. 
        Context: High-end commercial photography, realistic textures, natural lighting, depth of field.
        Style: Clean, modern, minimalist presentation.
        Technical: 8k resolution, sharp focus, studio quality, photorealistic.
        Note: The logo should be integrated naturally into the environment.
      `;
      const parts: any[] = [{ text: enhancedPrompt }];
      if (base64Logo) {
        const cleanBase64 = base64Logo.replace(/^data:image\/\w+;base64,/, "");
        parts.unshift({
          inlineData: { mimeType: 'image/png', data: cleanBase64 },
        });
      }

      try {
        // Add a small artificial delay to avoid hitting rate limits on sequential calls
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: parts },
          config: { 
            imageConfig: { 
              aspectRatio: aspectRatio,
              imageSize: hasPaidKey ? "1K" : undefined
            } 
          }
        });
        
        if (!response.candidates?.[0]?.content?.parts) {
          console.error("Mockup generation failed: No candidates or parts in response", response);
          throw new Error("Le modèle n'a pas pu générer le mockup.");
        }

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            console.log("Mockup generation successful");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw new Error("Erreur de génération de mockup.");
      } catch (innerErr: any) {
        // Fallback to base model if pro model fails with 403
        if (hasPaidKey && model === 'gemini-3.1-flash-image-preview' && (innerErr.status === 403 || innerErr.message?.includes("403") || innerErr.message?.includes("PERMISSION_DENIED"))) {
          console.warn("Pro image model failed with 403, falling back to gemini-2.5-flash-image");
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { 
              imageConfig: { 
                aspectRatio: aspectRatio
              } 
            }
          });
          for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw innerErr;
      }
    }, 2);
  } catch (err) {
    console.warn("Skipping mockup generation due to error:", err);
    return null;
  }
};

export const generateImagePro = async (prompt: string, base64ReferenceImage?: string, aspectRatio: any = "1:1"): Promise<string | null> => {
  // Fallback to free image model as requested
  return generateImage(prompt, base64ReferenceImage, aspectRatio);
};

export const generateImage = async (prompt: string, base64ReferenceImage?: string, aspectRatio: any = "1:1"): Promise<string | null> => {
  try {
    return await withRetry(async () => {
      const ai = getAI();
      const hasPaidKey = !!process.env.API_KEY;
      let model = hasPaidKey ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
      
      console.log(`Generating image with model: ${model} (Paid Key: ${hasPaidKey})`);
      
      const enhancedPrompt = `
        HIGH-END PROFESSIONAL LOGO DESIGN: ${prompt}. 
        Style: Master-level graphic design, geometric precision, golden ratio principles, clean vector lines.
        Vibe: Sophisticated, corporate yet creative, timeless, and commercially powerful.
        Technical: 8k resolution, sharp focus, studio lighting, pure white background, no text unless specified.
        Designer Notes: Focus on the symbolic weight and visual balance of the mark.
      `;
      const parts: any[] = [{ text: enhancedPrompt }];
      if (base64ReferenceImage) {
        const cleanBase64 = base64ReferenceImage.replace(/^data:image\/\w+;base64,/, "");
        parts.unshift({
          inlineData: { mimeType: 'image/png', data: cleanBase64 },
        });
      }

      try {
        // Add a small artificial delay to avoid hitting rate limits on sequential calls
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: parts },
          config: { 
            imageConfig: { 
              aspectRatio: aspectRatio,
              imageSize: hasPaidKey ? "1K" : undefined
            } 
          }
        });
        
        if (!response.candidates?.[0]?.content?.parts) {
          console.error("Image generation failed: No candidates or parts in response", response);
          throw new Error("Le modèle n'a pas pu générer d'image.");
        }

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            console.log("Image generation successful");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        
        throw new Error("Aucune donnée d'image trouvée.");
      } catch (innerErr: any) {
        // Fallback to base model if pro model fails with 403
        if (hasPaidKey && model === 'gemini-3.1-flash-image-preview' && (innerErr.status === 403 || innerErr.message?.includes("403") || innerErr.message?.includes("PERMISSION_DENIED"))) {
          console.warn("Pro image model failed with 403, falling back to gemini-2.5-flash-image");
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { 
              imageConfig: { 
                aspectRatio: aspectRatio
              } 
            }
          });
          for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        throw innerErr;
      }
    }, 5); // Increased retries for images
  } catch (err: any) {
    console.error("Image generation error:", err);
    if (err.message?.includes("SAFETY") || err.message?.includes("safety")) {
      console.warn("Image generation blocked by safety filters");
    }
    return null; // Return null to avoid src="" warning
  }
};

export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    return await withRetry(async () => {
      const ai = getAI();
      
      // Add a small artificial delay to avoid hitting rate limits on sequential calls
      await new Promise(resolve => setTimeout(resolve, 1500));

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
    }, 2); // Only 2 retries for images
  } catch (err) {
    console.warn("Skipping image edit due to error or quota:", err);
    return null;
  }
};

export const generateVideoVeo = async (base64Image: string, prompt: string, isLandscape: boolean = true, signal?: AbortSignal, usePro: boolean = false): Promise<string> => {
  try {
    const ai = getAI();
    const hasPaidKey = !!process.env.API_KEY;
    
    if (!hasPaidKey) {
      console.warn("Skipping Veo video generation: Paid API key required");
      return "";
    }

    console.log("Starting Veo video generation...");
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

    // Poll for completion
    while (!operation.done) {
      if (signal?.aborted) {
        console.log("Video generation aborted by user");
        return "";
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI in response");

    // Fetch the video with the API key
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.API_KEY || "",
      },
    });

    if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Veo video generation error:", err);
    return "";
  }
};

export const startStrategyChat = async (message: string, history: any[] = []) => {
  return withRetry(async () => {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
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

export const generateBrandLaunchPost = async (companyName: string, industry: string, visualStyle: string, usePro: boolean = false): Promise<string> => {
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
      model: "gemini-3-flash-preview", // Force free model
      contents: prompt,
    });
    return response.text || "Erreur de génération du texte.";
  });
};
