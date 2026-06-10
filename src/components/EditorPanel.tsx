import { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';

import { EditorView, lineNumbers, highlightActiveLineGutter, dropCursor, rectangularSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { history, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as cssPlugin from 'prettier/plugins/postcss';

import { parseHTMLErrors, parseCSSErrors, detectJSError } from '../utils/linters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditorPanelProps {
  language:     string;
  langColor:    string;
  value:        string;
  onChange:     (val: string) => void;
  isDragOver:   boolean;
  onDragStart:  () => void;
  onDragOver:   (e: React.DragEvent) => void;
  onDragLeave:  () => void;
  onDrop:       () => void;
  defaultTheme?: ThemeName;
}

type CodeError = { line: number; message: string } | null;
type ThemeName = 'oneDark' | 'cosmos' | 'dracula' | 'solarizedLight' | 'monokai';

// ─── Themes ───────────────────────────────────────────────────────────────────

const cosmosBase = EditorView.theme({
  '&':                                    { backgroundColor: '#0d0f1a', color: '#c9d1d9' },
  '.cm-content':                          { caretColor: '#00d4aa' },
  '.cm-cursor, .cm-dropCursor':           { borderLeftColor: '#00d4aa' },
  '.cm-gutters':                          { backgroundColor: '#0a0c14', color: '#3a3a4a', border: 'none' },
  '.cm-activeLineGutter':                 { backgroundColor: '#0f1220' },
  '.cm-activeLine':                       { backgroundColor: 'rgba(15,18,32,0.6)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(0,212,170,0.18)' },
  '&.cm-focused .cm-selectionBackground':{ backgroundColor: 'rgba(0,212,170,0.22)' },
  '.cm-matchingBracket':                  { backgroundColor: 'rgba(0,212,170,0.25)', color: '#00d4aa !important' },
}, { dark: true });
const cosmosHighlight = HighlightStyle.define([
  { tag: tags.keyword,     color: '#913EDB' }, { tag: tags.string, color: '#00d4aa' },
  { tag: tags.comment,     color: '#3d4460', fontStyle: 'italic' }, { tag: tags.number, color: '#f0db4f' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#79c0ff' },
  { tag: tags.variableName, color: '#c9d1d9' }, { tag: tags.propertyName, color: '#79c0ff' },
  { tag: tags.operator, color: '#913EDB' }, { tag: tags.punctuation, color: '#8b949e' },
  { tag: tags.tagName, color: '#7ee787' }, { tag: tags.attributeName, color: '#79c0ff' },
  { tag: tags.attributeValue, color: '#00d4aa' }, { tag: tags.bool, color: '#f78166' },
  { tag: tags.definitionKeyword, color: '#913EDB' }, { tag: tags.typeName, color: '#79c0ff' },
]);
const cosmosTheme = [cosmosBase, syntaxHighlighting(cosmosHighlight)];

const draculaBase = EditorView.theme({
  '&':                                    { backgroundColor: '#282a36', color: '#f8f8f2' },
  '.cm-content':                          { caretColor: '#f8f8f2' },
  '.cm-cursor, .cm-dropCursor':           { borderLeftColor: '#f8f8f2' },
  '.cm-gutters':                          { backgroundColor: '#21222c', color: '#6272a4', border: 'none' },
  '.cm-activeLineGutter':                 { backgroundColor: '#2d2f3f' },
  '.cm-activeLine':                       { backgroundColor: 'rgba(68,71,90,0.3)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(98,114,164,0.4)' },
  '&.cm-focused .cm-selectionBackground':{ backgroundColor: 'rgba(98,114,164,0.5)' },
  '.cm-matchingBracket':                  { backgroundColor: 'rgba(255,255,255,0.15)', color: '#f8f8f2 !important' },
}, { dark: true });
const draculaHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff79c6' }, { tag: tags.string, color: '#f1fa8c' },
  { tag: tags.comment, color: '#6272a4', fontStyle: 'italic' }, { tag: tags.number, color: '#bd93f9' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#50fa7b' },
  { tag: tags.variableName, color: '#f8f8f2' }, { tag: tags.propertyName, color: '#66d9e8' },
  { tag: tags.operator, color: '#ff79c6' }, { tag: tags.punctuation, color: '#f8f8f2' },
  { tag: tags.tagName, color: '#ff79c6' }, { tag: tags.attributeName, color: '#50fa7b' },
  { tag: tags.attributeValue, color: '#f1fa8c' }, { tag: tags.bool, color: '#bd93f9' },
]);
const draculaTheme = [draculaBase, syntaxHighlighting(draculaHighlight)];

const solarizedLightBase = EditorView.theme({
  '&':                                    { backgroundColor: '#fdf6e3', color: '#657b83' },
  '.cm-content':                          { caretColor: '#268bd2' },
  '.cm-cursor, .cm-dropCursor':           { borderLeftColor: '#268bd2' },
  '.cm-gutters':                          { backgroundColor: '#eee8d5', color: '#93a1a1', border: 'none' },
  '.cm-activeLineGutter':                 { backgroundColor: '#d6d0c5' },
  '.cm-activeLine':                       { backgroundColor: 'rgba(101,123,131,0.08)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(38,139,210,0.15)' },
  '&.cm-focused .cm-selectionBackground':{ backgroundColor: 'rgba(38,139,210,0.22)' },
  '.cm-matchingBracket':                  { backgroundColor: 'rgba(38,139,210,0.25)', color: '#268bd2 !important' },
}, { dark: false });
const solarizedLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#859900' }, { tag: tags.string, color: '#2aa198' },
  { tag: tags.comment, color: '#93a1a1', fontStyle: 'italic' }, { tag: tags.number, color: '#d33682' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#268bd2' },
  { tag: tags.variableName, color: '#657b83' }, { tag: tags.propertyName, color: '#268bd2' },
  { tag: tags.operator, color: '#859900' }, { tag: tags.punctuation, color: '#586e75' },
  { tag: tags.tagName, color: '#268bd2' }, { tag: tags.attributeName, color: '#2aa198' },
  { tag: tags.attributeValue, color: '#2aa198' }, { tag: tags.bool, color: '#d33682' },
]);
const solarizedLightTheme = [solarizedLightBase, syntaxHighlighting(solarizedLightHighlight)];

const monokaiBase = EditorView.theme({
  '&':                                    { backgroundColor: '#272822', color: '#f8f8f2' },
  '.cm-content':                          { caretColor: '#a1efe4' },
  '.cm-cursor, .cm-dropCursor':           { borderLeftColor: '#a1efe4' },
  '.cm-gutters':                          { backgroundColor: '#3e3d32', color: '#90908a', border: 'none' },
  '.cm-activeLineGutter':                 { backgroundColor: '#49483e' },
  '.cm-activeLine':                       { backgroundColor: 'rgba(73,72,62,0.4)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(73,72,62,0.5)' },
  '&.cm-focused .cm-selectionBackground':{ backgroundColor: 'rgba(73,72,62,0.6)' },
  '.cm-matchingBracket':                  { backgroundColor: 'rgba(161,239,228,0.3)', color: '#a1efe4 !important' },
}, { dark: true });
const monokaiHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#f92672' }, { tag: tags.string, color: '#e6db74' },
  { tag: tags.comment, color: '#75715e', fontStyle: 'italic' }, { tag: tags.number, color: '#ae81ff' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#a1efe4' },
  { tag: tags.variableName, color: '#f8f8f2' }, { tag: tags.propertyName, color: '#a1efe4' },
  { tag: tags.operator, color: '#f92672' }, { tag: tags.punctuation, color: '#f8f8f2' },
  { tag: tags.tagName, color: '#f92672' }, { tag: tags.attributeName, color: '#a1efe4' },
  { tag: tags.attributeValue, color: '#e6db74' }, { tag: tags.bool, color: '#ae81ff' },
]);
const monokaiTheme = [monokaiBase, syntaxHighlighting(monokaiHighlight)];

