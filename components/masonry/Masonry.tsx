import * as React from 'react';
import type { CSSProperties } from 'react';
import { CSSMotionList } from '@rc-component/motion';
import ResizeObserver from '@rc-component/resize-observer';
import { composeRef } from '@rc-component/util';
import { clsx } from 'clsx';

import { useMergeSemantic } from '../_util/hooks/useMergeSemantic';
import type { GenerateSemantic } from '../_util/hooks/useMergeSemantic/semanticType';
import { isNumber } from '../_util/is';
import { responsiveArray } from '../_util/responsiveObserver';
import type { Breakpoint } from '../_util/responsiveObserver';
import { useComponentConfig } from '../config-provider/context';
import useCSSVarCls from '../config-provider/hooks/useCSSVarCls';
import type { RowProps } from '../grid';
import useBreakpoint from '../grid/hooks/useBreakpoint';
import useGutter from '../grid/hooks/useGutter';
import { genCssVar } from '../theme/util/genStyleUtils';
import useLayoutChange from './hooks/useLayoutChange';
import useMeasure from './hooks/useMeasure';
import usePositions from './hooks/usePositions';
import MasonryItem from './MasonryItem';
import type { MasonryItemType } from './MasonryItem';
import useStyle from './style';

export type Gap = number | undefined;

export type Key = string | number;

export type MasonrySemanticType = {
  classNames?: {
    root?: string;
    item?: string;
  };
  styles?: {
    root?: React.CSSProperties;
    item?: React.CSSProperties;
  };
};

export type MasonrySemanticAllType = GenerateSemantic<MasonrySemanticType, MasonryProps>;

export interface MasonryProps<ItemDataType = any> {
  // Style
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;

  classNames?: MasonrySemanticAllType['classNamesAndFn'];
  styles?: MasonrySemanticAllType['stylesAndFn'];

  /** Spacing between items */
  gutter?: RowProps['gutter'];

  // Data
  items?: MasonryItemType<ItemDataType>[];

  itemRender?: (itemInfo: MasonryItemType<ItemDataType> & { index: number }) => React.ReactNode;

  /** Number of columns in the masonry grid layout */
  columns?: number | Partial<Record<Breakpoint, number>>;

  /** Trigger when item layout order changed */
  onLayoutChange?: (sortInfo: { key: React.Key; column: number }[]) => void;

  fresh?: boolean;
}

export interface MasonryRef {
  nativeElement: HTMLDivElement;
}

