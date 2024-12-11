import React from 'react';

interface GroupingControlsProps {
  categories: string[];
  sources: string[];
  selectedCategory: string | null;
  selectedSource: string | null;
  sortOrder: 'desc' | 'asc';
  onCategoryChange: (category: string | null) => void;
  onSourceChange: (source: string | null) => void;
  onSortOrderChange: (order: 'desc' | 'asc') => void;
}

export const GroupingControls = ({
  categories,
  sources,
  selectedCategory,
  selectedSource,
  sortOrder,
  onCategoryChange,
  onSourceChange,
  onSortOrderChange
}: GroupingControlsProps) => {
  return (
    <div className="grouping-controls">
      <select 
        className="pill-select"
        value={selectedCategory || ''}
        onChange={(e) => {
          const value = e.target.value || null;
          onCategoryChange(value);
          // Reset source when category changes
          onSourceChange(null);
        }}
      >
        <option value="">All Categories</option>
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select 
        className="pill-select"
        value={selectedSource || ''}
        onChange={(e) => onSourceChange(e.target.value || null)}
      >
        <option value="">All Sources</option>
        {sources.map(source => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
      <button 
        className="pill-button"
        onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
      >
        {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
      </button>
    </div>
  );
}; 