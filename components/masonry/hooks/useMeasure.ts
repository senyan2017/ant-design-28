import * as React from 'react';
import { isEqual } from '@rc-component/util';

import type { MasonryItemType } from '../MasonryItem';
import useDelay from './useDelay';
import type { ItemHeightData } from './usePositions';
import useRefs from './useRefs';

/**
 * Manages DOM measurement for masonry items.
 *
 * Combines ref collection (useRefs), RAF-based debouncing (useDelay),
 * and `getBoundingClientRect` reads into a single hook.
 * Returns item height data for the layout pipeline and a stable
 * `triggerMeasure` function that can be called from resize observers,
 * image load handlers, and effects.
 */
export default function useMeasure(mergedItems: MasonryItemType[]) {
  const [setItemRef, getItemRef] = useRefs();
  const [itemHeights, setItemHeights] = React.useState<ItemHeightData[]>([]);

  const triggerMeasure = useDelay(() => {
    const nextHeights = mergedItems.map<ItemHeightData>((item, index) => {
      const itemKey = item.key ?? index;
      const element = getItemRef(itemKey);
      const rect = element?.getBoundingClientRect();
      return [itemKey, rect ? rect.height : 0, item.column];
    });

    setItemHeights((prev) => (isEqual(prev, nextHeights) ? prev : nextHeights));
  });

  return { setItemRef, itemHeights, triggerMeasure };
}
