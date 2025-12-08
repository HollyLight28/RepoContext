import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="mb-10 text-center">
      <div className="inline-flex items-center justify-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
          RepoContext
        </h1>
      </div>
      <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
        Turn any GitHub repository into a single text file.<br/>
        The ultimate tool for feeding code to ChatGPT, Claude, or Gemini.
      </p>
    </header>
  );
};