import { useMemo } from 'react';
import Box from '@mui/material/Box';

interface PreviewFrameProps {
  html: string;
  css: string;
  js: string;
}

export default function PreviewFrame({ html, css, js }: PreviewFrameProps) {
  const srcDoc = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
${css}
</style>
</head>
<body>
${html}
<script>
try{${js}}catch(e){console.error(e)}
</script>
</body>
</html>`,
    [html, css, js]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#050510' }}>
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin"
        title="preview"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </Box>
  );
}
