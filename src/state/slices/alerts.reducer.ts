import { ActionTypes, type AlertsAction } from '@/state/actions';
import { initialAlertsState } from '@/state/initialState';
import type { AlertsState } from '@/state/types';

export const MAX_ALERTS_QUEUE = 3;

function assertNever(action: never): never {
  throw new Error(
    `Unhandled alerts action: ${JSON.stringify(action)}`
  );
}

/**
 * Pure Alerts Slice Reducer:
 * - De-duplicates by `dedupeKey` (replaces existing alert and refreshes position at tail)
 * - Caps queue at 3 alerts (drops oldest)
 */
export function alertsSliceReducer(
  state: AlertsState = initialAlertsState,
  action: AlertsAction
): AlertsState {
  switch (action.type) {
    case ActionTypes.ALERTS_PUSH: {
      const incoming = action.payload;
      const filtered = incoming.dedupeKey
        ? state.queue.filter((item) => item.dedupeKey !== incoming.dedupeKey)
        : state.queue.filter((item) => item.id !== incoming.id);

      const appended = [...filtered, incoming];
      const capped =
        appended.length > MAX_ALERTS_QUEUE
          ? appended.slice(appended.length - MAX_ALERTS_QUEUE)
          : appended;

      return {
        queue: capped,
      };
    }

    case ActionTypes.ALERTS_DISMISS: {
      return {
        queue: state.queue.filter((item) => item.id !== action.payload.id),
      };
    }

    case ActionTypes.ALERTS_CLEAR: {
      return {
        queue: [],
      };
    }

    default:
      return assertNever(action);
  }
}

export { alertsSliceReducer as alertsReducer };

