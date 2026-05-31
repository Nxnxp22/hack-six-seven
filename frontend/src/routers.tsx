import { createBrowserRouter } from 'react-router-dom'
import MainDashboard from './modules/MainDashboard'
import SecurityLockdownPage from './modules/security-lockdown/pages/SecurityLockdownPage'
import PowerOverloadPage from './modules/powerOverload/PowerOverloadPage'
import GamePage from './modules/comm-failure/pages/GamePage'

export const router = createBrowserRouter([
  { path: '/',                   element: <MainDashboard /> },
  { path: '/poweroverload',      element: <PowerOverloadPage /> },
  { path: '/security-lockdown',  element: <SecurityLockdownPage /> },
  { path: '/comm-collapse',      element: <GamePage /> },
])