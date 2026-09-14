import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SaasApp from './SaasApp.tsx';
import './index.css';

createRoot(document.getElementById('saas-root')!).render(
  <StrictMode>
    <SaasApp />
  </StrictMode>
);
