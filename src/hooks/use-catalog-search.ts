'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { actions } from '@/state/actions';
import { useCatalogFilter, useDispatch } from '@/state/context';

/**
 * Manages the raw search input in local state, debounces at 300 ms,
 * and dispatches `search/setQuery`. Also syncs when `search/reset` clears the query.
 */
export function useCatalogSearch(debounceMs = 300) {
  const filter = useCatalogFilter();
  const dispatch = useDispatch();

  const [inputState, setInputState] = useState<{
    externalQuery: string;
    rawInput: string;
  }>({
    externalQuery: filter.query,
    rawInput: filter.query,
  });

  // If filter.query was reset externally (e.g. search/reset), sync rawInput
  const rawQuery =
    inputState.externalQuery !== filter.query
      ? filter.query
      : inputState.rawInput;

  const timerRef = useRef<number | null>(null);

  const setRawQuery = useCallback(
    (nextValue: string) => {
      setInputState({
        externalQuery: filter.query,
        rawInput: nextValue,
      });

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        dispatch(actions.search.setQuery(nextValue));
      }, debounceMs);
    },
    [dispatch, debounceMs, filter.query]
  );

  const clearQuery = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setInputState({
      externalQuery: '',
      rawInput: '',
    });
    dispatch(actions.search.setQuery(''));
  }, [dispatch]);

  const selectMenu = useCallback(
    (menuId: string | null) => {
      dispatch(actions.search.setMenu(menuId));
    },
    [dispatch]
  );

  const selectSubType = useCallback(
    (subTypeId: string | null) => {
      dispatch(actions.search.setSubType(subTypeId));
    },
    [dispatch]
  );

  const resetAll = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setInputState({
      externalQuery: '',
      rawInput: '',
    });
    dispatch(actions.search.reset());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    rawQuery,
    debouncedQuery: filter.query,
    menuId: filter.menuId,
    subTypeId: filter.subTypeId,
    setRawQuery,
    clearQuery,
    selectMenu,
    selectSubType,
    resetAll,
    setMenu: selectMenu,
    setSubType: selectSubType,
    resetFilters: resetAll,
  };
}

