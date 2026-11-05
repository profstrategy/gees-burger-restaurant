'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { executeAlertAction } from '@/lib/alert-action-registry';
import type { Alert } from '@/state/types';
import { cn } from '@/lib/utils';

const severityStyles: Record<
  Alert['severity'],
  {
    barColor: string;
    iconColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  success: {
    barColor: 'bg-[#F8E010]',
    iconColor: 'text-[#F8E010]',
    Icon: CheckCircle2,
  },
  info: {
    barColor: 'bg-[#F8F8F8]',
    iconColor: 'text-[#F8F8F8]',
    Icon: Info,
  },
  warning: {
    barColor: 'bg-[#F8E010]',
    iconColor: 'text-[#F8E010]',
    Icon: AlertTriangle,
  },
  error: {
    barColor: 'bg-[#E10600]',
    iconColor: 'text-[#E10600]',
    Icon: AlertCircle,
  },
};

export interface AlertToastProps {
  alert: Alert;
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

export function AlertToast({
  alert,
  onDismiss,
  autoDismissMs = 4500,
}: AlertToastProps) {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);

  const isError = alert.severity === 'error';
  const shouldAutoDismiss = !alert.sticky && !isError;

  useEffect(() => {
    if (!shouldAutoDismiss || isPaused) return;
    const timer = window.setTimeout(() => {
      onDismiss(alert.id);
    }, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [alert.id, autoDismissMs, isPaused, onDismiss, shouldAutoDismiss]);

  const style = severityStyles[alert.severity];
  const Icon = style.Icon;

  const handleActionClick = () => {
    if (!alert.action) return;
    executeAlertAction(alert.action, {
      navigate: (href) => router.push(href),
    });
    onDismiss(alert.id);
  };

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="pointer-events-auto relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border border-white/15 bg-[#161616] p-4 pl-5 text-sm text-[#F8F8F8] shadow-xl"
    >
      {/* 3 px severity bar on the left */}
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-[3px]', style.barColor)}
      />

      <div className="flex items-start gap-3 min-w-0">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.iconColor)} />
        <div className="space-y-1 min-w-0">
          {alert.title && (
            <p className="font-display text-lg text-[#F8E010] leading-none">
              {alert.title}
            </p>
          )}
          <p className="text-xs sm:text-sm text-[#E6E6E6] leading-relaxed break-words">
            {alert.message}
          </p>

          {alert.action && (
            <div className="pt-1">
              {alert.action.kind === 'link' && alert.action.href ? (
                <Link
                  href={alert.action.href}
                  onClick={() => onDismiss(alert.id)}
                  className="inline-flex items-center min-h-[36px] text-xs font-semibold text-[#F8E010] underline underline-offset-4 hover:text-[#F8E850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  {alert.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center min-h-[36px] text-xs font-semibold text-[#F8E010] underline underline-offset-4 hover:text-[#F8E850] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] rounded"
                >
                  {alert.action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(alert.id)}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] -my-2 -mr-2 rounded-lg text-[#E6E6E6] hover:text-[#F8E010] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8E010] shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default AlertToast;
