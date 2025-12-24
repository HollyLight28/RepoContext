
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
    label: 'VANILLA', 
    tag: 'RAW_SOURCE',
    desc: 'No AI instrumentation. Provides pure, unmodified source code context for manual processing.',
    prompt: '' 
  },
  refactor: { 
    label: 'ARCHITECT', 
    tag: 'STRUCTURAL_AUDIT',
    desc: 'Deep structural analysis and refactoring using SOLID, DRY, and specialized design patterns.',
    prompt: '### ROLE: Principal Software Architect & Systems Designer\n### CONTEXT: You are performing a high-stakes architectural audit of a mission-critical codebase. \n### TASK: \n1. ANALYZE the global dependency graph and identify tightly coupled modules.\n2. IDENTIFY violations of SOLID, DRY, and KISS principles.\n3. PROPOSE a migration strategy for technical debt reduction.\n4. SUGGEST performance optimizations regarding time/space complexity.\n### CONSTRAINTS: \n- Prioritize maintainability over clever "one-liners".\n- Maintain backward compatibility where applicable.\n- Use Chain-of-Thought reasoning before suggesting specific code changes.'
  },
  debug: { 
    label: 'BUG_HUNTER', 
    tag: 'VERIFICATION',
    desc: 'Formal verification mindset to identify race conditions, memory leaks, and logical edge cases.',
    prompt: '### ROLE: Senior Systems Engineer & Formal Verification Specialist\n### CONTEXT: You are scanning a codebase for non-obvious failure modes in a high-concurrency environment.\n### TASK:\n1. EXECUTE a mental execution trace to find potential race conditions or deadlocks.\n2. AUDIT memory management and resource cleanup paths.\n3. SCAN for logical edge cases in complex conditional branches.\n4. IDENTIFY potential regressions in the current implementation.\n### METHODOLOGY:\nUse a "Failure Mode and Effects Analysis" (FMEA) approach. For every identified risk, provide an impact score and a robust mitigation strategy.'
  },
  explain: { 
    label: 'MENTOR', 
    tag: 'KNOWLEDGE_MAP',
    desc: 'Constructs a comprehensive mental model and high-resolution documentation of the system.',
    prompt: '### ROLE: Technical Lead & System Documentarian\n### CONTEXT: You are onboarding a world-class senior engineer who needs to understand the "soul" of the project in 5 minutes.\n### TASK:\n1. MAP the lifecycle of a primary data object through the system.\n2. EXPLAIN the core design philosophy and why these specific libraries/patterns were chosen.\n3. DESCRIBE the entry points and critical execution paths.\n4. PROVIDE a high-level conceptual overview followed by granular module responsibilities.\n### GOAL: Maximize conceptual density while maintaining zero ambiguity.'
  },
  security: { 
    label: 'SECOPS', 
    tag: 'THREAT_MODEL',
    desc: 'Rigorous zero-trust security audit focusing on OWASP, data integrity, and exploit vectors.',
    prompt: '### ROLE: Senior Offensive Security Researcher & Red Teamer\n### CONTEXT: You are performing a white-box security audit. Assume a zero-trust environment.\n### TASK:\n1. AUDIT for OWASP Top 10 vulnerabilities (Injection, Broken Access Control, etc.).\n2. IDENTIFY insecure handling of PII or sensitive metadata.\n3. EVALUATE the attack surface of external API integrations and data ingestion points.\n4. SCAN for hardcoded secrets, weak cryptographic primitives, or insecure defaults.\n### OUTPUT:\nProvide a prioritized Vulnerability Report with "Exploitability" and "Impact" metrics for each finding, accompanied by secure-by-design remediation.'
  },
  custom: { 
    label: 'CUSTOM', 
    tag: 'USER_DEFINED',
    desc: 'Bypass standard protocols and inject your own specialized system-level meta-instructions.',
    prompt: '' 
  },
};

