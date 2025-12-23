import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="mb-8 md:mb-12 text-center animate-in slide-in-from-top-4 duration-500 relative z-10 px-2">
      <div className="flex flex-col items-center justify-center gap-4 mb-6 group">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          {!logoError ? (
            <img 
              src="assets/logo.png" 
              alt="RepoContext Logo" 
              className="relative h-20 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-110 transition-transform duration-500 ease-out"
              onError={() => setLogoError(true)}
            />
          ) : (
            /* High-Fidelity SVG Fallback */
            <div className="w-20 h-20 md:w-24 md:h-24 relative hover:scale-110 transition-transform duration-500 ease-out">
               <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full"></div>
               <svg className="w-full h-full drop-shadow-xl relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <rect width="100" height="100" rx="24" fill="url(#brand_grad)" />
                 <path d="M62 28V72" stroke="white" strokeWidth="7" strokeLinecap="round" />
                 <path d="M42 28L42 48C42 58 52 58 62 58" stroke="white" strokeWidth="7" strokeLinecap="round" />
                 <circle cx="42" cy="28" r="6" fill="white" />
                 <circle cx="62" cy="28" r="6" fill="white" />
                 <circle cx="62" cy="72" r="6" fill="white" />
                 <defs>
                   <linearGradient id="brand_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                     <stop stopColor="#6366F1" />
                     <stop offset="1" stopColor="#A855F7" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          {/* Responsive title: text-4xl on mobile, text-6xl on desktop */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-zinc-500 tracking-tighter drop-shadow-sm leading-tight">
            RepoContext
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-px w-4 bg-indigo-500/50"></span>
            <span className="text-[10px] md:text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase opacity-90">Developer Edition</span>
            <span className="h-px w-4 bg-indigo-500/50"></span>
          </div>
        </div>
      </div>
      
      <p className="text-zinc-400 text-sm md:text-lg max-w-lg mx-auto leading-relaxed font-light px-4">
        Turn any GitHub repository into a single <span className="text-indigo-400 font-semibold glow-text">context-rich</span> file. Optimized for top-tier LLMs.
      </p>
      
      <style>{`
        .glow-text {
          text-shadow: 0 0 15px rgba(129, 140, 248, 0.4);
        }
      `}</style>
    </header>
  );
};