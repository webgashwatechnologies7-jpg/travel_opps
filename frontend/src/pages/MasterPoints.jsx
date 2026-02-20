import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit, X, Trash2, Check, AlertCircle } from 'lucide-react';
import { masterPointsAPI } from '../services/api';
import SimpleEditor from '../components/SimpleEditor';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
    { id: 'inclusion', label: 'Inclusions', color: 'green', colorClass: 'text-green-800 bg-green-100 border-green-200', btnClass: 'bg-green-600 hover:bg-green-700' },
    { id: 'exclusion', label: 'Exclusions', color: 'red', colorClass: 'text-red-800 bg-red-100 border-red-200', btnClass: 'bg-red-600 hover:bg-red-700' },
    { id: 'terms', label: 'Terms & Conditions', color: 'blue', colorClass: 'text-blue-800 bg-blue-100 border-blue-200', btnClass: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'confirmation', label: 'Confirmation Policy', color: 'teal', colorClass: 'text-teal-800 bg-teal-100 border-teal-200', btnClass: 'bg-teal-600 hover:bg-teal-700' },
    { id: 'cancellation', label: 'Cancellation Policy', color: 'orange', colorClass: 'text-orange-800 bg-orange-100 border-orange-200', btnClass: 'bg-orange-600 hover:bg-orange-700' },
    { id: 'amendment', label: 'Amendment Policy', color: 'cyan', colorClass: 'text-cyan-800 bg-cyan-100 border-cyan-200', btnClass: 'bg-cyan-600 hover:bg-cyan-700' },
    { id: 'payment', label: 'Payment Policy', color: 'indigo', colorClass: 'text-indigo-800 bg-indigo-100 border-indigo-200', btnClass: 'bg-indigo-600 hover:bg-indigo-700' },
    { id: 'remarks', label: 'Remarks', color: 'purple', colorClass: 'text-purple-800 bg-purple-100 border-purple-200', btnClass: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'thank_you', label: 'Thank You Message', color: 'pink', colorClass: 'text-pink-800 bg-pink-100 border-pink-200', btnClass: 'bg-pink-600 hover:bg-pink-700' },
];

const MasterPoints = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inclusion');
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ content: '', is_active: true, sort_order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPoints();
    }, [activeTab]);

    const fetchPoints = async () => {
        try {
            setLoading(true);
            const response = await masterPointsAPI.list(activeTab);
            setPoints(response.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ content: '', is_active: true, sort_order: points.length + 1 });
        setIsModalOpen(true);
    };

    const handleEdit = (point) => {
        setEditingId(point.id);
        setFormData({
            content: point.content,
            is_active: point.is_active,
            sort_order: point.sort_order
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await masterPointsAPI.delete(id);
            fetchPoints();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData, type: activeTab };
            if (editingId) {
                await masterPointsAPI.update(editingId, payload);
            } else {
                await masterPointsAPI.create(payload);
            }
            setIsModalOpen(false);
            fetchPoints();
        } catch (err) {
            setError('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Master Content Management</h1>
                    <p className="text-gray-500">Manage standard inclusions, exclusions, terms, and policies.</p>
                </div>

                {/* TABS */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab.id
                                ? `${tab.colorClass} border-2`
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-transparent'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* LIST */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold capitalize">{TABS.find(t => t.id === activeTab)?.label} List</h2>
                        <button
                            onClick={handleAddNew}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded transition-colors ${TABS.find(t => t.id === activeTab)?.btnClass}`}
                        >
                            <Plus size={18} /> Add New
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-2">
                            {points.length === 0 && <div className="text-center text-gray-400 py-8">No items found. Add one!</div>}
                            {points.map((point) => (
                                <div key={point.id} className="flex justify-between items-start p-3 border rounded hover:bg-gray-50 group">
                                    <div className="flex-1 pr-4">
                                        {/* Render HTML content safely */}
                                        <div
                                            className="text-sm text-gray-800 prose prose-sm max-w-none line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: point.content }}
                                        />
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${point.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {point.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(point)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                        {(user?.is_super_admin || user?.roles?.some(r => ['Admin', 'Company Admin', 'Super Admin'].includes(typeof r === 'string' ? r : r.name))) && (
                                            <button onClick={() => handleDelete(point.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                                <h3 className="font-bold text-lg">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-4 flex flex-col gap-4 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Content</label>
                                    <SimpleEditor
                                        value={formData.content}
                                        onChange={val => setFormData(prev => ({ ...prev, content: val }))}
                                        placeholder={`Enter ${activeTab} details...`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Select text to format (Bold, Italic, etc.)</p>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Order:</span>
                                        <input
                                            type="number"
                                            className="w-16 border rounded px-1"
                                            value={formData.sort_order}
                                            onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                        />
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
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

export default MasterPoints;
