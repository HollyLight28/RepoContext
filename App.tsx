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
  const [maxFileSize, setMaxFileSize] = useState<number>(100);
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
    if (newVal) localStorage.setItem('gh_token', newVal);
    else localStorage.removeItem('gh_token');
  };

  const handleFetchTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setProcessState({
      status: 'fetching_tree',
      totalFiles: 0,
      processedFiles: 0,
      currentFile: 'Analyzing repository structure...',
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

      if (tree.length === 0) throw new Error("No files found. Check your filters.");

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
        error: err instanceof Error ? err.message : 'Connection error'
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
        error: err instanceof Error ? err.message : 'Download failed'
      }));
    }
  };

  const reset = () => {
    setProcessState({
      status: 'idle', totalFiles: 0, processedFiles: 0, currentFile: '',
      error: null, result: null, resultSize: 0, tokenCount: 0, tree: []
    });
    setFetchedRepoInfo(null);
  };

  const isProcessing = ['fetching_tree', 'downloading', 'merging'].includes(processState.status);

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col items-center py-6 md:py-20 px-4 relative overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* ULTRA PREM BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-4xl space-y-12 relative z-10">
        <Header />

        {/* MAIN CONTAINER: Glassmorphism Card */}
        <div className="bg-[#0d0d10]/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 shadow-[0_40px_120px_rgba(0,0,0,0.6)] relative overflow-hidden group/container">
          
          {/* Internal Glow Effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full group-hover/container:bg-indigo-500/20 transition-all duration-1000"></div>

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
            <form onSubmit={handleFetchTree} className="space-y-10">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <Input
                      label="Repository URL"
                      placeholder="https://github.com/owner/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      label="Branch"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] md:text-xs font-bold text-zinc-500 pl-1 uppercase tracking-[0.3em]">Select Export Mode</label>
                   <div className="grid grid-cols-3 gap-3 p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5">
                      {(['markdown', 'plain', 'xml'] as OutputFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setOutputFormat(fmt)}
                          disabled={isProcessing}
                          className={`
                            py-3 px-2 rounded-2xl text-[10px] md:text-xs font-black transition-all duration-500 uppercase tracking-widest
                            ${outputFormat === fmt 
                              ? 'bg-zinc-800 text-white shadow-2xl ring-1 ring-white/10 scale-[1.02]' 
                              : 'text-zinc-600 hover:text-zinc-400'}
                          `}
                        >
                          {fmt === 'plain' ? 'Text' : fmt}
                        </button>
                      ))}
                   </div>
                </div>
                
                <Input
                  label={
                    <div className="flex justify-between items-center w-full">
                      <span>Personal Access Token</span>
                      <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 normal-case text-[9px]">
                        GENERATE <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={3} /></svg>
                      </a>
                    </div>
                  }
                  placeholder="ghp_xxxxxxxxxxxx"
                  type="password"
                  value={token}
                  onChange={handleTokenChange}
                  disabled={isProcessing}
                  helperText="Avoids rate limits. Recommended for private repos."
                />

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2.5 text-[10px] font-bold text-zinc-500 hover:text-indigo-400 transition-all tracking-widest uppercase"
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${showAdvanced ? 'bg-indigo-500 text-white' : 'bg-zinc-900 border border-white/5'}`}>
                      <svg className={`w-3 h-3 transition-transform duration-500 ${showAdvanced ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    Engine Settings
                  </button>

                  {showAdvanced && (
                    <div className="mt-6 p-8 bg-black/40 rounded-3xl border border-white/5 space-y-8 animate-in slide-in-from-top-4 duration-500">
                      <div>
                        <div className="flex justify-between mb-4 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <span>Max Individual File Size</span>
                          <span className="text-indigo-400">{maxFileSize} KB</span>
                        </div>
                        <input 
                          type="range" min="10" max="1000" step="10" value={maxFileSize}
                          onChange={(e) => setMaxFileSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <Input label="Custom Ignore Patterns" placeholder="tests/, docs/, *.md, legacy/" value={customIgnores} onChange={(e) => setCustomIgnores(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {processState.status === 'error' && (
                <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-xs md:text-sm text-red-400 flex items-center gap-4 animate-shake">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <span className="font-medium">{processState.error}</span>
                </div>
              )}

              {isProcessing ? (
                <ProgressBar progress={processState.processedFiles} total={processState.totalFiles || 100} currentFile={processState.currentFile} />
              ) : (
                <div className="space-y-10">
                  <Button type="submit" className="w-full h-16 text-lg md:text-xl" isLoading={isProcessing}>
                    Scan Repository
                  </Button>
                  {processState.status === 'idle' && <History onSelect={(repo) => setRepoUrl(`https://github.com/${repo}`)} />}
                </div>
              )}
            </form>
          )}
        </div>

        <div className="text-center pt-4">
           <p className="text-[9px] md:text-[10px] text-zinc-600 font-black uppercase tracking-[0.5em] opacity-50 hover:opacity-100 transition-opacity duration-1000">
             Privacy Secured • 100% Client-Side • Next-Gen Engine
           </p>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          border: 3px solid #000;
        }
      `}</style>
    </div>
  );
};

export default App;