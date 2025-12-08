export const IGNORED_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp', 'bmp', 'tiff',
  // Fonts
  'eot', 'ttf', 'woff', 'woff2', 'otf',
  // Archives
  'zip', 'tar', 'gz', 'rar', '7z',
  // Video/Audio
  'mp4', 'mp3', 'wav', 'ogg', 'webm', 'mov', 'avi',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Binaries/System
  'exe', 'dll', 'so', 'dylib', 'bin', 'dat', 'db', 'sqlite', 'ds_store',
  // Lock files (often too large/noisy for LLM context)
  'lock', 'tfstate'
]);

export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.github', // Optional: sometimes useful, but often just config
  '.idea',
  '.vscode',
  'dist',
  'build',
  'coverage',
  'vendor', // PHP/Go
  '__pycache__',
  '.next',
  '.nuxt',
  'target', // Rust/Java
  'bin',
  'obj'
]);

export const DEFAULT_REPO = 'facebook/react';

export const CONCURRENCY_LIMIT = 5; // GitHub API rate limit protection
