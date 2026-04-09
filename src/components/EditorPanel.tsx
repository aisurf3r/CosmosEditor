import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface EditorPanelProps {
  language: string;
  langColor: string;
  value: string;
  onChange: (val: string) => void;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

export default function EditorPanel({
  language,
  langColor,
  value,
  onChange,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: EditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = start + 2;
        ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        outline: isDragOver ? '1px solid rgba(0,212,170,0.4)' : '1px solid transparent',
        transition: 'outline 0.15s',
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <Box
        draggable
        onDragStart={onDragStart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon
          sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.4 }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: langColor,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {language}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? 'primary.main' : 'text.secondary',
              opacity: copied ? 1 : 0.5,
              '&:hover': { opacity: 0.8, color: 'primary.main' },
              transition: 'all 0.15s',
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear content">
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{
              color: 'text.secondary',
              opacity: 0.5,
              '&:hover': { opacity: 0.8, color: 'secondary.main' },
              transition: 'all 0.15s',
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: isFocused ? '#151515' : '#121212',
          transition: 'background-color 0.15s',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          spellCheck={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '14px 16px',
            fontFamily: '"Roboto Mono", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#c9d1d9',
            caretColor: '#00d4aa',
            scrollbarWidth: 'thin',
            scrollbarColor: '#3a3a3a transparent',
          }}
        />
      </Box>
    </Box>
  );
}
