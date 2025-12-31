
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
  const baseStyles = "px-5 py-2.5 rounded-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed text-xs tracking-widest font-mono uppercase border select-none";
  
  const variants = {
    primary: "bg-zinc-100 border-zinc-100 text-black hover:bg-white active:translate-y-[1px] active:shadow-none shadow-[0_2px_0_0_rgba(161,161,170,1)]",
    secondary: "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 active:translate-y-[1px]",
    outline: "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
    ghost: "bg-transparent border-transparent text-zinc-600 hover:text-zinc-400",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-3 w-3 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-70">PROCESSING...</span>
        </div>
      ) : children}
    </button>
  );
};
