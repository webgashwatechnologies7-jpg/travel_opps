import { useState, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { toast } from 'react-toastify';
import { companyTelephonyAPI } from '../services/api';
import PhoneNumberMapping from './PhoneNumberMapping';
import { Save, CheckCircle, Phone, Settings, Edit2, Info, RefreshCw, AlertCircle, ShieldCheck, Users } from 'lucide-react';

const CompanyTelephonySetup = () => {
    const { executeWithErrorHandling } = useErrorHandler();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('settings');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        telephony_provider: 'exotel',
        exotel_account_sid: '',
        exotel_api_key: '',
        exotel_api_token: '',
        exotel_subdomain: 'api.exotel.com',
        exotel_from_number: '',
        exotel_webhook_secret: '',
        telephony_enabled: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const result = await executeWithErrorHandling(async () => {
            const response = await companyTelephonyAPI.getSettings();
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch settings');
            }
            return response.data.data;
        });

        if (result.success) {
            const data = result.data;
            setSettings(data);
            setForm({
                telephony_provider: data.telephony_provider || 'exotel',
                exotel_account_sid: data.exotel_account_sid || '',
                exotel_api_key: data.exotel_api_key || '',
                exotel_api_token: data.exotel_api_token || '',
                exotel_subdomain: data.exotel_subdomain || 'api.exotel.com',
                exotel_from_number: data.exotel_from_number || '',
                exotel_webhook_secret: data.exotel_webhook_secret || '',
                telephony_enabled: data.telephony_enabled || false,
            });
            if (!data.telephony_provider) {
                setShowForm(true);
            }
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (form.telephony_provider === 'exotel' && (!form.exotel_account_sid || !form.exotel_api_token || !form.exotel_from_number)) {
            toast.error('Account SID, API Token, and From Number are required.');
            return;
        }

        setSaving(true);
        const result = await executeWithErrorHandling(async () => {
            const response = await companyTelephonyAPI.updateSettings(form);
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to update settings');
            }
            return response.data;
        }, 'Telephony settings updated successfully');

        if (result.success) {
            setShowForm(false);
            await fetchSettings();
        }
        setSaving(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'error': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-5 h-5" />;
            case 'pending': return <RefreshCw className="w-5 h-5 animate-spin" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            default: return <Settings className="w-5 h-5" />;
        }
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Phone className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Telephony Integration</h2>
                            <p className="text-blue-100 opacity-90">Manage your cloud telephony (Exotel/Twilio) settings</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-b border-gray-100">
                    <div className="flex px-2 pt-2">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 rounded-t-lg ${activeTab === 'settings'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Settings className="w-4 h-4" />
                            Provider Setup
                        </button>
                        <button
                            onClick={() => setActiveTab('mapping')}
                            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 rounded-t-lg ${activeTab === 'mapping'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Users className="w-4 h-4" />
                            Team Mapping
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'settings' ? (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl ${getStatusColor(settings?.telephony_status)}`}>
                                        {getStatusIcon(settings?.telephony_status)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            Integration Status: <span className="capitalize">{settings?.telephony_status || 'Not Configured'}</span>
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {settings?.telephony_enabled ? 'Calls and recordings are active' : 'Telephony is currently disabled'}
                                        </p>
                                    </div>
                                </div>
                                {!showForm && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Configure Settings
                                    </button>
                                )}
                            </div>

                            {showForm && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Settings className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-bold text-gray-900">Configure Telephony Provider</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Provider</label>
                                            <div className="flex gap-4">
                                                {['exotel', 'twilio'].map((p) => (
                                                    <label key={p} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.telephony_provider === p ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            name="provider"
                                                            value={p}
                                                            checked={form.telephony_provider === p}
                                                            onChange={(e) => setForm({ ...form, telephony_provider: e.target.value })}
                                                        />
                                                        <span className="font-bold capitalize">{p}</span>
                                                        {form.telephony_provider === p && <CheckCircle className="w-5 h-5" />}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {form.telephony_provider === 'exotel' && (
                                            <>
                                                <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                                                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                    <div className="text-sm text-blue-800">
                                                        <p className="font-bold mb-1">How to find these?</p>
                                                        <p>Login to your Exotel Dashboard → API Settings. You will find your Account SID, API Key and Token there.</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">Account SID *</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_account_sid} onChange={(e) => setForm({ ...form, exotel_account_sid: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">API Key</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_api_key} onChange={(e) => setForm({ ...form, exotel_api_key: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">API Token *</label>
                                                    <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_api_token} onChange={(e) => setForm({ ...form, exotel_api_token: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">Subdomain</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_subdomain} onChange={(e) => setForm({ ...form, exotel_subdomain: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">From Number (Virtual Number) *</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_from_number} onChange={(e) => setForm({ ...form, exotel_from_number: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">Webhook Secret (Optional)</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200" value={form.exotel_webhook_secret} onChange={(e) => setForm({ ...form, exotel_webhook_secret: e.target.value })} />
                                                </div>
                                            </>
                                        )}
                                        <div className="md:col-span-2">
                                            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                                                <input type="checkbox" className="w-5 h-5 rounded text-primary" checked={form.telephony_enabled} onChange={(e) => setForm({ ...form, telephony_enabled: e.target.checked })} />
                                                <div>
                                                    <span className="font-bold text-gray-900 block">Enable Telephony Features</span>
                                                    <span className="text-xs text-gray-500">Allow users to make calls and track recordings within the CRM.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-primary text-white font-bold rounded-lg">{saving ? 'Saving...' : 'Save Configuration'}</button>
                                        <button onClick={() => setShowForm(false)} className="px-8 py-3 bg-white text-gray-700 font-bold rounded-lg border">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {!showForm && settings?.telephony_provider && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 font-bold text-gray-900"><ShieldCheck className="w-5 h-5 text-green-600" />Configuration Details</h4>
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                            <p className="text-sm"><strong>Provider:</strong> <span className="capitalize">{settings.telephony_provider}</span></p>
                                            <p className="text-sm"><strong>From Number:</strong> {settings.exotel_from_number}</p>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 text-sm">
                                        <h4 className="font-bold text-indigo-900 mb-2">Integration Help</h4>
                                        <p>Webhook URL:</p>
                                        <code className="block bg-white/50 p-2 rounded mb-2 overflow-x-auto">{window.location.origin}/api/calls/webhooks/exotel</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <PhoneNumberMapping />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyTelephonySetup;
