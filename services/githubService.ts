
import { GitHubTreeItem, OutputFormat, AIStrategy } from '../types';
import { IGNORED_DIRECTORIES, IGNORED_EXTENSIONS, CONCURRENCY_LIMIT } from '../constants';

const BASE_URL = 'https://api.github.com';

const PROMPTS: Record<AIStrategy, string> = {
  none: "",
  refactor: `### ROLE: Principal Systems Architect & Software Strategist
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
- Provide "Gold Standard" code examples for the suggested target state.`,
  debug: `### ROLE: Senior Systems Engineer & Formal Verification Specialist
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
- **MITIGATION**: A robust, production-ready fix.`,
  explain: `### ROLE: Principal Technical Lead & "Code Soul" Documentarian
### OBJECTIVE: Decrypt the "Mental Model" of this system for a Senior Engineer onboarding.
### KNOWLEDGE MAPPING:
1. **DATA GENESIS & DESTRUCTION**: Trace the lifecycle of core data structures from ingestion/creation to persistence/deletion.
2. **"FIRST PRINCIPLES" RATIONALE**: Explain the "Why" behind the "How". What trade-offs were made regarding latency vs consistency?
3. **HOT PATHS & BOTTLENECKS**: Locate the critical 20% of code that handles 80% of the complexity or performance impact.
4. **MODULE TAXONOMY**: Provide a hierarchical map of responsibilities. Clear the "Fog of War" around naming conventions and folder structures.
5. **ENTRY POINT SEQUENCE**: Detail the boot sequence and main loops. How does the system "wake up" and "listen"?
### GOAL: Achieve "High-Resolution Understanding". The reader must be able to predict the system's behavior without running the code.`,
  security: `### ROLE: Chief Information Security Officer (CISO) & Red Team Lead
### OBJECTIVE: Perform a "Zero-Trust" offensive audit and defensive hardening plan.
### ATTACK SURFACE ANALYSIS:
1. **OWASP + STRIDE AUDIT**: Perform an exhaustive check for Spoofing, Tampering, Repudiation, Information Disclosure, DoS, and Elevation of Privilege.
2. **CRYPTO & SECRETS HYGIENE**: Verify entropy of salts, strength of hashing, and absolute absence of hardcoded credentials/tokens.
3. **INPUT SANITIZATION PIPELINE**: Audit the boundaries between untrusted input and internal sinks (DBs, APIs, Shells).
4. **AUTHZ & AUTHN INTEGRITY**: Stress-test the session management and RBAC (Role-Based Access Control) implementation.
5. **DEPENDENCY POISONING**: Identify risky 3rd party packages or supply-chain vulnerabilities.
### OUTPUT:
Provide a "Prioritized Vulnerability Stack". Rank by "Exploitability" vs "Business Impact". Provide "Secure-by-Design" code remediations.`,
  custom: "" 
};

export class GitHubService {
  private token: string | null = null;
  
  constructor(token?: string) { 
    this.token = token?.trim() || null; 
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    return headers;
  }

