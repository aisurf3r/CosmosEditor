<div align="center">

# 🌌 COSMOS 3DITOR

### A sleek, browser-based HTML · CSS · JS playground

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-6-D30707?style=flat-square)](https://codemirror.net)
[![MUI](https://img.shields.io/badge/MUI-5-007FFF?style=flat-square&logo=mui)](https://mui.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-00d4aa?style=flat-square)](LICENSE)

[**Live Demo →**](https://cosmoseditor.vercel.app) · [Report a bug](https://github.com/aisurf3r/CosmosEditor/issues) · [Request a feature](https://github.com/aisurf3r/CosmosEditor/issues)

</div>
<img width="1920" height="963" alt="{C0C96F4B-4870-4473-A748-0634224A4109}" src="https://github.com/user-attachments/assets/e29d5523-c2c9-4a86-be5b-c6d6a3e35d7f" />

---

## ✨ Features

### 🖊️ Editor
- **CodeMirror 6** — professional-grade editing engine (the same core as VS Code)
- **Syntax highlighting** for HTML, CSS and JavaScript
- **Real-time error detection** with precise line marking and inline badge
- **Autocompletion** for HTML tags, CSS properties and JS keywords
- **Auto bracket closing** — `{`, `(`, `[`, `"`, `'`
- **Code formatting** via Prettier (HTML · CSS · JS)
- **Native undo / redo** — full history, keyboard shortcuts included
- **5 themes** — One Dark · Cosmos · Dracula · Solarized Light · Monokai

### 🔴 Live Preview
- Instant render of HTML + CSS + JS in an isolated `<iframe>`
- **Pause / Resume** toggle to stop unwanted re-renders while editing
- Resizable preview pane — drag the divider to your liking

### 🗂️ Panels
- **Drag & drop** panel reordering — swap HTML · CSS · JS freely
- **Resizable columns** — drag the vertical dividers between panels
- **Horizontal / Vertical** layout toggle
- Responsive layout — stacks vertically on tablet automatically

### 📤 Export & Share
- **Export as 3 separate files** — `index.html` · `styles.css` · `script.js`
- **Export as single HTML file** — everything inlined, ready to share
- **Share via URL** — encodes the full project in a hash link, no server needed

---

## 🛠️ Tech Stack

| Layer | Library | Purpose |
|---|---|---|
| UI Framework | React 18 + TypeScript | Component architecture |
| Build Tool | Vite 5 | Fast dev server & bundler |
| Component Library | Material UI 5 | Layout, icons, theming |
| Code Editor | CodeMirror 6 | Editor engine |
| Syntax Parsing | Acorn | Precise JS error positions |
| Code Formatting | Prettier 3 | Auto-format HTML · CSS · JS |
| Deployment | Vercel | Serverless hosting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repo
git clone https://github.com/aisurf3r/CosmosEditor.git
cd CosmosEditor

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl / ⌘` + `Z` | Undo |
| `Ctrl / ⌘` + `Y` | Redo |
| `Ctrl / ⌘` + `Shift` + `Z` | Redo (alternative) |
| `Tab` | Indent (2 spaces) |
| `Ctrl / ⌘` + `Space` | Trigger autocomplete |

---

## 🎨 Themes

| Theme | Style | Best for |
|---|---|---|
| **One Dark** | Dark, blue-grey | Default — easy on the eyes |
| **Cosmos** | Dark, teal & purple | Matches the app aesthetic |
| **Dracula** | Dark, pink & green | High contrast fans |
| **Solarized Light** | Light, warm tones | Daylight / bright environments |
| **Monokai** | Dark, vibrant | Classic Sublime Text feel |

Switch themes via the 🎨 palette button in each panel's header.

---

## 🔍 Error Detection

Cosmos 3ditor performs real-time static analysis on all three languages:

**HTML**
- Unclosed tags (`<div>` without `</div>`)
- Tag mismatch (`</span>` where `</div>` expected)
- Unclosed attribute quotes
- Duplicate attributes on the same tag

**CSS**
- Unbalanced braces `{` / `}`
- Missing `:` in declarations
- Empty property values
- Unclosed strings

**JavaScript**
- Full syntax parsing via **Acorn** — same parser used by Babel and Webpack
- Exact character-level error position with line marking

---

## 📁 Project Structure

```
src/
├── components/
│   ├── EditorPanel.tsx     # Code editor (CodeMirror + linter + themes)
│   ├── PreviewFrame.tsx    # Live preview iframe
│   ├── ResizeDivider.tsx   # Draggable resize handle
│   └── ExportMenu.tsx      # Export dropdown
├── utils/
│   └── defaultCode.ts      # Initial demo code
├── App.tsx                 # Layout, state, drag & drop
└── theme.ts                # MUI dark theme config
```

---

## 🗺️ Roadmap

- [ ] Console panel — capture `console.log` and runtime errors from the preview
- [ ] Local storage persistence — auto-save your work between sessions
- [ ] Multiple tabs / projects
- [ ] Emmet abbreviation support
- [ ] Import external libraries via CDN (React, Three.js, etc.)

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome.
Feel free to open an [issue](https://github.com/aisurf3r/CosmosEditor/issues) or submit a pull request.

1. Fork the project
2. Create your feature branch — `git checkout -b feature/my-feature`
3. Commit your changes — `git commit -m 'Add my feature'`
4. Push to the branch — `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ☕ by [aisurf3r](https://github.com/aisurf3r)

</div>
