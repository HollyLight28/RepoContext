import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  currentFile: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, currentFile }) => {
  const percentage = Math.min(100, Math.round((progress / total) * 100));

  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-blue-400">Processing...</span>
        <span className="text-xs font-mono text-zinc-500">{progress} / {total} files</span>
      </div>
      
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between items-center">
         <p className="text-xs text-zinc-500 truncate max-w-[80%] font-mono">
           {currentFile || "Initializing..."}
         </p>
         <span className="text-xs font-bold text-zinc-300">{percentage}%</span>
      </div>
    </div>
  );
};