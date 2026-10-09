import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

// Si Supabase no acepta el redirect a /reset-password, el link del correo cae
// en la URL principal (#access_token=…&type=recovery) y el router lo mandaría
// a /login. Se reencamina antes de montar la app, conservando el hash.
if (window.location.hash.includes('type=recovery') && window.location.pathname !== '/reset-password') {
  window.history.replaceState(null, '', `/reset-password${window.location.hash}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
