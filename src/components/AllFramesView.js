import React, { useState } from 'react';

const AllFramesView = ({ videoData, onOpenVideo, sortBy: externalSortBy }) => {
  const [sortByState, setSortByState] = useState('score'); // kept for backward compat, unused when external provided
  const sortBy = externalSortBy || sortByState;
  const [zoomedFrame, setZoomedFrame] = useState(null);
  
  if (!videoData || Object.keys(videoData).length === 0) {
    return <div className="status">No frames available</div>;
  }

  // Collect all frames from all videos
  const allFrames = [];
  Object.values(videoData).forEach(video => {
    video.keyframes.forEach(keyframe => {
      allFrames.push({
        ...keyframe,
        video_id: video.video_id,
        video_url: video.video_url,
        group_id: video.group_id
      });
    });
  });

  // Sort frames based on selected criteria
  const sortedFrames = [...allFrames].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.confidence_score - a.confidence_score;
      case 'time':
        return (a.timestamp || 0) - (b.timestamp || 0);
      case 'video':
        return a.video_id.localeCompare(b.video_id);
      case 'frame':
        return a.keyframe_num - b.keyframe_num;
      default:
        return 0;
    }
  });

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

  return (
    <>
      {/* Sort controls moved to toolbar */}
      
      <div className="grid">
        {sortedFrames.map((frame, i) => {
          const src = frame.image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
          const score = frame.confidence_score ? frame.confidence_score.toFixed(3) : '';
          const timestamp = frame.timestamp ? frame.timestamp.toFixed(1) : 'N/A';
          
          return (
            <div className="card" key={`frame-${i}`}>
              <img
                className="thumb keyframe-thumb"
                src={src}
                alt={`${frame.video_id} - Frame ${frame.keyframe_num}`}
                loading="lazy"
                onClick={() => setZoomedFrame(frame)}
                onError={(e) => { 
                  e.currentTarget.style.opacity = 0.5; 
                  e.currentTarget.alt = 'Preview unavailable'; 
                }}
              />
              <div className="meta">
                <div className="frame-header">
                  <div title={frame.keyframe_id}>
                    Frame {frame.keyframe_num}
                    {score && <span className="score-display">{score}</span>}
                  </div>
                  <div className="video-info">
                    <span className="video-name">{frame.video_id}</span>
                  </div>
                </div>
                <div className="frame-timestamp">
                  <span className="timestamp">{timestamp}s</span>
                </div>
                <div className="frame-actions">
                  <button
                    className="youtube-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToVideo(frame.video_url);
                    }}
                  >
                    📺 YouTube
                  </button>
                  <button
                    className="csv-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCSV(frame.video_id, frame.keyframe_num);
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
                    onClick={() => navigateToVideo(zoomedFrame.video_url)}
                  >
                    📺 Watch on YouTube
                  </button>
                  <button
                    className="csv-btn zoom-csv-btn"
                    onClick={() => downloadCSV(zoomedFrame.video_id, zoomedFrame.keyframe_num)}
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

export default AllFramesView;
