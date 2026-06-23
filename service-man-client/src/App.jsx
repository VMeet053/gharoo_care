import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Earnings from './pages/Earnings';

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      {
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'leads', element: <Leads /> },
          { path: 'work-orders', element: <WorkOrders /> },
          { path: 'work-orders/:id', element: <WorkOrderDetail /> },
          { path: 'earnings', element: <Earnings /> },
        ],
      },
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
], {
  basename: '/service',
});

export default function App() {
  return <RouterProvider router={router} />;
}
