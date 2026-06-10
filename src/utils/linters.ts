import * as acorn from 'acorn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LintError {
  line:    number;
  message: string;
}

// ════════════════════════════════════════════════════════════════════════════
//  H T M L
// ════════════════════════════════════════════════════════════════════════════

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input',
  'link','meta','param','source','track','wbr',
]);

const DEPRECATED_ELEMENTS = new Set([
  'acronym','applet','basefont','big','blink','center','dir',
  'font','frame','frameset','isindex','marquee','noframes',
  'plaintext','rb','rtc','spacer','strike','tt','xmp',
]);

// Elements that must not contain block-level children
const INLINE_ONLY = new Set(['a','abbr','b','bdi','bdo','cite','code','data',
  'dfn','em','i','kbd','mark','q','rp','rt','ruby','s','samp','small',
  'span','strong','sub','sup','time','u','var','wbr']);

const BLOCK_ELEMENTS = new Set(['address','article','aside','blockquote','dd','details',
  'dialog','div','dl','dt','fieldset','figcaption','figure','footer','form',
  'h1','h2','h3','h4','h5','h6','header','hgroup','hr','li','main','nav',
  'ol','p','pre','section','summary','table','ul']);

function buildLineMap(src: string): (pos: number) => number {
  const s: number[] = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') s.push(i + 1);
  return (pos: number) => {
    let lo = 0, hi = s.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

function checkHTMLAttributes(attrStr: string, lineNum: number, tagName: string): LintError | null {
  // Unclosed quote
  let inQ = false, qCh = '';
  for (const ch of attrStr) {
    if (!inQ && (ch === '"' || ch === "'")) { inQ = true; qCh = ch; }
    else if (inQ && ch === qCh) inQ = false;
  }
  if (inQ) return { line: lineNum, message: `Unclosed attribute quote (${qCh}) in <${tagName}>` };

  // Duplicate attributes
  const seen = new Set<string>();
  const re   = /(?:^|\s)([a-zA-Z][a-zA-Z0-9-:]*)(?:=|(?=\s|\/|>|$))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1].toLowerCase();
    if (seen.has(name)) return { line: lineNum, message: `Duplicate attribute "${name}" in <${tagName}>` };
    seen.add(name);
  }

  // <img> without alt
  if (tagName === 'img' && !seen.has('alt')) {
    return { line: lineNum, message: '<img> is missing the "alt" attribute (accessibility)' };
  }

  return null;
}