function getTheme(name: ThemeName) {
  if (name === 'cosmos')         return cosmosTheme;
  if (name === 'dracula')        return draculaTheme;
  if (name === 'solarizedLight') return solarizedLightTheme;
  if (name === 'monokai')        return monokaiTheme;
  return oneDark;
}

const THEME_LABELS: Record<ThemeName, string> = {
  oneDark: 'One Dark', cosmos: 'Cosmos', dracula: 'Dracula',
  solarizedLight: 'Solarized Light', monokai: 'Monokai',
};

// ─── Prettier ─────────────────────────────────────────────────────────────────

async function formatCode(code: string, lang: string): Promise<string> {
  try {
    const l = lang.toLowerCase();
    if (l === 'javascript' || l === 'js') return await prettier.format(code, { parser: 'babel',  plugins: [babelPlugin, estreePlugin], semi: true, singleQuote: true, tabWidth: 2 });
    if (l === 'html')       return await prettier.format(code, { parser: 'html',   plugins: [htmlPlugin], tabWidth: 2 });
    if (l === 'css')        return await prettier.format(code, { parser: 'css',    plugins: [cssPlugin],  tabWidth: 2 });
  } catch (e) { console.warn('Prettier error:', e); }
  return code;
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function EditorPanel({
  language, langColor, value, onChange,
  isDragOver, onDragStart, onDragOver, onDragLeave, onDrop,
  defaultTheme = 'oneDark',
}: EditorPanelProps) {
  const editorContainerRef    = useRef<HTMLDivElement>(null);
  const editorViewRef         = useRef<EditorView | null>(null);
  const isUpdatingFromPropsRef = useRef(false);
  const themeCompartment      = useRef(new Compartment());
  const activeThemeRef        = useRef<ThemeName>(defaultTheme);

  const isCompact = useMediaQuery('(max-width: 1024px)');

  const [isFocused,       setIsFocused]       = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [codeError,       setCodeError]       = useState<CodeError>(null);
  const [canUndo,         setCanUndo]         = useState(false);
  const [canRedo,         setCanRedo]         = useState(false);
  const [activeTheme,     setActiveTheme]     = useState<ThemeName>(defaultTheme);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  const [isFormatting,    setIsFormatting]    = useState(false);
  const [buttonsExpanded, setButtonsExpanded] = useState(false);

  const showButtons = !isCompact || buttonsExpanded;

  // ── Language extension ──────────────────────────────────────────────────────

  const getLanguageExtension = () => {
    const l = language.toLowerCase();
    if (l === 'html') return html();
    if (l === 'css')  return css();
    return javascript(); // covers 'js' and 'javascript'
  };

  // ── Error detection — 800ms debounce over linters.ts ──────────────────────
  // Runs independently of CodeMirror. No CM linter extension needed.

  useEffect(() => {
    if (!value.trim()) { setCodeError(null); return; }
    const timer = setTimeout(() => {
      const l = language.toLowerCase();
      let err: { line: number; message: string } | null = null;
      if      (l === 'javascript' || l === 'js') err = detectJSError(value);
      else if (l === 'html')                     err = parseHTMLErrors(value);
      else if (l === 'css')                      err = parseCSSErrors(value);
      setCodeError(err);
    }, 800);
    return () => clearTimeout(timer);
  }, [value, language]);

  // ── Init CodeMirror ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editorContainerRef.current || editorViewRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(), highlightActiveLineGutter(), dropCursor(), rectangularSelection(),
        history(), closeBrackets(), autocompletion(),
        getLanguageExtension(),
        themeCompartment.current.of(getTheme(activeThemeRef.current)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromPropsRef.current) onChange(update.state.doc.toString());
          setCanUndo(undoDepth(update.state) > 0);
          setCanRedo(redoDepth(update.state) > 0);
        }),
        EditorView.contentAttributes.of({ spellcheck: 'false' }),
      ],
    });
    const view = new EditorView({ state, parent: editorContainerRef.current });
    editorViewRef.current = view;
    view.contentDOM.addEventListener('focus', () => setIsFocused(true));
    view.contentDOM.addEventListener('blur',  () => setIsFocused(false));

    // Force re-measure after first paint — handles cases where the container
    // gets its size from flex allocation after mount (e.g. vertical layout)
    requestAnimationFrame(() => view.requestMeasure());

    // Watch for container size changes (layout switches, panel resize, etc.)
    // and tell CodeMirror to re-render at the new size
    const observer = new ResizeObserver(() => {
      editorViewRef.current?.requestMeasure();
    });
    observer.observe(editorContainerRef.current);

    return () => {
      view.destroy();
      observer.disconnect();
      editorViewRef.current = null;
    };
  }, [language]);

  // ── Sync value ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editorViewRef.current) return;
    const current = editorViewRef.current.state.doc.toString();
    if (current !== value) {
      isUpdatingFromPropsRef.current = true;
      editorViewRef.current.dispatch({ changes: { from: 0, to: current.length, insert: value } });
      isUpdatingFromPropsRef.current = false;
    }
  }, [value]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  const handleUndo = () => { if (!editorViewRef.current) return; undo(editorViewRef.current); onChange(editorViewRef.current.state.doc.toString()); };
  const handleRedo = () => { if (!editorViewRef.current) return; redo(editorViewRef.current); onChange(editorViewRef.current.state.doc.toString()); };

  // ── Format ─────────────────────────────────────────────────────────────────

  const handleFormat = async () => { setIsFormatting(true); onChange(await formatCode(value, language)); setIsFormatting(false); };

  // ── Theme ──────────────────────────────────────────────────────────────────

  const handleThemeSelect = (name: ThemeName) => {
    setThemeMenuAnchor(null); setActiveTheme(name); activeThemeRef.current = name;
    editorViewRef.current?.dispatch({ effects: themeCompartment.current.reconfigure(getTheme(name)) });
  };

  // ── Copy ───────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (err) { console.error(err); }
  };

  // ── Button group ───────────────────────────────────────────────────────────

  const buttonGroup = (
    <>
      <Tooltip title={`Theme: ${THEME_LABELS[activeTheme]}`}>
        <IconButton size="small" onClick={(e) => setThemeMenuAnchor(e.currentTarget)}
          sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
          <PaletteOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={themeMenuAnchor} open={Boolean(themeMenuAnchor)} onClose={() => setThemeMenuAnchor(null)}
        slotProps={{ paper: { sx: { bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', minWidth: 140 } } }}>
        {(Object.keys(THEME_LABELS) as ThemeName[]).map((name) => (
          <MenuItem key={name} selected={activeTheme === name} onClick={() => handleThemeSelect(name)}
            sx={{ fontSize: '0.75rem', fontFamily: '"Roboto Mono", monospace', color: activeTheme === name ? 'primary.main' : 'text.secondary', '&:hover': { color: 'text.primary' }, '&.Mui-selected': { bgcolor: 'rgba(0,212,170,0.08)' } }}>
            {THEME_LABELS[name]}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip title="Undo"><IconButton size="small" onClick={handleUndo} disabled={!canUndo}
        sx={{ color: 'text.secondary', opacity: canUndo ? 0.5 : 0.3, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
        <UndoIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>

      <Tooltip title="Redo"><IconButton size="small" onClick={handleRedo} disabled={!canRedo}
        sx={{ color: 'text.secondary', opacity: canRedo ? 0.5 : 0.3, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
        <RedoIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>

      <Tooltip title={isFormatting ? 'Formatting…' : 'Format code'}>
        <IconButton size="small" onClick={handleFormat} disabled={isFormatting}
          sx={{ color: 'text.secondary', opacity: isFormatting ? 0.3 : 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s',
            animation: isFormatting ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}>
          <AutoFixHighIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>

      <Tooltip title={copied ? 'Copied!' : 'Copy'}>
        <IconButton size="small" onClick={handleCopy}
          sx={{ color: copied ? 'primary.main' : 'text.secondary', opacity: copied ? 1 : 0.5, '&:hover': { opacity: 0.8, color: 'primary.main' }, transition: 'all 0.15s' }}>
          <ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>

      <Tooltip title="Clear">
        <IconButton size="small" onClick={() => onChange('')}
          sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 0.8, color: 'secondary.main' }, transition: 'all 0.15s' }}>
          <DeleteOutlineIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minHeight: 0, outline: isDragOver ? '1px solid rgba(0,212,170,0.4)' : '1px solid transparent', transition: 'outline 0.15s' }}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={(e) => { e.preventDefault(); onDrop(); }}>

      {/* ── Header ── */}
      <Box draggable onDragStart={onDragStart}
        onMouseDown={(e) => {
          // If the mousedown target is the header itself (or DragIndicator), allow native drag.
          // But if it came from a child button/icon, suppress it so ResizeDivider mouse events
          // on adjacent panels are not eaten by the browser's drag machinery.
          const el = e.target as HTMLElement;
          if (!el.closest('[data-drag-handle]')) e.currentTarget.setAttribute('draggable', 'false');
        }}
        onMouseUp={(e) => { e.currentTarget.setAttribute('draggable', 'true'); }}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.75, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', cursor: 'grab', userSelect: 'none', flexShrink: 0, '&:active': { cursor: 'grabbing' } }}>

        <DragIndicatorIcon data-drag-handle="true" sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.4, flexShrink: 0 }} />
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: langColor, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"Roboto Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
          {language}
        </Typography>

        {/* Error badge — always visible */}
        {codeError && (
          <Tooltip title={`Line ${codeError.line}: ${codeError.message}`} placement="bottom">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.8, py: 0.2, borderRadius: '3px', bgcolor: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.25)', cursor: 'default', flexShrink: 0 }}>
              <ErrorOutlineIcon sx={{ fontSize: 11, color: '#ff5050' }} />
              <Typography sx={{ fontSize: '0.6rem', color: '#ff5050', fontFamily: '"Roboto Mono", monospace', letterSpacing: '0.04em', whiteSpace: 'nowrap', maxWidth: isCompact ? 60 : 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                L{codeError.line}{!isCompact && `: ${codeError.message}`}
              </Typography>
            </Box>
          </Tooltip>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Desktop: always visible */}
        {!isCompact && buttonGroup}

        {/* Tablet/mobile: collapsible */}
        {isCompact && (
          <>
            {showButtons && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{buttonGroup}</Box>}
            <Tooltip title={buttonsExpanded ? 'Hide tools' : 'Show tools'}>
              <IconButton size="small" onClick={() => setButtonsExpanded((v) => !v)}
                sx={{ color: buttonsExpanded ? 'primary.main' : 'text.secondary', opacity: buttonsExpanded ? 1 : 0.6, '&:hover': { opacity: 1, color: 'primary.main' }, transition: 'all 0.15s', flexShrink: 0 }}>
                {buttonsExpanded ? <CloseIcon sx={{ fontSize: 14 }} /> : <MoreHorizIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* ── CodeMirror ── */}
      <Box ref={editorContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isFocused ? '#151515' : '#121212', transition: 'background-color 0.15s',
          '& .cm-editor':      { flex: 1, height: '100%', fontFamily: '"Roboto Mono", "Courier New", monospace', fontSize: '13px', backgroundColor: '#191919', display: 'flex', flexDirection: 'column' },
          '& .cm-scroller':    { overflow: 'auto', flex: 1 },
          '& .cm-gutters':     { backgroundColor: '#191919', borderRight: 'none' },
          '& .cm-content':     { padding: '14px 16px' },
          '& .cm-lineNumbers': { color: '#666' },
        }}
      />
    </Box>
  );
}