const Masonry = React.forwardRef<MasonryRef, MasonryProps>((props, ref) => {
  const {
    rootClassName,
    className,
    style,
    classNames,
    styles,
    columns,
    prefixCls: customizePrefixCls,
    gutter = 0,
    items,
    itemRender,
    onLayoutChange,
    fresh,
  } = props;

  // ======================= MISC =======================
  const {
    getPrefixCls,
    direction,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles,
  } = useComponentConfig('masonry');

  const prefixCls = getPrefixCls('masonry', customizePrefixCls);
  const rootPrefixCls = getPrefixCls();
  const rootCls = useCSSVarCls(prefixCls);
  const [hashId, cssVarCls] = useStyle(prefixCls, rootCls);

  const [varName, varRef] = genCssVar(rootPrefixCls, 'masonry');

  // ======================= Refs =======================
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    nativeElement: containerRef.current!,
  }));

  // ======================= Item =======================
  // Defer the item list into state set from an effect so the very first render
  // (e.g. SSR via `renderToString`, where effects never run) stays empty. Item
  // positions depend on heights that are only measurable after mount, so
  // painting items before measurement would emit an unstacked layout. Both the
  // rendered list and the `onLayoutChange` payload read from this same
  // `mergedItems`, so they always describe the identical set of items.
  const [mergedItems, setMergedItems] = React.useState<MasonryItemType[]>([]);

  React.useEffect(() => {
    setMergedItems(items || []);
  }, [items]);

  // ==================== Breakpoint ====================
  const screens = useBreakpoint();
  const gutters = useGutter(gutter, screens);
  const [horizontalGutter = 0, verticalGutter = horizontalGutter] = gutters;

  // ====================== Layout ======================
  const columnCount = React.useMemo<number>(() => {
    if (!columns) {
      return 3;
    }

    if (isNumber(columns)) {
      return columns;
    }

    // Find first matching responsive breakpoint
    const matchingBreakpoint = responsiveArray.find(
      (breakpoint) => screens[breakpoint] && columns[breakpoint] !== undefined,
    );

    if (matchingBreakpoint) {
      return columns[matchingBreakpoint] as number;
    }

    return columns.xs ?? 1;
  }, [columns, screens]);

  // =========== Merged Props for Semantic ==========
  const mergedProps: MasonryProps = {
    ...props,
    columns: columnCount,
  };

  const [mergedClassNames, mergedStyles] = useMergeSemantic(
    [contextClassNames, classNames],
    [contextStyles, styles],
    {
      props: mergedProps,
    },
  );

  // ================== Measurement ===================
  // Collects DOM sizes of rendered items via refs + RAF-batched reads.
  const { setItemRef, itemHeights, triggerMeasure } = useMeasure(mergedItems);

  // ================== Positions =====================
  // Assigns each item to a column using shortest-column-first.
  const [itemPositions, totalHeight] = usePositions(
    itemHeights,
    columnCount,
    verticalGutter as number,
  );

  const itemWithPositions = React.useMemo(
    () =>
      mergedItems.map((item, index) => {
        const key = item.key ?? index;
        return {
          item,
          itemIndex: index,
          // CSSMotion will transform key to string.
          // Let's keep the original key here.
          itemKey: key,
          key,
          position: itemPositions.get(key),
        };
      }),
    [mergedItems, itemPositions],
  );

  // Re-measure whenever the item set or the column count changes.
  React.useEffect(() => {
    triggerMeasure();
  }, [mergedItems, columnCount]);

  // ================ Layout Callback =================
  // Fires `onLayoutChange` when column assignments change.
  useLayoutChange(onLayoutChange, itemWithPositions, mergedItems);

  // ====================== Render ======================
  return (
    <ResizeObserver onResize={triggerMeasure}>
      <div
        ref={containerRef}
        className={clsx(
          prefixCls,
          contextClassName,
          mergedClassNames.root,
          rootClassName,
          className,
          hashId,
          cssVarCls,
          { [`${prefixCls}-rtl`]: direction === 'rtl' },
        )}
        style={{ height: totalHeight, ...mergedStyles.root, ...contextStyle, ...style }}
        // Listen for image events that may change item sizes
        onLoad={triggerMeasure}
        onError={triggerMeasure}
      >
        <CSSMotionList
          keys={itemWithPositions}
          component={false}
          // Motion config
          motionAppear
          motionLeave
          motionName={`${prefixCls}-item-fade`}
        >
          {(motionInfo, motionRef) => {
            const {
              item,
              itemKey,
              position = {},
              itemIndex,

              key,
              className: motionClassName,
              style: motionStyle,
            } = motionInfo;
            const { column: columnIndex = 0 } = position;

            const itemStyle: CSSProperties = {
              [varName('item-width')]: `calc((100% + ${horizontalGutter}px) / ${columnCount})`,
              insetInlineStart: `calc(${varRef('item-width')} * ${columnIndex})`,
              width: `calc(${varRef('item-width')} - ${horizontalGutter}px)`,
              top: position.top,
              position: 'absolute',
            };

            return (
              <MasonryItem
                prefixCls={prefixCls}
                key={key}
                item={item}
                style={{ ...motionStyle, ...mergedStyles.item, ...itemStyle }}
                className={clsx(mergedClassNames.item, motionClassName)}
                ref={composeRef(motionRef, (ele) => setItemRef(itemKey, ele))}
                index={itemIndex}
                itemRender={itemRender}
                column={columnIndex}
                onResize={fresh ? triggerMeasure : null}
              />
            );
          }}
        </CSSMotionList>
      </div>
    </ResizeObserver>
  );
});

if (process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry';
}

export default Masonry as (<ItemDataType = any>(
  props: React.PropsWithChildren<MasonryProps<ItemDataType>> & React.RefAttributes<MasonryRef>,
) => React.ReactElement) &
  Pick<React.FC, 'displayName'>;
