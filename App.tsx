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
      case 'plain': return 'Text';
      case 'markdown': return 'Markdown';
      case 'xml': return 'XML';
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col items-center py-8 md:py-16 px-4 relative overflow-x-hidden selection:bg-indigo-500/40 selection:text-white">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[100vw] h-[100vw] bg-indigo-900/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-violet-900/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-3xl space-y-8 md:space-y-12 relative z-10">
        <Header />

        {/* MAIN CONTAINER */}
        <div className="bg-[#0c0c0e]/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative ring-1 ring-white/5 overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
          
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <Input
                      label="Repository URL"
                      placeholder="https://github.com/owner/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      label="Branch"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] md:text-xs font-bold text-zinc-500 pl-1 uppercase tracking-widest mb-3 block">Format</label>
                   <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-zinc-800/50 shadow-inner">
                      {(['markdown', 'plain', 'xml'] as OutputFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setOutputFormat(fmt)}
                          disabled={isProcessing}
                          className={`
                            py-2 px-1 md:px-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-500 relative overflow-hidden
                            ${outputFormat === fmt 
                              ? 'bg-zinc-800 text-white shadow-xl ring-1 ring-white/10' 
                              : 'text-zinc-500 hover:text-zinc-300'}
                          `}
                        >
                          {outputFormat === fmt && (
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
                          )}
                          <span className="relative z-10">{getFormatLabel(fmt)}</span>
                        </button>
                      ))}
                   </div>
                </div>
                
                <div className="pt-2">
                  <Input
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>API Token (Optional)</span>
                        <a 
                          href="https://github.com/settings/tokens/new" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          GET TOKEN <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={3} /></svg>
                        </a>
                      </div>
                    }
                    placeholder="ghp_xxxxxxxxxxxx"
                    type="password"
                    value={token}
                    onChange={handleTokenChange}
                    disabled={isProcessing}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-zinc-300 transition-all tracking-widest"
                  >
                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${showAdvanced ? 'bg-indigo-500 text-white' : 'bg-zinc-800'}`}>
                      <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${showAdvanced ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    ADVANCED CONFIG
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-5 bg-black/40 rounded-xl border border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div>
                        <div className="flex justify-between mb-3 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                          <span>Max File Size</span>
                          <span className="text-indigo-400">{maxFileSize} KB</span>
                        </div>
                        <input 
                          type="range" min="10" max="1000" step="10" value={maxFileSize}
                          onChange={(e) => setMaxFileSize(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                      </div>
                      <Input label="Ignore Patterns" placeholder="tests/, docs/, *.md" value={customIgnores} onChange={(e) => setCustomIgnores(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {processState.status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs md:text-sm text-red-300 flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{processState.error}</span>
                </div>
              )}

              {isProcessing ? (
                <ProgressBar progress={processState.processedFiles} total={processState.totalFiles || 100} currentFile={processState.currentFile} />
              ) : (
                <div className="space-y-6">
                  <Button type="submit" className="w-full py-4 text-lg" isLoading={isProcessing}>
                    SCAN & PREPARE
                  </Button>
                  {processState.status === 'idle' && <History onSelect={(repo) => setRepoUrl(`https://github.com/${repo}`)} />}
                </div>
              )}
            </form>
          )}
        </div>

        <div className="text-center opacity-40 hover:opacity-100 transition-opacity duration-700">
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">
             Local Browser Engine • No Data Collection
           </p>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;