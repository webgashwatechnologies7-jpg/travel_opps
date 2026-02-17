import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { companySettingsAPI } from '../services/api';
import {
    Shield,
    CheckCircle,
    Clock,
    CreditCard,
    Zap,
    ArrowUpCircle,
    Package,
    Calendar,
    Info
} from 'lucide-react';
import { toast } from 'react-toastify';

const SubscriptionDetails = () => {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const response = await companySettingsAPI.getSubscription();
            if (response.data?.success) {
                setSubscription(response.data.data);
            } else {
                setError('Failed to load subscription details');
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
            setError(err.response?.data?.message || 'Error fetching subscription details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100 m-4">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="text-red-600 w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchSubscription}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">Plan & Subscription</h1>
                                    <p className="text-blue-100 mt-1">Manage your company subscription and features</p>
                                </div>
                            </div>
                            <div className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                {subscription?.plan_name || 'Active Plan'}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <CreditCard className="w-6 h-6 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Billed At</p>
                                <p className="text-lg font-bold text-gray-900">₹{subscription?.price} <span className="text-xs font-normal text-gray-500">/{subscription?.billing_period}</span></p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-green-50 p-3 rounded-xl">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Expires On</p>
                                <p className="text-lg font-bold text-gray-900">{subscription?.expiry_date || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-purple-50 p-3 rounded-xl">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <p className="text-lg font-bold text-gray-900">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Features List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-gray-900">Included Features</h2>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {subscription?.features?.length || 0} Features Active
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subscription?.features && subscription.features.length > 0 ? (
                                    subscription.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3 p-4 rounded-xl border border-gray-50 bg-gray-50/50 group hover:border-blue-200 hover:bg-white transition-all duration-200">
                                            <div className="bg-green-100 text-green-600 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-sm">{feature.name}</p>
                                                {feature.limit && (
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Limit: {feature.limit}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-12">
                                        <p className="text-gray-500">No specific features listed for this plan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20"></div>

                            <h2 className="text-xl font-bold mb-4 relative">Need More Power?</h2>
                            <p className="text-gray-400 text-sm mb-8 relative">
                                Upgrade to a premium plan to unlock more features, higher limits, and dedicated support for your travel business.
                            </p>

                            <ul className="space-y-4 mb-8 relative">
                                <li className="flex items-center gap-3 text-sm">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span>Higher automation limits</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span>Advanced CRM analytics</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span>Dedicated account manager</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => {
                                    toast.success("Redirecting to upgrade panel...", { position: "top-center" });
                                    setTimeout(() => {
                                        window.open('https://gashwatechnologies.com/contact', '_blank');
                                    }, 1500);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40 relative group"
                            >
                                <ArrowUpCircle className="w-5 h-5 group-hover:animate-bounce" />
                                <span>Upgrade Plan Now</span>
                            </button>

                            <p className="text-center text-[10px] text-gray-500 mt-4">
                                Contact sales for custom enterprise plans
                            </p>
                        </div>

                        {/* Support Info */}
                        <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-900 mb-2">Need Help?</h3>
                            <p className="text-xs text-blue-700 leading-relaxed mb-4">
                                If you have questions about your billing or features, our support team is here to help you.
                            </p>
                            <a href="mailto:support@travelops.com" className="text-xs font-bold text-blue-800 hover:underline">
                                Contact support@travelops.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SubscriptionDetails;
