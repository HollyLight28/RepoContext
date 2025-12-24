
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
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
    a.download = `repo-context-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gpt4Context = 128000;
  const claudeContext = 200000;
  
  const getContextColor = (limit: number) => {
    const usage = stats.tokenCount / limit;
    if (usage > 1) return 'text-red-400';
    if (usage > 0.8) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getUsagePercentage = (limit: number) => Math.min(100, (stats.tokenCount / limit) * 100);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Ready to use
          </h2>
          <p className="text-zinc-400 text-sm mt-1 ml-6">Context file generated successfully in {format.toUpperCase()} format.</p>
        </div>
        
        <Button variant="outline" onClick={onReset} className="text-[10px] px-4 py-2 border-dashed uppercase tracking-widest">
          New Repository
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">Files</span>
          <span className="text-2xl font-mono text-white font-semibold">{stats.files}</span>
        </div>
        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">Size</span>
          <span className="text-2xl font-mono text-white font-semibold">{formatSize(stats.size)}</span>
        </div>
        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5"></div>
          <span className="text-indigo-400 text-[10px] uppercase tracking-widest font-black mb-1 relative">Est. Tokens</span>
          <span className="text-2xl font-mono text-indigo-100 font-semibold relative">{formatTokens(stats.tokenCount)}</span>
        </div>
      </div>

      {/* Context Usage Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800/50">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
               <span className="text-xs font-bold text-zinc-300">GPT-4 Turbo</span>
             </div>
             <span className={`text-xs font-mono font-bold ${getContextColor(gpt4Context)}`}>
               {Math.round(getUsagePercentage(gpt4Context))}%
             </span>
           </div>
           <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
             <div 
                className={`h-full rounded-full transition-all duration-1000 ${getContextColor(gpt4Context).replace('text-', 'bg-')}`} 
                style={{ width: `${getUsagePercentage(gpt4Context)}%` }}
             ></div>
           </div>
           <div className="mt-1 text-[9px] text-zinc-600 text-right uppercase font-bold tracking-tighter">Limit: 128k tokens</div>
        </div>

        <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800/50">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
               <span className="text-xs font-bold text-zinc-300">Claude 3.5</span>
             </div>
             <span className={`text-xs font-mono font-bold ${getContextColor(claudeContext)}`}>
               {Math.round(getUsagePercentage(claudeContext))}%
             </span>
           </div>
           <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
             <div 
                className={`h-full rounded-full transition-all duration-1000 ${getContextColor(claudeContext).replace('text-', 'bg-')}`} 
                style={{ width: `${getUsagePercentage(claudeContext)}%` }}
             ></div>
           </div>
           <div className="mt-1 text-[9px] text-zinc-600 text-right uppercase font-bold tracking-tighter">Limit: 200k tokens</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <Button onClick={handleDownload} className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20">
           <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
           Download Context File
        </Button>
        
        <Button variant="secondary" onClick={handleCopy} className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-700/80">
          {copied ? (
            <>
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Copied to Clipboard!</span>
            </>
          ) : (
             <>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
               </svg>
               <span className="uppercase tracking-widest font-bold">Copy to Clipboard</span>
             </>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div className="mt-4 group">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 block group-hover:text-zinc-300 transition-colors">Output Preview</label>
        <div className="bg-black/60 rounded-xl p-4 font-mono text-[10px] text-zinc-500 border border-zinc-800 overflow-hidden relative shadow-inner h-32 select-none">
          <pre className="whitespace-pre-wrap break-all opacity-60">
            {stats.content.slice(0, 800)}...
          </pre>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};
