
import React, { useState, useMemo, useEffect } from 'react';
import { GitHubTreeItem } from '../types';
import { Button } from './Button';

interface FileTreeProps {
  files: GitHubTreeItem[];
  onConfirm: (selectedPaths: string[]) => void;
  onCancel: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onConfirm, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [maxSizeLimit, setMaxSizeLimit] = useState<number>(50); // Default 50KB
  
  // Find the actual maximum file size in the repo to set slider bounds
  const maxPossibleSize = useMemo(() => {
    const sizes = files.map(f => (f.size || 0) / 1024);
    return Math.ceil(Math.max(...sizes, 100));
  }, [files]);

  // Initial selection includes all files that fit the default limit
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialPaths = files
      .filter(f => !f.size || (f.size / 1024) <= maxSizeLimit)
      .map(f => f.path);
    setSelected(new Set(initialPaths));
  }, [files]);

  // Filter by search AND size
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.path.toLowerCase().includes(searchTerm.toLowerCase());
      const fitsSize = !f.size || (f.size / 1024) <= maxSizeLimit;
      return matchesSearch && fitsSize;
    });
  }, [files, searchTerm, maxSizeLimit]);

  const toggleFile = (path: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === filteredFiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredFiles.map(f => f.path)));
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">📂</span> Select Files
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Review structure and refine context.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
           <span className="text-sm font-mono text-indigo-400 font-black">{selected.size}</span>
           <span className="text-[10px] text-indigo-300/60 uppercase tracking-widest font-bold">Selected</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Search */}
        <div className="md:col-span-7 relative group">
          <input 
            type="text" 
            placeholder="Search by filename..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
          <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Size Slider */}
        <div className="md:col-span-5 bg-black/40 border border-zinc-800 rounded-xl p-3 px-4 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max File Size</span>
            <span className="text-xs font-mono text-indigo-400 font-bold">{maxSizeLimit} KB</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max={maxPossibleSize} 
            value={maxSizeLimit} 
            onChange={(e) => setMaxSizeLimit(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          Showing {filteredFiles.length} of {files.length} files
        </span>
        <button 
          onClick={toggleAll}
          className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
        >
          {selected.size === filteredFiles.length ? 'Deselect All' : 'Select Visible'}
        </button>
      </div>

      {/* File List */}
      <div className="border border-zinc-800/60 rounded-2xl bg-black/40 h-80 overflow-hidden flex flex-col mb-8 shadow-inner relative">
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent p-3 space-y-1">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <label 
                key={file.path} 
                className={`
                  flex items-center gap-4 p-2.5 rounded-xl cursor-pointer transition-all duration-300 group
                  ${selected.has(file.path) ? 'bg-indigo-500/10 border border-indigo-500/10' : 'bg-transparent border border-transparent hover:bg-white/5'}
                `}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input 
                    type="checkbox" 
                    checked={selected.has(file.path)}
                    onChange={() => toggleFile(file.path)}
                    className="peer appearance-none w-5 h-5 rounded-lg border border-zinc-700 bg-zinc-800/50 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer"
                  />
                  <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-mono truncate transition-colors ${selected.has(file.path) ? 'text-indigo-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {file.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${file.size && file.size > 20480 ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-600 bg-zinc-800/50'}`}>
                      {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '0 KB'}
                    </span>
                  </div>
                </div>
              </label>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-40">
              <div className="p-4 bg-zinc-900/50 rounded-full">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest mb-1">No matches</p>
                <p className="text-[10px]">Try adjusting filters or search term</p>
              </div>
            </div>
          )}
        </div>
        {/* Shadow Overlay for scroll depth */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      </div>

      <div className="flex gap-4 justify-end pt-4 border-t border-white/5">
        <button 
          onClick={onCancel} 
          className="px-6 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
        >
          Cancel
        </button>
        <Button 
          onClick={() => onConfirm(Array.from(selected))} 
          disabled={selected.size === 0} 
          className="min-w-[200px] shadow-2xl shadow-indigo-500/10"
        >
          Compile {selected.size} Files
        </Button>
      </div>
    </div>
  );
};
