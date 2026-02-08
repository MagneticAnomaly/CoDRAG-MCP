import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApiClientProvider, CodragApiClient } from '@codrag/ui'
import App from './App'
import './index.css'

const apiClient = new CodragApiClient({
  baseUrl: window.location.origin,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientProvider client={apiClient}>
      <App />
    </ApiClientProvider>
  </React.StrictMode>,
)
