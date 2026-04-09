import { useCallback, useRef } from 'react';
import Box from '@mui/material/Box';

interface ResizeDividerProps {
  onResize: (delta: number) => void;
  direction?: 'horizontal' | 'vertical';
}

export default function ResizeDivider({ onResize, direction = 'horizontal' }: ResizeDividerProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastPos.current = direction === 'horizontal' ? e.clientY : e.clientX;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const curr = direction === 'horizontal' ? ev.clientY : ev.clientX;
        const delta = curr - lastPos.current;
        lastPos.current = curr;
        onResize(delta);
      };

      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onResize, direction]
  );

  const isHoriz = direction === 'horizontal';

  return (
    <Box
      onMouseDown={onMouseDown}
      sx={{
        flexShrink: 0,
        width: isHoriz ? '100%' : '4px',
        height: isHoriz ? '4px' : '100%',
        bgcolor: 'divider',
        cursor: isHoriz ? 'row-resize' : 'col-resize',
        position: 'relative',
        transition: 'background-color 0.15s',
        '&:hover': {
          bgcolor: 'primary.main',
          opacity: 0.6,
        },
        '&:active': {
          bgcolor: 'primary.main',
          opacity: 0.8,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: isHoriz ? '-4px 0' : '0 -4px',
          zIndex: 10,
        },
      }}
    />
  );
}
