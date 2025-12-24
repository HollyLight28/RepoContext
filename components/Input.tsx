
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2.5 w-full group">
      <label className="text-[10px] font-black text-zinc-600 pl-0.5 uppercase tracking-[0.25em] group-focus-within:text-indigo-400 transition-colors duration-500">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full bg-black/40 border rounded-2xl px-6 py-4.5 text-zinc-100 placeholder-zinc-700
            transition-all duration-500 ease-out text-sm md:text-base
            focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-black/60
            ${error 
              ? 'border-red-500/40 focus:border-red-500/60' 
              : 'border-white/5 focus:border-indigo-500/40 hover:border-white/10'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[10px] text-red-400 pl-1 font-bold flex items-center gap-2 mt-1 uppercase tracking-wider">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-[10px] text-zinc-600 pl-1 mt-1 italic font-medium tracking-tight opacity-50">{helperText}</span>
      )}
    </div>
  );
};