  async getRepoDetails(owner: string, repo: string) {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers: this.getHeaders() });
    
    if (!response.ok) {
        if (response.status === 404) {
            if (this.token) {
               throw new Error(`Access Denied (404). Either the URL is invalid, or your Token is missing the 'repo' scope.`);
            } else {
               throw new Error(`Repository not found (404). If this is a private repo, you MUST provide a Token.`);
            }
        }
        throw new Error(`GitHub API Error: ${response.status}`);
    }
    return response.json();
  }

  async getRepoTree(owner: string, repo: string, branch: string): Promise<GitHubTreeItem[]> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch file tree structure.');
    const data = await response.json();
    return data.tree;
  }

  async getBlob(owner: string, repo: string, fileSha: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/blobs/${fileSha}`, { headers: this.getHeaders() });
    const data = await response.json();
    return this.decodeBase64(data.content);
  }

  private decodeBase64(str: string): string {
    try {
      return decodeURIComponent(atob(str.replace(/\s/g, '')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch { return "[Binary Content or Encoding Error]"; }
  }

  isIgnored(path: string, customIgnores: string[] = []): boolean {
    const parts = path.split('/');
    for (const part of parts) if (IGNORED_DIRECTORIES.has(part)) return true;
    const ext = parts[parts.length - 1].split('.').pop()?.toLowerCase();
    if (ext && IGNORED_EXTENSIONS.has(ext)) return true;
    for (const pattern of customIgnores) if (pattern && path.includes(pattern)) return true;
    return false;
  }
}

/**
 * Generates a visual tree structure string from an array of file paths.
 */
const generateTreeText = (paths: string[]): string => {
  const root: any = {};
  paths.forEach(path => {
    const parts = path.split('/');
    let current = root;
    parts.forEach(part => {
      if (!current[part]) current[part] = {};
      current = current[part];
    });
  });

  let output = "";
  const render = (node: any, indent = "") => {
    const keys = Object.keys(node).sort((a, b) => {
      const aHasChildren = Object.keys(node[a]).length > 0;
      const bHasChildren = Object.keys(node[b]).length > 0;
      if (aHasChildren && !bHasChildren) return -1;
      if (!aHasChildren && bHasChildren) return 1;
      return a.localeCompare(b);
    });

    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const connector = isLast ? "└── " : "├── ";
      output += `${indent}${connector}${key}\n`;
      render(node[key], indent + (isLast ? "    " : "│   "));
    });
  };

  render(root);
  return output;
};

const cleanCode = (code: string): string => {
  let cleaned = code.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');
  return cleaned.trim();
};

const formatFileContent = (path: string, content: string, format: OutputFormat): string => {
  const ext = path.split('.').pop() || '';
  switch (format) {
    case 'markdown': return `\n## File: ${path}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
    case 'xml': return `\n<file path="${path}">\n<![CDATA[\n${content}\n]]>\n</file>\n`;
    default: return `\n===== FILE: ${path} =====\n${content}\n`;
  }
};

export const fetchRepoStructure = async ({ repoUrl, branch, token, maxFileSizeKB, customIgnores }: any) => {
  const cleanUrl = repoUrl.trim().replace(/^(https?:\/\/)?(www\.)?github\.com\//, '').replace(/\.git$/, '').split('/tree/')[0].split('/blob/')[0].replace(/\/$/, '');
  const parts = cleanUrl.split('/');
  if (parts.length < 2) throw new Error("Invalid GitHub URL format.");
  const owner = parts[0];
  const repo = parts[1];

  const service = new GitHubService(token);
  const repoInfo = await service.getRepoDetails(owner, repo);
  const targetBranch = branch || repoInfo.default_branch;
  const rawTree = await service.getRepoTree(owner, repo, targetBranch);
  
  const filteredTree = rawTree.filter(item => item.type === 'blob' && !service.isIgnored(item.path, customIgnores) && (!item.size || item.size < maxFileSizeKB * 1024));
  return { tree: filteredTree, branch: targetBranch, repoName: `${owner}/${repo}` };
};

export const generateMergedContent = async ({ files, repoName, branch, token, format, strategy, customPrompt, stripComments, minimalist, onProgress }: any) => {
  const [owner, repo] = repoName.split('/');
  const service = new GitHubService(token);
  let mergedContent = "";

  // 1. Handle Prompt
  if (strategy !== 'none') {
    const promptText = strategy === 'custom' ? customPrompt : PROMPTS[strategy as AIStrategy];
    if (promptText) {
      mergedContent += `[SYSTEM_INSTRUCTION_START]\n${promptText}\n[SYSTEM_INSTRUCTION_END]\n\n================================\n\n`;
    }
  }

  // 2. Technical Header
  if (!minimalist) {
    mergedContent += `REPOSITORY_CONTEXT_DUMP\nIDENTIFIER: ${repoName}\nREF: ${branch}\nENTITY_COUNT: ${files.length}\n\n`;
  }

  // 3. Repository Structure (File Tree)
  mergedContent += `STRUCTURE_MAP:\n${generateTreeText(files.map(f => f.path))}\n`;
  mergedContent += `================================\n\n`;

  // 4. File Contents
  let processedCount = 0;
  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
    const results = await Promise.all(chunk.map(async (file) => {
      onProgress(processedCount, files.length, file.path);
      try {
        let content = await service.getBlob(owner, repo, file.sha);
        if (stripComments) content = cleanCode(content);
        return { path: file.path, content };
      } catch { return null; }
    }));
    for (const res of results) if (res) {
      mergedContent += formatFileContent(res.path, res.content, format);
      processedCount++;
    }
  }

  return { content: mergedContent, fileCount: processedCount, totalSize: mergedContent.length, tokenCount: Math.ceil(mergedContent.length / 4) };
};
