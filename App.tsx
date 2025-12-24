
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { FileTree } from './components/FileTree';
import { History, addToHistory } from './components/History';
import { ProcessState, OutputFormat, AIStrategy } from './types';
import { fetchRepoStructure, generateMergedContent } from './services/githubService';

const STRATEGY_DETAILS: Record<AIStrategy, { label: string, tag: string, desc: string, prompt: string }> = {
  none: { 
    label: 'Standard source', 
    tag: 'Raw content',
    desc: 'No AI instrumentation. Provides unmodified source code context for manual processing.',
    prompt: '' 
  },
  refactor: { 
    label: 'Architectural audit', 
    tag: 'Structural',
    desc: 'God-tier structural analysis using SOLID, DRY, and Principal-level design pattern optimization.',
    prompt: `### ROLE: Principal Systems Architect & Software Strategist
### OBJECTIVE: Perform a "First Principles" architectural teardown and reconstruction blueprint.
### ANALYSIS PROTOCOLS:
1. **DE-COUPLING MATRIX**: Map the global dependency graph. Identify "Entropy Hotspots" where temporal coupling or hidden state is leaking between domains.
2. **ABSTRACTION FIDELITY**: Audit the boundary between business logic and infrastructure. Detect "Leaky Abstractions" and "Anemic Domain Models".
3. **PRINCIPLE ENFORCEMENT**: Critique the implementation against SOLID, KISS, and the "Law of Demeter". Quantify the "Cognitive Load" of critical paths.
4. **REFACTORING ROADMAP**: Design a phased "Strangler Fig" or "Abstraction Bridge" strategy to migrate technical debt.
5. **SYSTEM STABILITY**: Evaluate the "Fragility" vs "Antifragility" of the codebase under extreme scaling or changing requirements.
### CONSTRAINTS:
- Use "Chain-of-Thought" (CoT) reasoning for every structural recommendation.
- Prioritize "Composition over Inheritance" and "Data-Driven Design".
- Provide "Gold Standard" code examples for the suggested target state.`
  },
  debug: { 
    label: 'Logic debugger', 
    tag: 'Verification',
    desc: 'Formal verification mindset to identify race conditions, memory leaks, and complex logic flaws.',
    prompt: `### ROLE: Senior Systems Engineer & Formal Verification Specialist
### OBJECTIVE: Execute a deep-trace logical audit to find the "Impossible State" and non-obvious failure modes.
### VERIFICATION PROTOCOL:
1. **CONCURRENCY HAZARD SCAN**: Simulate high-concurrency execution. Check for non-atomic operations, race conditions, and signal-handling deadlocks.
2. **MEMORY & RESOURCE LINEAGE**: Audit the lifecycle of every high-cost object. Identify potential leaks in error-handling catch blocks and long-running loops.
3. **LOGIC BRANCH TRUTH TABLE**: Exhaustively verify all conditional branches. Find "Dead Code" paths and unhandled edge cases in complex "if/else" or "switch" matrices.
4. **STATE MACHINE AUDIT**: If applicable, map the system as a Finite State Machine (FSM). Identify illegal state transitions and "Black Hole" states.
### METHODOLOGY:
Apply "FMEA" (Failure Mode and Effects Analysis). For every identified flaw, provide:
- **ROOT CAUSE**: The underlying architectural or logical reason.
- **EXPLOSION RADIUS**: Cascading effects of this bug.
- **MITIGATION**: A robust, production-ready fix.`
  },
  explain: { 
    label: 'System mentor', 
    tag: 'Knowledge map',
    desc: 'Constructs a high-resolution mental model and multi-layered documentation of the system.',
    prompt: `### ROLE: Principal Technical Lead & "Code Soul" Documentarian
### OBJECTIVE: Decrypt the "Mental Model" of this system for a Senior Engineer onboarding.
### KNOWLEDGE MAPPING:
1. **DATA GENESIS & DESTRUCTION**: Trace the lifecycle of core data structures from ingestion/creation to persistence/deletion.
2. **"FIRST PRINCIPLES" RATIONALE**: Explain the "Why" behind the "How". What trade-offs were made regarding latency vs consistency?
3. **HOT PATHS & BOTTLENECKS**: Locate the critical 20% of code that handles 80% of the complexity or performance impact.
4. **MODULE TAXONOMY**: Provide a hierarchical map of responsibilities. Clear the "Fog of War" around naming conventions and folder structures.
5. **ENTRY POINT SEQUENCE**: Detail the boot sequence and main loops. How does the system "wake up" and "listen"?
### GOAL: Achieve "High-Resolution Understanding". The reader must be able to predict the system's behavior without running the code.`
  },
  security: { 
    label: 'Security review', 
    tag: 'Threat model',
    desc: 'Zero-trust audit focusing on OWASP, threat modeling, and defensive engineering.',
    prompt: `### ROLE: Chief Information Security Officer (CISO) & Red Team Lead
### OBJECTIVE: Perform a "Zero-Trust" offensive audit and defensive hardening plan.
### ATTACK SURFACE ANALYSIS:
1. **OWASP + STRIDE AUDIT**: Perform an exhaustive check for Spoofing, Tampering, Repudiation, Information Disclosure, DoS, and Elevation of Privilege.
2. **CRYPTO & SECRETS HYGIENE**: Verify entropy of salts, strength of hashing, and absolute absence of hardcoded credentials/tokens.
3. **INPUT SANITIZATION PIPELINE**: Audit the boundaries between untrusted input and internal sinks (DBs, APIs, Shells).
4. **AUTHZ & AUTHN INTEGRITY**: Stress-test the session management and RBAC (Role-Based Access Control) implementation.
5. **DEPENDENCY POISONING**: Identify risky 3rd party packages or supply-chain vulnerabilities.
### OUTPUT:
Provide a "Prioritized Vulnerability Stack". Rank by "Exploitability" vs "Business Impact". Provide "Secure-by-Design" code remediations.`
  },
  custom: { 
    label: 'Custom instructions', 
    tag: 'User defined',
    desc: 'Bypass standard protocols and inject your own specialized system-level meta-instructions.',
    prompt: '' 
  },
};

