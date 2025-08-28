import React from 'react';

const SearchForm = ({
  query,
  setQuery,
  csvBaseName,
  setCsvBaseName,
  k,
  setK,
  scoreThreshold,
  setScoreThreshold,
  modelName,
  setModelName,
  temporalSearch,
  setTemporalSearch,
  loading,
  onSearch,
  onCancel
}) => {
  const handleTxtUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const nameNoExt = (file.name || '').replace(/\.[^/.]+$/, '');
    try {
      const text = await file.text();
      setQuery(text);
    } catch (err) {
      // ignore read errors
    }
    // set CSV base name from file name
    setCsvBaseName(nameNoExt || 'query');
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleKeyDown = (e) => {
    // Keep Enter to new line in textarea; Ctrl+Enter to search
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <>
      <form className="search" onSubmit={handleSubmit}>
        <div className="control-group" style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block' }}>Upload .txt (optional):</label>
          <input type="file" accept=".txt,text/plain" onChange={handleTxtUpload} />
        </div>
        <textarea
          placeholder={temporalSearch ? "Describe a sequence of events (e.g., 'train running, then vehicles waiting, then people closing barriers')" : "Describe what you're looking for..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          style={{ resize: 'vertical', whiteSpace: 'pre-wrap', minHeight: '140px' }}
        />
        <div className="control-group" style={{ margin: '8px 0' }}>
          <label>Query name (used for CSV filename when no file uploaded):</label>
          <input
            type="text"
            placeholder="enter a short name"
            value={csvBaseName}
            onChange={(e) => setCsvBaseName(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className={temporalSearch ? 'temporal-active' : ''}
        >
          {loading ? 'Searching…' : temporalSearch ? 'Temporal Search' : 'Search'}
        </button>
        {loading && (
          <button
            type="button"
            className="cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="controls">
        <div className="control-group">
          <label>Results:</label>
          <input
            type="number"
            min="1"
            max="1000"
            placeholder="10"
            value={k}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setK(''); // Allow empty while typing
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  setK(numValue);
                }
              }
            }}
          />
        </div>

        <div className="control-group">
          <label>Score:</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="0.0"
            value={scoreThreshold}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setScoreThreshold(''); // Allow empty while typing
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  setScoreThreshold(numValue);
                }
              }
            }}
          />
        </div>

        <div className="control-group">
          <label>Model:</label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          >
            <option value="jinav2">Jina V2</option>
            <option value="jinav1">Jina V1</option>
            <option value="blip2">BLIP2</option>
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={temporalSearch}
              onChange={(e) => setTemporalSearch(e.target.checked)}
            />
            Temporal Search
          </label>
          <div className="control-help">
            Break down complex queries into sequential events
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchForm;
