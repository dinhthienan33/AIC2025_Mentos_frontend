import React, { useState } from 'react';
import SearchForm from './SearchForm';
import VideoList from './VideoList';
import KeyframeGrid from './KeyframeGrid';
import AllFramesView from './AllFramesView';

const SearchInterface = ({ onOpenVideo }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [abortController, setAbortController] = useState(null);
  const [k, setK] = useState(10);
  const [modelName, setModelName] = useState('jinav2');
  const [scoreThreshold, setScoreThreshold] = useState(0.0);
  const [temporalSearch, setTemporalSearch] = useState(false);
  const [processingTime, setProcessingTime] = useState(null);
  const [viewMode, setViewMode] = useState('videos'); // 'videos' or 'frames'
  const [videoView, setVideoView] = useState('list'); // 'list' or 'keyframes'
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoData, setVideoData] = useState({}); // Store grouped video data

  const doSearch = async () => {
    setError("");
    setProcessingTime(null);
    if (!query.trim()) return;
    
    // Validate and set defaults for empty fields
    const finalK = k === '' || k === null || k === undefined ? 10 : parseInt(k) || 10;
    const finalScoreThreshold = scoreThreshold === '' || scoreThreshold === null || scoreThreshold === undefined ? 0.0 : parseFloat(scoreThreshold) || 0.0;
    
    // Update state with validated values
    if (k !== finalK) setK(finalK);
    if (scoreThreshold !== finalScoreThreshold) setScoreThreshold(finalScoreThreshold);
    
    setLoading(true);
    setVideoView('list'); // Reset to list view
    setSelectedVideoId(null);
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // Show immediate feedback
      setItems([]);
      setVideoData({});

      // Real API call
      const fetchPromise = fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query,
          top_k: finalK,
          score_threshold: finalScoreThreshold,
          model_name: modelName,
          search_method: temporalSearch ? "temporal" : "normal"
        }),
        signal: controller.signal
      });
      const res = await fetchPromise;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      
      // Set processing time if available
      if (data.processing_time !== undefined) {
        setProcessingTime(data.processing_time);
      }
      
      // Extract results from API format
      let results = data.results || [];
      
      if (results.length === 0) {
        setError('No results found for your query');
      } else {
        // Always group by video in new UI
        const grouped = {};
        results.forEach(item => {
          const videoId = item.video_id;
          if (!grouped[videoId]) {
            grouped[videoId] = {
              video_id: videoId,
              group_id: item.group_id,
              video_url: item.video_url,
              thumbnail_url: item.thumbnail_url, // Store YouTube thumbnail
              keyframes: [],
              best_score: 0
            };
          }
          grouped[videoId].keyframes.push(item);
          grouped[videoId].best_score = Math.max(grouped[videoId].best_score, item.confidence_score);
        });

        // Sort keyframes within each video by score
        Object.values(grouped).forEach(video => {
          video.keyframes.sort((a, b) => b.confidence_score - a.confidence_score);
        });

        // Convert to sorted video list
        const videoList = Object.values(grouped)
          .sort((a, b) => b.best_score - a.best_score);

        setVideoData(grouped);
        setItems(videoList);
      }
      
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Search was cancelled');
      } else if (e.message.includes('Failed to fetch')) {
        setError('Unable to connect to server at localhost:8000');
      } else {
        setError(String(e?.message || e));
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const cancelSearch = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setError('Search cancelled by user');
    }
  };

  const exploreVideo = (videoId) => {
    setSelectedVideoId(videoId);
    setVideoView('keyframes');
  };

  const backToVideos = () => {
    setVideoView('list');
    setSelectedVideoId(null);
  };

  return (
    <div className="container">
      <h1>Visual Search</h1>
      
             <SearchForm
         query={query}
         setQuery={setQuery}
         k={k}
         setK={setK}
         scoreThreshold={scoreThreshold}
         setScoreThreshold={setScoreThreshold}
         modelName={modelName}
         setModelName={setModelName}
         temporalSearch={temporalSearch}
         setTemporalSearch={setTemporalSearch}
         loading={loading}
         onSearch={doSearch}
         onCancel={cancelSearch}
       />

       {/* View Mode Selector */}
       {!loading && items.length > 0 && (
         <div className="view-mode-selector">
           <label>View Mode:</label>
           <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
             <option value="videos">Videos</option>
             <option value="frames">Frames</option>
           </select>
         </div>
       )}

      {error && <div className="status">Error: {error}</div>}
      {!error && loading && <div className="status">Searching...</div>}
      {!error && !loading && temporalSearch && (
        <div className="temporal-status">
          🔄 Temporal Search Mode: Breaking down query into sequential events
        </div>
      )}
      {!error && !loading && processingTime && (
        <div className="processing-time">
          ⚡ Search completed in {processingTime.toFixed(2)} seconds
        </div>
      )}
      
             {/* Main content area */}
       {viewMode === 'videos' ? (
         // Videos view - normal behavior
         videoView === 'list' ? (
           <VideoList 
             items={items} 
             onExploreVideo={exploreVideo} 
           />
         ) : (
           <KeyframeGrid
             selectedVideoId={selectedVideoId}
             videoData={videoData}
             onBackToVideos={backToVideos}
             onOpenVideo={onOpenVideo}
           />
         )
       ) : (
         // Frames view - show all frames from all videos
         <AllFramesView 
           videoData={videoData}
           onOpenVideo={onOpenVideo}
         />
       )}
    </div>
  );
};

export default SearchInterface;
