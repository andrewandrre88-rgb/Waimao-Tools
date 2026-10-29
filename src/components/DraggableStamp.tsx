import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TransparentSignature } from './TransparentSignature';
import { Move, RotateCcw, ZoomIn, ZoomOut, Check, Sparkles } from 'lucide-react';

interface DraggableStampProps {
  src: string;
  alt?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  position?: { xPct: number; yPct: number } | null;
  onPositionChange: (pos: { xPct: number; yPct: number } | null) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  defaultPosition?: { xPct: number; yPct: number };
  language?: 'zh' | 'en';
}

export const DraggableStamp: React.FC<DraggableStampProps> = ({
  src,
  alt = 'Factory Stamp',
  containerRef,
  position,
  onPositionChange,
  scale = 1,
  onScaleChange,
  defaultPosition = { xPct: 84, yPct: 92 },
  language = 'en'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [livePos, setLivePos] = useState<{ xPct: number; yPct: number }>(position || defaultPosition);
  const dragStartRef = useRef<{ startX: number; startY: number; startXPct: number; startYPct: number } | null>(null);

  // Sync live position with external prop changes when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLivePos(position || defaultPosition);
    }
  }, [position, defaultPosition, isDragging]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with left mouse button / primary touch
    if (e.button !== 0) return;
    
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    const currentPos = position || defaultPosition;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startXPct: currentPos.xPct,
      startYPct: currentPos.yPct
    };

    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      // Convert pixel deltas to percentage relative to the container dimensions
      const deltaXPct = (deltaX / rect.width) * 100;
      const deltaYPct = (deltaY / rect.height) * 100;

      // Clamp so the stamp stays neatly within the printable page bounds
      const clampedX = Math.max(5, Math.min(95, dragStartRef.current.startXPct + deltaXPct));
      const clampedY = Math.max(4, Math.min(96, dragStartRef.current.startYPct + deltaYPct));

      const updated = {
        xPct: Math.round(clampedX * 10) / 10,
        yPct: Math.round(clampedY * 10) / 10
      };

      setLivePos(updated);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      try {
        (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // Ignore
      }

      setIsDragging(false);

      if (dragStartRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = upEvent.clientX - dragStartRef.current.startX;
        const deltaY = upEvent.clientY - dragStartRef.current.startY;

        const deltaXPct = (deltaX / rect.width) * 100;
        const deltaYPct = (deltaY / rect.height) * 100;

        const finalX = Math.max(5, Math.min(95, dragStartRef.current.startXPct + deltaXPct));
        const finalY = Math.max(4, Math.min(96, dragStartRef.current.startYPct + deltaYPct));

        const finalPos = {
          xPct: Math.round(finalX * 10) / 10,
          yPct: Math.round(finalY * 10) / 10
        };

        setLivePos(finalPos);
        onPositionChange(finalPos);
      }

      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, [containerRef, position, defaultPosition, onPositionChange]);

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLivePos(defaultPosition);
    onPositionChange(null);
  };

  const handleScaleDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScaleChange) {
      const nextScale = Math.max(0.6, Math.min(1.6, Math.round((scale + delta) * 10) / 10));
      onScaleChange(nextScale);
    }
  };

  // Base dimensions (standard company stamp size in export documents)
  const baseWidthPx = 112 * scale;
  const baseHeightPx = 64 * scale;

  return (
    <div
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${livePos.xPct}%`,
        top: `${livePos.yPct}%`,
        transform: 'translate(-50%, -50%)',
        width: `${baseWidthPx}px`,
        height: `${baseHeightPx}px`,
        zIndex: isDragging ? 50 : 25,
        touchAction: 'none'
      }}
      className={`group select-none cursor-grab active:cursor-grabbing transition-shadow print:cursor-default print:select-auto ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      title={language === 'zh' ? '拖动可在单据任意位置盖章' : 'Click and drag to position stamp anywhere on the document'}
    >
      {/* Visual outline on hover or active dragging (hidden during print) */}
      <div 
        className={`absolute -inset-1.5 rounded-xl border border-dashed transition-all pointer-events-none print:hidden ${
          isDragging 
            ? 'border-blue-600 bg-blue-500/10 shadow-lg ring-2 ring-blue-400/40' 
            : isHovered 
              ? 'border-blue-400 bg-blue-50/20 shadow-xs' 
              : 'border-transparent'
        }`}
      />

      {/* Floating interactive toolbar (hover or dragging, strictly print:hidden) */}
      <div
        className={`absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap shadow-xl transition-all duration-150 z-50 print:hidden pointer-events-auto ${
          isHovered || isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <span className="flex items-center gap-1 text-blue-300 font-bold">
          <Move size={11} className="animate-pulse" />
          <span>{language === 'zh' ? '自由拖动' : 'Drag to Move'}</span>
        </span>

        {onScaleChange && (
          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-700">
            <button
              type="button"
              onClick={(e) => handleScaleDelta(-0.1, e)}
              className="px-1 py-0.2 hover:bg-white/20 rounded text-[9px] font-black cursor-pointer"
              title={language === 'zh' ? '缩小印章' : 'Scale down stamp'}
            >
              -
            </button>
            <span className="text-[8px] text-slate-300 font-mono font-bold w-6 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={(e) => handleScaleDelta(0.1, e)}
              className="px-1 py-0.2 hover:bg-white/20 rounded text-[9px] font-black cursor-pointer"
              title={language === 'zh' ? '放大印章' : 'Scale up stamp'}
            >
              +
            </button>
          </div>
        )}

        {position && (
          <button
            type="button"
            onClick={handleResetPosition}
            className="ml-1 pl-1 border-l border-slate-700 text-amber-300 hover:text-amber-200 flex items-center gap-0.5 text-[8px] cursor-pointer"
            title={language === 'zh' ? '重置回右下角默认位置' : 'Reset to default footer position'}
          >
            <RotateCcw size={9} />
            <span>{language === 'zh' ? '重置' : 'Reset'}</span>
          </button>
        )}
      </div>

      {/* Stamp Image Component with automatic background cleaning and realistic blend */}
      <div className="w-full h-full flex items-center justify-center mix-blend-multiply pointer-events-none">
        <TransparentSignature 
          src={src} 
          alt={alt} 
          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-2xs" 
        />
      </div>

      {/* Subtle position hint badge in the corner of the stamp (print:hidden) */}
      <div 
        className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 bg-white/90 border border-slate-200 shadow-2xs px-1.5 py-0.2 rounded-md pointer-events-none whitespace-nowrap transition-opacity print:hidden ${
          isHovered || isDragging ? 'opacity-100' : 'opacity-0'
        }`}
      >
        X: {livePos.xPct}% • Y: {livePos.yPct}%
      </div>
    </div>
  );
};
