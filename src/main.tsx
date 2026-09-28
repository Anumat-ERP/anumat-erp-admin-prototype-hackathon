import { ToastProvider, TooltipProvider } from '@repo/ui';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router';
import { App } from './App';
import { StoreProvider } from './data/store';
import './styles/app.css';

// GitHub Pages serves 404.html (a copy of index.html) for deep links; the single-page
// artifact build can't own its URL, so it keeps the route in memory.
const Router =
  import.meta.env.MODE === 'artifact'
    ? ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>
    : ({ children }: { children: ReactNode }) => (
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>{children}</BrowserRouter>
      );

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <TooltipProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </TooltipProvider>
      </StoreProvider>
    </Router>
  </StrictMode>,
);
