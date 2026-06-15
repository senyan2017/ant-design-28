import React from 'react';
import { omit, toArray } from '@rc-component/util';
import { clsx } from 'clsx';

import { isPresetSize } from '../_util/gapSize';
import { useOrientation } from '../_util/hooks';
import { isFunction, isNonNullable, isReactRenderable } from '../_util/is';
import { ConfigContext } from '../config-provider';
import type { ConfigConsumerProps } from '../config-provider';
import type { FlexProps } from './interface';
import useStyle from './style';
import createFlexClassNames from './utils';

const Flex = React.forwardRef<HTMLElement, React.PropsWithChildren<FlexProps>>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    rootClassName,
    className,
    style,
    flex,
    gap,
    vertical,
    orientation,
    separator,
    component: Component = 'div',
    children,
    ...othersProps
  } = props;

  const {
    flex: ctxFlex,
    direction: ctxDirection,
    getPrefixCls,
  } = React.useContext<ConfigConsumerProps>(ConfigContext);

  const prefixCls = getPrefixCls('flex', customizePrefixCls);

  const [hashId, cssVarCls] = useStyle(prefixCls);

  const [, mergedVertical] = useOrientation(orientation, vertical ?? ctxFlex?.vertical);

  const mergedCls = clsx(
    className,
    rootClassName,
    ctxFlex?.className,
    prefixCls,
    hashId,
    cssVarCls,
    createFlexClassNames(prefixCls, { ...props, vertical: mergedVertical }),
    {
      [`${prefixCls}-rtl`]: ctxDirection === 'rtl',
      [`${prefixCls}-gap-${gap}`]: isPresetSize(gap),
      [`${prefixCls}-vertical`]: mergedVertical,
    },
  );

  const mergedStyle: React.CSSProperties = { ...ctxFlex?.style, ...style };

  if (isNonNullable(flex)) {
    mergedStyle.flex = flex;
  }

  if (isNonNullable(gap) && !isPresetSize(gap)) {
    mergedStyle.gap = gap;
  }

  // ======================== Separator ========================
  let mergedChildren: React.ReactNode = children;

  if (isNonNullable(separator)) {
    const childNodes = toArray(children);
    const renderableNodes = childNodes.filter(isReactRenderable);

    if (renderableNodes.length > 1) {
      mergedChildren = renderableNodes.reduce<React.ReactNode[]>((acc, child, index) => {
        acc.push(child);
        if (index < renderableNodes.length - 1) {
          const separatorContent = isFunction(separator) ? separator(index) : separator;
          acc.push(
            <span className={`${prefixCls}-separator`} key={`separator-${index}`}>
              {separatorContent}
            </span>,
          );
        }
        return acc;
      }, []);
    }
  }

  return (
    <Component
      ref={ref}
      className={mergedCls}
      style={mergedStyle}
      {...omit(othersProps, ['justify', 'wrap', 'align'])}
    >
      {mergedChildren}
    </Component>
  );
});

if (process.env.NODE_ENV !== 'production') {
  Flex.displayName = 'Flex';
}

export default Flex;
