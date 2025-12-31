
import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  currentFile: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, currentFile }) => {
  const percentage = Math.min(100, Math.round((progress / total) * 100));

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 p-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-end mb-4">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Sequence Running...</span>
        <span className="text-xs font-mono text-zinc-500">{progress} / {total}</span>
      </div>
      
      <div className="h-1 w-full bg-zinc-800 overflow-hidden">
        <div 
          className="h-full bg-crimson-600 transition-all duration-300 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4 flex justify-between items-center font-mono">
         <p className="text-[10px] text-zinc-600 truncate max-w-[80%] uppercase">
           Processing: {currentFile || "Init..."}
         </p>
         <span className="text-xs font-bold text-zinc-300">{percentage}%</span>
      </div>
    </div>
  );
};
