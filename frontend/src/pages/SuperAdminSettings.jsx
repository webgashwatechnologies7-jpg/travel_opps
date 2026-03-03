import { useEffect, useState } from 'react';
import { Settings, Save, Globe, Info } from 'lucide-react';
import { superAdminAPI } from '../services/api';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { toast } from 'react-toastify';

const SuperAdminSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/super-admin/settings', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setSettings(prev => prev.map(s => {
            if (s.key === key) {
                // Better toggle logic: if it's currently 'true' or '1' or true, make it 'false'
                const isCurrentlyTrue = s.value === 'true' || s.value === '1' || s.value === true || s.value === 1;
                return { ...s, value: isCurrentlyTrue ? 'false' : 'true' };
            }
            return s;
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/super-admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ settings })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Settings updated successfully!');
                // Wait a bit then refresh to be sure
                setTimeout(fetchSettings, 500);
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Find specific settings
    const singleDomainLogin = settings.find(s => s.key === 'allow_single_domain_login');

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Settings className="w-6 h-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-800">
                            <Globe className="w-5 h-5 text-gray-500" />
                            Domain & Access Controls
                        </h2>

                        <div className="space-y-6">
                            {/* Single Domain Login Toggle */}
                            <div className="flex items-start justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">Allow Single URL Login (Bypass Subdomains)</h3>
                                    <p className="text-sm text-gray-600 mt-1 mr-4">
                                        When enabled, company users can login directly from the main domain/IP without a subdomain.
                                        Subdomains will still work for those who have them configured.
                                        <span className="block mt-1 font-semibold text-blue-600 flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            Useful for testing or if DNS is not pointed yet.
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleToggle('allow_single_domain_login')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${(singleDomainLogin?.value === 'true' || singleDomainLogin?.value === '1' || singleDomainLogin?.value === true || singleDomainLogin?.value === 1) ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(singleDomainLogin?.value === 'true' || singleDomainLogin?.value === '1' || singleDomainLogin?.value === true || singleDomainLogin?.value === 1) ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Placeholder for future settings */}
                            <div className="pt-4 border-t text-sm text-gray-400 italic">
                                More global settings will appear here in future updates.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminSettings;
