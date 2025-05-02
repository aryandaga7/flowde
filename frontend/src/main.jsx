import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.jsx'
import LandingPageRouter from './LandingPageRouter';

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <LandingPageRouter />
  </StrictMode>,
)
