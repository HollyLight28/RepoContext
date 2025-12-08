import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-zinc-400 pl-1">{label}</label>
      <input
        className={`bg-zinc-900/50 border ${error ? 'border-red-500/50' : 'border-zinc-700'} rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 pl-1">{error}</span>}
      {helperText && !error && <span className="text-xs text-zinc-500 pl-1">{helperText}</span>}
    </div>
  );
};