import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useErrorHandler } from '../hooks/useErrorHandler';
import {
    marketingEmailCampaignsAPI,
    marketingWhatsappCampaignsAPI,
    marketingTemplatesAPI,
    leadsAPI,
    clientGroupsAPI
} from '../services/api';
import {
    Mail,
    MessageCircle,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Send,
    Users,
    ChevronDown,
    Download,
    AlertCircle
} from 'lucide-react';

const Campaigns = () => {
    const { error, loading, setError, handleError, clearError, executeWithErrorHandling } = useErrorHandler();
    const [activeTab, setActiveTab] = useState('email'); // 'email' or 'whatsapp'
    const [campaigns, setCampaigns] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    // Shared data
    const [templates, setTemplates] = useState([]);
    const [leads, setLeads] = useState([]);
    const [groups, setGroups] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        template_id: '',
        lead_ids: [],
        group_ids: [],
        send_immediately: false,
        scheduled_at: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, [activeTab]);

    const fetchInitialData = async () => {
        await executeWithErrorHandling(async () => {
            const api = activeTab === 'email' ? marketingEmailCampaignsAPI : marketingWhatsappCampaignsAPI;

            const [campaignsResponse, templatesResponse, leadsResponse, groupsResponse] = await Promise.all([
                api.list(),
                marketingTemplatesAPI.list(),
                leadsAPI.list({ per_page: 50, page: 1 }),
                clientGroupsAPI.list()
            ]);

            setCampaigns(campaignsResponse.data?.data?.data || campaignsResponse.data?.data || []);
            setTemplates(templatesResponse.data?.data || templatesResponse.data || []);
            setLeads(leadsResponse.data?.data?.leads || []);
            setGroups(groupsResponse.data?.data || []);
        }, 'Data loaded successfully');
    };

    const handleCreate = () => {
        setSelectedCampaign(null);
        setFormData({
            name: '',
            subject: '',
            template_id: '',
            lead_ids: [],
            group_ids: [],
            send_immediately: false,
            scheduled_at: ''
        });
        setShowCreateModal(true);
    };

    const handleEdit = (campaign) => {
        setSelectedCampaign(campaign);
        setFormData({
            name: campaign.name,
            subject: campaign.subject || '',
            template_id: campaign.template_id,
            lead_ids: campaign.lead_ids || [],
            group_ids: campaign.group_ids || [],
            send_immediately: campaign.status === 'sent',
            scheduled_at: campaign.scheduled_at || ''
        });
        setShowCreateModal(true);
    };

    const handleSave = async () => {
        const result = await executeWithErrorHandling(async () => {
            const api = activeTab === 'email' ? marketingEmailCampaignsAPI : marketingWhatsappCampaignsAPI;
            const response = selectedCampaign
                ? await api.update(selectedCampaign.id, formData)
                : await api.create(formData);

            const data = response.data;
            if (!data.success) throw new Error(data.message || 'Failed to save campaign');
            return data;
        }, `${activeTab === 'email' ? 'Email' : 'WhatsApp'} Campaign saved successfully`);

        if (result.success) {
            fetchInitialData();
            setShowCreateModal(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            const result = await executeWithErrorHandling(async () => {
                const api = activeTab === 'email' ? marketingEmailCampaignsAPI : marketingWhatsappCampaignsAPI;
                const response = await api.delete(id);
                if (!response.data.success) throw new Error(response.data.message || 'Failed to delete campaign');
                return response.data;
            }, 'Campaign deleted successfully');

            if (result.success) {
                setCampaigns(campaigns.filter(c => c.id !== id));
            }
        }
    };

    const handleSendCampaign = async (id) => {
        await executeWithErrorHandling(async () => {
            const api = activeTab === 'email' ? marketingEmailCampaignsAPI : marketingWhatsappCampaignsAPI;
            const response = await api.send(id);
            if (!response.data.success) throw new Error(response.data.message || 'Failed to send campaign');
            return response.data;
        }, 'Campaign sending started');

        setCampaigns(campaigns.map(c =>
            c.id === id ? { ...c, status: 'sending' } : c
        ));
    };

    const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.subject && campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-yellow-100 text-yellow-800',
            sending: 'bg-blue-100 text-blue-800',
            sent: 'bg-green-100 text-green-800',
            paused: 'bg-orange-100 text-orange-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Layout>
            <div className="min-h-screen">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
                                <p className="text-gray-600 mt-1">Manage all your marketing campaigns in one place</p>
                            </div>
                            <div className="flex items-center space-x-4 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search campaigns..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white transition-all shadow-md active:scale-95 ${activeTab === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create {activeTab === 'email' ? 'Email' : 'WhatsApp'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Premium Tab Toggle */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mb-4 shadow-inner">
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex items-center space-x-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'email'
                                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                            >
                                <Mail className={`w-4 h-4 ${activeTab === 'email' ? 'text-blue-600' : ''}`} />
                                <span>Email</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('whatsapp')}
                                className={`flex items-center space-x-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'whatsapp'
                                    ? 'bg-white text-green-600 shadow-md ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                            >
                                <MessageCircle className={`w-4 h-4 ${activeTab === 'whatsapp' ? 'text-green-600' : ''}`} />
                                <span>WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm flex items-center">
                            <AlertCircle className="w-5 h-5 mr-3" />
                            <p>{error}</p>
                            <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Campaigns Table */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                                        {activeTab === 'email' && (
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                                        )}
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredCampaigns.length > 0 ? (
                                        filteredCampaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`${activeTab === 'email' ? 'bg-blue-100' : 'bg-green-100'} p-2 rounded-lg mr-3`}>
                                                            {activeTab === 'email' ? <Mail className="w-4 h-4 text-blue-600" /> : <MessageCircle className="w-4 h-4 text-green-600" />}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">{campaign.name}</span>
                                                    </div>
                                                </td>
                                                {activeTab === 'email' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{campaign.subject || '-'}</td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {templates.find(t => t.id === campaign.template_id)?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(campaign.status)}`}>
                                                        {campaign.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-l border-r border-gray-50">
                                                    <div className="flex items-center space-x-2">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span>{campaign.sent_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    {new Date(campaign.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => handleEdit(campaign)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><Edit className="w-4 h-4" /></button>
                                                        {campaign.status === 'scheduled' && (
                                                            <button onClick={() => handleSendCampaign(campaign.id)} className="text-green-600 hover:text-green-900" title="Send Now"><Send className="w-4 h-4" /></button>
                                                        )}
                                                        <button onClick={() => handleDelete(campaign.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={activeTab === 'email' ? 7 : 6} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    {activeTab === 'email' ? <Mail className="w-16 h-16 text-gray-200 mb-4" /> : <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />}
                                                    <p className="text-lg font-medium text-gray-500">No campaigns found</p>
                                                    <p className="text-sm text-gray-400 mt-1">Start by creating your first {activeTab} campaign.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shared Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-all animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className={`${activeTab === 'email' ? 'bg-blue-600' : 'bg-green-600'} px-6 py-4 flex justify-between items-center`}>
                            <h2 className="text-xl font-bold text-white">{selectedCampaign ? 'Edit' : 'Create'} {activeTab === 'email' ? 'Email' : 'WhatsApp'} Campaign</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                                        placeholder="Enter campaign name"
                                    />
                                </div>
                                {activeTab === 'email' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject Line *</label>
                                        <input
                                            type="text"
                                            required={activeTab === 'email'}
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                                            placeholder="Enter subject line"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marketing Template *</label>
                                <select
                                    required
                                    value={formData.template_id}
                                    onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                                >
                                    <option value="">Select Template</option>
                                    {templates.filter(t => t.type === (activeTab === 'email' ? 'email' : 'whatsapp')).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
                                <div className="flex flex-col space-y-4">
                                    {groups.length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 mb-2 block">CLIENT GROUPS</span>
                                            <div className="border border-gray-200 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2 bg-gray-50">
                                                {groups.map(g => (
                                                    <label key={g.id} className="flex items-center space-x-3 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.group_ids?.includes(g.id)}
                                                            onChange={e => {
                                                                const ids = formData.group_ids || [];
                                                                setFormData({ ...formData, group_ids: e.target.checked ? [...ids, g.id] : ids.filter(id => id !== g.id) });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">{g.name} <span className="text-xs text-gray-400 font-normal">({g.client_count} clients)</span></span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <span className="text-xs font-medium text-gray-500 mb-2 block">INDIVIDUAL LEADS</span>
                                        <div className="border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50">
                                            {leads.map(lead => (
                                                <label key={lead.id} className="flex items-center space-x-3 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.lead_ids?.includes(lead.id)}
                                                        onChange={e => {
                                                            const ids = formData.lead_ids || [];
                                                            setFormData({ ...formData, lead_ids: e.target.checked ? [...ids, lead.id] : ids.filter(id => id !== lead.id) });
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">{lead.name || lead.client_name}</span>
                                                        <span className="text-xs text-gray-400">{activeTab === 'email' ? lead.email : lead.phone}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Scheduling Options</label>
                                <div className="flex items-center space-x-8">
                                    <label className="flex items-center space-x-2.5 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="w-4 h-4"
                                            checked={formData.send_immediately}
                                            onChange={() => setFormData({ ...formData, send_immediately: true, scheduled_at: '' })}
                                        />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Send Immediately</span>
                                    </label>
                                    <label className="flex items-center space-x-2.5 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="w-4 h-4"
                                            checked={!formData.send_immediately}
                                            onChange={() => setFormData({ ...formData, send_immediately: false, scheduled_at: new Date().toISOString().slice(0, 16) })}
                                        />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Schedule Performance</span>
                                    </label>
                                </div>
                                {!formData.send_immediately && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            type="datetime-local"
                                            required={!formData.send_immediately}
                                            value={formData.scheduled_at}
                                            onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className={`px-8 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${activeTab === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {selectedCampaign ? 'Update' : 'Launch'} Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Campaigns;
