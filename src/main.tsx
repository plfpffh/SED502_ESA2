/**
 * main.tsx – Einstiegspunkt: Router und die Provider für Messwerte und Filter um die App legen
 *
 * @project  FERNFH SED502 Frontend Development WS 2026/27 ESA 2: Seen im Klimawandel
 * @author   Peter Luckmann
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import SeeDatenProvider from './context/SeeDatenProvider.tsx'
import SeenFilterProvider from './context/SeenFilterProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SeeDatenProvider>
        <SeenFilterProvider>
          <App />
        </SeenFilterProvider>
      </SeeDatenProvider>
    </BrowserRouter>
  </StrictMode>,
)
