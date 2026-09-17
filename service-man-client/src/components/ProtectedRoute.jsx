import { Navigate } from 'react-router-dom';

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

export default function ProtectedRoute({ children }) {
  const user = getStoredUser();

  if (!user || user.role !== 'Service Man') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
