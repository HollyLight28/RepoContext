
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { FileTree } from './components/FileTree';
import { History, addToHistory } from './components/History';
import { ChatInterface } from './components/ChatInterface';
import { ProcessState, OutputFormat, AIStrategy } from './types';
import { fetchRepoStructure, generateMergedContent } from './services/githubService';

const STRATEGY_DETAILS: Record<AIStrategy, { label: string, desc: string, prompt: string }> = {
  none: { 
    label: 'RAW', 
    desc: 'Baseline source.', 
    prompt: 'No additional instructions. Pure repository serialization without semantic overhead.' 
  },
  refactor: { 
    label: 'ARCHITECT', 
    desc: 'Structural audit.', 
    prompt: `### ROLE: Principal Systems Architect & Software Strategist
### OBJECTIVE: Perform a "First Principles" architectural teardown and reconstruction blueprint.
1. DE-COUPLING MATRIX: Map the global dependency graph. Identify "Entropy Hotspots" where temporal coupling or hidden state is leaking between domains.
2. ABSTRACTION FIDELITY: Audit the boundary between business logic and infrastructure. Detect "Leaky Abstractions" and "Anemic Domain Models".
3. PRINCIPLE ENFORCEMENT: Critique against SOLID, KISS, and the "Law of Demeter". Quantify the "Cognitive Load" of critical paths.
4. REFACTORING ROADMAP: Design a phased "Strangler Fig" strategy to migrate technical debt without breaking runtime stability.` 
  },
  debug: { 
    label: 'DEBUGGER', 
    desc: 'Logic trace.', 
    prompt: `### ROLE: Senior Systems Engineer & Formal Verification Specialist
### OBJECTIVE: Execute a deep-trace logical audit to find the "Impossible State" and non-obvious failure modes.
1. CONCURRENCY HAZARD SCAN: Simulate high-concurrency execution. Check for non-atomic operations, race conditions, and signal-handling deadlocks.
2. RESOURCE LINEAGE: Audit the lifecycle of every high-cost object. Identify potential leaks in error-handling catch blocks and long-running loops.
3. LOGIC BRANCH TRUTH TABLE: Exhaustively verify all conditional branches. Find "Dead Code" paths and unhandled edge cases in complex logic matrices.` 
  },
  explain: { 
    label: 'DOC_GEN', 
    desc: 'System mapping.', 
    prompt: `### ROLE: Principal Technical Lead & "Code Soul" Documentarian
### OBJECTIVE: Decrypt the "Mental Model" of this system for high-resolution onboarding.
1. DATA GENESIS & DESTRUCTION: Trace the lifecycle of core data structures from ingestion/creation to persistence/deletion.
2. "FIRST PRINCIPLES" RATIONALE: Explain the "Why" behind the "How". What trade-offs were made regarding latency vs consistency?
3. HOT PATHS & BOTTLENECKS: Locate the critical 20% of code that handles 80% of the complexity or performance impact.` 
  },
  security: { 
    label: 'SEC_OPS', 
    desc: 'Zero-trust audit.', 
    prompt: `### ROLE: Chief Information Security Officer (CISO) & Red Team Lead
### OBJECTIVE: Perform a "Zero-Trust" offensive audit and defensive hardening plan.
1. OWASP + STRIDE AUDIT: Perform an exhaustive check for Spoofing, Tampering, Repudiation, Information Disclosure, DoS, and Elevation of Privilege.
2. SECRETS HYGIENE: Verify entropy of salts, strength of hashing, and absolute absence of hardcoded credentials/tokens.
3. INPUT SANITIZATION PIPELINE: Audit the boundaries between untrusted input and internal sinks (DBs, APIs, Shells).` 
  },
  custom: { 
    label: 'CUSTOM', 
    desc: 'User inject.', 
    prompt: 'Awaiting user-defined system instructions to override default logic.' 
  },
};

const FORMATS: { id: OutputFormat, label: string }[] = [
  { id: 'markdown', label: 'MD' },
  { id: 'xml', label: 'XML' },
  { id: 'plain', label: 'TXT' },
];

