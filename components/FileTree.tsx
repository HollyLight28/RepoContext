
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
  const [maxSizeLimit, setMaxSizeLimit] = useState<number>(50);
  
  const maxPossibleSize = useMemo(() => {
    const sizes = files.map(f => (f.size || 0) / 1024);
    return Math.ceil(Math.max(...sizes, 100));
  }, [files]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialPaths = files
      .filter(f => !f.size || (f.size / 1024) <= maxSizeLimit)
      .map(f => f.path);
    setSelected(new Set(initialPaths));
  }, [files]);

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
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 font-mono uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-4 bg-crimson-600 block"></span>
            File Selection Manifest
          </h2>
          <p className="text-[10px] text-zinc-600 font-mono mt-2 uppercase tracking-widest italic">// Select nodes for context mapping</p>
        </div>
        <div className="text-right">
           <span className="text-2xl font-mono text-zinc-200 leading-none">{selected.size}</span>
           <span className="text-[9px] text-zinc-700 uppercase tracking-widest block font-bold">Files_Queue</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        <div className="md:col-span-8">
          <div className="relative bg-black/40 border-b border-zinc-800 focus-within:border-zinc-500 transition-colors">
            <input 
              type="text" 
              placeholder="SEARCH_PATH..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent py-2.5 pl-9 text-[11px] font-mono text-zinc-400 focus:outline-none placeholder-zinc-800"
            />
            <svg className="w-3.5 h-3.5 text-zinc-700 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="md:col-span-4 bg-black/20 border-b border-zinc-800 p-2 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] font-mono text-zinc-700 uppercase font-bold tracking-tighter">Size_Filter</span>
            <span className="text-[9px] font-mono text-crimson-600 font-bold tracking-tighter">{maxSizeLimit} KB</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max={maxPossibleSize} 
            value={maxSizeLimit} 
            onChange={(e) => setMaxSizeLimit(parseInt(e.target.value))}
            className="w-full h-[2px] bg-zinc-900 appearance-none cursor-pointer accent-crimson-700"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[8px] font-mono text-zinc-800 uppercase font-black">
          [ Indexing {filteredFiles.length} of {files.length} units ]
        </span>
        <button 
          onClick={toggleAll}
          className="text-[9px] font-mono text-zinc-500 hover:text-crimson-500 uppercase tracking-tighter transition-colors"
        >
          {selected.size === filteredFiles.length ? '[ NONE ]' : '[ ALL_VISIBLE ]'}
        </button>
      </div>

      <div className="border border-zinc-900 bg-black/20 h-96 flex flex-col mb-8 relative">
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800 p-0.5">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <label 
                key={file.path} 
                className={`
                  flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-all group
                  ${selected.has(file.path) ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/20'}
                `}
              >
                <div className="relative flex items-center justify-center w-3 h-3">
                  <input 
                    type="checkbox" 
                    checked={selected.has(file.path)}
                    onChange={() => toggleFile(file.path)}
                    className="appearance-none w-3 h-3 border border-zinc-800 bg-transparent checked:bg-crimson-800 checked:border-crimson-600 transition-all"
                  />
                </div>
                
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className={`text-[11px] font-mono truncate ${selected.has(file.path) ? 'text-zinc-200' : 'text-zinc-700 group-hover:text-zinc-500'}`}>
                    {file.path}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-800 ml-4">
                    {file.size ? (file.size / 1024).toFixed(0) + 'kb' : '0kb'}
                  </span>
                </div>
              </label>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-[9px] font-mono text-zinc-800 uppercase">
              // NO_NODES_MATCH_CRITERIA
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-between pt-6 border-t border-zinc-900">
        <Button variant="ghost" onClick={onCancel}>
          {'< ABORT_OP'}
        </Button>
        <Button 
          onClick={() => onConfirm(Array.from(selected))} 
          disabled={selected.size === 0}
          className="min-w-[200px]"
        >
          START_SERIALIZATION {'>'}
        </Button>
      </div>
    </div>
  );
};
