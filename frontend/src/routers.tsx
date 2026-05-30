import { createBrowserRouter } from 'react-router-dom';
import MainDashboard from './modules/MainDashboard';
import PowerOverloadPage from './modules/powerOverload/PowerOverloadPage';

export const router = createBrowserRouter([
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
]);
