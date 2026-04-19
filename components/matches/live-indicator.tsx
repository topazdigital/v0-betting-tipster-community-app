'use client';

import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  minute?: number;
  className?: string;
}

export function LiveIndicator({ minute, className }: LiveIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live"></span>
      </span>
      <span className="font-semibold text-live">
        {minute ? `${minute}'` : 'LIVE'}
      </span>
    </div>
  );
}
