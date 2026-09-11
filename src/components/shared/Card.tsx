import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function Card({ children, className = '', hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300/80' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
