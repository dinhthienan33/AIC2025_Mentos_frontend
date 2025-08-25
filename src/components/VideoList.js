import React, { useState } from 'react';

const VideoList = ({ items, onExploreVideo }) => {
  const [sortBy, setSortBy] = useState('score'); // 'name', 'score', 'frames'
  
  if (!items || items.length === 0) {
    return null;
  }

  // Sort items based on selected criteria
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.video_id.localeCompare(b.video_id);
      case 'score':
        return b.best_score - a.best_score;
      case 'frames':
        return b.keyframes.length - a.keyframes.length;
      default:
        return 0;
    }
  });

  return (
    <>
      <div className="sort-controls">
        <label>Sort by:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="score">Best Score</option>
          <option value="name">Video Name</option>
          <option value="frames">Number of Frames</option>
        </select>
      </div>
      
      <div className="grid">
        {sortedItems.map((video, i) => {
        // Use YouTube thumbnail if available, fallback to first keyframe image
        const thumbnailSrc = video.thumbnail_url || 
          (video.keyframes && video.keyframes[0] 
            ? video.keyframes[0].image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
            : 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');

        return (
          <div 
            className="video-card" 
            key={`video-${i}`}
            onClick={() => onExploreVideo(video.video_id)}
          >
            <img
              className="thumb"
              src={thumbnailSrc}
              alt={`${video.video_id} YouTube thumbnail`}
              loading="lazy"
              onError={(e) => { 
                // Fallback to keyframe image if YouTube thumbnail fails
                if (video.keyframes && video.keyframes[0] && video.keyframes[0].image_url && e.currentTarget.src !== video.keyframes[0].image_url) {
                  e.currentTarget.src = video.keyframes[0].image_url;
                } else {
                  e.currentTarget.style.opacity = 0.5; 
                  e.currentTarget.alt = 'Preview unavailable'; 
                }
              }}
            />
            <div className="video-info">
              <div className="video-title">{video.video_id}</div>
              <div className="video-stats">
                <span className="keyframe-count">
                  {video.keyframes.length} frames
                </span>
                <span className="best-score">
                  {video.best_score.toFixed(3)}
                </span>
              </div>
              <div className="video-timestamp">
                <span className="timestamp">
                  {video.keyframes && video.keyframes[0] && video.keyframes[0].timestamp 
                    ? `${video.keyframes[0].timestamp.toFixed(1)}s` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
};

export default VideoList;
