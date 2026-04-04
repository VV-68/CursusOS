import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    if (decoded.must_change_password && location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }

    if (roles && !roles.includes(decoded.role)) {
      return <Navigate to="/unauthorized" />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
