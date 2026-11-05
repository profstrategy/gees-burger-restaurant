import { getCatalogIndex } from '@/lib/catalog-index';
import { ActionTypes, type CatalogFilterAction } from '@/state/actions';
import { initialCatalogFilterState } from '@/state/initialState';
import type { CatalogFilterState } from '@/state/types';

function assertNever(action: never): never {
  throw new Error(
    `Unhandled catalog filter action: ${JSON.stringify(action)}`
  );
}

/**
 * Pure Catalog Search/Filter Slice Reducer.
 * - search/setMenu clears subTypeId
 * - subTypeId is only valid while its menu is selected
 * - search/reset clears query, menuId, and subTypeId
 */
export function catalogFilterSliceReducer(
  state: CatalogFilterState = initialCatalogFilterState,
  action: CatalogFilterAction
): CatalogFilterState {
  switch (action.type) {
    case ActionTypes.SEARCH_SET_QUERY: {
      return {
        ...state,
        query: action.payload.query,
      };
    }

    case ActionTypes.SEARCH_SET_MENU: {
      return {
        ...state,
        menuId: action.payload.menuId,
        subTypeId: null,
      };
    }

    case ActionTypes.SEARCH_SET_SUBTYPE: {
      if (state.menuId === null) {
        return {
          ...state,
          subTypeId: null,
        };
      }
      const nextSubTypeId = action.payload.subTypeId;
      if (nextSubTypeId !== null) {
        const validSubTypes =
          getCatalogIndex().subTypesByMenuId.get(state.menuId) ?? [];
        if (!validSubTypes.some((st) => st.id === nextSubTypeId)) {
          return {
            ...state,
            subTypeId: null,
          };
        }
      }
      return {
        ...state,
        subTypeId: nextSubTypeId,
      };
    }

    case ActionTypes.SEARCH_RESET: {
      return {
        query: '',
        menuId: null,
        subTypeId: null,
      };
    }

    default:
      return assertNever(action);
  }
}

export { catalogFilterSliceReducer as catalogReducer };