const FORMATS: { id: OutputFormat, label: string, sub: string }[] = [
  { id: 'markdown', label: 'Markdown', sub: 'Standard for ChatGPT' },
  { id: 'xml', label: 'XML Structure', sub: 'Best for Claude 3.5' },
  { id: 'plain', label: 'Raw Text', sub: 'Maximum token density' },
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
  const [showFullPrompt, setShowFullPrompt] = useState(false);
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
    // Reset error state before starting new fetch
    setProcessState({ ...processState, status: 'fetching_tree', error: null, currentFile: 'Analyzing repository...' });
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
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-200 flex flex-col items-center py-8 md:py-24 px-4 relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[60vw] h-[60vw] bg-indigo-600/5 rounded-full blur-[140px] opacity-30"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="w-full max-w-4xl space-y-16 relative z-10">
        <Header />

        <div className="bg-[#0d0d10]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 sm:p-12 md:p-20 shadow-[0_40px_120px_rgba(0,0,0,0.8)] relative group/container">
          {processState.status === 'completed' && processState.result ? (
            <ResultCard stats={{ files: processState.processedFiles, size: processState.resultSize, tokenCount: processState.tokenCount, content: processState.result }} onReset={reset} format={outputFormat} />
          ) : processState.status === 'selecting' ? (
            <FileTree files={processState.tree} onConfirm={handleMergeSelection} onCancel={reset} />
          ) : (
            <form onSubmit={handleFetchTree} className="space-y-20">
              {processState.status === 'error' && processState.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 mb-8 animate-in slide-in-from-top-4 fade-in">
                   <div className="p-2 bg-red-500/20 rounded-full shrink-0 h-fit">
                     <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                   </div>
                   <div>
                     <h4 className="text-red-400 font-bold uppercase tracking-wider text-xs mb-1">Authorization Failed</h4>
                     <p className="text-red-200/80 text-sm leading-relaxed">{processState.error}</p>
                     
                     {processState.error.includes('403') && (
                       <p className="text-red-300/60 text-xs mt-2 font-mono">Tip: API rate limit exceeded. Add a personal access token to continue.</p>
                     )}

                     {processState.error.includes('404') && token && (
                        <a 
                          href="https://github.com/settings/tokens/new?scopes=repo&description=RepoContext+Fix" 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wide border border-red-500/30"
                        >
                          Create token with "Repo" scope
                          <svg className="w-3 h-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                     )}
                   </div>
                </div>
              )}

              {/* Section 01: Source */}
              <section className="relative">
                {/* Fixed positioning for number - moved right (-left-6 instead of -left-24) to be near the dash */}
                <div className="absolute -left-6 -top-2 text-6xl font-black text-white/[0.04] select-none pointer-events-none hidden md:block">01</div>
                <div className="flex flex-col gap-8 md:pl-16 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-indigo-500/50"></div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Repository Source</h3>
                  </div>
                  <div className="space-y-6">
                    <Input label="GitHub URL" placeholder="https://github.com/owner/repository" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                       <Input label="Branch / Reference" placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
                       <div className="relative group/token">
                          <div className="absolute -top-6 right-1">
                            <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                              Generate token
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          </div>
                          <Input 
                            label="Personal Access Token" 
                            type="password" 
                            placeholder="ghp_xxxxxxxxxxxx" 
                            value={token} 
                            onChange={(e) => setToken(e.target.value)} 
                            helperText="Required for private repos. Must have 'repo' scope."
                          />
                       </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 02: Analysis */}
              <section className="relative">
                <div className="absolute -left-6 -top-2 text-6xl font-black text-white/[0.04] select-none pointer-events-none hidden md:block">02</div>
                <div className="flex flex-col gap-8 md:pl-16 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-indigo-500/50"></div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Analysis strategy</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(Object.keys(STRATEGY_DETAILS) as AIStrategy[]).map((id) => (
                      <button
                        key={id} type="button" onClick={() => { setAiStrategy(id); setShowFullPrompt(false); }}
                        className={`group/btn flex flex-col p-6 rounded-2xl border transition-all duration-500 text-left ${aiStrategy === id ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                      >
                        <span className={`text-sm font-bold transition-colors ${aiStrategy === id ? 'text-white' : 'text-zinc-400 group-hover/btn:text-zinc-200'}`}>
                          {STRATEGY_DETAILS[id].label}
                        </span>
                        <span className={`text-[10px] mt-1.5 font-medium px-2 py-0.5 rounded-full w-fit ${aiStrategy === id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-zinc-500'}`}>
                          {STRATEGY_DETAILS[id].tag}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 animate-in fade-in duration-700">
                    <p className="text-sm text-zinc-400 leading-relaxed italic font-light">
                      &ldquo;{STRATEGY_DETAILS[aiStrategy].desc}&rdquo;
                    </p>
                    {aiStrategy !== 'none' && aiStrategy !== 'custom' && (
                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                        <button 
                          type="button" 
                          onClick={() => setShowFullPrompt(!showFullPrompt)}
                          className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-2 tracking-[0.1em]"
                        >
                          {showFullPrompt ? 'Hide detailed instructions' : 'View detailed meta-prompt'}
                          <svg className={`w-3 h-3 transition-transform ${showFullPrompt ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showFullPrompt && (
                          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 animate-in zoom-in-95 duration-300">
                             <pre className="text-[11px] font-mono text-indigo-300/60 leading-relaxed whitespace-pre-wrap italic">
                               {STRATEGY_DETAILS[aiStrategy].prompt}
                             </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {aiStrategy === 'custom' && (
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 h-40 resize-none transition-all"
                      placeholder="Specify your custom AI role and context requirements here..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  )}
                </div>
              </section>

              {/* Section 03: Export */}
              <section className="relative">
                <div className="absolute -left-6 -top-2 text-6xl font-black text-white/[0.04] select-none pointer-events-none hidden md:block">03</div>
                <div className="flex flex-col gap-8 md:pl-16 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-indigo-500/50"></div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Export settings</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {FORMATS.map(f => (
                      <button
                        key={f.id} type="button" onClick={() => setOutputFormat(f.id)}
                        className={`flex flex-col p-6 rounded-2xl border transition-all text-left ${outputFormat === f.id ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                      >
                        <span className={`text-sm font-bold ${outputFormat === f.id ? 'text-white' : 'text-zinc-400'}`}>{f.label}</span>
                        <span className={`text-[10px] mt-1 font-medium ${outputFormat === f.id ? 'text-indigo-400/80' : 'text-zinc-600'}`}>{f.sub}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setStripComments(!stripComments)}
                      className={`p-6 rounded-2xl border transition-all text-left flex justify-between items-center group ${stripComments ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-300">Clean source</span>
                        <span className="text-[10px] text-zinc-500">Remove comments and docs to reduce noise.</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${stripComments ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-800'}`}></div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setMinimalist(!minimalist)}
                      className={`p-6 rounded-2xl border transition-all text-left flex justify-between items-center group ${minimalist ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-300">Compact headers</span>
                        <span className="text-[10px] text-zinc-500">Minimalist metadata to maximize tokens.</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${minimalist ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-800'}`}></div>
                    </button>
                  </div>
                </div>
              </section>

              <div className="pt-12 space-y-8">
                <Button type="submit" className="w-full h-20 text-lg uppercase tracking-[0.3em] font-black" isLoading={['fetching_tree', 'downloading'].includes(processState.status)}>
                  Initialize Scan
                </Button>
                {processState.status === 'idle' && <History onSelect={(repo) => setRepoUrl(`https://github.com/${repo}`)} />}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
