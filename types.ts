export interface GitHubRepo {
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  size: number;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

export type OutputFormat = 'plain' | 'markdown' | 'xml';

export interface ProcessState {
  status: 'idle' | 'fetching_tree' | 'selecting' | 'downloading' | 'merging' | 'completed' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  error: string | null;
  result: string | null;
  resultSize: number;
  tokenCount: number;
  tree: GitHubTreeItem[];
}

export enum FileType {
  TEXT,
  BINARY,
  IGNORED
}