import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children, allowManager = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isAdmin = user?.is_super_admin || user?.roles?.some(r => {
        const roleName = typeof r === 'string' ? r : r.name;
        return ['Admin', 'Company Admin', 'Super Admin'].includes(roleName);
    });

    const isManager = user?.roles?.some(r => {
        const roleName = typeof r === 'string' ? r : r.name;
        return ['Manager', 'Team Leader'].includes(roleName);
    });

    if (!user || !user.id || (!isAdmin && (!allowManager || !isManager))) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;
