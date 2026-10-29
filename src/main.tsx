import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import SeeDatenProvider from './context/SeeDatenProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SeeDatenProvider>
        <App />
      </SeeDatenProvider>
    </BrowserRouter>
  </StrictMode>,
)
