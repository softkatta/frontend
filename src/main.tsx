import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { bootstrapAuth } from '@/store/bootstrap'
import { Toaster } from '@/components/ui/toaster'
import { SiteBrandingProvider } from '@/contexts/SiteBrandingContext'
import App from './App'
import './index.css'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <Provider store={store}>
      <SiteBrandingProvider>
        <App />
      </SiteBrandingProvider>
      <Toaster />
    </Provider>
  </StrictMode>,
)

void bootstrapAuth()
