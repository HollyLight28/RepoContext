
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-mono text-white uppercase tracking-widest font-black transition-colors group-focus-within:text-crimson-500">
          {label}
        </label>
        {error && (
          <span className="text-[10px] font-mono text-crimson-500 font-bold uppercase tracking-widest animate-pulse">
            ![ERROR_DETECTED]
          </span>
        )}
      </div>
      
      <div className="relative">
        <input
          className={`
            w-full bg-zinc-900/40 border-zinc-700 border-x-0 border-t-0 border-b rounded-none px-0 py-3 text-white placeholder-zinc-700 font-mono text-sm
            transition-all duration-300
            focus:outline-none focus:border-crimson-500 focus:bg-white/[0.08]
            disabled:opacity-40
            ${error ? 'border-crimson-900' : 'hover:border-zinc-400'}
            ${className}
          `}
          autoComplete="off"
          spellCheck="false"
          {...props}
        />
      </div>
      
      {helperText && !error && (
        <span className="text-[9px] text-zinc-300 font-mono italic mt-1.5 opacity-100 uppercase tracking-tight font-medium">
          // {helperText}
        </span>
      )}
    </div>
  );
};
