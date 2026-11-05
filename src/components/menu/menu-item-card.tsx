'use client';

import React, { memo, useMemo } from 'react';
import type { AddOn, ItemVariant, MenuItem } from '@/types/catalog';
import { getCatalogIndex } from '@/lib/catalog-index';
import type { CatalogIndexLike } from '@/state/selectors';
import { useMenuCardModel } from '@/hooks/useMenuCardModel';
import { MenuCard } from '@/components/menu/MenuCard/MenuCard';

export interface MenuItemCardProps {
  item: MenuItem;
  catalogIndex?: CatalogIndexLike;
  priority?: boolean;
  initialExpanded?: boolean;
  /** Legacy optional props kept for compatibility with existing callers */
  variants?: ItemVariant[];
  addOns?: AddOn[];
  menuTitle?: string;
}

export const MenuItemCard = memo(function MenuItemCard({
  item,
  catalogIndex = getCatalogIndex(),
  priority = false,
  initialExpanded,
}: MenuItemCardProps) {
  const options = useMemo(() => ({ initialExpanded }), [initialExpanded]);
  const model = useMenuCardModel(item, catalogIndex, options);
  return <MenuCard model={model} priority={priority} />;
});
