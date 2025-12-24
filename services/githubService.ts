
import { GitHubTreeItem, OutputFormat, AIStrategy } from '../types';
import { IGNORED_DIRECTORIES, IGNORED_EXTENSIONS, CONCURRENCY_LIMIT } from '../constants';

const BASE_URL = 'https://api.github.com';

const PROMPTS: Record<AIStrategy, string> = {
  none: "",
  refactor: "### ROLE: Principal Software Architect & Systems Designer\n### CONTEXT: You are performing a high-stakes architectural audit of a mission-critical codebase. \n### TASK: \n1. ANALYZE the global dependency graph and identify tightly coupled modules.\n2. IDENTIFY violations of SOLID, DRY, and KISS principles.\n3. PROPOSE a migration strategy for technical debt reduction.\n4. SUGGEST performance optimizations regarding time/space complexity.\n### CONSTRAINTS: \n- Prioritize maintainability over clever \"one-liners\".\n- Maintain backward compatibility where applicable.\n- Use Chain-of-Thought reasoning before suggesting specific code changes.",
  debug: "### ROLE: Senior Systems Engineer & Formal Verification Specialist\n### CONTEXT: You are scanning a codebase for non-obvious failure modes in a high-concurrency environment.\n### TASK:\n1. EXECUTE a mental execution trace to find potential race conditions or deadlocks.\n2. AUDIT memory management and resource cleanup paths.\n3. SCAN for logical edge cases in complex conditional branches.\n4. IDENTIFY potential regressions in the current implementation.\n### METHODOLOGY:\nUse a \"Failure Mode and Effects Analysis\" (FMEA) approach. For every identified risk, provide an impact score and a robust mitigation strategy.",
  explain: "### ROLE: Technical Lead & System Documentarian\n### CONTEXT: You are onboarding a world-class senior engineer who needs to understand the \"soul\" of the project in 5 minutes.\n### TASK:\n1. MAP the lifecycle of a primary data object through the system.\n2. EXPLAIN the core design philosophy and why these specific libraries/patterns were chosen.\n3. DESCRIBE the entry points and critical execution paths.\n4. PROVIDE a high-level conceptual overview followed by granular module responsibilities.\n### GOAL: Maximize conceptual density while maintaining zero ambiguity.",
  security: "### ROLE: Senior Offensive Security Researcher & Red Teamer\n### CONTEXT: You are performing a white-box security audit. Assume a zero-trust environment.\n### TASK:\n1. AUDIT for OWASP Top 10 vulnerabilities (Injection, Broken Access Control, etc.).\n2. IDENTIFY insecure handling of PII or sensitive metadata.\n3. EVALUATE the attack surface of external API integrations and data ingestion points.\n4. SCAN for hardcoded secrets, weak cryptographic primitives, or insecure defaults.\n### OUTPUT:\nProvide a prioritized Vulnerability Report with \"Exploitability\" and \"Impact\" metrics for each finding, accompanied by secure-by-design remediation.",
  custom: "" 
};

export class GitHubService {
  private token: string | null = null;
  constructor(token?: string) { this.token = token || null; }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
    if (this.token) headers['Authorization'] = `token ${this.token}`;
    return headers;
  }

  async getRepoDetails(owner: string, repo: string) {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error(`Repo error: ${response.status}`);
    return response.json();
  }

  async getRepoTree(owner: string, repo: string, branch: string): Promise<GitHubTreeItem[]> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch tree');
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
    const filename = parts[parts.length - 1];
    for (const part of parts) if (IGNORED_DIRECTORIES.has(part)) return true;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && IGNORED_EXTENSIONS.has(ext)) return true;
    for (const pattern of customIgnores) if (pattern && path.includes(pattern)) return true;
    return false;
  }
}

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
  const cleanUrl = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');
  const [owner, repo] = cleanUrl.split('/');
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

  // 1. Handle Prompt (Elite Meta-Prompts)
  if (strategy !== 'none') {
    const promptText = strategy === 'custom' ? customPrompt : PROMPTS[strategy as AIStrategy];
    if (promptText) {
      mergedContent += `[SYSTEM_INSTRUCTION_START]\n${promptText}\n[SYSTEM_INSTRUCTION_END]\n\n================================\n\n`;
    }
  }

  // 2. Technical Header (Unless Minimalist)
  if (!minimalist) {
    mergedContent += `REPOSITORY_CONTEXT_DUMP\nIDENTIFIER: ${repoName}\nREF: ${branch}\nENTITY_COUNT: ${files.length}\n\n`;
  }

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
