import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-gray-400 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
