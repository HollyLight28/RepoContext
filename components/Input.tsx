import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <label className="text-[10px] md:text-xs font-bold text-zinc-500 pl-1 uppercase tracking-[0.2em] group-focus-within:text-indigo-400 transition-colors duration-300">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full bg-[#0a0a0c] border rounded-2xl px-5 py-4 text-zinc-100 placeholder-zinc-700
            transition-all duration-300 ease-out text-sm md:text-base
            focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-black
            shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]
            ${error 
              ? 'border-red-500/40 focus:border-red-500/60' 
              : 'border-white/5 focus:border-indigo-500/40 hover:border-white/10'}
            ${className}
          `}
          {...props}
        />
        {/* Sub-pixel border line */}
        <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-focus-within:via-indigo-500/40 transition-all duration-700"></div>
      </div>
      {error && (
        <span className="text-[10px] md:text-xs text-red-400 pl-1 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-[10px] md:text-xs text-zinc-500 pl-1 mt-1 opacity-60 italic">{helperText}</span>
      )}
    </div>
  );
};