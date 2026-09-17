import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import PremiumUserList from './pages/PremiumUserList';
import ServiceUserList from './pages/ServiceUserList';
import ServicePrice from './pages/ServicePrice';
import Leads from './pages/Leads';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import StatusPending from './pages/StatusPending';
import StatusCompleted from './pages/StatusCompleted';
import Payment from './pages/Payment';
import Charts from './pages/Charts';
import Tables from './pages/Tables';
import Forms from './pages/Forms';
import Modals from './pages/Modals';
import Alerts from './pages/Alerts';
import Components from './pages/Components';
import AddUser from './pages/AddUser';
import CreateAgent from './pages/CreateAgent';
import UserDetails from './pages/UserDetails';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import UserPanelHero from './pages/UserPanelHero';
import UserPanelAbout from './pages/UserPanelAbout';
import UserPanelServices from './pages/UserPanelServices';
import UserPanelTestimonials from './pages/UserPanelTestimonials';
import UserPanelPricing from './pages/UserPanelPricing';
import UserPanelContact from './pages/UserPanelContact';
import UserPanelBrandMarquee from './pages/UserPanelBrandMarquee';
import UserPanelNewSection from './pages/UserPanelNewSection';
import UserPanelWhyChoose from './pages/UserPanelWhyChoose';
import UserPanelCompletedProjects from './pages/UserPanelCompletedProjects';
import UserPanelServiceSlider from './pages/UserPanelServiceSlider';
import UserPanelStats from './pages/UserPanelStats';
import UserPanelHeader from './pages/UserPanelHeader';
import UserPanelFooter from './pages/UserPanelFooter';
import WorkOrders from './pages/WorkOrders';

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      { path: '500', element: <ServerError /> },
      {
        element: <ProtectedRoute><Layout /></ProtectedRoute>,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'users', element: <Users /> },
          { path: 'work-orders', element: <WorkOrders /> },
          { path: 'premium-user-list', element: <PremiumUserList /> },
          { path: 'service-user-list', element: <ServiceUserList /> },
          { path: 'service-price', element: <ServicePrice /> },
          { path: 'leads', element: <Leads /> },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
          { path: 'status/pending', element: <StatusPending /> },
          { path: 'status/completed', element: <StatusCompleted /> },
          { path: 'payment', element: <Payment /> },
          { path: 'charts', element: <Charts /> },
          { path: 'tables', element: <Tables /> },
          { path: 'forms', element: <Forms /> },
          { path: 'modals', element: <Modals /> },
          { path: 'alerts', element: <Alerts /> },
          { path: 'components', element: <Components /> },
          { path: 'add-user', element: <AddUser /> },
          { path: 'create-agent', element: <CreateAgent /> },
          { path: 'user-details', element: <UserDetails /> },
          { path: 'user-panel/hero', element: <UserPanelHero /> },
          { path: 'user-panel/about', element: <UserPanelAbout /> },
          { path: 'user-panel/services', element: <UserPanelServices /> },
          { path: 'user-panel/testimonials', element: <UserPanelTestimonials /> },
          { path: 'user-panel/pricing', element: <UserPanelPricing /> },
          { path: 'user-panel/contact', element: <UserPanelContact /> },
          { path: 'user-panel/brand-marquee', element: <UserPanelBrandMarquee /> },
          { path: 'user-panel/new-section', element: <UserPanelNewSection /> },
          { path: 'user-panel/why-choose', element: <UserPanelWhyChoose /> },
          { path: 'user-panel/completed-projects', element: <UserPanelCompletedProjects /> },
          { path: 'user-panel/service-slider', element: <UserPanelServiceSlider /> },
          { path: 'user-panel/stats', element: <UserPanelStats /> },
          { path: 'user-panel/header', element: <UserPanelHeader /> },
          { path: 'user-panel/footer', element: <UserPanelFooter /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
], {
  basename: '/admin',
});

export default function App() {
  return <RouterProvider router={router} />;
}
