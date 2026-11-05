'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseChipScrollerReturn {
  scrollerRef: (node: HTMLDivElement | null) => void;
  hasLeftOverflow: boolean;
  hasRightOverflow: boolean;
  handleChipClick: (element: HTMLElement | null) => void;
}

const EDGE_PADDING_PX = 20;
const VISIBILITY_TOLERANCE_PX = 4;

/**
 * Horizontal chip scroller hook:
 * - Tracks whether there is horizontal overflow to the right/left so a right-edge fade can be rendered.
 * - When the user taps the last fully visible chip (or a partially cut-off chip),
 *   smoothly scrolls the container so the next (cut-off) chip becomes fully visible with padding.
 */
export function useChipScroller(): UseChipScrollerReturn {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [nodeState, setNodeState] = useState<HTMLDivElement | null>(null);
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);

  const measureElement = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setHasLeftOverflow(el.scrollLeft > VISIBILITY_TOLERANCE_PX);
    setHasRightOverflow(
      maxScrollLeft - el.scrollLeft > VISIBILITY_TOLERANCE_PX
    );
  }, []);

  const scrollerRef = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      setNodeState(node);
      if (node) {
        measureElement(node);
      }
    },
    [measureElement]
  );

  useEffect(() => {
    if (!nodeState) return;

    const onScrollOrResize = () => {
      measureElement(nodeState);
    };

    nodeState.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onScrollOrResize);
      observer.observe(nodeState);
    }

    return () => {
      nodeState.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      observer?.disconnect();
    };
  }, [measureElement, nodeState]);

  const handleChipClick = useCallback((chipElement: HTMLElement | null) => {
    const container = elementRef.current;
    if (!container || !chipElement) return;

    if (container.scrollWidth <= container.clientWidth) return;

    const chips = Array.from(
      container.querySelectorAll<HTMLElement>('[data-chip="true"]')
    );
    const clickedIdx = chips.indexOf(chipElement);
    if (clickedIdx === -1) return;

    const containerRect = container.getBoundingClientRect();
    const visibleLeft = containerRect.left;
    const visibleRight = containerRect.right;

    // Identify all currently fully visible chips
    const fullyVisibleIndices: number[] = [];
    chips.forEach((chip, idx) => {
      const rect = chip.getBoundingClientRect();
      const isFullyVisible =
        rect.left >= visibleLeft - VISIBILITY_TOLERANCE_PX &&
        rect.right <= visibleRight + VISIBILITY_TOLERANCE_PX;
      if (isFullyVisible) {
        fullyVisibleIndices.push(idx);
      }
    });

    const lastFullyVisibleIdx =
      fullyVisibleIndices.length > 0
        ? fullyVisibleIndices[fullyVisibleIndices.length - 1]
        : -1;
    const firstFullyVisibleIdx =
      fullyVisibleIndices.length > 0 ? fullyVisibleIndices[0] : -1;

    const clickedRect = chipElement.getBoundingClientRect();

    // Case 1: Tapped the last fully visible chip (or a chip partially cut off on the right)
    if (
      clickedIdx === lastFullyVisibleIdx ||
      clickedRect.right > visibleRight - VISIBILITY_TOLERANCE_PX
    ) {
      const targetChip = chips[clickedIdx + 1] ?? chipElement;
      const targetRect = targetChip.getBoundingClientRect();
      const deltaRight =
        targetRect.right - visibleRight + EDGE_PADDING_PX;
      if (deltaRight > 0) {
        container.scrollTo({
          left: container.scrollLeft + deltaRight,
          behavior: 'smooth',
        });
        return;
      }
    }

    // Case 2: Tapped the first fully visible chip (or a chip partially cut off on the left)
    if (
      clickedIdx === firstFullyVisibleIdx ||
      clickedRect.left < visibleLeft + VISIBILITY_TOLERANCE_PX
    ) {
      const targetChip = chips[clickedIdx - 1] ?? chipElement;
      const targetRect = targetChip.getBoundingClientRect();
      const deltaLeft = visibleLeft - targetRect.left + EDGE_PADDING_PX;
      if (deltaLeft > 0) {
        container.scrollTo({
          left: Math.max(0, container.scrollLeft - deltaLeft),
          behavior: 'smooth',
        });
      }
    }
  }, []);

  return {
    scrollerRef,
    hasLeftOverflow,
    hasRightOverflow,
    handleChipClick,
  };
}
