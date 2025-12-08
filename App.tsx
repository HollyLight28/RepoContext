import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { ProcessState, OutputFormat } from './types';
import { mergeRepo } from './services/githubService';
import { DEFAULT_REPO } from './constants';

const App: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState('');
  const [token, setToken] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [maxFileSize, setMaxFileSize] = useState<number>(100); // KB
  const [customIgnores, setCustomIgnores] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle',
    totalFiles: 0,
    processedFiles: 0,
    currentFile: '',
    error: null,
    result: null,
    resultSize: 0,
    tokenCount: 0,
  });

  // Load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) setToken(savedToken);
  }, []);

  // Handle "Ingest" URL pattern (domain.com/owner/repo)
  useEffect(() => {
    const path = window.location.pathname.substring(1); // remove leading slash
    // Simple check: owner/repo pattern (and not just a random file or empty)
    // Avoid matching typical assets like main.js if routing is messy
    if (path && path.split('/').length >= 2 && !path.includes('.')) {
      const [owner, repo, ...rest] = path.split('/');
      const cleanRepoPath = `${owner}/${repo}`;
      setRepoUrl(cleanRepoPath);
      
      // If there is a 3rd part, it might be the branch, but standard github url structure 
      // is usually /owner/repo/tree/branch. For simplicity, we just take owner/repo.
      
      // Only auto-start once per page load and if we have a valid path
      if (!autoStarted && !processState.result) {
        setAutoStarted(true);
        // We need to use a timeout or a ref to ensure the state (repoUrl) is updated
        // before we trigger the merge. However, since we are inside the effect setting it,
        // we can pass the value directly to a function.
        triggerMerge(cleanRepoPath);
      }
    }
  }, [autoStarted, processState.result]);

  // Save token to localStorage
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setToken(newVal);
    if (newVal) {
      localStorage.setItem('gh_token', newVal);
    } else {
      localStorage.removeItem('gh_token');
    }
  };

  const triggerMerge = async (urlToMerge: string) => {
    setProcessState({
      status: 'fetching_tree',
      totalFiles: 0,
      processedFiles: 0,
      currentFile: 'Initializing...',
      error: null,
      result: null,
      resultSize: 0,
      tokenCount: 0,
    });

    try {
      const result = await mergeRepo({
        repoUrl: urlToMerge, 
        branch: branch || undefined, 
        token, // Uses current state token (might be empty if not loaded yet, but usually localStorage loads fast)
        format: outputFormat,
        maxFileSizeKB: maxFileSize,
        customIgnores: customIgnores.split(',').map(s => s.trim()).filter(Boolean),
        onProgress: (processed, total, current) => {
          setProcessState(prev => ({
            ...prev,
            status: 'downloading',
            processedFiles: processed,
            totalFiles: total,
            currentFile: current
          }));
        }
      });

      setProcessState(prev => ({
        ...prev,
        status: 'completed',
        result: result.content,
        resultSize: result.totalSize,
        tokenCount: result.tokenCount,
        processedFiles: result.fileCount,
        totalFiles: result.fileCount
      }));

    } catch (err) {
      setProcessState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      }));
    }
  };

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    triggerMerge(repoUrl);
  };

  const reset = () => {
    setProcessState({
      status: 'idle',
      totalFiles: 0,
      processedFiles: 0,
      currentFile: '',
      error: null,
      result: null,
      resultSize: 0,
      tokenCount: 0,
    });
    // Clear URL path without reloading
    window.history.pushState({}, '', '/');
  };

  const isProcessing = ['fetching_tree', 'downloading', 'filtering', 'merging'].includes(processState.status);

  const getFormatLabel = (fmt: OutputFormat) => {
    switch (fmt) {
      case 'plain': return 'Text (.txt)';
      case 'markdown': return 'Markdown (AI)';
      case 'xml': return 'XML (Strict)';
    }
  };

  // Get current domain for the pro tip
  const currentDomain = typeof window !== 'undefined' ? window.location.host : 'your-site.com';

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <Header />

        <div className="bg-surface border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
          
          {processState.status === 'completed' && processState.result ? (
            <ResultCard 
              stats={{
                files: processState.processedFiles,
                size: processState.resultSize,
                tokenCount: processState.tokenCount,
                content: processState.result
              }}
              onReset={reset}
            />
          ) : (
            <form onSubmit={handleMergeSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="GitHub Repository"
                      placeholder="owner/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Branch"
                      placeholder="(default)"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                   <label className="text-sm font-medium text-zinc-400 pl-1 mb-2 block">Output Format</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['markdown', 'plain', 'xml'] as OutputFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setOutputFormat(fmt)}
                          disabled={isProcessing}
                          className={`
                            py-2 px-1 rounded-lg text-sm font-medium border transition-all truncate
                            ${outputFormat === fmt 
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                              : 'bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}
                          `}
                        >
                          {getFormatLabel(fmt)}
                        </button>
                      ))}
                   </div>
                   <p className="text-xs text-zinc-500 mt-2 pl-1 h-8">
                     {outputFormat === 'markdown' && "Recommended. Adds formatting so AI understands code structure better."}
                     {outputFormat === 'xml' && "Advanced. Wraps files in tags. Useful for strict parsing tasks."}
                     {outputFormat === 'plain' && "Basic. Just the raw code separated by lines. No special formatting."}
                   </p>
                </div>
                
                <div className="relative">
                  <Input
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>Personal Access Token (Optional)</span>
                        <a 
                          href="https://github.com/settings/tokens/new?description=RepoContext&scopes=repo" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
                          tabIndex={-1}
                        >
                          Generate Token 
                          <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    }
                    placeholder="ghp_xxxxxxxxxxxx"
                    type="password"
                    value={token}
                    onChange={handleTokenChange}
                    helperText="Recommended for private repos and to avoid rate limits."
                    disabled={isProcessing}
                  />
                </div>

                {/* Advanced Settings Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Advanced Settings
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 space-y-4 animate-in slide-in-from-top-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-zinc-400">Max File Size</label>
                          <span className="text-xs text-indigo-400 font-mono">{maxFileSize} KB</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="1000" 
                          step="10"
                          value={maxFileSize}
                          onChange={(e) => setMaxFileSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">Skips files larger than this to save tokens.</p>
                      </div>

                      <Input 
                        label="Ignore Patterns"
                        placeholder="tests/, *.test.ts, docs/"
                        value={customIgnores}
                        onChange={(e) => setCustomIgnores(e.target.value)}
                        helperText="Comma separated list of folders or files to skip."
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {processState.status === 'error' && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-sm text-red-200 flex items-start gap-2 animate-in slide-in-from-top-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{processState.error}</span>
                </div>
              )}

              {isProcessing ? (
                <ProgressBar 
                  progress={processState.processedFiles}
                  total={processState.totalFiles || 100}
                  currentFile={processState.currentFile}
                />
              ) : (
                <Button 
                  type="submit" 
                  className="w-full py-3 text-lg" 
                  isLoading={isProcessing}
                >
                  Merge to File
                </Button>
              )}
            </form>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
           {/* Pro Tip Card */}
           <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 max-w-sm w-full flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-md">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-300">Magic URL:</p>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Add <span className="font-mono text-zinc-400">/owner/repo</span> to this site's URL to instantly start merging.
                  <br/>Example: <span className="text-zinc-600">{currentDomain}/facebook/react</span>
                </p>
              </div>
           </div>

           <p className="text-xs text-zinc-600">
             Client-side processing. Your code never leaves your browser.
           </p>
        </div>
      </div>
    </div>
  );
};

export default App;