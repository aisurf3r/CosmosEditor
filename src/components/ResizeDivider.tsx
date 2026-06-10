import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';

interface ResizeDividerProps {
  onResize:     (delta: number) => void;
  direction?:   'horizontal' | 'vertical';
  onDragStart?: () => void;
  onDragEnd?:   () => void;
}

export default function ResizeDivider({
  onResize,
  direction = 'horizontal',
  onDragStart,
  onDragEnd,
}: ResizeDividerProps) {
  const dragging     = useRef(false);
  const lastPos      = useRef(0);
  const rafId        = useRef<number | null>(null);
  const pendingDelta = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging.current     = true;
      pendingDelta.current = 0;
      setIsDragging(true);
      onDragStart?.();
      lastPos.current = direction === 'horizontal' ? e.clientY : e.clientX;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const curr   = direction === 'horizontal' ? ev.clientY : ev.clientX;
        pendingDelta.current += curr - lastPos.current;
        lastPos.current = curr;

        // Throttle to one React update per animation frame — smooth 60fps
        if (rafId.current !== null) return;
        rafId.current = requestAnimationFrame(() => {
          onResize(pendingDelta.current);
          pendingDelta.current = 0;
          rafId.current = null;
        });
      };

      const onMouseUp = () => {
        dragging.current = false;
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        pendingDelta.current = 0;
        setIsDragging(false);
        onDragEnd?.();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup',   onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup',   onMouseUp);
    },
    [onResize, direction, onDragStart, onDragEnd]
  );

  const isHoriz = direction === 'horizontal';

  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        flexShrink: 0,
        // Visible track: 10px for easier grabbing
        width:  isHoriz ? '100%' : '10px',
        height: isHoriz ? '10px'  : '100%',
        bgcolor:    isDragging ? 'dividerAccent.main' : 'divider',
        cursor:     isHoriz ? 'row-resize' : 'col-resize',
        position:   'relative',
        transition: isDragging ? 'none' : 'background-color 0.15s',
        opacity:    isDragging ? 1 : 0.7,
        '&:hover':  { bgcolor: 'dividerAccent.main', opacity: 0.8 },
        // Hit area: extended 14px each side → 33px total grabbing zone
        '&::after': {
          content:  '""',
          position: 'absolute',
          inset:    isHoriz ? '-8px 0' : '0 -8px',
          zIndex:   10,
          cursor:   isHoriz ? 'row-resize' : 'col-resize',
        },
      }}
    />
  );
}
