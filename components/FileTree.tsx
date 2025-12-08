import React, { useState, useMemo } from 'react';
import { GitHubTreeItem } from '../types';
import { Button } from './Button';

interface FileTreeProps {
  files: GitHubTreeItem[];
  onConfirm: (selectedPaths: string[]) => void;
  onCancel: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(files.map(f => f.path)));
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    return files.filter(f => f.path.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [files, searchTerm]);

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
          <p className="text-sm text-zinc-400 mt-1">Review the repository structure before merging.</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
           <span className="text-sm font-mono text-indigo-400 font-bold">{selected.size}</span>
           <span className="text-xs text-zinc-500 uppercase tracking-wide">Files Selected</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 group">
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-3 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={toggleAll}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors shadow-lg"
        >
          {selected.size === filteredFiles.length ? 'None' : 'All'}
        </button>
      </div>

      <div className="border border-zinc-800/60 rounded-xl bg-black/40 h-80 overflow-hidden flex flex-col mb-6 shadow-inner">
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent p-2">
          {filteredFiles.length > 0 ? (
            <div className="space-y-0.5">
              {filteredFiles.map((file) => (
                <label 
                  key={file.path} 
                  className={`
                    flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 group
                    ${selected.has(file.path) ? 'bg-indigo-500/10 hover:bg-indigo-500/20' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input 
                      type="checkbox" 
                      checked={selected.has(file.path)}
                      onChange={() => toggleFile(file.path)}
                      className="peer appearance-none w-4 h-4 rounded border border-zinc-600 bg-zinc-800 checked:bg-indigo-500 checked:border-indigo-500 transition-colors cursor-pointer"
                    />
                    <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <span className={`text-sm font-mono truncate transition-colors ${selected.has(file.path) ? 'text-indigo-200' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {file.path}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                      {file.size ? (file.size / 1024).toFixed(1) + 'k' : ''}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
              <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">No files found matching "{searchTerm}"</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Back
        </Button>
        <Button onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0} className="w-full sm:w-auto">
          Merge Files
        </Button>
      </div>
    </div>
  );
};