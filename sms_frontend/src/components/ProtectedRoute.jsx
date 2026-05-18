import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // If token is expired
  if (decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // Force password change — allow ONLY /change-password through (or /student/complete-profile for students)
  if (decoded.must_change_password) {
    if (decoded.role === 'student' && location.pathname !== '/student/complete-profile') {
      return <Navigate to="/student/complete-profile" replace />;
    } else if (decoded.role !== 'student' && location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  }

  // Role guard
  if (roles && !roles.includes(decoded.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