const App: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [token, setToken] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [aiStrategy, setAiStrategy] = useState<AIStrategy>('none');
  const [customPrompt, setCustomPrompt] = useState('');
  const [stripComments, setStripComments] = useState(false);
  const [minimalist, setMinimalist] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState<number>(100);
  const [customIgnores, setCustomIgnores] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  
  const [fetchedRepoInfo, setFetchedRepoInfo] = useState<{name: string, branch: string} | null>(null);

  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle', totalFiles: 0, processedFiles: 0, currentFile: '', error: null, result: null, resultSize: 0, tokenCount: 0, tree: []
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const handleFetchTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setProcessState({ ...processState, status: 'fetching_tree', error: null, currentFile: 'Establishing handshake...' });
    try {
      const { tree, branch: fb, repoName } = await fetchRepoStructure({ repoUrl, branch, token, maxFileSizeKB: maxFileSize, customIgnores: customIgnores.split(',') });
      setFetchedRepoInfo({ name: repoName, branch: fb });
      if (token) localStorage.setItem('gh_token', token);
      addToHistory(repoName);
      setProcessState(prev => ({ ...prev, status: 'selecting', tree, totalFiles: tree.length }));
    } catch (err: any) {
      setProcessState(prev => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  const handleMergeSelection = async (selectedPaths: string[]) => {
    if (!fetchedRepoInfo) return;
    const selectedFiles = processState.tree.filter(f => selectedPaths.includes(f.path));
    setProcessState(prev => ({ ...prev, status: 'downloading', totalFiles: selectedFiles.length, processedFiles: 0 }));
    try {
      const result = await generateMergedContent({
        files: selectedFiles, repoName: fetchedRepoInfo.name, branch: fetchedRepoInfo.branch,
        token, format: outputFormat, strategy: aiStrategy, customPrompt, stripComments, minimalist,
        onProgress: (p: number, t: number, c: string) => setProcessState(prev => ({ ...prev, processedFiles: p, currentFile: c }))
      });
      setProcessState(prev => ({ ...prev, status: 'completed', result: result.content, resultSize: result.totalSize, tokenCount: result.tokenCount, processedFiles: result.fileCount }));
    } catch (err: any) {
      setProcessState(prev => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  const reset = () => {
    setProcessState({ status: 'idle', totalFiles: 0, processedFiles: 0, currentFile: '', error: null, result: null, resultSize: 0, tokenCount: 0, tree: [] });
    setFetchedRepoInfo(null);
    setShowChat(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-24 relative overflow-hidden bg-background">
      <Header />

      <main className="w-full max-w-4xl px-6 mt-16 z-10">
        
        {processState.status === 'error' && processState.error && (
          <div className="bg-crimson-950/20 border border-crimson-900/50 p-6 mb-12 flex items-start gap-4 animate-in fade-in zoom-in-95">
             <span className="text-crimson-500 font-mono text-xs font-black">![SYSTEM_ERR]</span>
             <p className="text-zinc-50 text-xs font-mono leading-relaxed">{processState.error}</p>
          </div>
        )}

        {processState.status === 'completed' && processState.result ? (
          <div className="flex flex-col gap-12">
            <ResultCard stats={{ files: processState.processedFiles, size: processState.resultSize, tokenCount: processState.tokenCount, content: processState.result }} onReset={reset} format={outputFormat} />
            
            {!showChat ? (
              <Button 
                variant="secondary" 
                onClick={() => setShowChat(true)}
                className="w-full py-8 border-dashed border-crimson-800/30 text-crimson-400 hover:text-white hover:border-crimson-500 bg-crimson-950/5 hover:bg-crimson-950/20"
              >
                [ INITIALIZE_AI_ORACLE_CHAT_SESSION ]
              </Button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-6 duration-700">
                <ChatInterface repositoryContext={processState.result} />
              </div>
            )}
          </div>
        ) : processState.status === 'selecting' ? (
          <div className="bg-zinc-900/30 border border-zinc-800 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <FileTree files={processState.tree} onConfirm={handleMergeSelection} onCancel={reset} />
          </div>
        ) : (
          <form onSubmit={handleFetchTree} className="flex flex-col gap-20">
            
            {/* Step 1: Input */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4 flex flex-col gap-3">
                <span className="text-[11px] font-mono text-white uppercase tracking-[0.4em] font-black">01 // SOURCE_NODE</span>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed uppercase font-medium">Enter target repository coordinates for extraction.</p>
              </div>
              <div className="md:col-span-8 flex flex-col gap-10">
                <Input label="REPO_URI" placeholder="owner/repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} required />
                <div className="grid grid-cols-2 gap-10">
                  <Input label="BRANCH_REF" placeholder="HEAD" value={branch} onChange={(e) => setBranch(e.target.value)} />
                  <Input label="AUTH_TOKEN" type="password" placeholder="OPTIONAL" value={token} onChange={(e) => setToken(e.target.value)} />
                </div>
                <History onSelect={(repo) => setRepoUrl(`https://github.com/${repo}`)} />
              </div>
            </section>

            <div className="h-px bg-zinc-800/40 w-full"></div>

            {/* Step 2: Config */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4 flex flex-col gap-3">
                <span className="text-[11px] font-mono text-white uppercase tracking-[0.4em] font-black">02 // MODALITY_CONFIG</span>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed uppercase font-medium">Adjust serialization depth and system instructions.</p>
              </div>
              <div className="md:col-span-8 flex flex-col gap-12">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-300 uppercase mb-4 block font-black tracking-widest">OUTPUT_ENGINE</label>
                    <div className="flex gap-px bg-zinc-800 border border-zinc-800">
                      {FORMATS.map(f => (
                        <button key={f.id} type="button" onClick={() => setOutputFormat(f.id)}
                          className={`flex-1 py-4 text-[10px] font-mono font-bold transition-all ${outputFormat === f.id ? 'bg-zinc-100 text-black shadow-lg' : 'bg-black text-zinc-400 hover:text-zinc-200'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-300 uppercase mb-4 block font-black tracking-widest">DATA_FLAGS</label>
                    <div className="flex flex-col gap-4">
                      <button type="button" onClick={() => setStripComments(!stripComments)} className="flex items-center gap-4 group">
                        <div className={`w-4 h-4 border transition-all ${stripComments ? 'bg-crimson-600 border-crimson-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' : 'border-zinc-700'}`}></div>
                        <span className={`text-[11px] font-mono uppercase transition-colors font-bold ${stripComments ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>STRIP_COMMENTS</span>
                      </button>
                      <button type="button" onClick={() => setMinimalist(!minimalist)} className="flex items-center gap-4 group">
                        <div className={`w-4 h-4 border transition-all ${minimalist ? 'bg-crimson-600 border-crimson-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' : 'border-zinc-700'}`}></div>
                        <span className={`text-[11px] font-mono uppercase transition-colors font-bold ${minimalist ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>MINIMAL_METADATA</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-300 uppercase mb-4 block font-black tracking-widest">ANALYSIS_STRATEGY</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 overflow-hidden">
                    {(Object.keys(STRATEGY_DETAILS) as AIStrategy[]).map((id) => (
                      <button key={id} type="button" onClick={() => setAiStrategy(id)}
                        className={`p-5 text-left transition-all flex flex-col gap-2 ${aiStrategy === id ? 'bg-zinc-900 text-white' : 'bg-black text-zinc-500 hover:text-zinc-300'}`}>
                        <span className={`text-[11px] font-black font-mono tracking-wider ${aiStrategy === id ? 'text-crimson-500' : ''}`}>{STRATEGY_DETAILS[id].label}</span>
                        <span className="text-[10px] opacity-60 uppercase leading-none font-medium">{STRATEGY_DETAILS[id].desc}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Enhanced Strategy Inspector */}
                  <div className="mt-6 bg-zinc-950/90 border border-zinc-800 p-6 animate-in fade-in slide-in-from-top-2 duration-500 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-crimson-900 group-hover:bg-crimson-600 transition-colors"></div>
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[9px] font-mono text-zinc-200 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-crimson-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]"></span>
                         Strategy_Inspector_v1.2
                       </span>
                       <span className="text-[8px] font-mono text-zinc-600 uppercase font-bold">Static_Context_Stream</span>
                    </div>
                    <pre className="text-[11px] font-mono text-zinc-100 whitespace-pre-wrap leading-relaxed selection:bg-crimson-900 selection:text-white border-l border-zinc-800 pl-4 py-2">
                      {aiStrategy === 'custom' ? (customPrompt || "> Awaiting_Custom_Inject_Sequence...") : STRATEGY_DETAILS[aiStrategy].prompt}
                    </pre>
                  </div>
                </div>

                {aiStrategy === 'custom' && (
                  <textarea className="w-full bg-black/60 border border-zinc-800 p-5 font-mono text-[12px] text-white focus:outline-none focus:border-crimson-700 h-40 transition-all placeholder-zinc-800"
                    placeholder="> INSERT_CUSTOM_SYSTEM_PROMPT_HERE..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} />
                )}
              </div>
            </section>

            <div className="mt-12 mb-20">
              <Button type="submit" className="w-full py-8 text-sm font-black tracking-[0.3em] shadow-[0_10px_40px_rgba(220,38,38,0.2)] hover:shadow-[0_10px_40px_rgba(220,38,38,0.35)]" isLoading={['fetching_tree', 'downloading'].includes(processState.status)}>
                {processState.status === 'fetching_tree' ? 'AUTHENTICATING_SOURCE...' : 'EXECUTE_SERIALIZATION_SEQUENCE'}
              </Button>
              {['fetching_tree', 'downloading'].includes(processState.status) && (
                <div className="mt-16">
                  <ProgressBar progress={processState.processedFiles} total={processState.totalFiles} currentFile={processState.currentFile} />
                </div>
              )}
            </div>

          </form>
        )}
      </main>
    </div>
  );
};

export default App;