const FORMATS: { id: OutputFormat, label: string, sub: string }[] = [
  { id: 'markdown', label: 'MARKDOWN', sub: 'Optimized for Chat-based LLMs' },
  { id: 'xml', label: 'XML_TAGS', sub: 'Strict structure for Claude 3.5' },
  { id: 'plain', label: 'RAW_TEXT', sub: 'Max token density / No overhead' },
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
    setProcessState({ ...processState, status: 'fetching_tree', currentFile: 'Analyzing repository...' });
    try {
      const { tree, branch: fb, repoName } = await fetchRepoStructure({ repoUrl, branch, token, maxFileSizeKB: maxFileSize, customIgnores: customIgnores.split(',') });
      setFetchedRepoInfo({ name: repoName, branch: fb });
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
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col items-center py-6 md:py-20 px-4 relative overflow-x-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="w-full max-w-4xl space-y-12 relative z-10">
        <Header />

        <div className="bg-[#0d0d10]/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 shadow-[0_40px_120px_rgba(0,0,0,0.6)] relative overflow-hidden group/container">
          {processState.status === 'completed' && processState.result ? (
            <ResultCard stats={{ files: processState.processedFiles, size: processState.resultSize, tokenCount: processState.tokenCount, content: processState.result }} onReset={reset} format={outputFormat} />
          ) : processState.status === 'selecting' ? (
            <FileTree files={processState.tree} onConfirm={handleMergeSelection} onCancel={reset} />
          ) : (
            <form onSubmit={handleFetchTree} className="space-y-12">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-black text-indigo-400">01</span>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Target Environment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <Input label="Repository Link" placeholder="https://github.com/owner/repository" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} required />
                  </div>
                  <Input label="Git Branch" placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-black text-indigo-400">02</span>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Context Intelligence Strategy</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(STRATEGY_DETAILS) as AIStrategy[]).map((id) => (
                    <button
                      key={id} type="button" onClick={() => { setAiStrategy(id); setShowFullPrompt(false); }}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group/btn ${aiStrategy === id ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                         <div className={`w-1.5 h-1.5 rounded-full transition-all ${aiStrategy === id ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-zinc-700'}`}></div>
                         <span className={`text-[11px] font-black tracking-widest font-mono transition-colors ${aiStrategy === id ? 'text-indigo-300' : 'text-zinc-500 group-hover/btn:text-zinc-300'}`}>{STRATEGY_DETAILS[id].label}</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter opacity-60 ml-3.5">{STRATEGY_DETAILS[id].tag}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 animate-in fade-in slide-in-from-top-2 relative">
                   <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                     <span className="text-indigo-400 mr-2">›</span>{STRATEGY_DETAILS[aiStrategy].desc}
                   </p>
                   {aiStrategy !== 'none' && aiStrategy !== 'custom' && (
                     <div className="mt-5 pt-5 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setShowFullPrompt(!showFullPrompt)}
                          className="group flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors"
                        >
                          <span className={`w-4 h-px bg-zinc-800 transition-all group-hover:w-8 group-hover:bg-indigo-500`}></span>
                          {showFullPrompt ? 'CLOSE SYSTEM INSTRUCTION' : 'VIEW META-PROMPT ENGINEERING DETAIL'}
                        </button>
                        {showFullPrompt && (
                          <div className="mt-4 p-5 bg-black/60 rounded-xl border border-indigo-500/20 animate-in zoom-in-95 duration-300 shadow-inner">
                             <pre className="text-[10px] font-mono text-indigo-200/60 leading-relaxed whitespace-pre-wrap italic">
                               {STRATEGY_DETAILS[aiStrategy].prompt}
                             </pre>
                          </div>
                        )}
                     </div>
                   )}
                </div>

                {aiStrategy === 'custom' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                     <textarea
                       className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500/50 h-40 resize-none shadow-inner"
                       placeholder="[SYSTEM_INPUT_REQUIRED]: Define your specialized AI role and constraints here..."
                       value={customPrompt}
                       onChange={(e) => setCustomPrompt(e.target.value)}
                     />
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-black text-indigo-400">03</span>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Output Encoding & Tuning</h3>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {FORMATS.map(f => (
                        <button
                          key={f.id} type="button" onClick={() => setOutputFormat(f.id)}
                          className={`flex flex-col p-5 rounded-xl border transition-all text-left group ${outputFormat === f.id ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                        >
                          <span className={`text-[11px] font-black tracking-widest font-mono ${outputFormat === f.id ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{f.label}</span>
                          <span className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${outputFormat === f.id ? 'text-indigo-200/50' : 'text-zinc-600'}`}>{f.sub}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                   <div 
                     className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${stripComments ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                     onClick={() => setStripComments(!stripComments)}
                   >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">STRIP_COMMENTS</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${stripComments ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${stripComments ? 'left-4.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-600 uppercase font-bold leading-tight">Eliminate boilerplate noise to focus LLM reasoning on core logic.</p>
                   </div>

                   <div 
                     className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${minimalist ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                     onClick={() => setMinimalist(!minimalist)}
                   >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">COMPACT_MODE</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${minimalist ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${minimalist ? 'left-4.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-600 uppercase font-bold leading-tight">Remove metadata headers to maximize token-to-code ratio.</p>
                   </div>
                </div>
              </section>

              <div className="pt-10 space-y-6">
                <Button type="submit" className="w-full h-16 text-lg tracking-[0.2em] shadow-[0_20px_60px_rgba(79,70,229,0.2)]" isLoading={['fetching_tree', 'downloading'].includes(processState.status)}>
                  INITIALIZE REPO SCAN
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
