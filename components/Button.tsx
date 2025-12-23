import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-8 py-4 rounded-2xl font-bold transition-all duration-500 flex items-center justify-center gap-3 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 text-sm md:text-base tracking-tight";
  
  const variants = {
    primary: "bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-violet-500 text-white shadow-[0_10px_40px_rgba(79,70,229,0.3)] border border-white/20 hover:shadow-[0_15px_50px_rgba(79,70,229,0.4)]",
    secondary: "bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 text-white border border-white/5 shadow-xl",
    outline: "bg-transparent border-2 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="uppercase tracking-widest text-xs">Processing...</span>
        </div>
      ) : children}
    </button>
  );
};