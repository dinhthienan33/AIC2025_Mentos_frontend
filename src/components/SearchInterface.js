import React, { useState } from 'react';
import SearchForm from './SearchForm';
import VideoList from './VideoList';
import KeyframeGrid from './KeyframeGrid';
import AllFramesView from './AllFramesView';
import ASRSearchTab from './ASRSearchTab';
import SearchLevelSelector from './SearchLevelSelector';

const SearchInterface = ({ onOpenVideo }) => {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' or 'asr'
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
  const [frameSortBy, setFrameSortBy] = useState('score'); // shared frames sort
  const [videoListSortBy, setVideoListSortBy] = useState('score'); // persist video list sort
  const [csvBaseName, setCsvBaseName] = useState('');
  const [videosScrollY, setVideosScrollY] = useState(0);

  // Filtering UI state
  const [filteringEnabled, setFilteringEnabled] = useState(false);
  const [filterOd, setFilterOd] = useState(false);
  const [filterOcr, setFilterOcr] = useState(false);
  const [filterAsr, setFilterAsr] = useState(false);
  const [odValues, setOdValues] = useState(['']);
  const [ocrValues, setOcrValues] = useState(['']);
  const [asrValues, setAsrValues] = useState(['']);

  // Exclusion controls
  const [excludeByGroup, setExcludeByGroup] = useState(false);
  const [excludeGroupsText, setExcludeGroupsText] = useState(""); // comma-separated groups e.g. L21,L22
  const [excludeByVideo, setExcludeByVideo] = useState(false);
  const [excludeVidIdsText, setExcludeVidIdsText] = useState(""); // comma-separated video ids e.g. L21_V001,L22_V003
  const [batch, setBatch] = useState(1); // batch selection: 1 or 2

  // Search level selector state
  const [searchLevel, setSearchLevel] = useState('all'); // 'all', 'batch', 'group', 'video'
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const doSearch = async () => {
    setError("");
    setProcessingTime(null);
    if (!query.trim()) return;
    if (!csvBaseName || !csvBaseName.trim()) {
      setError('Please set a query name (or upload a .txt file).');
      return;
    }

    // Validate search level selections
    if (searchLevel === 'batch' && selectedBatches.length === 0) {
      setError('Please select at least one batch to search within.');
      return;
    }
    if (searchLevel === 'group' && (selectedBatches.length === 0 || selectedGroups.length === 0)) {
      setError('Please select at least one batch and group to search within.');
      return;
    }
    if (searchLevel === 'video' && (selectedBatches.length === 0 || selectedGroups.length === 0 || selectedVideos.length === 0)) {
      setError('Please select at least one batch, group, and video to search within.');
      return;
    }
    
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
      // Build filtering object if enabled
      const listFromValues = (values) =>
        (values || []).map(v => (v || '').trim()).filter(v => v.length > 0);
      const filtering = {};
      if (filteringEnabled) {
        if (filterOd) filtering.od_text = listFromValues(odValues);
        if (filterOcr) filtering.ocr_text = listFromValues(ocrValues);
        if (filterAsr) filtering.asr_text = listFromValues(asrValues);
      }

      // Build search scope based on search level
      const searchScope = {};
      if (searchLevel === 'batch' && selectedBatches.length > 0) {
        searchScope.batches = selectedBatches;
      } else if (searchLevel === 'group' && selectedGroups.length > 0) {
        searchScope.batches = selectedBatches;
        searchScope.groups = selectedGroups;
      } else if (searchLevel === 'video' && selectedVideos.length > 0) {
        searchScope.batches = selectedBatches;
        searchScope.groups = selectedGroups;
        searchScope.videos = selectedVideos;
      } else {
        // 'all' level - use existing batch selection
        searchScope.batch = batch;
      }

      const fetchPromise = fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query,
          top_k: finalK,
          score_threshold: finalScoreThreshold,
          model_name: modelName,
          search_method: filteringEnabled ? "filtering" : (temporalSearch ? "temporal" : "normal"),
          filtering: filtering && Object.keys(filtering).length > 0 ? filtering : undefined,
          // New exclusion fields
          exclude_groups: excludeByGroup
            ? (excludeGroupsText || "").split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
          exclude_vid_id: excludeByVideo
            ? (excludeVidIdsText || "").split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
          // Search scope
          ...searchScope
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
    try {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      setVideosScrollY(y);
    } catch (_) {}
    setSelectedVideoId(videoId);
    setVideoView('keyframes');
  };

  const backToVideos = () => {
    setVideoView('list');
    setSelectedVideoId(null);
    setTimeout(() => {
      try {
        window.scrollTo(0, videosScrollY || 0);
      } catch (_) {}
    }, 0);
  };

  const buildFilteringPayload = () => {
    // origin_paths: take all unique video_ids from the first response
    const originPaths = Array.from(new Set(Object.keys(videoData)));

    // Convert value arrays to list[str], trimming empties
    const listFromValues = (values) =>
      (values || []).map(v => (v || '').trim()).filter(v => v.length > 0);

    const filtering = {};
    if (filterOd) filtering.od_text = listFromValues(odValues);
    if (filterOcr) filtering.ocr_text = listFromValues(ocrValues);
    if (filterAsr) filtering.asr_text = listFromValues(asrValues);

    return { origin_paths: originPaths, filtering };
  };

  const onFilter = async () => {
    try {
      setError("");
      if (!filteringEnabled) return;

      const payload = buildFilteringPayload();
      if (!payload.origin_paths || payload.origin_paths.length === 0) {
        setError('No origin paths available. Run a search first.');
        return;
      }
      if (!payload.filtering || Object.keys(payload.filtering).length === 0) {
        setError('Select at least one filtering type and add values.');
        return;
      }

      const res = await fetch('http://localhost:8000/filter-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();

      // Assume backend returns a list of filtered paths (video_ids)
      const filteredPaths = Array.isArray(data)
        ? data
        : (data.results || data.paths || data.origin_paths || []);
      if (!Array.isArray(filteredPaths)) {
        setError('Unexpected filtering response format');
        return;
      }

      const allowed = new Set(filteredPaths);
      const newVideoData = {};
      Object.entries(videoData).forEach(([vid, v]) => {
        if (allowed.has(vid)) newVideoData[vid] = v;
      });
      const newItems = (items || []).filter(v => allowed.has(v.video_id));

      setVideoData(newVideoData);
      setItems(newItems);

      // If current selected video is filtered out, reset view
      if (selectedVideoId && !allowed.has(selectedVideoId)) {
        backToVideos();
      }
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const renderValues = (values, setValues) => (
    <div className="filter-pairs">
      {values.map((val, idx) => (
        <div className="filter-pair-row" key={idx}>
          <input
            type="text"
            placeholder="value"
            value={val}
            onChange={(e) => {
              const next = [...values];
              next[idx] = e.target.value;
              setValues(next);
            }}
          />
          <button
            className="small-btn"
            onClick={() => setValues(values.filter((_, i) => i !== idx))}
            disabled={values.length <= 1}
          >
            −
          </button>
          <button
            className="small-btn"
            onClick={() => setValues([...values, ""])}
          >
            +
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">Controls</h2>
        
        <SearchLevelSelector
          searchLevel={searchLevel}
          setSearchLevel={setSearchLevel}
          selectedBatches={selectedBatches}
          setSelectedBatches={setSelectedBatches}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
          selectedVideos={selectedVideos}
          setSelectedVideos={setSelectedVideos}
          onLevelChange={(level) => {
            // Update batch selection when level changes
            if (level === 'batch' && selectedBatches.length > 0) {
              setBatch(selectedBatches[0]); // Use first selected batch
            } else if (level === 'all') {
              setBatch(1); // Reset to default
            }
          }}
        />
        
        <SearchForm
          query={query}
          setQuery={setQuery}
          csvBaseName={csvBaseName}
          setCsvBaseName={setCsvBaseName}
          k={k}
          setK={setK}
          scoreThreshold={scoreThreshold}
          setScoreThreshold={setScoreThreshold}
          modelName={modelName}
          setModelName={setModelName}
          temporalSearch={temporalSearch}
          setTemporalSearch={setTemporalSearch}
          batch={batch}
          setBatch={setBatch}
          loading={loading}
          onSearch={doSearch}
          onCancel={cancelSearch}
        />

        {/* Filtering controls */}
        <div className="controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={filteringEnabled}
                onChange={(e) => setFilteringEnabled(e.target.checked)}
              />
              filtering
            </label>
          </div>

          {filteringEnabled && (
            <div className="filtering-panel">
              <div className="control-group">
                <label>
                  <input type="checkbox" checked={filterOd} onChange={(e) => setFilterOd(e.target.checked)} /> od
                </label>
                <label>
                  <input type="checkbox" checked={filterOcr} onChange={(e) => setFilterOcr(e.target.checked)} /> ocr
                </label>
                <label>
                  <input type="checkbox" checked={filterAsr} onChange={(e) => setFilterAsr(e.target.checked)} /> asr
                </label>
              </div>

              {filterOd && (
                <div className="filter-section">
                  <div className="filter-title">od values</div>
                  {renderValues(odValues, setOdValues)}
                </div>
              )}
              {filterOcr && (
                <div className="filter-section">
                  <div className="filter-title">ocr values</div>
                  {renderValues(ocrValues, setOcrValues)}
                </div>
              )}
              {filterAsr && (
                <div className="filter-section">
                  <div className="filter-title">asr values</div>
                  {renderValues(asrValues, setAsrValues)}
                </div>
              )}

              <div className="control-group">
                <button className="video-link-btn" onClick={onFilter}>Filter</button>
              </div>
            </div>
          )}

          {/* Exclusion controls */}
          <div className="control-group" style={{ marginTop: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={excludeByGroup}
                onChange={(e) => setExcludeByGroup(e.target.checked)}
              />
              exclude by group
            </label>
            {excludeByGroup && (
              <input
                type="text"
                placeholder="e.g. L21,L22"
                value={excludeGroupsText}
                onChange={(e) => setExcludeGroupsText(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            )}
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={excludeByVideo}
                onChange={(e) => setExcludeByVideo(e.target.checked)}
              />
              exclude by video id
            </label>
            {excludeByVideo && (
              <input
                type="text"
                placeholder="e.g. L21_V001,L22_V003"
                value={excludeVidIdsText}
                onChange={(e) => setExcludeVidIdsText(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            )}
          </div>
        </div>
      </aside>

      <main className="content">
        <div className="container">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'visual' ? 'active' : ''}`}
              onClick={() => setActiveTab('visual')}
            >
              Visual Search
            </button>
            <button
              className={`tab-button ${activeTab === 'asr' ? 'active' : ''}`}
              onClick={() => setActiveTab('asr')}
            >
              ASR Search
            </button>
          </div>

          {activeTab === 'asr' ? (
            <ASRSearchTab />
          ) : (
            <>
              <h1>Visual Search</h1>

          {/* Top toolbar with View Mode and Sort together */}
          {!loading && items.length > 0 && (
            <div className="top-toolbar">
              <div className="view-mode-selector">
                <label>View Mode:</label>
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                  <option value="videos">Videos</option>
                  <option value="frames">Frames</option>
                </select>
              </div>
              <div className="sort-controls compact">
                <label>Sort frames by:</label>
                <select value={frameSortBy} onChange={(e) => setFrameSortBy(e.target.value)}>
                  <option value="score">Best Score</option>
                  <option value="name">Frame Number</option>
                  <option value="time">Timestamp</option>
                  <option value="video">Video Name</option>
                  <option value="frame">Frame Number</option>
                </select>
              </div>
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
                sortBy={videoListSortBy}
                setSortBy={setVideoListSortBy}
              />
            ) : (
              <KeyframeGrid
                selectedVideoId={selectedVideoId}
                videoData={videoData}
                onBackToVideos={backToVideos}
                onOpenVideo={onOpenVideo}
                csvBaseName={csvBaseName}
                sortBy={frameSortBy}
              />
            )
          ) : (
            // Frames view - show all frames from all videos
            <AllFramesView 
              videoData={videoData}
              onOpenVideo={onOpenVideo}
              csvBaseName={csvBaseName}
              sortBy={frameSortBy}
            />
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchInterface;
