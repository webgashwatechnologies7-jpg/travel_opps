import { useState, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { toast } from 'react-toastify';
import { Plus, Trash2, Phone, User, Tag, ShieldCheck, CheckCircle, X, Search, MoreHorizontal } from 'lucide-react';
import { callsAPI, companySettingsAPI } from '../services/api';

const PhoneNumberMapping = () => {
    const { executeWithErrorHandling } = useErrorHandler();
    const [mappings, setMappings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({
        user_id: '',
        phone_number: '',
        label: '',
        contact_name: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [mappingRes, usersRes] = await Promise.all([
            executeWithErrorHandling(() => callsAPI.getMappings()),
            executeWithErrorHandling(() => companySettingsAPI.getUsers())
        ]);

        if (mappingRes.success) {
            // Backend returns data: { mappings: [...] }
            setMappings(mappingRes.data.data.mappings || []);
        }

        if (usersRes.success) {
            // CompanySettingsController returns data: [...] directly or data.data
            // Standardizing to handle Both structures
            const userData = usersRes.data.data;
            setUsers(Array.isArray(userData) ? userData : (userData.users || []));
        }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.user_id || !form.phone_number) {
            toast.error('User and Phone Number are required');
            return;
        }

        const result = await executeWithErrorHandling(() => callsAPI.createMapping(form), 'Number mapped successfully');
        if (result.success) {
            setShowModal(false);
            setForm({ user_id: '', phone_number: '', label: '', contact_name: '' });
            fetchData();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this mapping?')) return;
        const result = await executeWithErrorHandling(() => callsAPI.deleteMapping(id), 'Mapping removed');
        if (result.success) fetchData();
    };

    const filteredMappings = mappings.filter(m =>
        m.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.label?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Phone Number Mapping</h2>
                    <p className="text-sm text-gray-500 mt-1">Link your employee's SIM numbers to their CRM profiles for automatic call tracking.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                    <Plus className="w-5 h-5" />
                    Add New Mapping
                </button>
            </div>

            {/* Search & Stats */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by phone, name or label..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-gray-500">Total Mapped: </span>
                        <span className="font-bold text-gray-900">{mappings.length}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="text-sm">
                        <span className="text-gray-500">Available Users: </span>
                        <span className="font-bold text-gray-900">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Grid of Mappings */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredMappings.length === 0 ? (
                <div className="bg-white p-20 text-center rounded-xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Mappings Found</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">Start by mapping your first employee's phone number to enable automatic call tracking.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMappings.map((mapping) => (
                        <div key={mapping.id} className="relative group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <Phone className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(mapping.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        {mapping.phone_number}
                                        {mapping.is_active && (
                                            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                                        )}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">MOBILE NUMBER</p>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-blue-100">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                        {mapping.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{mapping.user?.name || 'Unknown User'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">{mapping.label || 'Individual SIM'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-4 right-12">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mapping.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {mapping.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Mapping Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">Map Phone Number</h3>
                            <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    Assign to Employee *
                                </label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                                    value={form.user_id}
                                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select an employee</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-500" />
                                    Employee SIM Number *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                                    placeholder="e.g. 9876543210 (without +91)"
                                    value={form.phone_number}
                                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-blue-500" />
                                        Label (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                                        placeholder="Sales SIM, Personal, etc."
                                        value={form.label}
                                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        Contact Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                                        placeholder="Internal Name"
                                        value={form.contact_name}
                                        onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                                >
                                    Map Number
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneNumberMapping;
