import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverable = false,
  onClick 
}) => {
  return (
    <div 
      className={`
        relative backdrop-blur-md 
        bg-white/90 dark:bg-gray-800/10 
        border border-gray-200/50 dark:border-gray-700/20
        rounded-2xl shadow-xl transition-all duration-300 ease-out
        ${hoverable ? 'hover:scale-[1.02] hover:shadow-2xl hover:bg-white/95 dark:hover:bg-gray-800/15 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 dark:from-gray-700/10 to-transparent" />
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
};