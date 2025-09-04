// Utility functions for handling video URLs

/**
 * Get a safe video URL, falling back to YouTube homepage if invalid
 * @param {string|null|undefined} videoUrl - The original video URL
 * @returns {string} - A valid video URL
 */
export const getSafeVideoUrl = (videoUrl) => {
  // Check if videoUrl is valid (not null, undefined, or empty string)
  if (!videoUrl || videoUrl.trim() === '' || videoUrl === 'null' || videoUrl === 'undefined') {
    return 'https://www.youtube.com/';
  }
  
  // Check if it's a valid URL format
  try {
    new URL(videoUrl);
    return videoUrl;
  } catch (error) {
    // If URL parsing fails, return YouTube homepage
    return 'https://www.youtube.com/';
  }
};

/**
 * Check if a video URL is valid (not the fallback)
 * @param {string} videoUrl - The video URL to check
 * @returns {boolean} - True if the URL is valid and not the fallback
 */
export const isValidVideoUrl = (videoUrl) => {
  return videoUrl && 
         videoUrl !== 'https://www.youtube.com/' && 
         videoUrl !== 'null' && 
         videoUrl !== 'undefined' &&
         videoUrl.trim() !== '';
};
