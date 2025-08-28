import React, { useState } from 'react';

const VideoList = ({ items, onExploreVideo, sortBy, setSortBy }) => {
  
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
        // Show highest-scoring keyframe image as thumbnail
        let bestFrame = null;
        if (video.keyframes && video.keyframes.length > 0) {
          bestFrame = [...video.keyframes].sort((a, b) => b.confidence_score - a.confidence_score)[0];
        }
        const thumbnailSrc = (bestFrame && bestFrame.image_url) 
          || video.thumbnail_url 
          || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

        return (
          <div 
            className="video-card" 
            key={`video-${i}`}
            onClick={() => onExploreVideo(video.video_id)}
          >
            <img
              className="thumb"
              src={thumbnailSrc}
              alt={`${video.video_id} best keyframe`}
              loading="lazy"
              onError={(e) => { 
                // Fallback to any available keyframe or blank
                if (bestFrame && bestFrame.image_url && e.currentTarget.src !== bestFrame.image_url) {
                  e.currentTarget.src = bestFrame.image_url;
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
