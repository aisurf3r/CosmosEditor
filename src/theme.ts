import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#121212',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#e8e8e8',
      secondary: '#888888',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2a2a transparent',
          boxSizing: 'border-box',
        },
        '*::-webkit-scrollbar': {
          width: '5px',
          height: '5px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#3a3a3a',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#4a4a4a',
        },
        'body, html, #root': {
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          height: '100%',
        },
      },
    },
  },
});

export default theme;
