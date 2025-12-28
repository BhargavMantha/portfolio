import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useUniverseStore } from './store/universeStore'

// Expose store to window for testing
if (import.meta.env.DEV) {
  (window as any).useUniverseStore = useUniverseStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
