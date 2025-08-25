import React, { useState } from 'react';
import SearchInterface from './components/SearchInterface';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

function App() {
  const [videoPlayer, setVideoPlayer] = useState(null);

  const openVideoPlayer = (keyframe) => {
    // Calculate end time as start time + 10 seconds (or use actual end time if available)
    const startTime = keyframe.timestamp || 0;
    const endTime = keyframe.end_time || (startTime + 10); // Default 10 second segment
    
    setVideoPlayer({
      video_id: keyframe.video_id,
      video_url: keyframe.video_url,
      start_time: startTime,
      end_time: endTime,
      keyframe_num: keyframe.keyframe_num,
      confidence_score: keyframe.confidence_score
    });
  };

  const closeVideoPlayer = () => {
    setVideoPlayer(null);
  };

  return (
    <div className="App">
      <SearchInterface onOpenVideo={openVideoPlayer} />
      {videoPlayer && (
        <VideoPlayer 
          video={videoPlayer} 
          onClose={closeVideoPlayer} 
        />
      )}
    </div>
  );
}

export default App;
