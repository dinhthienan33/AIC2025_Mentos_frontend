import React, { useState } from 'react';
import SearchInterface from './components/SearchInterface';
import VideoPlayModal from './components/VideoPlayModal';
import './App.css';

function App() {
  const [videoPlayer, setVideoPlayer] = useState(null);

  const openVideoPlayer = (keyframe) => {
    // Calculate end time as start time + 10 seconds (or use actual end time if available)
    const startTime = keyframe.timestamp || 0;
    const endTime = keyframe.end_time || (startTime + 10); // Default 10 second segment
    
    setVideoPlayer({
      videoUrl: keyframe.video_url,
      startSeconds: startTime,
      videoId: keyframe.video_id,
      keyframeRefs: [{
        timestamp: startTime,
        keyframe_num: keyframe.keyframe_num,
        confidence_score: keyframe.confidence_score
      }],
      markers: [startTime],
      csvBaseName: keyframe.video_id
    });
  };

  const closeVideoPlayer = () => {
    setVideoPlayer(null);
  };

  return (
    <div className="App">
      <SearchInterface onOpenVideo={openVideoPlayer} />
      {videoPlayer && (
        <VideoPlayModal 
          videoUrl={videoPlayer.videoUrl}
          startSeconds={videoPlayer.startSeconds}
          videoId={videoPlayer.videoId}
          keyframeRefs={videoPlayer.keyframeRefs}
          markers={videoPlayer.markers}
          csvBaseName={videoPlayer.csvBaseName}
          onClose={closeVideoPlayer} 
        />
      )}
    </div>
  );
}

export default App;
