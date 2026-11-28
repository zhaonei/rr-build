import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Panel } from '../../types/ui';
import { useEditorStore } from '../../store/useEditorStore';

const DRAG_THRESHOLD = 4;

interface MobileDrawerProps {
  height: number;
  maxHeight: number;
  isCollapsed: boolean;
  isHidden: boolean;
  activePanel: Panel | null;
  onHeightChange: (height: number) => void;
  onSnap: (height: number) => void;
  onToggleCollapsed: () => void;
  onMinHeightChange: (height: number) => void;
  renderPanel: (panel: Panel) => React.ReactNode;
  footer?: React.ReactNode;
  switcher: React.ReactNode;
  headerActions?: React.ReactNode;
}

export default function MobileDrawer({
  height,
  maxHeight,
  isCollapsed,
  isHidden,
  activePanel,
  onHeightChange,
  onSnap,
  onToggleCollapsed,
  onMinHeightChange,
  renderPanel,
  footer,
  switcher,
  headerActions,
}: MobileDrawerProps) {
  const isSliderDragging = useEditorStore((state) => state.isSliderDragging);
  const dragState = useRef<{ startY: number; startHeight: number; pointerId: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gripRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<number | null>(null);

  useEffect(() => {
    const grip = gripRef.current;
    const bottom = bottomRef.current;
    if (!grip || !bottom) return;

    const update = () => {
      onMinHeightChange(grip.offsetHeight + bottom.offsetHeight);
    };

    const observer = new ResizeObserver(update);
    observer.observe(grip);
    observer.observe(bottom);
    update();
    return () => observer.disconnect();
  }, [onMinHeightChange]);

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSwipeMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = swipeStartRef.current;
    if (startY === null) return;
    if ((event.touches[0]?.clientY ?? startY) - startY > 30) {
      swipeStartRef.current = null;
      onToggleCollapsed();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragState.current = {
      startY: event.clientY,
      startHeight: height,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    onHeightChange(Math.max(0, Math.min(maxHeight, drag.startHeight + (drag.startY - event.clientY))));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragState.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (Math.abs(event.clientY - drag.startY) < DRAG_THRESHOLD) {
      navigator.vibrate?.(8);
      onToggleCollapsed();
      return;
    }
    navigator.vibrate?.(5);
    onSnap(height);
  };

  return (
    <div
      className={clsx(
        'shrink-0 relative flex flex-col overflow-hidden rounded-t-xl border-t border-surface/60 bg-bg-secondary',
        !isDragging && 'shadow-[0_-8px_24px_rgba(0,0,0,0.35)]',
      )}
      style={{
        height: isHidden ? 0 : height,
        opacity: isHidden ? 0 : isSliderDragging ? 0.45 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: isDragging
          ? 'none'
          : 'height 220ms cubic-bezier(0.32, 0.72, 0, 1), opacity 140ms ease-out',
        overscrollBehavior: 'contain',
      }}
      data-mobile-drawer
    >
      <div
        ref={gripRef}
        role="slider"
        aria-label="Panel height"
        aria-valuenow={Math.round(height)}
        aria-valuemin={0}
        aria-valuemax={maxHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex h-8 shrink-0 items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <div
          className={clsx(
            'h-1 rounded-full bg-text-secondary/50 transition-all',
            isDragging ? 'w-14 bg-accent' : 'w-10',
          )}
        />
        {headerActions && (
          <div className="absolute right-1.5 top-0 flex h-8 items-center gap-1">{headerActions}</div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {activePanel && !isCollapsed && (
          <div className="absolute inset-0 overflow-y-auto overscroll-contain custom-scrollbar">
            {renderPanel(activePanel)}
          </div>
        )}
      </div>

      <div
        ref={bottomRef}
        className="shrink-0"
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
      >
        {switcher}
        <div className="border-t border-surface">{footer}</div>
      </div>
    </div>
  );
}
