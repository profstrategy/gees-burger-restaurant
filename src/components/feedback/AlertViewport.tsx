'use client';

import React, { useCallback } from 'react';
import { actions } from '@/state/actions';
import { useAlerts, useDispatch } from '@/state/context';
import { AlertToast } from '@/components/feedback/AlertToast';

/**
 * Global AlertViewport mounted in the root layout.
 * position:fixed, top-right on desktop (max width 360px) and top-centre on mobile
 * (full width minus gutters, below the header), max 3 stacked.
 * Wrapper pointer-events:none, toasts pointer-events:auto.
 */
export function AlertViewport() {
  const { queue } = useAlerts();
  const dispatch = useDispatch();

  const handleDismiss = useCallback(
    (id: string) => {
      dispatch(actions.alerts.dismiss(id));
    },
    [dispatch]
  );

  const visibleAlerts = queue.slice(0, 3);
  if (visibleAlerts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed top-[76px] left-4 right-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-[360px] z-[100] flex flex-col gap-2.5"
    >
      {visibleAlerts.map((alert) => (
        <AlertToast key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

export default AlertViewport;
