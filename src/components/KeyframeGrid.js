import React, { useState } from 'react';

const KeyframeGrid = ({ selectedVideoId, videoData, onBackToVideos, onOpenVideo, sortBy: externalSortBy }) => {
  const [zoomedFrame, setZoomedFrame] = useState(null);
  
  if (!selectedVideoId || !videoData[selectedVideoId]) {
    return <div className="status">No video selected</div>;
  }

  const sortBy = externalSortBy || 'score';
  const video = videoData[selectedVideoId];

  const navigateToVideo = (videoUrl) => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadCSV = (videoId, frameIdx) => {
    const csvContent = `video_id,frame_idx\n${videoId},${frameIdx}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${videoId}_frame_${frameIdx}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort keyframes based on selected criteria
  const sortedKeyframes = [...video.keyframes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.keyframe_num - b.keyframe_num;
      case 'score':
        return b.confidence_score - a.confidence_score;
      case 'time':
        return (a.timestamp || 0) - (b.timestamp || 0);
      default:
        return 0;
    }
  });

  return (
    <>
      <button className="back-button" onClick={onBackToVideos}>
        ← Back to Videos
      </button>
      
      <div className="keyframes-header">
        <div>
          <h2 style={{ margin: 0, color: '#eaf0f6' }}>
            {selectedVideoId} ({video.group_id})
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#a2b0c6', fontSize: '14px' }}>
            {video.keyframes.length} keyframes found
          </p>
        </div>
      </div>

      <div className="youtube-section">
        <button
          className="video-link-btn youtube-top-btn"
          onClick={() => navigateToVideo(video.video_url)}
        >
          📺 Watch on YouTube
        </button>
      </div>

      {/* Sort controls removed; now in top toolbar */}
      
      <div className="grid">
        {sortedKeyframes.map((keyframe, i) => {
          const src = keyframe.image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
          const score = keyframe.confidence_score ? keyframe.confidence_score.toFixed(3) : '';
          const timestamp = keyframe.timestamp ? keyframe.timestamp.toFixed(1) : 'N/A';
          
          return (
            <div className="card" key={`keyframe-${i}`}>
                             <img
                className="thumb keyframe-thumb"
                src={src}
                alt={`${keyframe.video_id} - Frame ${keyframe.keyframe_num}`}
                loading="lazy"
                onClick={() => setZoomedFrame(keyframe)}
                onError={(e) => { 
                  e.currentTarget.style.opacity = 0.5; 
                  e.currentTarget.alt = 'Preview unavailable'; 
                }}
              />
              <div className="meta">
                <div title={keyframe.keyframe_id}>
                  Frame {keyframe.keyframe_num}
                  {score && <span className="score-display">{score}</span>}
                </div>
                <div className="frame-timestamp">
                  <span className="timestamp">{timestamp}s</span>
                </div>
                <div className="frame-actions">
                  <button
                    className="youtube-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToVideo(video.video_url);
                    }}
                  >
                    📺 YouTube
                  </button>
                  <button
                    className="csv-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCSV(video.video_id, keyframe.keyframe_num);
                    }}
                  >
                    📊 CSV
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Frame Modal */}
      {zoomedFrame && (
        <div className="zoom-frame-overlay" onClick={() => setZoomedFrame(null)}>
          <div className="zoom-frame-container" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-frame-header">
              <div className="zoom-frame-title">
                Frame {zoomedFrame.keyframe_num} - {zoomedFrame.video_id}
              </div>
              <button 
                className="zoom-frame-close" 
                onClick={() => setZoomedFrame(null)}
              >
                ×
              </button>
            </div>
            <div className="zoom-frame-content">
              <img
                className="zoom-frame-image"
                src={zoomedFrame.image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}
                alt={`${zoomedFrame.video_id} - Frame ${zoomedFrame.keyframe_num}`}
              />
              <div className="zoom-frame-info">
                <div className="zoom-frame-details">
                  <span className="zoom-frame-score">
                    Score: {zoomedFrame.confidence_score ? zoomedFrame.confidence_score.toFixed(3) : 'N/A'}
                  </span>
                  <span className="zoom-frame-timestamp">
                    Time: {zoomedFrame.timestamp ? `${zoomedFrame.timestamp.toFixed(1)}s` : 'N/A'}
                  </span>
                </div>
                <div className="zoom-frame-actions">
                  <button
                    className="youtube-btn zoom-youtube-btn"
                    onClick={() => navigateToVideo(video.video_url)}
                  >
                    📺 Watch on YouTube
                  </button>
                  <button
                    className="csv-btn zoom-csv-btn"
                    onClick={() => downloadCSV(video.video_id, zoomedFrame.keyframe_num)}
                  >
                    📊 Download CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyframeGrid;
