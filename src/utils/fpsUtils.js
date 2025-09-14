// Utility functions for handling FPS data from metadata CSV

let fpsDataCache = null;

/**
 * Load FPS data from the metadata CSV file
 * @returns {Promise<Object>} - Object mapping video_id to FPS data
 */
export const loadFpsData = async () => {
  if (fpsDataCache) {
    return fpsDataCache;
  }

  try {
    const response = await fetch('/metadata_v2.csv');
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    const fpsData = {};
    dataLines.forEach(line => {
      const [video_name, fps, url, group_id, video_id, thumbnail] = line.split(',');
      if (video_name && fps) {
        fpsData[video_name] = {
          fps: parseFloat(fps),
          url: url,
          group_id: group_id,
          video_id: video_id,
          thumbnail: thumbnail
        };
      }
    });
    
    fpsDataCache = fpsData;
    console.log(`Loaded FPS data for ${Object.keys(fpsData).length} videos`);
    return fpsData;
  } catch (error) {
    console.error('Error loading FPS data:', error);
    return {};
  }
};

/**
 * Get FPS for a specific video
 * @param {string} videoId - The video ID (e.g., "L21_V001")
 * @returns {Promise<number|null>} - FPS value or null if not found
 */
export const getVideoFps = async (videoId) => {
  const fpsData = await loadFpsData();
  return fpsData[videoId]?.fps || null;
};

/**
 * Get complete video metadata including FPS
 * @param {string} videoId - The video ID
 * @returns {Promise<Object|null>} - Complete video metadata or null if not found
 */
export const getVideoMetadata = async (videoId) => {
  const fpsData = await loadFpsData();
  return fpsData[videoId] || null;
};

/**
 * Calculate frame number from timestamp and FPS
 * @param {number} timestamp - Time in seconds
 * @param {number} fps - Frames per second
 * @returns {number} - Frame number (0-based)
 */
export const timestampToFrameNumber = (timestamp, fps) => {
  return Math.floor(timestamp * fps);
};

/**
 * Calculate timestamp from frame number and FPS
 * @param {number} frameNumber - Frame number (0-based)
 * @param {number} fps - Frames per second
 * @returns {number} - Time in seconds
 */
export const frameNumberToTimestamp = (frameNumber, fps) => {
  return frameNumber / fps;
};

/**
 * Get all available video IDs
 * @returns {Promise<Array<string>>} - Array of video IDs
 */
export const getAllVideoIds = async () => {
  const fpsData = await loadFpsData();
  return Object.keys(fpsData);
};

/**
 * Get videos by group ID
 * @param {string} groupId - The group ID (e.g., "L21")
 * @returns {Promise<Array<Object>>} - Array of video metadata for the group
 */
export const getVideosByGroup = async (groupId) => {
  const fpsData = await loadFpsData();
  return Object.values(fpsData).filter(video => video.group_id === groupId);
};
