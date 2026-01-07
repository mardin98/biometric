import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { brandConfig } from './config' // Importar config

// CAMBIO DE TÍTULO DINÁMICO
document.title = `${brandConfig.appName} - Panel de Control`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
