import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApiClientProvider, CodragApiClient } from '@codrag/ui'
import App from './App'
import './index.css'

const apiClient = new CodragApiClient({
  // Use the same origin to leverage Vite proxy.
  // This is required for access via Network IPs (e.g. 192.168.x.x)
  // Vite forwards /projects, /health, etc. to port 8400
  baseUrl: window.location.origin,
})

console.log('[Main] Initialized ApiClient with Proxy baseUrl:', window.location.origin);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientProvider client={apiClient}>
      <App />
    </ApiClientProvider>
  </React.StrictMode>,
)
