import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import WorkflowEditor from './components/WorkflowEditor';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WorkflowEditor />
    </ThemeProvider>
  );
};

export default App; 