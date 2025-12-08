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
}

export const ResultCard: React.FC<ResultCardProps> = ({ stats, onReset }) => {
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
    const blob = new Blob([stats.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repo-merge-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Context window visualization (approximate)
  const gpt4Context = 128000;
  const claudeContext = 200000;
  
  const getContextColor = (limit: number) => {
    const usage = stats.tokenCount / limit;
    if (usage > 1) return 'text-red-500';
    if (usage > 0.8) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Merge Complete
          </h2>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-400">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs uppercase tracking-wider">Files</span>
              <span className="text-zinc-200 font-mono">{stats.files}</span>
            </div>
            <div className="w-px h-8 bg-zinc-700/50 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs uppercase tracking-wider">Size</span>
              <span className="text-zinc-200 font-mono">{formatSize(stats.size)}</span>
            </div>
            <div className="w-px h-8 bg-zinc-700/50 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs uppercase tracking-wider">Est. Tokens</span>
              <span className="text-zinc-200 font-mono">{formatTokens(stats.tokenCount)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={onReset} className="flex-1 md:flex-none">
            New Repo
          </Button>
        </div>
      </div>

      {/* Context Window Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs text-zinc-500">GPT-4 Turbo (128k)</span>
             <span className={`text-xs font-bold ${getContextColor(gpt4Context)}`}>
               {Math.round((stats.tokenCount / gpt4Context) * 100)}%
             </span>
           </div>
           <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${getContextColor(gpt4Context).replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, (stats.tokenCount / gpt4Context) * 100)}%` }}></div>
           </div>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs text-zinc-500">Claude 3.5 (200k)</span>
             <span className={`text-xs font-bold ${getContextColor(claudeContext)}`}>
               {Math.round((stats.tokenCount / claudeContext) * 100)}%
             </span>
           </div>
           <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${getContextColor(claudeContext).replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, (stats.tokenCount / claudeContext) * 100)}%` }}></div>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={handleDownload} className="w-full py-3">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
           Download .txt
        </Button>
        
        <Button variant="outline" onClick={handleCopy} className="w-full py-3">
          {copied ? (
            <>
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
             <>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
               </svg>
               Copy to Clipboard
             </>
          )}
        </Button>
      </div>

      {/* Preview Snippet */}
      <div className="mt-6">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Preview (First 500 chars)</label>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-zinc-400 border border-zinc-800 overflow-hidden relative">
          <pre className="whitespace-pre-wrap break-all">
            {stats.content.slice(0, 500)}...
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};