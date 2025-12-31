
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
    <div className="w-full mt-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-wrap gap-2">
        {history.map((repo) => (
          <button
            key={repo}
            type="button"
            onClick={() => onSelect(repo)}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 border border-zinc-800 px-2 py-1 transition-colors uppercase"
          >
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
