import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './index.css' // 1. Primero Tailwind
import './App.css'   // 2. Luego tus estilos personalizados

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)