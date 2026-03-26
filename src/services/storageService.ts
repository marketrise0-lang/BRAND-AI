import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Converts a base64 string to a Uint8Array.
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Uploads a base64 image to Firebase Storage and returns the download URL.
 * @param uid User ID
 * @param projectId Project ID
 * @param fileName Name of the file (e.g., 'master_logo.png')
 * @param base64Data The base64 string (with or without data prefix)
 */
export const uploadBase64Image = async (uid: string, projectId: string, fileName: string, base64Data: string, retries = 3): Promise<string> => {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    // If it's already a URL or not a valid base64 image, return as is
    return base64Data;
  }

  try {
    const storagePath = `users/${uid}/projects/${projectId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Remove the data:image/...;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const bytes = base64ToUint8Array(cleanBase64);
    
    // Use uploadBytes for more reliable binary transfer
    await uploadBytes(storageRef, bytes, { contentType: 'image/png' });
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    if (retries > 0 && error.code === 'storage/retry-limit-exceeded') {
      console.warn(`Retrying upload for ${fileName}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return uploadBase64Image(uid, projectId, fileName, base64Data, retries - 1);
    }
    console.error(`Error uploading image ${fileName}:`, error);
    // Fallback to the original base64 if upload fails (though this might still hit Firestore limits)
    return base64Data;
  }
};

/**
 * Processes a BrandingResult object, uploading all base64 images to Storage in parallel.
 */
export const processBrandingImages = async (uid: string, projectId: string, brandingData: any): Promise<any> => {
  const processed = JSON.parse(JSON.stringify(brandingData)); // Deep clone
  const uploadTasks: Promise<void>[] = [];

  // 1. Logo Variations
  if (processed.logo) {
    if (processed.logo.generatedImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.generatedImageUrl = await uploadBase64Image(uid, projectId, 'master_logo.png', processed.logo.generatedImageUrl);
      })());
    }
    if (processed.logo.simplifiedImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.simplifiedImageUrl = await uploadBase64Image(uid, projectId, 'simplified_logo.png', processed.logo.simplifiedImageUrl);
      })());
    }
    if (processed.logo.monochromeImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.monochromeImageUrl = await uploadBase64Image(uid, projectId, 'monochrome_logo.png', processed.logo.monochromeImageUrl);
      })());
    }
    if (processed.logo.invertedImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.invertedImageUrl = await uploadBase64Image(uid, projectId, 'inverted_logo.png', processed.logo.invertedImageUrl);
      })());
    }
    if (processed.logo.darkBgImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.darkBgImageUrl = await uploadBase64Image(uid, projectId, 'dark_bg_logo.png', processed.logo.darkBgImageUrl);
      })());
    }
    if (processed.logo.faviconImageUrl) {
      uploadTasks.push((async () => {
        processed.logo.faviconImageUrl = await uploadBase64Image(uid, projectId, 'favicon.png', processed.logo.faviconImageUrl);
      })());
    }
  }

  // 2. Style Guide Assets
  if (processed.styleGuide) {
    if (processed.styleGuide.graphicElements?.patternImageUrl) {
      uploadTasks.push((async () => {
        processed.styleGuide.graphicElements.patternImageUrl = await uploadBase64Image(uid, projectId, 'brand_pattern.png', processed.styleGuide.graphicElements.patternImageUrl);
      })());
    }
    if (processed.styleGuide.mockupImageUrl) {
      uploadTasks.push((async () => {
        processed.styleGuide.mockupImageUrl = await uploadBase64Image(uid, projectId, 'master_mockup.png', processed.styleGuide.mockupImageUrl);
      })());
    }
    
    // Print assets
    if (processed.styleGuide.ecosystem?.print) {
      if (processed.styleGuide.ecosystem.print.businessCardImageUrl) {
        uploadTasks.push((async () => {
          processed.styleGuide.ecosystem.print.businessCardImageUrl = await uploadBase64Image(uid, projectId, 'business_card.png', processed.styleGuide.ecosystem.print.businessCardImageUrl);
        })());
      }
      if (processed.styleGuide.ecosystem.print.flyerImageUrl) {
        uploadTasks.push((async () => {
          processed.styleGuide.ecosystem.print.flyerImageUrl = await uploadBase64Image(uid, projectId, 'flyer.png', processed.styleGuide.ecosystem.print.flyerImageUrl);
        })());
      }
    }

    // Extra Mockups (Array)
    if (Array.isArray(processed.styleGuide.extraMockups)) {
      const extraMockupTasks = processed.styleGuide.extraMockups.map(async (data: string, i: number) => {
        return await uploadBase64Image(uid, projectId, `mockup_${i + 1}.png`, data);
      });
      
      uploadTasks.push((async () => {
        processed.styleGuide.extraMockups = await Promise.all(extraMockupTasks);
      })());
    }
  }

  // Wait for all uploads to complete in parallel
  await Promise.all(uploadTasks);

  return processed;
};
