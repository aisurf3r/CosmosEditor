export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function exportAsSeparateFiles(html: string, css: string, js: string) {
  downloadFile('index.html', html, 'text/html');
  setTimeout(() => downloadFile('style.css', css, 'text/css'), 100);
  setTimeout(() => downloadFile('script.js', js, 'text/javascript'), 200);
}

export function exportAsHTML(html: string, css: string, js: string) {
  const document = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodePlay Export</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;
  downloadFile('index.html', document, 'text/html');
}
