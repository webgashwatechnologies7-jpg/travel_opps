import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, X, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from './Layout';
import useApi from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

/**
 * Generic Master Page component for CRUD operations on simple resources.
 */
const MasterPage = ({
    title,
    api,
    searchPlaceholder = "Search...",
    fields = [{ name: 'name', label: 'Name', type: 'text', required: true }],
    resourceKey = 'name',
    permissionPrefix = null
}) => {
    const { user } = useAuth();
    const { data: items, loading, error, request: fetchItems } = useApi(api.list);
    const [searchTerm, setSearchTerm] = useState('');
    const [localError, setLocalError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Initialize form data based on fields
    const getInitialFormData = useCallback(() => {
        const data = {};
        fields.forEach(field => {
            data[field.name] = field.defaultValue !== undefined ? field.defaultValue : (field.type === 'select' ? 'active' : '');
        });
        // Always include status if not specified
        if (!data.status && fields.some(f => f.name === 'status')) {
            // status handled by fields
        } else if (!data.status) {
            data.status = 'active';
        }
        return data;
    }, [fields]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        setFormData(getInitialFormData());
    }, [getInitialFormData]);

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.is_super_admin) return true;
        if (!permissionPrefix) return true;
        return user.permissions?.includes(`${permissionPrefix}.${permission}`);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData(getInitialFormData());
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(getInitialFormData());
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setLocalError('');

        try {
            if (editingId) {
                await api.update(editingId, formData);
                toast.success(`${title} updated successfully`);
            } else {
                await api.create(formData);
                toast.success(`${title} added successfully`);
            }
            await fetchItems();
            handleCloseModal();
        } catch (err) {
            setLocalError(err.response?.data?.message || `Failed to save ${title}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const data = {};
        fields.forEach(field => {
            data[field.name] = item[field.name] || '';
        });
        data.status = item.status || 'active';
        setFormData(data);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) return;
        try {
            await api.delete(id);
            toast.success(`${title} deleted successfully`);
            await fetchItems();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to delete ${title}`);
        }
    };

    const handleStatusToggle = async (item) => {
        if (permissionPrefix && !hasPermission('status')) return;
        try {
            const newStatus = (item.status === 'active' || !item.status) ? 'inactive' : 'active';
            await api.update(item.id, { ...item, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            await fetchItems();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const displayItems = (items || []).filter(item => {
        const val = item[resourceKey] || '';
        return val.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-GB');
        } catch {
            return dateString;
        }
    };

    if (loading && (!items || items.length === 0)) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                        {hasPermission('create') && (
                            <button
                                onClick={handleAddNew}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                Add New
                            </button>
                        )}
                    </div>
                </div>

                {(error || localError) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error || localError}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {fields.map(field => (
                                        <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {field.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={fields.length + 4} className="px-6 py-4 text-center text-gray-500">
                                            No {title.toLowerCase()} found
                                        </td>
                                    </tr>
                                ) : (
                                    displayItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            {fields.map(field => (
                                                <td key={field.name} className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item[field.name] || 'N/A'}</div>
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleStatusToggle(item)}
                                                    disabled={permissionPrefix && !hasPermission('status')}
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${(item.status === 'active' || !item.status) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {(item.status === 'active' || !item.status) ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{item.created_by_name || 'System'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(item.updated_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    {hasPermission('edit') && (
                                                        <button onClick={() => handleEdit(item)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full">
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    {hasPermission('delete') && (
                                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full">
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">{editingId ? `Edit ${title}` : `Add ${title}`}</h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="p-6 space-y-4">
                                    {fields.map(field => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} {field.required && '*'}</label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={formData[field.name]}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    required={field.required}
                                                >
                                                    {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    value={formData[field.name] || ''}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    required={field.required}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MasterPage;
