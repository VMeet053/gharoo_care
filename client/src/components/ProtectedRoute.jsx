import { Navigate } from 'react-router-dom';

function getStoredAdminUser() {
  const raw = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
  return raw ? JSON.parse(raw) : null;
}

export default function ProtectedRoute({ children }) {
  const user = getStoredAdminUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
