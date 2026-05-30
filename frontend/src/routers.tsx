import { createBrowserRouter } from 'react-router-dom'
import MainDashboard from './modules/MainDashboard'
import SecurityLockdownPage from './modules/security-lockdown/pages/SecurityLockdownPage'
import PowerOverloadPage from './modules/powerOverload/PowerOverloadPage'

export const router = createBrowserRouter([
  { path: '/',                  element: <MainDashboard /> },
  { path: '/security-lockdown', element: <SecurityLockdownPage /> },
  { path: '/poweroverload',     element: <PowerOverloadPage /> },
  { path: '/game',              element: <PowerOverloadPage /> },
])
