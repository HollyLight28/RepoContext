import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { FileTree } from './components/FileTree';
import { History, addToHistory } from './components/History';
import { ProcessState, OutputFormat } from './types';
import { fetchRepoStructure, generateMergedContent } from './services/githubService';

const App: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [token, setToken] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [maxFileSize, setMaxFileSize] = useState<number>(100); // KB
  const [customIgnores, setCustomIgnores] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [fetchedRepoInfo, setFetchedRepoInfo] = useState<{name: string, branch: string} | null>(null);

  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle',
    totalFiles: 0,
    processedFiles: 0,
    currentFile: '',
    error: null,
    result: null,
    resultSize: 0,
    tokenCount: 0,
    tree: []
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setToken(newVal);
    if (newVal) {
      localStorage.setItem('gh_token', newVal);
    } else {
      localStorage.removeItem('gh_token');
    }
  };

  const handleFetchTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setProcessState({
      status: 'fetching_tree',
      totalFiles: 0,
      processedFiles: 0,
      currentFile: 'Scanning repository structure...',
      error: null,
      result: null,
      resultSize: 0,
      tokenCount: 0,
      tree: []
    });

    try {
      const { tree, branch: foundBranch, repoName } = await fetchRepoStructure({
        repoUrl,
        branch: branch || undefined,
        token,
        maxFileSizeKB: maxFileSize,
        customIgnores: customIgnores.split(',').map(s => s.trim()).filter(Boolean)
      });

      if (tree.length === 0) {
        throw new Error("No files found. Check your ignore settings or repo is empty.");
      }

      setFetchedRepoInfo({ name: repoName, branch: foundBranch });
      addToHistory(repoName);
      
      setProcessState(prev => ({
        ...prev,
        status: 'selecting',
        tree: tree,
        totalFiles: tree.length
      }));

    } catch (err) {
      setProcessState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      }));
    }
  };

  const handleMergeSelection = async (selectedPaths: string[]) => {
    if (!fetchedRepoInfo) return;

    const selectedFiles = processState.tree.filter(f => selectedPaths.includes(f.path));

    setProcessState(prev => ({
      ...prev,
      status: 'downloading',
      totalFiles: selectedFiles.length,
      processedFiles: 0,
    }));

    try {
      const result = await generateMergedContent({
        files: selectedFiles,
        repoName: fetchedRepoInfo.name,
        branch: fetchedRepoInfo.branch,
        token,
        format: outputFormat,
        onProgress: (processed, total, current) => {
          setProcessState(prev => ({
            ...prev,
            processedFiles: processed,
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
        error: err instanceof Error ? err.message : 'Error downloading content'
      }));
    }
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
      tree: []
    });
    setFetchedRepoInfo(null);
  };

  const isProcessing = ['fetching_tree', 'downloading', 'merging'].includes(processState.status);

  const getFormatLabel = (fmt: OutputFormat) => {
    switch (fmt) {
      case 'plain': return 'Text (.txt)';
      case 'markdown': return 'Markdown (AI)';
      case 'xml': return 'XML (Strict)';
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      
      {/* PROFESSIONAL BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep mesh gradient */}
        <div className="absolute -top-[30%] -left-[10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-10000"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[800px] h-[800px] bg-violet-900/10 rounded-full blur-[150px] mix-blend-screen"></div>
        
        {/* Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-3xl space-y-12 relative z-10">
        <Header />

        {/* MAIN GLASS CARD */}
        <div className="bg-zinc-900/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden ring-1 ring-white/5">
          
          {/* Accent lighting on card */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
          
          {processState.status === 'completed' && processState.result ? (
            <ResultCard 
              stats={{
                files: processState.processedFiles,
                size: processState.resultSize,
                tokenCount: processState.tokenCount,
                content: processState.result
              }}
              onReset={reset}
              format={outputFormat}
            />
          ) : processState.status === 'selecting' ? (
             <FileTree 
                files={processState.tree}
                onConfirm={handleMergeSelection}
                onCancel={reset}
             />
          ) : (
            <form onSubmit={handleFetchTree} className="space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="GitHub Repository URL"
                      placeholder="https://github.com/owner/repository"
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

                {/* Format Tabs */}
                <div>
                   <label className="text-xs font-semibold text-zinc-400 pl-1 uppercase tracking-wide mb-3 block">Output Format</label>
                   <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-zinc-800/50">
                      {(['markdown', 'plain', 'xml'] as OutputFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setOutputFormat(fmt)}
                          disabled={isProcessing}
                          className={`
                            py-2.5 px-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden
                            ${outputFormat === fmt 
                              ? 'bg-zinc-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                          `}
                        >
                          {outputFormat === fmt && (
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-50"></div>
                          )}
                          <span className="relative z-10">{getFormatLabel(fmt)}</span>
                        </button>
                      ))}
                   </div>
                   <p className="text-[11px] text-zinc-500 mt-2.5 pl-2 h-4 flex items-center gap-1.5 opacity-80">
                     <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                     {outputFormat === 'markdown' && "Recommended. Optimized for syntax highlighting in ChatGPT."}
                     {outputFormat === 'xml' && "Structured tagging. Ideal for Claude's long-context window."}
                     {outputFormat === 'plain' && "Minimal overhead. Maximum efficiency for huge codebases."}
                   </p>
                </div>
                
                <div className="relative pt-2">
                  <Input
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>Private Repo Access</span>
                        <a 
                          href="https://github.com/settings/tokens/new?description=RepoContext&scopes=repo" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1 group"
                          tabIndex={-1}
                        >
                          GENERATE TOKEN 
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    }
                    placeholder="ghp_xxxxxxxxxxxx"
                    type="password"
                    value={token}
                    onChange={handleTokenChange}
                    helperText="Recommended for larger repos to bypass GitHub rate limits."
                    disabled={isProcessing}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group py-2"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${showAdvanced ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800/50'}`}>
                      <svg 
                        className={`w-3 h-3 transition-transform duration-300 ${showAdvanced ? 'rotate-90' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    ADVANCED CONFIGURATION
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-5 bg-black/40 rounded-xl border border-white/10 space-y-6 animate-in slide-in-from-top-2">
                      <div>
                        <div className="flex justify-between mb-3">
                          <label className="text-xs font-medium text-zinc-300">Max File Size</label>
                          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/30">{maxFileSize} KB</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="1000" 
                          step="10"
                          value={maxFileSize}
                          onChange={(e) => setMaxFileSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                      </div>

                      <Input 
                        label="Ignore Patterns"
                        placeholder="e.g. tests/, *.spec.ts, assets/"
                        value={customIgnores}
                        onChange={(e) => setCustomIgnores(e.target.value)}
                        className="bg-zinc-900/80"
                        helperText="Comma separated list of files or folders to skip."
                      />
                    </div>
                  )}
                </div>
              </div>

              {processState.status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200 flex items-start gap-3 animate-in slide-in-from-top-2 shadow-lg shadow-red-500/5">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                <div className="space-y-6 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full py-4 text-lg font-bold tracking-wide" 
                    isLoading={isProcessing}
                  >
                    SCAN REPOSITORY
                  </Button>
                  
                  {/* History Component */}
                  {processState.status === 'idle' && (
                    <History onSelect={(repo) => setRepoUrl(`https://github.com/${repo}`)} />
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 relative z-10 opacity-60 hover:opacity-100 transition-opacity">
           <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
             Secure Client-Side Processing • No Server Storage
           </p>
        </div>
      </div>
    </div>
  );
};

export default App;