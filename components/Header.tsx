
import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="mb-16 md:mb-24 text-center relative z-10 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center justify-center gap-8 group">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
          
          {!logoError ? (
            <img 
              src="assets/logo.png" 
              alt="RepoContext Logo" 
              className="relative h-24 md:h-36 w-auto object-contain drop-shadow-2xl transition-transform duration-700"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 relative group-hover:scale-105 transition-transform duration-500">
               <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100" fill="none">
                 <rect width="100" height="100" rx="32" fill="url(#logo_grad)" />
                 <path d="M65 30V70" stroke="white" strokeWidth="6" strokeLinecap="round" />
                 <path d="M40 30L40 50C40 60 50 60 65 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
                 <circle cx="40" cy="30" r="7" fill="white" />
                 <circle cx="65" cy="30" r="7" fill="white" />
                 <circle cx="65" cy="70" r="7" fill="white" />
                 <defs>
                   <linearGradient id="logo_grad" x1="0" y1="0" x2="100" y2="100">
                     <stop stopColor="#6366F1" />
                     <stop offset="1" stopColor="#818CF8" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter">
            <span className="text-white">Repo</span>
            <span className="text-indigo-400">Context</span>
          </h1>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="h-px w-10 bg-indigo-500/30"></div>
            <span className="text-[10px] md:text-xs font-bold text-zinc-500 tracking-[0.4em] uppercase">INTELLIGENT REPOSITORY SERIALIZATION</span>
            <div className="h-px w-10 bg-indigo-500/30"></div>
          </div>
        </div>
      </div>
      
      <p className="mt-10 text-zinc-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light px-6 opacity-70">
        Transform your entire repository into a single, token-optimized artifact. <br className="hidden md:block" />
        <span className="text-zinc-300 font-medium">The missing bridge between complex source code and high-precision AI reasoning.</span>
      </p>
    </header>
  );
};
