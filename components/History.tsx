import React, { useEffect, useState } from 'react';

interface HistoryProps {
  onSelect: (repo: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onSelect }) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('repo_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse history", e);
    }
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="w-full mt-4 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recent Repos</h3>
      <div className="flex flex-wrap gap-2">
        {history.map((repo) => (
          <button
            key={repo}
            onClick={() => onSelect(repo)}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors border border-zinc-700 flex items-center gap-1.5"
          >
            <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {repo}
          </button>
        ))}
      </div>
    </div>
  );
};

export const addToHistory = (repo: string) => {
  try {
    const cleanRepo = repo.replace('https://github.com/', '').replace(/\/$/, '');
    const stored = localStorage.getItem('repo_history');
    let history: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if exists (to move to top)
    history = history.filter(h => h !== cleanRepo);
    
    // Add to beginning
    history.unshift(cleanRepo);
    
    // Keep max 5
    if (history.length > 5) history.pop();
    
    localStorage.setItem('repo_history', JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};