import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="mb-10 md:mb-16 text-center relative z-10 px-4 pt-4 md:pt-0 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center justify-center gap-6 group">
        <div className="relative">
          {/* Subtle glow behind logo */}
          <div className="absolute inset-0 bg-indigo-500/30 blur-[40px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          {!logoError ? (
            <img 
              src="assets/logo.png" 
              alt="RepoContext Logo" 
              className="relative h-20 md:h-32 w-auto object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-105 transition-transform duration-700"
              onError={() => setLogoError(true)}
            />
          ) : (
            /* Premium SVG Fallback: A stylized '1' integrated with Git branch nodes */
            <div className="w-20 h-20 md:w-28 md:h-28 relative hover:rotate-3 transition-transform duration-500">
               <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <rect width="100" height="100" rx="28" fill="url(#logo_grad)" />
                 <path d="M65 30V70" stroke="white" strokeWidth="6" strokeLinecap="round" />
                 <path d="M40 30L40 50C40 60 50 60 65 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
                 <circle cx="40" cy="30" r="7" fill="white" />
                 <circle cx="65" cy="30" r="7" fill="white" />
                 <circle cx="65" cy="70" r="7" fill="white" />
                 <defs>
                   <linearGradient id="logo_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                     <stop stopColor="#6366F1" />
                     <stop offset="1" stopColor="#A855F7" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center max-w-full">
          {/* Responsive title: starts small and scales up, ensuring it fits on 320px screens */}
          <h1 className="text-[2.5rem] leading-[0.9] sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Repo</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-violet-400">Context</span>
          </h1>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-indigo-500/50"></div>
            <span className="text-[9px] md:text-xs font-mono text-indigo-400 tracking-[0.4em] uppercase font-bold">Pro Context Generator</span>
            <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-indigo-500/50"></div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-zinc-400 text-sm md:text-xl max-w-xl mx-auto leading-relaxed font-light px-4 opacity-80">
        Turn any GitHub repository into a single <span className="text-white font-medium border-b border-indigo-500/40">context-rich</span> file. Optimized for ChatGPT, Claude & Gemini.
      </p>
    </header>
  );
};