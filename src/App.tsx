import { useState, useCallback, useEffect, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GitHubIcon from '@mui/icons-material/GitHub';
import ShareIcon from '@mui/icons-material/Share';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import theme from './theme';
import EditorPanel from './components/EditorPanel';
import PreviewFrame from './components/PreviewFrame';
import ResizeDivider from './components/ResizeDivider';
import ExportMenu from './components/ExportMenu';
import { defaultHTML, defaultCSS, defaultJS } from './utils/defaultCode';
import { parseHTMLErrors, parseCSSErrors, detectJSError } from './utils/linters';

// ─── Sharing ──────────────────────────────────────────────────────────────────

function encodeCode(html: string, css: string, js: string): string {
  return btoa(JSON.stringify({ html, css, js }));
}
function decodeCode(encoded: string): { html: string; css: string; js: string } | null {
  try { return JSON.parse(atob(encoded)); } catch { return null; }
}
function generateShareUrl(html: string, css: string, js: string): string {
  return `${window.location.origin}${window.location.pathname}#share=${encodeCode(html, css, js)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'html' | 'css' | 'js';

const LANG_CONFIG: Record<Lang, { label: string; color: string }> = {
  html: { label: 'HTML', color: '#e44d26' },
  css:  { label: 'CSS',  color: '#264de4' },
  js:   { label: 'JS',   color: '#f0db4f' },
};

interface IntegrityResult {
  lang:  Lang;
  error: { line: number; message: string } | null;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const isTabletOrMobile = useMediaQuery('(max-width: 1024px)');

  const [html, setHtml] = useState(defaultHTML);
  const [css,  setCss]  = useState(defaultCSS);
  const [js,   setJs]   = useState(defaultJS);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  const [panelOrder,    setPanelOrder]    = useState<Lang[]>(['html', 'css', 'js']);
  const [draggingPanel, setDraggingPanel] = useState<Lang | null>(null);
  const [dragOverPanel, setDragOverPanel] = useState<Lang | null>(null);

  const [editorsHeight,    setEditorsHeight]    = useState(44);
  const [editorsLayout,    setEditorsLayout]    = useState<'horizontal' | 'vertical'>('horizontal');
  const [panelWidths,      setPanelWidths]      = useState({ html: 33.33, css: 33.33, js: 33.34 });
  const [previewMinimized, setPreviewMinimized] = useState(false);
  const [isLive,           setIsLive]           = useState(true);
  const [isResizing,       setIsResizing]       = useState(false);
  const panelsContainerRef = useRef<HTMLDivElement>(null);

  const [integrityResults, setIntegrityResults] = useState<IntegrityResult[] | null>(null);
  const [integrityOpen,    setIntegrityOpen]    = useState(false);

  // Force vertical layout on tablet / mobile by default
  useEffect(() => {
    if (isTabletOrMobile) setEditorsLayout('vertical');
  }, [isTabletOrMobile]);

  // Load from share URL
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('share=')) {
      const decoded = decodeCode(hash.substring(6));
      if (decoded) {
        setHtml(decoded.html); setCss(decoded.css); setJs(decoded.js);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const codeMap: Record<Lang, { value: string; onChange: (v: string) => void }> = {
    html: { value: html, onChange: setHtml },
    css:  { value: css,  onChange: setCss  },
    js:   { value: js,   onChange: setJs   },
  };

  // ── Panel drag ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((lang: Lang) => { setDraggingPanel(lang); }, []);

  const handleDragOver = useCallback((e: React.DragEvent, lang: Lang) => {
    e.preventDefault();
    if (draggingPanel && draggingPanel !== lang) setDragOverPanel(lang);
  }, [draggingPanel]);

  const handleDragLeave = useCallback(() => { setDragOverPanel(null); }, []);

  const handleDrop = useCallback((targetLang: Lang) => {
    if (!draggingPanel || draggingPanel === targetLang) { setDraggingPanel(null); setDragOverPanel(null); return; }
    setPanelOrder((prev) => {
      const next = [...prev];
      const fi = next.indexOf(draggingPanel), ti = next.indexOf(targetLang);
      next[fi] = targetLang; next[ti] = draggingPanel;
      return next;
    });
    setDraggingPanel(null); setDragOverPanel(null);
  }, [draggingPanel]);

  // ── Resize ─────────────────────────────────────────────────────────────────

  const handleVerticalResize = useCallback((delta: number) => {
    if (previewMinimized) return;
    setEditorsHeight((prev) => Math.max(20, Math.min(80, prev + (delta / window.innerHeight) * 100)));
  }, [previewMinimized]);

  const handlePanelResize = useCallback((panelIdx: number, delta: number) => {
    setPanelWidths((prev) => {
      const w   = { ...prev };
      const cur = panelOrder[panelIdx], nxt = panelOrder[panelIdx + 1];
      if (!nxt) return prev;
      // panelWidths are flex-grow weights (proportional, not %).
      // Convert pixel delta → weight units using the actual container pixel size.
      const container = panelsContainerRef.current;
      const containerPx = container
        ? (editorsLayout === 'horizontal' ? container.offsetWidth : container.offsetHeight)
        : (editorsLayout === 'horizontal' ? window.innerWidth : window.innerHeight);
      const totalWeight = Object.values(prev).reduce((a, b) => a + b, 0);
      const weightPerPx = totalWeight / containerPx;
      const dw = delta * weightPerPx;
      w[cur] = Math.max(10, prev[cur] + dw);
      w[nxt] = Math.max(10, prev[nxt] - dw);
      return w;
    });
  }, [panelOrder, editorsLayout]);

  // ── Share ──────────────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl(html, css, js));
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) { console.error(err); }
  }, [html, css, js]);

  // ── Integrity check ────────────────────────────────────────────────────────

  const handleIntegrityCheck = useCallback(() => {
    const results: IntegrityResult[] = [
      { lang: 'html', error: parseHTMLErrors(html) },
      { lang: 'css',  error: parseCSSErrors(css)   },
      { lang: 'js',   error: detectJSError(js)      },
    ];
    setIntegrityResults(results);
    setIntegrityOpen(true);
  }, [html, css, js]);

  // ← NUEVO: cuando el panel está abierto, refresca resultados 300ms después
  //   de cualquier cambio en el código — sin necesidad de pulsar el botón
  useEffect(() => {
    if (!integrityOpen) return;
    const timer = setTimeout(() => {
      setIntegrityResults([
        { lang: 'html', error: parseHTMLErrors(html) },
        { lang: 'css',  error: parseCSSErrors(css)   },
        { lang: 'js',   error: detectJSError(js)      },
      ]);
    }, 300);
    return () => clearTimeout(timer);
  }, [html, css, js, integrityOpen]);

  const integrityHasErrors = integrityResults?.some((r) => r.error) ?? false;
  const integrityAllClean  = integrityResults?.every((r) => !r.error) ?? false;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', bgcolor: 'background.default', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 42, flexShrink: 0, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #e8d4ff 0%, #a855f7 45%, #6d28d9 80%, #4c1d95 100%)',
            boxShadow: 'none',
            flexShrink: 0,
            animation: 'pump 2.5s ease-in-out infinite',
            '@keyframes pump': {
              '0%, 100%': { transform: 'scale(1)',    boxShadow: 'none' },
              '50%':       { transform: 'scale(1.18)', boxShadow: 'none'  },
            },
          }} />

          <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.primary', opacity: 0.85 }}>
            Cosmos 3ditor
          </Typography>

          <Box sx={{ flex: 1 }} />

          {/* Layout toggle */}
          <Tooltip title={editorsLayout === 'horizontal' ? 'Vertical layout' : 'Horizontal layout'}>
            <IconButton size="small"
              onClick={() => setEditorsLayout(editorsLayout === 'horizontal' ? 'vertical' : 'horizontal')}
              sx={{ color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1, color: 'primary.main' }, transition: 'all 0.15s' }}>
              {editorsLayout === 'horizontal' ? <ViewAgendaIcon sx={{ fontSize: 18 }} /> : <ViewWeekIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <ExportMenu html={html} css={css} js={js} />

          {/* Share */}
          <Tooltip title={shareUrlCopied ? 'Link copied!' : 'Share code'}>
            <IconButton size="small" onClick={handleShare}
              sx={{ color: shareUrlCopied ? 'primary.main' : 'text.secondary', opacity: shareUrlCopied ? 1 : 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Integrity check button */}
          <Tooltip title="Check code integrity">
            <IconButton size="small" onClick={handleIntegrityCheck}
              sx={{
                color: integrityResults
                  ? integrityHasErrors ? '#ff5050' : '#4caf50'
                  : 'text.secondary',
                opacity: integrityResults ? 1 : 0.5,
                '&:hover': { opacity: 1, color: 'primary.main' },
                transition: 'all 0.15s',
              }}>
              <FactCheckIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Live toggle */}
          <Tooltip title={isLive ? 'Pause preview' : 'Resume preview'}>
            <IconButton size="small" onClick={() => setIsLive(!isLive)}
              sx={{
                height: 20, width: 'auto', px: 1,
                display: 'flex', alignItems: 'center', gap: 0.5,
                borderRadius: '4px',
                bgcolor:     isLive ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
                border:      '1px solid',
                borderColor: isLive ? 'rgba(76,175,80,0.25)' : 'rgba(244,67,54,0.25)',
                color:       isLive ? '#4caf50' : '#f44336',
                transition:  'all 0.2s',
                '&:hover':   { bgcolor: isLive ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)' },
              }}>
              <FiberManualRecordIcon sx={{ fontSize: 10 }} />
              <Typography sx={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                {isLive ? 'Live' : 'Paused'}
              </Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title="View on GitHub">
            <IconButton component="a" href="https://github.com/aisurf3r/CosmosEditor" target="_blank" rel="noopener noreferrer"
              size="small" sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
              <GitHubIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Integrity results panel ── */}
        <Collapse in={integrityOpen && integrityResults !== null}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: integrityHasErrors ? 'rgba(255,80,80,0.3)' : 'rgba(76,175,80,0.3)',
            px: 2, py: 1,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pt: 0.2, flexShrink: 0 }}>
              {integrityAllClean
                ? <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                : <ErrorOutlineIcon       sx={{ fontSize: 16, color: '#ff5050' }} />
              }
              <Typography sx={{ fontSize: '0.7rem', fontFamily: '"Roboto Mono", monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                {integrityAllClean ? 'All clear' : 'Issues found'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
              {integrityResults?.map(({ lang, error }) => (
                <Box key={lang} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, width: 52, flexShrink: 0 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: LANG_CONFIG[lang].color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {LANG_CONFIG[lang].label}
                    </Typography>
                  </Box>
                  {error ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', color: '#ff5050', fontWeight: 500 }}>
                        L{error.line}:
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', color: 'text.secondary' }}>
                        {error.message}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Roboto Mono", monospace', color: '#4caf50' }}>
                      ✓ No errors
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            <IconButton size="small" onClick={() => setIntegrityOpen(false)}
              sx={{ color: 'text.secondary', opacity: 0.4, '&:hover': { opacity: 0.8 }, flexShrink: 0 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Collapse>

        {/* ── Main area ── */}
        <Box sx={{ display: 'flex', flexDirection: editorsLayout === 'horizontal' ? 'column' : 'row', flex: 1, overflow: 'hidden' }}>

          <Box sx={{
            display: 'flex',
            flexDirection: editorsLayout === 'horizontal' ? 'row' : 'column',
            // horizontal: height% works (parent is column-flex with definite height)
            // vertical: parent is row-flex — height:100% is unreliable on cross-axis;
            //   use alignSelf:stretch to fill the row-flex parent's full height instead
            ...(editorsLayout === 'horizontal'
              ? { height: `${previewMinimized ? 100 : editorsHeight}%`, width: '100%' }
              : { width: `${previewMinimized ? 100 : editorsHeight}%`, alignSelf: 'stretch' }
            ),
            overflow: 'hidden', flexShrink: 0, minHeight: 0,
          }} ref={panelsContainerRef}>
            {panelOrder.flatMap((lang, idx) => {
              const dividerKey = `divider-${idx}`;
              const items = [
                <Box key={lang} sx={{
                  display: 'flex',
                  overflow: 'hidden',
                  minHeight: 0,
                  minWidth: 0,
                  // Use flex-grow proportional to panelWidths so dividers (fixed px) are
                  // excluded from the percentage distribution in both layouts
                  flex: `${panelWidths[lang]} 1 0px`,
                }}>
                  <EditorPanel
                    key={lang}
                    language={LANG_CONFIG[lang].label}
                    langColor={LANG_CONFIG[lang].color}
                    value={codeMap[lang].value}
                    onChange={codeMap[lang].onChange}
                    isDragOver={dragOverPanel === lang}
                    onDragStart={() => handleDragStart(lang)}
                    onDragOver={(e) => handleDragOver(e, lang)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(lang)}
                    defaultTheme={lang === 'html' ? 'oneDark' : lang === 'css' ? 'cosmos' : 'monokai'}
                  />
                </Box>,
              ];
              if (idx < panelOrder.length - 1) {
                items.push(
                  <ResizeDivider
                    key={dividerKey}
                    onResize={(d) => handlePanelResize(idx, d)}
                    direction={editorsLayout === 'horizontal' ? 'vertical' : 'horizontal'}
                    onDragStart={() => setIsResizing(true)}
                    onDragEnd={() => setIsResizing(false)}
                  />
                );
              }
              return items;
            })}
          </Box>

          {!previewMinimized && (
            <>
              <ResizeDivider onResize={handleVerticalResize}
                direction={editorsLayout === 'horizontal' ? 'horizontal' : 'vertical'}
                onDragStart={() => setIsResizing(true)} onDragEnd={() => setIsResizing(false)} />

              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: 'background.paper', flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Roboto Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Preview
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title="Minimize preview">
                    <IconButton size="small" onClick={() => setPreviewMinimized(true)}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
                      <ExpandLessIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  {isLive ? <PreviewFrame html={html} css={css} js={js} /> : null}
                </Box>
              </Box>
            </>
          )}

          {previewMinimized && (
            <Tooltip title="Restore preview">
              <IconButton onClick={() => setPreviewMinimized(false)}
                sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 100, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}>
                <ExpandLessIcon sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {isResizing && <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'inherit' }} />}

      </Box>
    </ThemeProvider>
  );
}
