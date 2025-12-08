import { GitHubRepo, GitHubTreeResponse, GitHubTreeItem, FileContent, FileType, OutputFormat } from '../types';
import { IGNORED_DIRECTORIES, IGNORED_EXTENSIONS, CONCURRENCY_LIMIT } from '../constants';

const BASE_URL = 'https://api.github.com';

export class GitHubService {
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || null;
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

  async getRepoDetails(owner: string, repo: string): Promise<GitHubRepo> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('Repository not found. Check URL or visibility.');
      if (response.status === 401) throw new Error('Invalid API Token or Unauthorized.');
      if (response.status === 403) throw new Error('API Rate limit exceeded. Please use a Token.');
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getRepoTree(owner: string, repo: string, branch: string): Promise<GitHubTreeItem[]> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error(`Branch '${branch}' not found.`);
      throw new Error('Failed to fetch file tree.');
    }

    const data: GitHubTreeResponse = await response.json();
    
    if (data.truncated) {
      console.warn('Tree was truncated by GitHub API. Some files may be missing.');
    }

    return data.tree;
  }

  async getBlob(owner: string, repo: string, fileSha: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/blobs/${fileSha}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file content.');
    }

    const data = await response.json();
    // GitHub blobs are base64 encoded
    return this.decodeBase64(data.content);
  }

  // Robust Base64 decoding handles Unicode characters correctly
  private decodeBase64(str: string): string {
    try {
      return decodeURIComponent(
        atob(str.replace(/\s/g, ''))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      console.error("Decoding failed", e);
      return "[Error: Binary data or Encoding issue]";
    }
  }

  isIgnored(path: string, customIgnores: string[] = []): boolean {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    
    // Check directories
    for (const part of parts) {
      if (IGNORED_DIRECTORIES.has(part)) return true;
    }

    // Check extension
    if (filename.startsWith('.')) return false; // Config files often have no extension but start with dot
    if (!filename.includes('.')) return false; // No extension (like Makefiles), assume text

    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && IGNORED_EXTENSIONS.has(ext)) return true;

    // Custom ignore patterns (simple includes check)
    if (customIgnores.length > 0) {
      for (const pattern of customIgnores) {
        if (pattern.trim() && path.includes(pattern.trim())) return true;
      }
    }

    return false;
  }
}

// Simple approximation: ~4 chars per token for English text/code
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

const formatFileContent = (path: string, content: string, format: OutputFormat): string => {
  const ext = path.split('.').pop() || '';
  
  switch (format) {
    case 'markdown':
      return `\n# File: ${path}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
    case 'xml':
      return `\n<file path="${path}">\n<![CDATA[\n${content}\n]]>\n</file>\n`;
    case 'plain':
    default:
      return `\n===== ${path} =====\n${content}\n`;
  }
};

interface MergeOptions {
  repoUrl: string;
  branch?: string;
  token: string;
  format: OutputFormat;
  maxFileSizeKB: number;
  customIgnores: string[];
  onProgress: (processed: number, total: number, currentFile: string) => void;
}

export const mergeRepo = async ({
  repoUrl, 
  branch,
  token, 
  format,
  maxFileSizeKB,
  customIgnores,
  onProgress
}: MergeOptions): Promise<{ content: string; fileCount: number; totalSize: number; tokenCount: number }> => {
  
  const cleanUrl = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');
  const [owner, repo] = cleanUrl.split('/');

  if (!owner || !repo) throw new Error("Invalid Repository Format. Use 'owner/repo'");

  const service = new GitHubService(token);
  
  // 1. Get Details (to find default branch if not specified)
  const repoInfo = await service.getRepoDetails(owner, repo);
  const targetBranch = branch || repoInfo.default_branch;
  
  // 2. Get Tree
  const tree = await service.getRepoTree(owner, repo, targetBranch);
  
  // 3. Filter
  const maxBytes = maxFileSizeKB * 1024;
  const blobs = tree.filter(item => {
    if (item.type !== 'blob') return false;
    if (service.isIgnored(item.path, customIgnores)) return false;
    // Check size if available (GitHub API usually returns size in tree)
    if (item.size && item.size > maxBytes) return false;
    return true;
  });
  
  let mergedContent = '';
  // Add header with metadata
  if (format === 'markdown') {
    mergedContent += `# Repository: ${owner}/${repo}\n# Branch: ${targetBranch}\n# Files: ${blobs.length}\n\n`;
  } else if (format === 'xml') {
    mergedContent += `<repository name="${owner}/${repo}" branch="${targetBranch}" file_count="${blobs.length}">\n`;
  } else {
    mergedContent += `Repository: ${owner}/${repo}\nBranch: ${targetBranch}\nFiles: ${blobs.length}\n\n`;
  }

  let processedCount = 0;
  let totalSize = 0;

  // 4. Batch Processing
  for (let i = 0; i < blobs.length; i += CONCURRENCY_LIMIT) {
    const chunk = blobs.slice(i, i + CONCURRENCY_LIMIT);
    
    const results = await Promise.all(chunk.map(async (file) => {
      onProgress(processedCount, blobs.length, file.path);
      try {
        const content = await service.getBlob(owner, repo, file.sha);
        
        if (content.includes('\0')) return null;

        return {
          path: file.path,
          content: content
        };
      } catch (err) {
        console.warn(`Failed to fetch ${file.path}`, err);
        return {
          path: file.path,
          content: `[Error fetching file: ${err}]`
        };
      }
    }));

    // Append to result
    for (const res of results) {
      if (res) {
        mergedContent += formatFileContent(res.path, res.content, format);
        processedCount++;
      }
    }
  }

  if (format === 'xml') {
    mergedContent += `\n</repository>`;
  }

  totalSize = mergedContent.length;
  const tokenCount = estimateTokens(mergedContent);

  return { content: mergedContent, fileCount: processedCount, totalSize, tokenCount };
};