import { createHashRouter } from 'react-router-dom';
import MainDashboard from './modules/MainDashboard';
import PowerOverloadPage from './modules/powerOverload/PowerOverloadPage';
import ModulePlaceholder from './modules/ModulePlaceholder';

export const router = createHashRouter([
  {
    path: '/',
    element: <MainDashboard />,
  },
  {
    path: '/poweroverload',
    element: <PowerOverloadPage />,
  },
  {
    path: '/game',
    element: <PowerOverloadPage />,
  },
  {
    path: '/reaction-failure',
    element: <ModulePlaceholder title="Reaction Failure" />,
  },
  {
    path: '/comm-collapse',
    element: <ModulePlaceholder title="Comm Collapse" />,
  },
  {
    path: '/security-lockdown',
    element: <ModulePlaceholder title="Security Lockdown" />,
  },
]);
