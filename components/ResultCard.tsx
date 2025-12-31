
import React, { useState } from 'react';
import { Button } from './Button';

interface ResultCardProps {
  stats: {
    files: number;
    size: number;
    tokenCount: number;
    content: string;
  };
  onReset: () => void;
  format?: 'plain' | 'markdown' | 'xml';
}

export const ResultCard: React.FC<ResultCardProps> = ({ stats, onReset, format = 'markdown' }) => {
  const [copied, setCopied] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(2) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'k';
    return tokens.toString();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stats.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    let extension = 'txt';
    let mimeType = 'text/plain';

    if (format === 'markdown') {
      extension = 'md';
      mimeType = 'text/markdown';
    } else if (format === 'xml') {
      extension = 'xml';
      mimeType = 'application/xml';
    }

    const blob = new Blob([stats.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repo_context_${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gpt4Context = 128000;
  const claudeContext = 200000;
  const getUsagePercentage = (limit: number) => Math.min(100, (stats.tokenCount / limit) * 100);

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center pb-6 border-b border-zinc-800 mb-8">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-3 uppercase tracking-tight">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Context Generated
          </h2>
          <p className="text-zinc-500 text-xs font-mono mt-1 uppercase tracking-widest">
            Format: {format} | Encoding: UTF-8
          </p>
        </div>
        
        <Button variant="outline" onClick={onReset} className="text-xs px-4 py-2 border-dashed">
          NEW_SESSION
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 mb-8">
        <div className="bg-[#0c0c0e] p-6 flex flex-col items-center justify-center text-center gap-2">
          <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Files Processed</span>
          <span className="text-2xl font-mono text-zinc-100">{stats.files}</span>
        </div>
        <div className="bg-[#0c0c0e] p-6 flex flex-col items-center justify-center text-center gap-2">
          <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Total Payload</span>
          <span className="text-2xl font-mono text-zinc-100">{formatSize(stats.size)}</span>
        </div>
        <div className="bg-[#0c0c0e] p-6 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden">
          <span className="text-crimson-600 text-[10px] font-mono uppercase tracking-widest relative z-10">Est. Tokens</span>
          <span className="text-2xl font-mono text-crimson-500 relative z-10">{formatTokens(stats.tokenCount)}</span>
          <div className="absolute inset-0 bg-crimson-900/5 z-0"></div>
        </div>
      </div>

      {/* Context Usage Bars - Technical Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { name: 'GPT-4 Turbo', limit: gpt4Context },
          { name: 'Claude 3.5', limit: claudeContext }
        ].map(model => {
          const pct = getUsagePercentage(model.limit);
          const isOver = pct >= 100;
          return (
            <div key={model.name} className="border border-zinc-800 bg-[#0c0c0e] p-4">
               <div className="flex justify-between items-baseline mb-3">
                 <span className="text-xs font-mono text-zinc-400 uppercase">{model.name}</span>
                 <span className={`text-xs font-mono ${isOver ? 'text-crimson-500' : 'text-zinc-500'}`}>
                   {Math.round(pct)}% Load
                 </span>
               </div>
               <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                 <div 
                    className={`h-full transition-all duration-1000 ${isOver ? 'bg-crimson-600' : 'bg-zinc-500'}`} 
                    style={{ width: `${pct}%` }}
                 ></div>
               </div>
            </div>
          )
        })}
      </div>

      {/* Preview */}
      <div className="mb-8">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 block">
          Payload Preview (Head 800 chars)
        </label>
        <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono text-[11px] text-zinc-400 h-32 select-none overflow-hidden relative">
          <pre className="whitespace-pre-wrap break-all opacity-80">
            {stats.content.slice(0, 800)}...
          </pre>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/90 pointer-events-none"></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <Button onClick={handleDownload} className="flex-1 bg-zinc-100 text-black hover:bg-zinc-300">
           DOWNLOAD_ARTIFACT
        </Button>
        
        <Button variant="secondary" onClick={handleCopy} className="flex-1">
          {copied ? 'COPIED_TO_CLIPBOARD' : 'COPY_TO_CLIPBOARD'}
        </Button>
      </div>
    </div>
  );
};
