import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label className="text-[10px] md:text-xs font-bold text-zinc-500 pl-1 uppercase tracking-widest group-focus-within:text-indigo-400 transition-colors">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full bg-[#0d0d0f]/80 backdrop-blur-sm border rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-[#121214]
            shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]
            ${error 
              ? 'border-red-500/40 focus:border-red-500/60' 
              : 'border-zinc-800/80 focus:border-indigo-500/40 hover:border-zinc-700'}
            ${className}
          `}
          {...props}
        />
        {/* Animated accent line */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-focus-within:via-indigo-500/40 transition-all duration-700"></div>
      </div>
      {error && (
        <span className="text-[10px] md:text-xs text-red-400 pl-1 font-medium flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-[10px] md:text-xs text-zinc-500 pl-1 mt-1 opacity-70 italic">{helperText}</span>
      )}
    </div>
  );
};