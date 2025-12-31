
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
        
        <div className="flex items-center gap-5">
          {/* Matrix Core Icon - Professional Replacement for REC dot */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-crimson-900/30 rotate-45 scale-90"></div>
            <div className="absolute inset-1 border border-zinc-600/40 -rotate-12"></div>
            <div className="w-2.5 h-2.5 bg-crimson-600 shadow-[0_0_15px_rgba(220,38,38,1)] z-10"></div>
            <div className="absolute inset-0 bg-crimson-600/5 animate-pulse rounded-sm"></div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tighter leading-none uppercase">
              RepoContext
            </h1>
            <span className="text-[10px] font-mono text-zinc-200 uppercase tracking-[0.3em] mt-1.5 font-black">
              Serialization Protocol v3.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-mono text-zinc-400 uppercase font-black tracking-widest">Auth_Status</span>
             <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               <span className="text-[10px] font-mono text-white font-bold">READY_STATE</span>
             </div>
           </div>
        </div>

      </div>
    </header>
  );
};
