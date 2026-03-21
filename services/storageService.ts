
/**
 * Mock uploadImage to avoid Storage usage as per new requirements.
 * Just returns the base64 data as is.
 */
export const uploadImage = async (base64Data: string, _path: string): Promise<string> => {
  return base64Data;
};
