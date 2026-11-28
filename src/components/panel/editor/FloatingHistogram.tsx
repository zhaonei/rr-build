import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { X } from 'lucide-react';
import ConnectedWaveform from './ConnectedWaveform';
import { useEditorActions } from '../../../hooks/useEditorActions';
import { useWaveformControls } from '../../../hooks/useWaveformControls';

interface FloatingHistogramProps {
  onClose: () => void;
  theme?: string;
}

export default function FloatingHistogram({ onClose, theme }: FloatingHistogramProps) {
  const { setAdjustments } = useEditorActions();
  const { setActiveWaveformChannel } = useWaveformControls();
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { offsetX: event.clientX - position.x, offsetY: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const parent = event.currentTarget.parentElement;
    const bounds = parent?.getBoundingClientRect();
    const maxX = bounds ? Math.max(0, bounds.width - 240) : 2000;
    const maxY = bounds ? Math.max(0, bounds.height - 160) : 2000;
    setPosition({
      x: Math.min(maxX, Math.max(0, event.clientX - drag.offsetX)),
      y: Math.min(maxY, Math.max(0, event.clientY - drag.offsetY)),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="absolute z-40 flex w-60 flex-col overflow-hidden rounded-lg border border-surface bg-bg-secondary/95 shadow-xl"
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
    >
      <div
        className="flex h-8 shrink-0 cursor-grab items-center justify-between px-2 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="text-[11px] uppercase tracking-wider text-text-secondary">Histogram</span>
        <button className="p-1 text-text-secondary" onClick={onClose} aria-label="Close histogram">
          <X size={14} />
        </button>
      </div>
      <div className="h-36 min-h-0 p-2 pt-0">
        <ConnectedWaveform
          setDisplayMode={setActiveWaveformChannel}
          setAdjustments={setAdjustments}
          theme={theme}
        />
      </div>
    </div>
  );
}
