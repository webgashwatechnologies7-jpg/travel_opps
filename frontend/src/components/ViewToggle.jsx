import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

/**
 * A reusable view toggle component for switching between Grid and List layouts.
 * @param {string} viewMode - The current view mode ('grid' or 'list')
 * @param {function} setViewMode - Function to update the view mode
 */
const ViewToggle = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-xl transition-all ${
          viewMode === 'grid' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
        title="Grid View"
      >
        <LayoutGrid size={20} />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-xl transition-all ${
          viewMode === 'list' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
        title="List View"
      >
        <List size={20} />
      </button>
    </div>
  );
};

export default ViewToggle;
