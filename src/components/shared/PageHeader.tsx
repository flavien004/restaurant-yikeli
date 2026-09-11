import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0 shadow-xs">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}
