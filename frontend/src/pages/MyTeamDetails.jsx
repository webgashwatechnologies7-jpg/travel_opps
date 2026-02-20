import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { companySettingsAPI, usersAPI, leadsAPI } from '../services/api';
import { Loader2, User, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, FileText, Activity, MessageSquare } from 'lucide-react';

const MyTeamDetails = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [communications, setCommunications] = useState([]);
    const [assignedLeads, setAssignedLeads] = useState([]);
    const [createdLeads, setCreatedLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assigned'); // assigned, created, logs, communications

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch User Details
                const userRes = await companySettingsAPI.getUserDetails(id);
                if (userRes.data?.success) {
                    setUser(userRes.data.data);
                }

                // Fetch Stats
                const statsRes = await companySettingsAPI.getDetailedUserStats(id);
                if (statsRes.data?.success) {
                    setStats(statsRes.data.data);
                }

                // Fetch Logs (initial page)
                fetchLogs();
                fetchCommunications();

                // Fetch Leads
                fetchLeads('assigned');
                fetchLeads('created');

            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchLogs = async (page = 1) => {
        try {
            const res = await companySettingsAPI.getUserLogs(id, { page });
            if (res.data?.success) {
                setLogs(res.data.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const fetchCommunications = async () => {
        try {
            const res = await companySettingsAPI.getUserCommunications(id);
            if (res.data?.success) {
                setCommunications(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching communication logs:', error);
        }
    };

    const fetchLeads = async (type) => {
        try {
            const filters = type === 'assigned' ? { assigned_to: id } : { created_by: id };
            const res = await leadsAPI.list(filters);
            if (res.data?.success) {
                if (type === 'assigned') setAssignedLeads(res.data.data.leads || []);
                else setCreatedLeads(res.data.data.leads || []);
            }
        } catch (error) {
            console.error(`Error fetching ${type} leads:`, error);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="p-6 text-center text-gray-500">User not found</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                        {user.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {user.roles?.[0]?.name || user.roles?.[0] || 'Team Member'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['week', 'month', 'year'].map((range) => (
                            <div key={range} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-lg font-semibold capitalize mb-4 text-gray-700 border-b pb-2">
                                    This {range}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Leads Assigned</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-2xl font-bold text-gray-900">{stats[range].total_assigned}</span>
                                            <div className="text-xs text-right">
                                                <div className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {Object.entries(stats[range].assigned).find(([k]) => k.toLowerCase().includes('confirm') || k.toLowerCase().includes('won'))?.[1] || 0} Won
                                                </div>
                                                <div className="text-red-600 flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" />
                                                    {Object.entries(stats[range].assigned).find(([k]) => k.toLowerCase().includes('cancel') || k.toLowerCase().includes('lost'))?.[1] || 0} Lost
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Leads Created</p>
                                        <span className="text-xl font-bold text-gray-900">{stats[range].total_created}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs & Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="border-b px-6">
                        <div className="flex gap-6 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('assigned')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assigned'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Assigned Leads ({assignedLeads.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('created')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'created'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Created Leads ({createdLeads.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'logs'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Activity Logs
                            </button>
                            <button
                                onClick={() => setActiveTab('communications')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'communications'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Communications ({communications.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'logs' ? (
                            <div className="space-y-4">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 items-start">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {log.activity_description || log.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </span>
                                                    {log.lead && (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded">
                                                            Lead #{log.lead.id} ({log.lead.destination})
                                                        </span>
                                                    )}
                                                    <span className="uppercase tracking-wider">{log.activity_type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500">No activity logs found.</div>
                                )}
                            </div>
                        ) : activeTab === 'communications' ? (
                            <div className="space-y-4">
                                {communications.length > 0 ? (
                                    communications.map((comm, index) => (
                                        <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 items-start hover:bg-gray-100 transition-colors">
                                            <div className={`p-2 rounded-full mt-1 ${comm.type === 'whatsapp' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {comm.type === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-medium text-gray-900">
                                                        {comm.type === 'whatsapp' ? 'WhatsApp Message' : (comm.subject || 'Email Sent')}
                                                    </h3>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(comm.created_at).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                                    {comm.type === 'whatsapp' ? comm.message : comm.body?.replace(/<[^>]+>/g, '')?.substring(0, 200) + (comm.body?.length > 200 ? '...' : '')}
                                                </p>

                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                                                    <span className="bg-gray-200 px-2 py-0.5 rounded">
                                                        To: {comm.to || comm.to_email}
                                                    </span>
                                                    {comm.lead && (
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded cursor-pointer hover:underline" onClick={() => window.open(`/leads/${comm.lead.id}`, '_blank')}>
                                                            Lead: {comm.lead.client_name}
                                                        </span>
                                                    )}
                                                    {comm.status && (
                                                        <span className={`px-2 py-0.5 rounded capitalize ${comm.status === 'sent' || comm.status === 'read' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {comm.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500">No communication logs found.</div>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Client</th>
                                            <th className="px-4 py-3">Destination</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === 'assigned' ? assignedLeads : createdLeads).map((lead) => (
                                            <tr key={lead.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    <div>{lead.client_name}</div>
                                                    <div className="text-xs text-gray-500">{lead.phone}</div>
                                                </td>
                                                <td className="px-4 py-3">{lead.destination || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${lead.status === 'confirmed' || lead.status === 'won' ? 'bg-green-100 text-green-700' :
                                                        lead.status === 'cancelled' || lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                    <div className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-4 py-3">{lead.source}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(activeTab === 'assigned' ? assignedLeads : createdLeads).length === 0 && (
                                    <div className="text-center py-10 text-gray-500">No leads found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MyTeamDetails;
