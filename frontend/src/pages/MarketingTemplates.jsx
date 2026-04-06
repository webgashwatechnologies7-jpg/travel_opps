import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Layout removed - handled by nested routing
import { marketingTemplatesAPI } from '../services/api';
import {
  Mail,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Filter,
  Search,
  FileText,
  X
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

const MarketingTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    variables: '',
    is_active: true,
  });
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await marketingTemplatesAPI.list();
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load marketing templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setIsEditing(true);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      is_active: template.is_active,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await marketingTemplatesAPI.delete(id);
      if (res.data?.success) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting template');
    }
  };

  const handleCopy = (template) => {
    setEditingId(null);
    setIsEditing(false);
    setFormData({
      name: `${template.name} (Copy)`,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      is_active: template.is_active,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`relative page-transition min-h-screen bg-[#F9FAFB] ${loading && templates.length > 0 ? 'opacity-80' : ''}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50 bg-[#2C55D4]" />}
      
      <div className="p-6 md:p-10 lg:p-12">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Executive Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-[22px] font-semibold text-gray-800 tracking-tight leading-none">
                Marketing <span className="text-[#2C55D4]">Templates</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                Omnichannel Communications Hub <span className="w-1 h-1 bg-slate-200 rounded-full" /> {filteredTemplates.length} Active
              </p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setIsEditing(false);
                setFormData({
                  name: '',
                  type: 'email',
                  subject: '',
                  content: '',
                  variables: '',
                  is_active: true,
                });
                setFormError('');
                setShowCreateModal(true);
              }}
              className="bg-[#2C55D4] text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Plus size={14} strokeWidth={3} />
              New Template
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[12px] font-semibold flex items-center gap-3 animate-in fade-in zoom-in duration-300">
               <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
               {error}
            </div>
          )}

          {/* High-Density Filtering Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Search repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[12px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 w-full md:w-auto">
               {['all', 'email', 'sms', 'whatsapp'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${
                      filterType === type ? 'bg-white text-[#2C55D4] shadow-sm border border-blue-50' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
               ))}
            </div>
          </div>

          {loading && templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
               <LogoLoader text="Connecting to content server..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <div key={template.id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full border-b-[3px] hover:border-b-[#2C55D4]">
                    <div className="flex justify-between items-start mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        template.type === 'email' ? 'bg-blue-50 text-blue-500' :
                        template.type === 'sms' ? 'bg-indigo-50 text-indigo-500' :
                        'bg-emerald-50 text-emerald-500'
                      }`}>
                        {template.type === 'email' ? <Mail size={18} /> : <MessageSquare size={18} />}
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        template.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {template.is_active ? 'Live' : 'Draft'}
                      </div>
                    </div>

                    <h3 className="text-[15px] font-semibold text-gray-800 mb-2 truncate group-hover:text-[#2C55D4] transition-colors">
                      {template.name}
                    </h3>

                    {template.type === 'email' && template.subject && (
                      <div className="mb-3">
                         <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Subject Line</span>
                         <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic mt-0.5">"{template.subject}"</p>
                      </div>
                    )}

                    <div className="bg-slate-50/50 p-4 rounded-xl mb-4 flex-1">
                       <p className="text-[12px] font-medium text-slate-600 leading-relaxed line-clamp-4">
                         {template.content || 'No content preview available'}
                       </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                      <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                        {new Date(template.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleCopy(template)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Duplicate"><Copy size={14} /></button>
                        <button onClick={() => handleEdit(template)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(template.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-3xl p-20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-[18px] font-semibold text-gray-800">No Asset Matched</h3>
                  <p className="text-[12px] font-medium text-slate-400 mt-2 max-w-[280px]">Your template repository is currently empty for this filter criteria.</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 text-[11px] font-bold text-[#2C55D4] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Plus size={12} strokeWidth={3}/> New Template Asset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Corporate Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[28px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#FBFCFE]">
              <div>
                <h2 className="text-[18px] font-semibold text-gray-800 tracking-tight">
                  {isEditing ? 'Modify Communications' : 'New Template Asset'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your marketing message parameters</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-slate-400 hover:text-gray-800 transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form className="space-y-8" id="templateForm" onSubmit={async (e) => {
                  e.preventDefault();
                  // ... logic remains same as before but inside premium UI
                  setFormError('');
                  try {
                    const payload = {
                      name: formData.name.trim(),
                      type: formData.type,
                      subject: formData.type === 'email' ? formData.subject.trim() : null,
                      content: formData.content,
                      variables: formData.variables
                        ? formData.variables.split(',').map(v => v.trim()).filter(Boolean)
                        : [],
                      is_active: formData.is_active,
                    };

                    const res = isEditing
                      ? await marketingTemplatesAPI.update(editingId, payload)
                      : await marketingTemplatesAPI.create(payload);

                    if (res.data?.success) {
                      fetchTemplates();
                      setShowCreateModal(false);
                    } else {
                      setFormError(res.data?.message || 'Failed to save');
                    }
                  } catch (err) {
                    setFormError(err.response?.data?.message || 'Error saving template');
                  }
                }}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Template Label</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      placeholder="e.g. Welcome Series - Day 1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Channel Type</label>
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      {['email', 'sms', 'whatsapp'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type })}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            formData.type === type ? 'bg-white text-[#2C55D4] shadow-sm border border-blue-50' : 'text-slate-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`space-y-2 transition-all duration-300 ${formData.type === 'email' ? 'opacity-100 translate-y-0' : 'opacity-30 -translate-y-2 pointer-events-none'}`}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    placeholder="Capture their attention..."
                    disabled={formData.type !== 'email'}
                    required={formData.type === 'email'}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Content</label>
                    <span className="text-[9px] font-bold text-[#2C55D4] bg-blue-50 px-2 py-0.5 rounded-md">Smart Keywords Enabled</span>
                  </div>
                  <textarea
                    rows={10}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-[13px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none leading-relaxed"
                    placeholder="Structure your dynamic message using {{variable}} syntax..."
                    required
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['name', 'email', 'phone', 'company', 'date'].map(v => (
                       <span key={v} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">
                          {`{{${v}}}`}
                       </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#FBFCFE] rounded-2xl border border-blue-50">
                   <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                      <input
                        type="checkbox"
                        id="is_active_modal"
                        className="sr-only"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label 
                        htmlFor="is_active_modal"
                        className={`h-4 w-4 transform rounded-full bg-white transition-all cursor-pointer ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                      <div className={`absolute inset-0 rounded-full transition-all ${formData.is_active ? 'bg-[#2C55D4]' : 'bg-slate-200 pointer-events-none'}`} />
                      <label htmlFor="is_active_modal" className="sr-only">Toggle Active</label>
                   </div>
                   <label htmlFor="is_active_modal" className="text-[11px] font-bold text-slate-600 cursor-pointer">DEPLOY AS ACTIVE ASSET</label>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[12px] font-semibold flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                     {formError}
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2.5 rounded-xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="templateForm"
                className="px-8 py-2.5 bg-[#2C55D4] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                {isEditing ? 'Save Changes' : 'Initialize Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingTemplates;
