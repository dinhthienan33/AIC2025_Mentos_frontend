import React, { useState } from 'react';
import VideoPlayerModal from './VideoPlayModal'

const AllFramesView = ({ videoData, onOpenVideo, sortBy: externalSortBy, csvBaseName }) => {
  const [sortByState, setSortByState] = useState('score'); // kept for backward compat, unused when external provided
  const sortBy = externalSortBy || sortByState;
  const [zoomedFrame, setZoomedFrame] = useState(null);
  const [player, setPlayer] = useState({ open: false, url: '', t: 0 });

  if (!videoData || Object.keys(videoData).length === 0) {
    return <div className="status">No frames available</div>;
  }

  const openPlayer = (videoUrl, seconds) => {
    setPlayer({
      open: true,
      url: videoUrl,
      t: Math.max(0, Math.floor(seconds || 0)),
    });
  };

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

  const buildUrlWithTime = (urlString, seconds) => {
    try {
      if (!urlString) return urlString;
      const url = new URL(urlString);
      const isYouTube = /youtube\.com|youtu\.be/.test(url.hostname);
      if (isYouTube) {
        url.searchParams.delete('t');
        url.searchParams.delete('start');
        const t = Math.max(0, Math.floor(seconds || 0));
        url.searchParams.set('t', `${t}s`);
        return url.toString();
      }
      const t = Math.max(0, Math.floor(seconds || 0));
      url.searchParams.set('t', `${t}`);
      return url.toString();
    } catch (_) {
      return urlString;
    }
  };

  const navigateToVideo = (videoUrl, seconds) => {
    const finalUrl = buildUrlWithTime(videoUrl, seconds);
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadCSV = (videoId, frameIdx) => {
    const csvContent = `${videoId},${frameIdx}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const base = (csvBaseName && csvBaseName.trim().length > 0) ? csvBaseName.trim() : `${videoId}`;
    link.setAttribute('download', `${base}.csv`);
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
                      openPlayer(frame.video_url, frame.timestamp);
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
                    onClick={() => openPlayer(zoomedFrame.video_url, zoomedFrame.timestamp)}
                  >
                    📺 Watch 
                  </button>
                  <button
                    className="csv-btn zoom-csv-btn"
                    onClick={() => downloadCSV(zoomedFrame.video_id, zoomedFrame.keyframe_num)}
                  >
                    📊 Download CSV
                  </button>
                </div>
                {videoData[zoomedFrame.video_id] && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ color: '#a2b0c6', marginBottom: '6px' }}>All frames in this video</div>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '6px' }}>
                      {videoData[zoomedFrame.video_id].keyframes.map((kf, idx) => {
                        const kfSrc = kf.image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
                        const isActive = kf.keyframe_num === zoomedFrame.keyframe_num;
                        return (
                          <div
                            key={`strip-${zoomedFrame.video_id}-${idx}`}
                            style={{ minWidth: '120px', border: isActive ? '2px solid #4da3ff' : '1px solid #2b3b52', borderRadius: '6px', padding: '2px' }}
                          >
                            <img
                              src={kfSrc}
                              alt={`${zoomedFrame.video_id} - Frame ${kf.keyframe_num}`}
                              style={{ width: '120px', height: '68px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                              onClick={() => setZoomedFrame({ ...kf, video_url: zoomedFrame.video_url })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {player.open && (
        <VideoPlayerModal
          videoUrl={player.url}
          startSeconds={player.t}
          onClose={() => setPlayer({ open: false, url: '', t: 0 })}
        />
      )}
    </>
  );
};

export default AllFramesView;
