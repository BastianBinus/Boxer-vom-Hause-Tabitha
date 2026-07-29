import { RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './auth/AuthProvider'
import { router } from './router'
import './styles/tokens.css'
import './styles/dashboard.css'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
    </AuthProvider>
  )
}
