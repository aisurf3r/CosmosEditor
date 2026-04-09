import { useState, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import theme from './theme';
import EditorPanel from './components/EditorPanel';
import PreviewFrame from './components/PreviewFrame';
import ResizeDivider from './components/ResizeDivider';
import ExportMenu from './components/ExportMenu';
import { defaultHTML, defaultCSS, defaultJS } from './utils/defaultCode';

type Lang = 'html' | 'css' | 'js';

const LANG_CONFIG: Record<Lang, { label: string; color: string }> = {
  html: { label: 'HTML', color: '#e44d26' },
  css: { label: 'CSS', color: '#264de4' },
  js: { label: 'JS', color: '#f0db4f' },
};

export default function App() {
  const [html, setHtml] = useState(defaultHTML);
  const [css, setCss] = useState(defaultCSS);
  const [js, setJs] = useState(defaultJS);

  const [panelOrder, setPanelOrder] = useState<Lang[]>(['html', 'css', 'js']);
  const [draggingPanel, setDraggingPanel] = useState<Lang | null>(null);
  const [dragOverPanel, setDragOverPanel] = useState<Lang | null>(null);

  const [editorsHeight, setEditorsHeight] = useState(44);
  const [editorsLayout, setEditorsLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  const codeMap: Record<Lang, { value: string; onChange: (v: string) => void }> = {
    html: { value: html, onChange: setHtml },
    css: { value: css, onChange: setCss },
    js: { value: js, onChange: setJs },
  };

  const handleDragStart = useCallback((lang: Lang) => {
    setDraggingPanel(lang);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, lang: Lang) => {
      e.preventDefault();
      if (draggingPanel && draggingPanel !== lang) {
        setDragOverPanel(lang);
      }
    },
    [draggingPanel]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverPanel(null);
  }, []);

  const handleDrop = useCallback(
    (targetLang: Lang) => {
      if (!draggingPanel || draggingPanel === targetLang) {
        setDraggingPanel(null);
        setDragOverPanel(null);
        return;
      }
      setPanelOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(draggingPanel);
        const toIdx = next.indexOf(targetLang);
        next[fromIdx] = targetLang;
        next[toIdx] = draggingPanel;
        return next;
      });
      setDraggingPanel(null);
      setDragOverPanel(null);
    },
    [draggingPanel]
  );

  const handleVerticalResize = useCallback((delta: number) => {
    setEditorsHeight((prev) => {
      const newVal = prev + (delta / window.innerHeight) * 100;
      return Math.max(20, Math.min(80, newVal));
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            height: 42,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4aa 0%, #0088cc 100%)',
              boxShadow: '0 0 8px rgba(0,212,170,0.5)',
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'text.primary',
              opacity: 0.85,
            }}
          >
            Cosmos 3ditor
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Tooltip title={editorsLayout === 'horizontal' ? 'Vertical layout' : 'Horizontal layout'}>
            <IconButton
              size="small"
              onClick={() => setEditorsLayout(editorsLayout === 'horizontal' ? 'vertical' : 'horizontal')}
              sx={{
                color: 'text.secondary',
                opacity: 0.6,
                '&:hover': { opacity: 1, color: 'primary.main' },
                transition: 'all 0.15s',
              }}
            >
              {editorsLayout === 'horizontal' ? <ViewAgendaIcon sx={{ fontSize: 18 }} /> : <ViewWeekIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <ExportMenu html={html} css={css} js={js} />

          <Chip
            label="Live"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              bgcolor: 'rgba(0,212,170,0.12)',
              color: 'primary.main',
              border: '1px solid rgba(0,212,170,0.25)',
              borderRadius: '4px',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: editorsLayout === 'horizontal' ? 'column' : 'row',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: editorsLayout === 'horizontal' ? 'row' : 'column',
              height: editorsLayout === 'horizontal' ? `${editorsHeight}%` : '100%',
              width: editorsLayout === 'vertical' ? `${editorsHeight}%` : '100%',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {panelOrder.map((lang, idx) => (
              <Box
                key={lang}
                sx={{
                  flex: 1,
                  display: 'flex',
                  overflow: 'hidden',
                  borderRight: editorsLayout === 'horizontal' && idx < panelOrder.length - 1 ? '1px solid' : 'none',
                  borderBottom: editorsLayout === 'vertical' && idx < panelOrder.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <EditorPanel
                  language={LANG_CONFIG[lang].label}
                  langColor={LANG_CONFIG[lang].color}
                  value={codeMap[lang].value}
                  onChange={codeMap[lang].onChange}
                  isDragOver={dragOverPanel === lang}
                  onDragStart={() => handleDragStart(lang)}
                  onDragOver={(e) => handleDragOver(e, lang)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(lang)}
                />
              </Box>
            ))}
          </Box>

          <ResizeDivider
            onResize={handleVerticalResize}
            direction={editorsLayout === 'horizontal' ? 'horizontal' : 'vertical'}
          />

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <PreviewFrame html={html} css={css} js={js} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
