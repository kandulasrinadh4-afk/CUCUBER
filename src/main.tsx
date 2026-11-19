import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign Vite HMR websocket disconnection errors in sandboxed preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (reason.toLowerCase().includes('websocket') || reason.toLowerCase().includes('closed without opened')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
