import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * FeatureGuard component to protect routes based on subscription plan features.
 * 
 * @param {string} feature - The feature key to check (e.g., 'marketing', 'email_campaigns')
 * @param {React.ReactNode} children - The component to render if feature is enabled
 * @param {string} fallbackUrl - Optional URL to redirect to if feature is missing
 */
const FeatureGuard = ({ feature, children, fallbackUrl }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Super Admins have access to everything
    if (user?.is_super_admin) {
        return children;
    }

    // Ensure plan_features exists
    const features = user?.plan_features || {};

    // Check if feature is enabled
    const isEnabled = features[feature]?.enabled === true;

    if (!isEnabled) {
        // Show toast notification
        setTimeout(() => {
            toast.info(
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">Plan Upgrade Required</span>
                    <span className="text-sm">This feature is not included in your current plan. Please upgrade your plan to access this feature.</span>
                </div>,
                {
                    position: "top-center",
                    autoClose: 5000,
                    theme: "colored",
                    style: { backgroundColor: '#1e3a8a' },
                    toastId: 'feature-restricted'
                }
            );
        }, 100);

        // Redirect to dashboard or fallback
        return <Navigate to={fallbackUrl || "/dashboard"} replace />;
    }

    return children;
};

export default FeatureGuard;
