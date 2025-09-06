import React, { useState } from 'react';
import { getSafeVideoUrl, isValidVideoUrl } from '../utils/videoUtils';

const ODSearchTab = () => {
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
      const response = await fetch('http://localhost:8000/od-search', {
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
      
      // Debug log to see the actual response structure
      console.log('OD Search Response:', data);
      
      if (data.processing_time !== undefined) {
        setProcessingTime(data.processing_time);
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setError('No OD results found for your query');
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

  const openVideoUrl = (url) => {
    const safeUrl = getSafeVideoUrl(url);
    window.open(safeUrl, '_blank');
  };

  return (
    <div className="od-search-tab">
      <div className="search-container">
        <h2>OD Search</h2>
        <p className="description">
          Search through video content using Object Detection (OD) to find specific objects.
        </p>
        
        <form className="search-form" onSubmit={handleSearch}>
          <div className="control-group">
            <label>Search Query:</label>
            <textarea
              placeholder="Enter objects to search for (e.g., dog, car, person)..."
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
            {loading ? 'Searching...' : 'Search Objects'}
          </button>
        </form>

        {error && <div className="error-message">Error: {error}</div>}
        {!error && loading && <div className="loading-message">Searching for objects...</div>}
        {!error && !loading && processingTime && (
          <div className="processing-time">
            ⚡ OD search completed in {processingTime.toFixed(2)} seconds
          </div>
        )}

        {results && results.length > 0 && (
          <div className="results-container">
            <h3>OD Search Results ({results.length})</h3>
            <div className="results-list">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className="result-number">#{index + 1}</span>
                    <span className="video-id">Video: {result.video_id || 'Unknown'}</span>
                    <span className="score">Score: {result.score ? result.score.toFixed(3) : 'N/A'}</span>
                  </div>
                  
                  <div className="object-info">
                    <div className="object-names">
                      <h4>Detected Objects:</h4>
                      <div className="object-tags">
                        {result.object_names && result.object_names.length > 0 ? (
                          result.object_names.map((obj, objIndex) => (
                            <span key={objIndex} className="object-tag">
                              {obj}
                            </span>
                          ))
                        ) : (
                          <span className="no-objects">No objects detected</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="video-actions">
                      {result.video_url && (
                        <button 
                          className="video-link-button"
                          onClick={() => openVideoUrl(result.video_url)}
                          title="Open video"
                        >
                          🎥 Watch Video
                        </button>
                      )}
                      {result.thumbnail_url && (
                        <img 
                          src={result.thumbnail_url} 
                          alt={`Thumbnail for ${result.video_id}`}
                          className="video-thumbnail"
                          onClick={() => openVideoUrl(result.video_url)}
                          title="Click to open video"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ODSearchTab;
