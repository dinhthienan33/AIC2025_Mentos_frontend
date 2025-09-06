import React, { useState, useEffect } from 'react';

const SearchLevelSelector = ({ 
  searchLevel, 
  setSearchLevel, 
  selectedBatches, 
  setSelectedBatches, 
  selectedGroups, 
  setSelectedGroups, 
  selectedVideos, 
  setSelectedVideos,
  onLevelChange 
}) => {
  // Data structure based on notes2.txt
  const batchData = {
    1: {
      name: "Batch 1",
      groups: ["L21", "L22", "L23", "L24", "L25", "L26", "L27", "L28", "L29", "L30"],
      groupFileCounts: {
        "L21": 29, "L22": 31, "L23": 25, "L24": 43, "L25": 88,
        "L26": 474, "L27": 16, "L28": 24, "L29": 23, "L30": 96
      }
    },
    2: {
      name: "Batch 2", 
      groups: ["K01", "K02", "K03", "K04", "K05", "K06", "K07", "K08", "K09", "K10", 
               "K11", "K12", "K13", "K14", "K15", "K16", "K17", "K18", "K19", "K20"],
      groupFileCounts: {
        "K01": 31, "K02": 31, "K03": 29, "K04": 30, "K05": 34,
        "K06": 31, "K07": 31, "K08": 30, "K09": 28, "K10": 28,
        "K11": 31, "K12": 31, "K13": 30, "K14": 30, "K15": 31,
        "K16": 32, "K17": 30, "K18": 27, "K19": 31, "K20": 31
      }
    }
  };

  const [availableVideos, setAvailableVideos] = useState([]);

  // Generate video list when groups change
  useEffect(() => {
    if (selectedGroups.length > 0 && selectedBatches.length > 0) {
      const videos = [];
      selectedBatches.forEach(batchNum => {
        selectedGroups.forEach(group => {
          if (batchData[batchNum] && batchData[batchNum].groupFileCounts[group]) {
            const fileCount = batchData[batchNum].groupFileCounts[group];
            for (let i = 1; i <= fileCount; i++) {
              const videoId = `${group}_V${i.toString().padStart(3, '0')}`;
              videos.push({
                id: videoId,
                name: `Video ${i}`,
                group: group,
                batch: batchNum
              });
            }
          }
        });
      });
      setAvailableVideos(videos);
    } else {
      setAvailableVideos([]);
    }
  }, [selectedGroups, selectedBatches]);

  // Reset selections when level changes
  useEffect(() => {
    if (searchLevel === 'all') {
      setSelectedBatches([]);
      setSelectedGroups([]);
      setSelectedVideos([]);
    } else if (searchLevel === 'batch') {
      setSelectedGroups([]);
      setSelectedVideos([]);
    } else if (searchLevel === 'group') {
      setSelectedVideos([]);
    }
  }, [searchLevel, setSelectedBatches, setSelectedGroups, setSelectedVideos]);

  // Handle level change
  const handleLevelChange = (level) => {
    setSearchLevel(level);
    if (onLevelChange) {
      onLevelChange(level);
    }
  };

  // Handle batch toggle
  const handleBatchToggle = (batch) => {
    setSelectedBatches(prev => {
      if (prev.includes(batch)) {
        return prev.filter(b => b !== batch);
      } else {
        return [...prev, batch];
      }
    });
    // Clear groups and videos when batch changes
    setSelectedGroups([]);
    setSelectedVideos([]);
  };

  // Handle group toggle
  const handleGroupToggle = (group) => {
    setSelectedGroups(prev => {
      if (prev.includes(group)) {
        return prev.filter(g => g !== group);
      } else {
        return [...prev, group];
      }
    });
    // Clear videos when group changes
    setSelectedVideos([]);
  };

  // Handle video toggle
  const handleVideoToggle = (video) => {
    setSelectedVideos(prev => {
      if (prev.includes(video)) {
        return prev.filter(v => v !== video);
      } else {
        return [...prev, video];
      }
    });
  };

  // Handle select all for current level
  const handleSelectAll = () => {
    if (searchLevel === 'batch') {
      setSelectedBatches([1, 2]);
    } else if (searchLevel === 'group' && selectedBatches.length > 0) {
      const allGroups = [];
      selectedBatches.forEach(batchNum => {
        if (batchData[batchNum]) {
          allGroups.push(...batchData[batchNum].groups);
        }
      });
      setSelectedGroups([...new Set(allGroups)]);
    } else if (searchLevel === 'video' && availableVideos.length > 0) {
      setSelectedVideos(availableVideos.map(v => v.id));
    }
  };

  // Handle clear all for current level
  const handleClearAll = () => {
    if (searchLevel === 'batch') {
      setSelectedBatches([]);
    } else if (searchLevel === 'group') {
      setSelectedGroups([]);
    } else if (searchLevel === 'video') {
      setSelectedVideos([]);
    }
  };

  const getCurrentSelection = () => {
    switch (searchLevel) {
      case 'all':
        return 'All data';
      case 'batch':
        if (selectedBatches.length === 0) return 'Select batches';
        if (selectedBatches.length === 1) return `Batch ${selectedBatches[0]}`;
        return `${selectedBatches.length} batches selected`;
      case 'group':
        if (selectedGroups.length === 0) return 'Select groups';
        if (selectedGroups.length === 1) return selectedGroups[0];
        return `${selectedGroups.length} groups selected`;
      case 'video':
        if (selectedVideos.length === 0) return 'Select videos';
        if (selectedVideos.length === 1) return selectedVideos[0];
        return `${selectedVideos.length} videos selected`;
      default:
        return 'All data';
    }
  };

  return (
    <div className="search-level-selector">
      <div className="level-selector-header">
        <h3>Search Level</h3>
        <div className="current-selection">
          {getCurrentSelection()}
        </div>
      </div>

      <div className="level-buttons">
        <button
          className={`level-btn ${searchLevel === 'all' ? 'active' : ''}`}
          onClick={() => handleLevelChange('all')}
        >
          All
        </button>
        <button
          className={`level-btn ${searchLevel === 'batch' ? 'active' : ''}`}
          onClick={() => handleLevelChange('batch')}
        >
          Batch
        </button>
        <button
          className={`level-btn ${searchLevel === 'group' ? 'active' : ''}`}
          onClick={() => handleLevelChange('group')}
          disabled={selectedBatches.length === 0}
        >
          Group
        </button>
        <button
          className={`level-btn ${searchLevel === 'video' ? 'active' : ''}`}
          onClick={() => handleLevelChange('video')}
          disabled={selectedGroups.length === 0}
        >
          Video
        </button>
      </div>

      {/* Batch Selection */}
      {searchLevel === 'batch' && (
        <div className="selection-panel">
          <div className="selection-header">
            <h4>Select Batches</h4>
            <div className="selection-actions">
              <button className="action-btn" onClick={handleSelectAll}>Select All</button>
              <button className="action-btn" onClick={handleClearAll}>Clear All</button>
            </div>
          </div>
          <div className="batch-grid">
            {Object.entries(batchData).map(([batchNum, batchInfo]) => (
              <label key={batchNum} className="batch-card-container">
                <input
                  type="checkbox"
                  checked={selectedBatches.includes(parseInt(batchNum))}
                  onChange={() => handleBatchToggle(parseInt(batchNum))}
                  className="batch-checkbox"
                />
                <div className={`batch-card ${selectedBatches.includes(parseInt(batchNum)) ? 'selected' : ''}`}>
                  <div className="batch-name">{batchInfo.name}</div>
                  <div className="batch-info">
                    {batchInfo.groups.length} groups
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Group Selection */}
      {searchLevel === 'group' && selectedBatches.length > 0 && (
        <div className="selection-panel">
          <div className="selection-header">
            <h4>Select Groups from {selectedBatches.length === 1 ? `Batch ${selectedBatches[0]}` : `${selectedBatches.length} Batches`}</h4>
            <div className="selection-actions">
              <button className="action-btn" onClick={handleSelectAll}>Select All</button>
              <button className="action-btn" onClick={handleClearAll}>Clear All</button>
            </div>
          </div>
          <div className="group-grid">
            {selectedBatches.map(batchNum => 
              batchData[batchNum] ? batchData[batchNum].groups.map(group => (
                <label key={`${batchNum}-${group}`} className="group-card-container">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={() => handleGroupToggle(group)}
                    className="group-checkbox"
                  />
                  <div className={`group-card ${selectedGroups.includes(group) ? 'selected' : ''}`}>
                    <div className="group-name">{group}</div>
                    <div className="group-info">
                      {batchData[batchNum].groupFileCounts[group]} files
                    </div>
                    <div className="group-batch">Batch {batchNum}</div>
                  </div>
                </label>
              )) : null
            )}
          </div>
        </div>
      )}

      {/* Video Selection */}
      {searchLevel === 'video' && selectedGroups.length > 0 && (
        <div className="selection-panel">
          <div className="selection-header">
            <h4>Select Videos from {selectedGroups.length} Groups</h4>
            <div className="selection-actions">
              <button className="action-btn" onClick={handleSelectAll}>Select All</button>
              <button className="action-btn" onClick={handleClearAll}>Clear All</button>
            </div>
          </div>
          <div className="video-grid">
            {availableVideos.map(video => (
              <label key={video.id} className="video-card-container">
                <input
                  type="checkbox"
                  checked={selectedVideos.includes(video.id)}
                  onChange={() => handleVideoToggle(video.id)}
                  className="video-checkbox"
                />
                <div className={`video-card ${selectedVideos.includes(video.id) ? 'selected' : ''}`}>
                  <div className="video-name">{video.name}</div>
                  <div className="video-id">{video.id}</div>
                  <div className="video-batch">Batch {video.batch}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {searchLevel !== 'all' && (
        <div className="selection-summary">
          <strong>Search Scope:</strong>
          <div className="scope-path">
            {searchLevel === 'batch' && selectedBatches.length > 0 && 
              `Batches: ${selectedBatches.join(', ')}`}
            {searchLevel === 'group' && selectedGroups.length > 0 && 
              `Groups: ${selectedGroups.join(', ')} (from ${selectedBatches.length} batch${selectedBatches.length > 1 ? 'es' : ''})`}
            {searchLevel === 'video' && selectedVideos.length > 0 && 
              `${selectedVideos.length} videos from ${selectedGroups.length} groups`}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchLevelSelector;