export function parseHTMLErrors(text: string): LintError | null {
  if (!text.trim()) return null;
  const lines   = text.split('\n');
  const getLine = buildLineMap(text);

  // 1. Unclosed angle brackets (line by line)
  for (let i = 0; i < lines.length; i++) {
    let open = false, inStr = false, strCh = '';
    for (const ch of lines[i]) {
      if (inStr)  { if (ch === strCh) inStr = false; continue; }
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
      if (ch === '<') { if (open) return { line: i + 1, message: 'Nested "<" — previous tag not closed with ">"' }; open = true; }
      if (ch === '>') open = false;
    }
    if (open) return { line: i + 1, message: 'Unclosed tag — missing ">"' };
  }

  // 2. Tag balance + attribute checks
  const stack: Array<{ tag: string; line: number }> = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^"'>]|"[^"]*"|'[^']*')*)(\/?)>/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(text)) !== null) {
    const isClose = m[1] === '/', tagName = m[2].toLowerCase(), attrStr = m[3] ?? '', isSC = m[4] === '/';
    const line = getLine(m.index);

    if (tagName.startsWith('!') || tagName.startsWith('?')) continue;

    // Deprecated elements
    if (!isClose && DEPRECATED_ELEMENTS.has(tagName)) {
      return { line, message: `<${tagName}> is a deprecated HTML element` };
    }

    // Attribute checks on opening non-self-closing tags
    if (!isClose && !isSC) {
      const err = checkHTMLAttributes(attrStr, line, tagName);
      if (err) return err;
    }

    if (VOID_ELEMENTS.has(tagName) || isSC) continue;

    if (isClose) {
      if (!stack.length) return { line, message: `Unexpected closing tag </${tagName}> — no matching opening tag` };
      const top = stack[stack.length - 1];
      if (top.tag !== tagName) return { line, message: `Expected </${top.tag}> but found </${tagName}>` };
      stack.pop();
    } else {
      // Basic nesting: block element inside inline-only element
      if (stack.length > 0 && INLINE_ONLY.has(stack[stack.length - 1].tag) && BLOCK_ELEMENTS.has(tagName)) {
        return { line, message: `Block element <${tagName}> cannot be nested inside inline element <${stack[stack.length - 1].tag}>` };
      }
      stack.push({ tag: tagName, line });
    }
  }

  if (stack.length > 0) {
    const u = stack[stack.length - 1];
    return { line: u.line, message: `Unclosed tag <${u.tag}>` };
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  C S S
// ════════════════════════════════════════════════════════════════════════════

const KNOWN_CSS_PROPS = new Set([
  // Box model
  'margin','margin-top','margin-right','margin-bottom','margin-left',
  'margin-block','margin-block-start','margin-block-end',
  'margin-inline','margin-inline-start','margin-inline-end',
  'padding','padding-top','padding-right','padding-bottom','padding-left',
  'padding-block','padding-block-start','padding-block-end',
  'padding-inline','padding-inline-start','padding-inline-end',
  'width','height','min-width','max-width','min-height','max-height',
  'inline-size','block-size','min-inline-size','max-inline-size','min-block-size','max-block-size',
  'box-sizing','box-shadow','box-decoration-break',
  // Border
  'border','border-top','border-right','border-bottom','border-left',
  'border-width','border-style','border-color','border-radius',
  'border-top-left-radius','border-top-right-radius',
  'border-bottom-left-radius','border-bottom-right-radius',
  'border-start-start-radius','border-start-end-radius',
  'border-end-start-radius','border-end-end-radius',
  'border-top-width','border-right-width','border-bottom-width','border-left-width',
  'border-top-style','border-right-style','border-bottom-style','border-left-style',
  'border-top-color','border-right-color','border-bottom-color','border-left-color',
  'border-collapse','border-spacing','border-image','border-image-source',
  'border-image-slice','border-image-width','border-image-outset','border-image-repeat',
  'border-block','border-block-start','border-block-end',
  'border-block-color','border-block-style','border-block-width',
  'border-inline','border-inline-start','border-inline-end',
  'border-inline-color','border-inline-style','border-inline-width',
  // Outline
  'outline','outline-width','outline-style','outline-color','outline-offset',
  // Display & position
  'display','position','top','right','bottom','left','z-index','inset',
  'inset-block','inset-block-start','inset-block-end',
  'inset-inline','inset-inline-start','inset-inline-end',
  'float','clear','overflow','overflow-x','overflow-y','overflow-wrap',
  'overflow-anchor','overflow-clip-margin','overflow-block','overflow-inline',
  'visibility','opacity','clip','clip-path','clip-rule',
  // Flexbox
  'flex','flex-direction','flex-wrap','flex-flow',
  'flex-grow','flex-shrink','flex-basis',
  'justify-content','justify-items','justify-self',
  'align-items','align-self','align-content',
  'order','gap','row-gap','column-gap',
  // Grid
  'grid','grid-template','grid-template-columns','grid-template-rows','grid-template-areas',
  'grid-column','grid-row','grid-area','grid-gap',
  'grid-auto-columns','grid-auto-rows','grid-auto-flow',
  'grid-column-start','grid-column-end','grid-row-start','grid-row-end',
  'place-items','place-content','place-self',
  // Typography
  'font','font-family','font-size','font-weight','font-style','font-variant',
  'font-stretch','font-display','font-kerning','font-feature-settings',
  'font-optical-sizing','font-size-adjust','font-synthesis','font-variant-caps',
  'font-variant-numeric','font-variant-ligatures','font-variant-east-asian',
  'font-palette','font-language-override',
  'line-height','letter-spacing','word-spacing','tab-size',
  'text-align','text-align-last','text-decoration','text-decoration-line',
  'text-decoration-color','text-decoration-style','text-decoration-thickness',
  'text-decoration-skip-ink','text-underline-offset','text-underline-position',
  'text-transform','text-indent','text-shadow','text-overflow',
  'text-rendering','text-size-adjust','text-justify','text-wrap',
  'text-emphasis','text-emphasis-color','text-emphasis-style','text-emphasis-position',
  'text-combine-upright','text-orientation','text-anchor',
  'white-space','word-break','word-wrap','vertical-align','line-break',
  'direction','unicode-bidi','writing-mode','hyphens','hanging-punctuation',
  'dominant-baseline','alignment-baseline','baseline-shift',
  // Color & background
  'color','color-scheme','forced-color-adjust','print-color-adjust',
  'background','background-color','background-image',
  'background-repeat','background-position','background-position-x','background-position-y',
  'background-size','background-attachment','background-clip',
  'background-origin','background-blend-mode',
  'flood-color','flood-opacity','lighting-color',
  // Transform & animation
  'transform','transform-origin','transform-style','transform-box',
  'perspective','perspective-origin','backface-visibility','rotate','scale','translate',
  'transition','transition-property','transition-duration',
  'transition-timing-function','transition-delay','transition-behavior',
  'animation','animation-name','animation-duration','animation-timing-function',
  'animation-delay','animation-iteration-count','animation-direction',
  'animation-fill-mode','animation-play-state','animation-timeline',
  'animation-range','animation-range-start','animation-range-end',
  'offset','offset-path','offset-distance','offset-rotate','offset-anchor',
  // Filter & effects
  'filter','backdrop-filter',
  'mask','mask-image','mask-size','mask-repeat','mask-position',
  'mask-clip','mask-origin','mask-composite','mask-type',
  'isolation','mix-blend-mode',
  // Interaction
  'cursor','pointer-events','user-select','touch-action','resize','appearance',
  'scroll-behavior','scroll-snap-type','scroll-snap-align','scroll-snap-stop',
  'scroll-margin','scroll-margin-top','scroll-margin-right','scroll-margin-bottom','scroll-margin-left',
  'scroll-margin-block','scroll-margin-inline',
  'scroll-padding','scroll-padding-top','scroll-padding-right','scroll-padding-bottom','scroll-padding-left',
  'scroll-padding-block','scroll-padding-inline',
  'overscroll-behavior','overscroll-behavior-x','overscroll-behavior-y',
  // Content & lists
  'content','quotes','counter-reset','counter-increment','counter-set',
  'list-style','list-style-type','list-style-position','list-style-image',
  // Table
  'table-layout','caption-side','empty-cells',
  // Object & image
  'object-fit','object-position','image-rendering','image-orientation',
  // Columns
  'columns','column-count','column-width','column-rule',
  'column-rule-width','column-rule-style','column-rule-color','column-span','column-fill',
  // Paging & flow
  'break-before','break-after','break-inside','orphans','widows',
  'page-break-before','page-break-after','page-break-inside',
  // Shapes
  'shape-outside','shape-margin','shape-image-threshold',
  // Container queries
  'container','container-name','container-type',
  'contain','contain-intrinsic-size','contain-intrinsic-width','contain-intrinsic-height',
  // SVG
  'fill','fill-opacity','fill-rule','stroke','stroke-width',
  'stroke-dasharray','stroke-dashoffset','stroke-linecap','stroke-linejoin',
  'stroke-miterlimit','stroke-opacity','stop-color','stop-opacity',
  'color-interpolation','color-interpolation-filters','color-rendering','shape-rendering',
  'marker','marker-start','marker-mid','marker-end','paint-order',
  'glyph-orientation-vertical','enable-background',
  // Misc
  'will-change','all','aspect-ratio','zoom',
  'unicode-range','src',  // @font-face descriptors
]);

const VALID_UNITS = new Set([
  // Length
  'px','em','rem','%','vw','vh','vmin','vmax','vb','vi',
  'svw','svh','dvw','dvh','lvw','lvh',
  'cqw','cqh','cqi','cqb','cqmin','cqmax',
  'pt','pc','cm','mm','in','ex','ch','fr','lh','rlh','cap','ic','q',
  // Angle
  'deg','rad','turn','grad',
  // Time
  'ms','s',
  // Resolution
  'dpi','dpcm','dppx','x',
  // Frequency
  'hz','khz',
]);

function findInvalidUnit(value: string): string | null {
  // Skip values with CSS functions — too complex to validate inside them
  if (/\b(?:var|calc|min|max|clamp|env|url|linear-gradient|radial-gradient|conic-gradient|attr|counter|counters|format|local|rgb|rgba|hsl|hsla|hwb|lch|oklch|lab|oklab|color|image|cross-fade|element|paint)\s*\(/.test(value)) return null;
  // Strip hex colors (#rgb, #rrggbb, #rrggbbaa) before scanning for units
  // so digits inside hex values (e.g. #a855f7 → "55f") are not mistaken for number+unit
  const stripped = value.replace(/#[0-9a-fA-F]{3,8}\b/g, '');
  // Negative lookbehind: skip numbers preceded by letter, #, or - (e.g. preserve-3d)
  const re = /(?<![a-zA-Z#\-])(\d+\.?\d*)([a-zA-Z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const unit = m[2].toLowerCase();
    if (!VALID_UNITS.has(unit)) return m[2];
  }
  return null;
}

export function parseCSSErrors(text: string): LintError | null {
  if (!text.trim()) return null;
  const lines = text.split('\n');

  let depth       = 0;
  let inComment   = false;
  let inKeyframes = false;
  let kfDepth     = 0;
  const openLines: number[] = [];
  // Per-block duplicate property tracking: stack of sets
  const propSets: Array<Set<string>> = [];

  for (let i = 0; i < lines.length; i++) {
    const raw     = lines[i];
    const trimmed = raw.trim();

    // ── Character-level: brace + comment tracking ───────────────────────────
    for (let j = 0; j < raw.length; j++) {
      if (!inComment && raw[j] === '/' && raw[j+1] === '*') { inComment = true;  j++; continue; }
      if ( inComment && raw[j] === '*' && raw[j+1] === '/') { inComment = false; j++; continue; }
      if (inComment) continue;

      if (raw[j] === '{') {
        depth++;
        openLines.push(i + 1);
        if (inKeyframes) kfDepth++;
        propSets.push(new Set());
      } else if (raw[j] === '}') {
        depth--;
        if (depth < 0) return { line: i + 1, message: 'Unexpected "}" — no matching opening "{"' };
        openLines.pop();
        propSets.pop();
        if (inKeyframes) { kfDepth--; if (kfDepth <= 0) { inKeyframes = false; kfDepth = 0; } }
      }
    }
    if (inComment) continue;

    // ── Line-level: skip non-declaration lines ──────────────────────────────
    if (/^@keyframes\s/i.test(trimmed)) { inKeyframes = true; kfDepth = 0; continue; }
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('@') ||
        trimmed.includes('{') || trimmed === '}' || trimmed === '*/') continue;

    // ── Declaration checks (inside blocks, not @keyframes) ──────────────────
    if (depth > 0 && !inKeyframes) {

      // Unclosed strings
      if ((trimmed.match(/"/g)  ?? []).length % 2 !== 0) return { line: i + 1, message: 'Unclosed string — missing closing \'"\''}; 
      if ((trimmed.match(/'/g)  ?? []).length % 2 !== 0) return { line: i + 1, message: "Unclosed string — missing closing \"'\"" };

      // Lines without colon: either a lone property name (error) or continuation value (skip)
      if (!trimmed.includes(':')) {
        const isPropName = /^-?[a-zA-Z][a-zA-Z0-9-]*$/.test(trimmed.replace(/;$/, '').trim());
        if (!isPropName) continue; // continuation value line (e.g., multi-line box-shadow)
        return { line: i + 1, message: `Missing ":" — "${trimmed}" is not a complete declaration` };
      }

      const colonIdx = trimmed.indexOf(':');
      const prop     = trimmed.slice(0, colonIdx).trim();
      const rawVal   = trimmed.slice(colonIdx + 1).trim();
      const val      = rawVal.replace(/;$/, '').trim();

      // Empty value — allow multi-line (next non-empty line is indented)
      if (!val) {
        let next = i + 1;
        while (next < lines.length && !lines[next].trim()) next++;
        const isContinuation = next < lines.length && /^\s{2,}|\t/.test(lines[next]);
        if (!isContinuation) return { line: i + 1, message: `Empty value for property "${prop}"` };
        continue;
      }

      // Missing semicolon (only when next line is also a declaration)
      if (!trimmed.endsWith(';') && !trimmed.endsWith(',') && !trimmed.endsWith('{')) {
        let next = i + 1;
        while (next < lines.length && !lines[next].trim()) next++;
        if (next < lines.length) {
          const nt = lines[next].trim();
          if (nt.includes(':') && /^-?[a-zA-Z*]/.test(nt) && !nt.startsWith('/*')) {
            return { line: i + 1, message: `Missing ";" after "${prop}: ${val}"` };
          }
        }
      }

      // Skip custom properties and vendor-prefixed
      const isCustom = prop.startsWith('--');
      const isVendor = /^-(?:webkit|moz|ms|o)-/.test(prop);
      if (isCustom || isVendor) continue;

      // Unknown property (whitelist check)
      if (!KNOWN_CSS_PROPS.has(prop)) {
        return { line: i + 1, message: `Unknown CSS property "${prop}"` };
      }

      // Duplicate property in same block
      const currentSet = propSets[propSets.length - 1];
      if (currentSet) {
        if (currentSet.has(prop)) {
          return { line: i + 1, message: `Duplicate property "${prop}" in the same rule block` };
        }
        currentSet.add(prop);
      }

      // Invalid unit in value (skip functions and special values)
      if (!val.includes('(')) {
        const badUnit = findInvalidUnit(val);
        if (badUnit) return { line: i + 1, message: `Invalid unit "${badUnit}" in "${prop}"` };
      }
    }
  }

  if (depth > 0) return { line: openLines[openLines.length - 1] ?? lines.length, message: 'Unclosed rule block — missing "}"' };
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  J A V A S C R I P T
// ════════════════════════════════════════════════════════════════════════════

/**
 * Full structural scanner.
 * Handles: single/double-quoted strings, template literals (including nested
 * ${...} expressions), line comments, block comments.
 * Tracks {}, (), [] balance precisely.
 */
function checkJSStructure(code: string): LintError | null {
  type BrType = 'brace' | 'paren' | 'bracket';
  type State  = 'code' | 'str1' | 'str2' | 'tmpl' | 'block_cmt';

  const bracketStack: Array<{ type: BrType; line: number; isTemplExpr?: boolean }> = [];
  // templateStack tracks whether each bracket-stack entry at tmpl boundary should return to tmpl
  let state: State = 'code';

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw     = lines[i];
    const lineNum = i + 1;

    for (let j = 0; j < raw.length; j++) {
      const ch   = raw[j];
      const next = raw[j + 1] ?? '';

      // ── Block comment ──────────────────────────────────────────────────────
      if (state === 'block_cmt') {
        if (ch === '*' && next === '/') { state = 'code'; j++; }
        continue;
      }

      // ── Single-quoted string ───────────────────────────────────────────────
      if (state === 'str1') {
        if (ch === '\\') { j++; continue; }
        if (ch === "'") state = 'code';
        continue;
      }

      // ── Double-quoted string ───────────────────────────────────────────────
      if (state === 'str2') {
        if (ch === '\\') { j++; continue; }
        if (ch === '"') state = 'code';
        continue;
      }

      // ── Template literal ───────────────────────────────────────────────────
      if (state === 'tmpl') {
        if (ch === '\\') { j++; continue; }
        if (ch === '`') { state = 'code'; continue; } // end of template
        if (ch === '$' && next === '{') {
          // Enter template expression — push a brace that knows it's a tmpl expr
          bracketStack.push({ type: 'brace', line: lineNum, isTemplExpr: true });
          state = 'code';
          j++; // consume '{'
          continue;
        }
        continue; // template literal text — ignore everything else
      }

      // ── Normal code ───────────────────────────────────────────────────────
      if (ch === '/' && next === '/') break; // line comment — skip rest of line
      if (ch === '/' && next === '*') { state = 'block_cmt'; j++; continue; }
      if (ch === "'") { state = 'str1'; continue; }
      if (ch === '"') { state = 'str2'; continue; }
      if (ch === '`') { state = 'tmpl'; continue; }

      if (ch === '{' || ch === '(' || ch === '[') {
        const type: BrType = ch === '{' ? 'brace' : ch === '(' ? 'paren' : 'bracket';
        bracketStack.push({ type, line: lineNum });
        continue;
      }

      if (ch === '}' || ch === ')' || ch === ']') {
        const expectedType: BrType = ch === '}' ? 'brace' : ch === ')' ? 'paren' : 'bracket';
        const openChar             = ch === '}' ? '{' : ch === ')' ? '(' : '[';

        if (!bracketStack.length) {
          return { line: lineNum, message: `Unexpected "${ch}" — no matching "${openChar}"` };
        }

        const top = bracketStack[bracketStack.length - 1];

        if (top.type !== expectedType) {
          const topOpen = top.type === 'brace' ? '{' : top.type === 'paren' ? '(' : '[';
          return { line: lineNum, message: `Mismatched "${ch}" — expected to close "${topOpen}" (opened at line ${top.line})` };
        }

        bracketStack.pop();

        // If this brace closed a template expression, return to template state
        if (ch === '}' && top.isTemplExpr) state = 'tmpl';
        continue;
      }
    }
  }

  // Unclosed structural issues
  if (state === 'str1')     return { line: lines.length, message: "Unclosed string — missing \"'\"" };
  if (state === 'str2')     return { line: lines.length, message: 'Unclosed string — missing \'"\''}; 
  if (state === 'tmpl')     return { line: lines.length, message: 'Unclosed template literal — missing closing backtick' };
  if (state === 'block_cmt')return { line: lines.length, message: 'Unclosed block comment — missing */' };

  if (bracketStack.length > 0) {
    const top     = bracketStack[bracketStack.length - 1];
    const openCh  = top.type === 'brace' ? '{' : top.type === 'paren' ? '(' : '[';
    const closeCh = top.type === 'brace' ? '}' : top.type === 'paren' ? ')' : ']';
    return { line: top.line, message: `Unclosed "${openCh}" — missing "${closeCh}"` };
  }

  return null;
}

export function detectJSError(code: string): LintError | null {
  if (!code.trim()) return null;

  // Pass 1 — structural scanner (strings, template literals, comments, brackets)
  const structErr = checkJSStructure(code);

  // Pass 2 — acorn full parse as module
  let acornErr: LintError | null = null;
  try { acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }); }
  catch (e: any) { if (e.loc) acornErr = { line: e.loc.line, message: e.message }; }

  // Pass 3 — acorn as script (may catch different things)
  if (!acornErr) {
    try { acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' }); }
    catch (e: any) { if (e.loc) acornErr = { line: e.loc.line, message: e.message }; }
  }

  // Return earliest error
  if (structErr && acornErr) return structErr.line <= acornErr.line ? structErr : acornErr;
  return structErr ?? acornErr;
}