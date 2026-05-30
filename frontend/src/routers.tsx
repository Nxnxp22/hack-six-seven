import { createBrowserRouter } from 'react-router-dom'
import SecurityLockdownPage from './modules/security-lockdown/pages/SecurityLockdownPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SecurityLockdownPage />,
  },
  {
    path: '/security-lockdown',
    element: <SecurityLockdownPage />,
  },
])
