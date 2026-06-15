import * as React from 'react';

export default function useRefs() {
  const ref = React.useRef<Map<React.Key, HTMLDivElement | null> | null>(null);

  if (ref.current === null) {
    ref.current = new Map();
  }

  const setRef = (key: React.Key, element: HTMLDivElement | null) => {
    if (element) {
      ref.current!.set(key, element);
    } else {
      // Drop the entry when its element unmounts so removed items don't leave
      // stale refs lingering in the map.
      ref.current!.delete(key);
    }
  };

  const getRef = (key: React.Key) => ref.current!.get(key);

  return [setRef, getRef] as const;
}
