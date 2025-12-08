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
      if (response.status === 403) throw new Error('⚠️ GitHub Rate Limit Reached. Don\'t worry! GitHub limits anonymous use to 60 requests/hour. Just create a free Token using the link above and you\'ll get 5,000 requests.');
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
      if (response.status === 403) throw new Error('⚠️ GitHub Rate Limit Reached. Please add a Token to continue.');
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
      if (response.status === 403) throw new Error('Rate Limit Exceeded during download.');
      throw new Error('Failed to fetch file content.');
    }

    const data = await response.json();
    return this.decodeBase64(data.content);
  }

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
    
    for (const part of parts) {
      if (IGNORED_DIRECTORIES.has(part)) return true;
    }

    if (filename.startsWith('.')) return false;
    if (!filename.includes('.')) return false;

    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && IGNORED_EXTENSIONS.has(ext)) return true;

    if (customIgnores.length > 0) {
      for (const pattern of customIgnores) {
        if (pattern.trim() && path.includes(pattern.trim())) return true;
      }
    }

    return false;
  }
}

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

interface FetchTreeOptions {
  repoUrl: string;
  branch?: string;
  token: string;
  maxFileSizeKB: number;
  customIgnores: string[];
}

export const fetchRepoStructure = async ({
  repoUrl,
  branch,
  token,
  maxFileSizeKB,
  customIgnores
}: FetchTreeOptions): Promise<{ tree: GitHubTreeItem[], branch: string, repoName: string }> => {
  const cleanUrl = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');
  const [owner, repo] = cleanUrl.split('/');

  if (!owner || !repo) throw new Error("Invalid Repository Format. Use 'owner/repo'");

  const service = new GitHubService(token);
  
  const repoInfo = await service.getRepoDetails(owner, repo);
  const targetBranch = branch || repoInfo.default_branch;
  
  const rawTree = await service.getRepoTree(owner, repo, targetBranch);
  
  const maxBytes = maxFileSizeKB * 1024;
  const filteredTree = rawTree.filter(item => {
    if (item.type !== 'blob') return false;
    if (service.isIgnored(item.path, customIgnores)) return false;
    if (item.size && item.size > maxBytes) return false;
    return true;
  });

  return { tree: filteredTree, branch: targetBranch, repoName: `${owner}/${repo}` };
};

interface MergeOptions {
  files: GitHubTreeItem[];
  repoName: string;
  branch: string;
  token: string;
  format: OutputFormat;
  onProgress: (processed: number, total: number, currentFile: string) => void;
}

export const generateMergedContent = async ({
  files,
  repoName,
  branch,
  token,
  format,
  onProgress
}: MergeOptions): Promise<{ content: string; fileCount: number; totalSize: number; tokenCount: number }> => {
  
  const [owner, repo] = repoName.split('/');
  const service = new GitHubService(token);
  
  let mergedContent = '';
  
  if (format === 'markdown') {
    mergedContent += `# Repository: ${repoName}\n# Branch: ${branch}\n# Files: ${files.length}\n\n`;
  } else if (format === 'xml') {
    mergedContent += `<repository name="${repoName}" branch="${branch}" file_count="${files.length}">\n`;
  } else {
    mergedContent += `Repository: ${repoName}\nBranch: ${branch}\nFiles: ${files.length}\n\n`;
  }

  let processedCount = 0;

  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
    
    const results = await Promise.all(chunk.map(async (file) => {
      onProgress(processedCount, files.length, file.path);
      try {
        const content = await service.getBlob(owner, repo, file.sha);
        if (content.includes('\0')) return null;
        return { path: file.path, content: content };
      } catch (err) {
        console.warn(`Failed to fetch ${file.path}`, err);
        return { path: file.path, content: `[Error fetching file: ${err}]` };
      }
    }));

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

  const totalSize = mergedContent.length;
  const tokenCount = estimateTokens(mergedContent);

  return { content: mergedContent, fileCount: processedCount, totalSize, tokenCount };
};

export const mergeRepo = async (options: FetchTreeOptions & { format: OutputFormat, onProgress: any }) => {
  const { tree, branch, repoName } = await fetchRepoStructure(options);
  return generateMergedContent({
    files: tree,
    repoName,
    branch,
    token: options.token,
    format: options.format,
    onProgress: options.onProgress
  });
};