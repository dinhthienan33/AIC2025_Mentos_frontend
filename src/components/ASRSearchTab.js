import React, { useState } from 'react';

const ASRSearchTab = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [processingTime, setProcessingTime] = useState(null);
  const [modelName, setModelName] = useState('jinav2');
  const [topK, setTopK] = useState(10);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError("");
    setProcessingTime(null);
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('http://localhost:8000/asr-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          model_name: modelName,
          top_k: topK
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.processing_time !== undefined) {
        setProcessingTime(data.processing_time);
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setError('No ASR results found for your query');
      }

    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Unable to connect to server at localhost:8000');
      } else {
        setError(String(err?.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openVideoUrl = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="asr-search-tab">
      <div className="search-container">
        <h2>ASR Search</h2>
        <p className="description">
          Search through video content using Automatic Speech Recognition (ASR) transcripts.
        </p>
        
        <form className="search-form" onSubmit={handleSearch}>
          <div className="control-group">
            <label>Search Query:</label>
            <textarea
              placeholder="Enter your search terms for ASR content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          <div className="search-controls">
            <div className="control-group">
              <label>Model:</label>
              <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
                <option value="jinav2">JinaV2</option>
                <option value="blip2">BLIP2</option>
                <option value="internvl">InternVL</option>
              </select>
            </div>

            <div className="control-group">
              <label>Top K Results:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search ASR'}
          </button>
        </form>

        {error && <div className="error-message">Error: {error}</div>}
        {!error && loading && <div className="loading-message">Searching ASR content...</div>}
        {!error && !loading && processingTime && (
          <div className="processing-time">
            ⚡ ASR search completed in {processingTime.toFixed(2)} seconds
          </div>
        )}

        {results.length > 0 && (
          <div className="results-container">
            <h3>ASR Search Results ({results.length})</h3>
            <div className="results-list">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className="result-number">#{index + 1}</span>
                    <span className="video-id">Video: {result.video_name}</span>
                    <span className="score">Score: {result.score?.toFixed(3) || 'N/A'}</span>
                  </div>
                  
                  {result.segments && result.segments.length > 0 ? (
                    <div className="segments-container">
                      <h4>Matching Segments ({result.segments.length})</h4>
                      {result.segments.map((segment, segIndex) => (
                        <div key={segIndex} className="segment-item">
                          <div className="segment-header">
                            <span className="segment-id">Segment {segment.segment_id}</span>
                            <span className="segment-time">
                              {formatTime(segment.start_time)} - {formatTime(segment.end_time)} 
                              <span className="duration">({segment.duration.toFixed(2)}s)</span>
                            </span>
                            {segment.video_url && (
                              <button 
                                className="video-link-button"
                                onClick={() => openVideoUrl(segment.video_url)}
                                title="Open video at this timestamp"
                              >
                                🎥 Watch
                              </button>
                            )}
                          </div>
                          
                          <div className="segment-text">
                            {segment.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="segments-container">
                      <h4>No Segments Found</h4>
                      <p style={{ textAlign: 'center', color: '#9fb0c6', fontStyle: 'italic' }}>
                        This video has no matching transcript segments for your search query.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ASRSearchTab;
