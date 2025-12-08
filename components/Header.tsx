import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="mb-10 text-center animate-in slide-in-from-top-4 duration-500 relative z-10">
      <div className="inline-flex items-center justify-center gap-5 mb-6 group">
        {!logoError ? (
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img 
              src="assets/logo.png" 
              alt="RepoContext Logo" 
              className="relative h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 transition-transform duration-300"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          /* Custom Brand Fallback: Number '1' with Git Branching */
          <div className="w-20 h-20 relative hover:scale-105 transition-transform duration-300">
             <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full"></div>
             <svg className="w-full h-full drop-shadow-lg relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect width="100" height="100" rx="20" fill="url(#paint0_linear)" />
               <path d="M65 25V75" stroke="white" strokeWidth="8" strokeLinecap="round" />
               <path d="M45 25L45 45C45 55 55 55 65 55" stroke="white" strokeWidth="8" strokeLinecap="round" />
               <circle cx="45" cy="25" r="7" fill="white" />
               <circle cx="65" cy="25" r="7" fill="white" />
               <circle cx="65" cy="75" r="7" fill="white" />
               <defs>
                 <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                   <stop stopColor="#4F46E5" />
                   <stop offset="1" stopColor="#7C3AED" />
                 </linearGradient>
               </defs>
             </svg>
          </div>
        )}
        <div className="flex flex-col items-start">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-zinc-400 tracking-tight drop-shadow-sm">
            RepoContext
          </h1>
          <span className="text-xs font-mono text-indigo-400 tracking-[0.2em] uppercase ml-1 mt-1 opacity-80">Developer Edition</span>
        </div>
      </div>
      <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed font-light">
        Turn any GitHub repository into a single <span className="text-indigo-400 font-semibold glow-text">context-rich</span> file.<br/>
        Optimized for ChatGPT, Claude, and Gemini.
      </p>
      <style>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
        }
      `}</style>
    </header>
  );
};