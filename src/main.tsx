import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { router } from './router'
import { ThemeProvider } from './components/theme-provider'
import { AnimationProvider } from './components/animation-provider'
import { Toaster } from './components/ui/toaster'
import { ErrorBoundary } from './components/error-boundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <AnimationProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AnimationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
