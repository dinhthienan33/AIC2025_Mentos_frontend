import React from 'react';

const SearchForm = ({
  query,
  setQuery,
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
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <>
      <form className="search" onSubmit={handleSubmit}>
        <input
          placeholder={temporalSearch ? "Describe a sequence of events (e.g., 'train running, then vehicles waiting, then people closing barriers')" : "Describe what you're looking for..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
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
