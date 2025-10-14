/**
 * Application configuration.
 * 
 * Centralizes environment variables and app-wide settings.
 */

/**
 * Get the API base URL from environment variables.
 * 
 * @throws Error if NEXT_PUBLIC_API_URL is not defined
 * @returns The API base URL
 */
export function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file."
    );
  }
  
  return apiUrl;
}

/**
 * Get the API key from environment variables (optional).
 * 
 * @returns The API key or undefined if not set
 */
export function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_API_KEY;
}

/**
 * Application configuration object.
 */
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    key: process.env.NEXT_PUBLIC_API_KEY,
  },
  // Add more config sections as needed
} as const;
