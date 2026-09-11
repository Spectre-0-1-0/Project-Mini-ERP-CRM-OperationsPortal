import React from 'react';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className={clsx('w-full text-left text-sm text-slate-700 border-collapse', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <thead className={clsx('bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0', className)}>
    {children}
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <tr
    onClick={onClick}
    className={clsx(
      'border-b border-slate-200/80 transition-colors last:border-0 hover:bg-slate-50/80',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={clsx('px-4 py-3 font-semibold text-slate-600', className)}>{children}</th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={clsx('px-4 py-3.5 align-middle text-slate-700', className)}>{children}</td>
);

export const TableEmpty: React.FC<{ title?: string; message?: string; icon?: React.ReactNode; action?: React.ReactNode }> = ({
  title = 'No items found',
  message = 'Get started by creating a new entry.',
  icon = <Inbox className="w-10 h-10 text-slate-400 stroke-[1.5]" />,
  action,
}) => (
  <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-white">
    <div className="p-3 bg-slate-100 rounded-full mb-3">{icon}</div>
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mb-4">{message}</p>
    {action}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="border-b border-slate-100 animate-pulse">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <td key={cIdx} className="px-4 py-3.5">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </td>
        ))}
      </tr>
    ))}
  </>
);
