import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <label className="text-xs font-semibold text-zinc-400 pl-1 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full bg-black/40 border rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-zinc-900/80
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]
            ${error 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-zinc-800 focus:border-indigo-500/50 hover:border-zinc-700'}
            ${className}
          `}
          {...props}
        />
        {/* Glow effect bottom line */}
        <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-focus-within:via-indigo-500/50 transition-all duration-500"></div>
      </div>
      {error && <span className="text-xs text-red-400 pl-1 font-medium flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {error}
      </span>}
      {helperText && !error && <span className="text-xs text-zinc-500 pl-1">{helperText}</span>}
    </div>
  );
};