import * as React from 'react';
import { isEqual, useLayoutEffect } from '@rc-component/util';

import type { MasonryItemType } from '../MasonryItem';

interface ItemWithPosition {
  item: MasonryItemType;
  position?: { column: number; top: number };
}

/**
 * Fires `onLayoutChange` when the column assignment of items changes.
 *
 * Uses a single `useLayoutEffect` with a ref-based diff against the last
 * fired output, replacing the previous two-step effect + intermediate
 * state chain.  This eliminates one render cycle and keeps the callback
 * synchronised with the actual layout.
 */
export default function useLayoutChange(
  onLayoutChange:
    | ((sortInfo: { key: React.Key; column: number }[]) => void)
    | undefined,
  itemWithPositions: ItemWithPosition[],
  mergedItems: MasonryItemType[],
) {
  const onLayoutChangeRef = React.useRef(onLayoutChange);
  onLayoutChangeRef.current = onLayoutChange;

  const prevLayoutRef = React.useRef<{ key: React.Key; column: number }[] | null>(null);

  useLayoutEffect(() => {
    if (!onLayoutChangeRef.current) return;

    // Only fire when every item has a computed position
    if (!itemWithPositions.every(({ position }) => position)) return;

    const layoutData = itemWithPositions.map(({ item, position }) => ({
      ...item,
      column: position!.column,
    }));

    // Only fire when items count matches and data actually changed
    if (
      mergedItems.length === layoutData.length &&
      !isEqual(prevLayoutRef.current, layoutData)
    ) {
      prevLayoutRef.current = layoutData;
      onLayoutChangeRef.current(layoutData);
    }
  }, [itemWithPositions, mergedItems]);
}
