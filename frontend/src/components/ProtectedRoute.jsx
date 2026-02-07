import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isMainDomain } from '../utils/domainUtils';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user exists and has an id
  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }

  // Main domain (127.0.0.1, localhost, IP): super admin ko sirf /super-admin access, company dashboard nahi
  if (user.is_super_admin && isMainDomain()) {
    return <Navigate to="/super-admin" replace />;
  }

  return children;
};

export default ProtectedRoute;

