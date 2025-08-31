import React, { useEffect, useMemo, useRef, useState } from 'react';
import VideoPlayerModal from './VideoPlayModal';

const KeyframeGrid = ({ selectedVideoId, videoData, onBackToVideos, onOpenVideo, sortBy: externalSortBy, csvBaseName }) => {
  const [zoomedFrame, setZoomedFrame] = useState(null);
  const [player, setPlayer] = useState({ open: false, url: '', t: 0, markers: [] });

  if (!selectedVideoId || !videoData[selectedVideoId]) {
    return <div className="status">No video selected</div>;
  }

  const sortBy = externalSortBy || 'score';
  const video = videoData[selectedVideoId];

  const buildUrlWithTime = (urlString, seconds) => {
    try {
      if (!urlString) return urlString;
      const url = new URL(urlString);
      // Prefer t param in seconds for YouTube watch URLs
      const isYouTube = /youtube\.com|youtu\.be/.test(url.hostname);
      if (isYouTube) {
        // Remove existing time params
        url.searchParams.delete('t');
        url.searchParams.delete('start');
        const t = Math.max(0, Math.floor(seconds || 0));
        url.searchParams.set('t', `${t}s`);
        return url.toString();
      }
      // Generic fallback: add t seconds param
      const t = Math.max(0, Math.floor(seconds || 0));
      url.searchParams.set('t', `${t}`);
      return url.toString();
    } catch (_) {
      return urlString;
    }
  };

  const openPlayer = (videoUrl, seconds, keyframes = []) => {
    const keyframeRefs = (keyframes || [])
      .map(k => ({
        sec: Math.max(0, Math.floor(k?.timestamp || 0)),
        frameIdx: k?.keyframe_num
      }))
      .filter(x => Number.isFinite(x.sec) && Number.isFinite(x.frameIdx))
      .sort((a, b) => a.sec - b.sec);
    setPlayer({
      open: true,
      url: videoUrl,
      t: Math.max(0, Math.floor(seconds || 0)),
      markers: keyframeRefs.map(x => x.sec),   // vẫn dùng cho marker bar
      keyframeRefs: keyframes,                             // dùng để resolve frameIdx khi Add
    });
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
          onClick={() => openPlayer(video.video_url, (zoomedFrame?.timestamp ?? 0), video.keyframes)}
        >
          📺 Watch
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
                      openPlayer(video.video_url, (keyframe?.timestamp ?? 0), video.keyframes);
                    }}
                  >
                    📺 Play
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
                    onClick={() => openPlayer(video.video_url, zoomedFrame.timestamp, video.keyframes)}
                  >
                    📺 Play
                  </button>
                  <button
                    className="csv-btn zoom-csv-btn"
                    onClick={() => downloadCSV(video.video_id, zoomedFrame.keyframe_num)}
                  >
                    📊 Download CSV
                  </button>
                </div>
                {video && video.keyframes && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ color: '#a2b0c6', marginBottom: '6px' }}>All frames in this video</div>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '6px' }}>
                      {video.keyframes.map((kf, idx) => {
                        const kfSrc = kf.image_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
                        const isActive = kf.keyframe_num === zoomedFrame.keyframe_num;
                        return (
                          <div
                            key={`strip-${video.video_id}-${idx}`}
                            style={{ minWidth: '120px', border: isActive ? '2px solid #4da3ff' : '1px solid #2b3b52', borderRadius: '6px', padding: '2px' }}
                          >
                            <img
                              src={kfSrc}
                              alt={`${video.video_id} - Frame ${kf.keyframe_num}`}
                              style={{ width: '120px', height: '68px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                              onClick={() => setZoomedFrame(kf)}
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
          markers={player.markers}
          keyframeRefs={player.keyframeRefs}
          videoId={selectedVideoId}
          csvBaseName={csvBaseName}
          onClose={() => setPlayer({ open: false, url: '', t: 0, markers: [], keyframeRefs: [] })}
        />
      )}
    </>
  );
};

export default KeyframeGrid;
