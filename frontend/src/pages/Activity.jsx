import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, X, Trash2, Eye, MapPin, ActivityIcon, User, Calendar, ExternalLink, Mail, Phone, Info, Building, Briefcase, Image as ImageIcon, Link as LinkIcon, DollarSign, Camera, Upload } from 'lucide-react';
import { activitiesAPI, suppliersAPI, packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const bypassRoles = ['Admin', 'Company Admin', 'Super Admin', 'Manager'];
  if (user.roles?.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName && bypassRoles.some(br => br.toLowerCase() === roleName.toLowerCase());
  })) return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const Activity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // States
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [saving, setSaving] = useState(false);

  // Image Library States
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSource, setImageSource] = useState('upload'); // 'upload' or 'library'
  const [libraryPackages, setLibraryPackages] = useState([]);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryTab, setLibraryTab] = useState('free');
  const [freeStockPhotos, setFreeStockPhotos] = useState([]);
  const [freeStockLoading, setFreeStockLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '', destination: '', description: '', image: null, contact_person: '', email: '', phone: '', address: '', status: 'active', activity_link: '', supplier_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [actRes, supRes] = await Promise.all([activitiesAPI.list(), suppliersAPI.list()]);
      const data = actRes.data.data || actRes.data || [];
      const processedData = data.map(a => {
        return {
          ...a,
          image: a.activity_photo || a.image,
          description: a.activity_details || a.description
        };
      });
      setActivities(processedData);
      setSuppliers(supRes.data.data || supRes.data || []);
    } catch (err) { toast.error('Failed to sync master records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddNew = () => {
    setEditingActivityId(null);
    setFormData({ name: '', destination: '', description: '', image: null, contact_person: '', email: '', phone: '', address: '', status: 'active', activity_link: '', supplier_id: '' });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (a) => {
    setEditingActivityId(a.id);
    setFormData({
      name: a.name || '',
      destination: a.destination || '',
      description: a.activity_details || a.description || '',
      image: null,
      contact_person: a.contact_person || '',
      email: a.email || '',
      phone: a.mobile || a.phone || '',
      address: a.address || '',
      status: a.status || 'active',
      activity_link: a.activity_link || '',
      supplier_id: a.supplier_id || ''
    });
    setImagePreview(a.activity_photo || a.image || null);
    setImageSource('upload');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('destination', formData.destination);
      submitData.append('activity_details', formData.description || '');
      submitData.append('contact_person', formData.contact_person || '');
      submitData.append('email', formData.email || '');
      submitData.append('phone', formData.phone || '');
      submitData.append('address', formData.address || ''); // activity table has 'address'
      submitData.append('status', formData.status || 'active');
      submitData.append('activity_link', formData.activity_link || '');
      if (formData.supplier_id) submitData.append('supplier_id', formData.supplier_id);

      if (formData.image) {
        submitData.append('activity_photo', formData.image);
      } else if (imagePreview && imageSource === 'library') {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'activity.jpg', { type: blob.type });
        submitData.append('activity_photo', file);
      }

      if (editingActivityId) {
        submitData.append('_method', 'PUT');
        await activitiesAPI.update(editingActivityId, submitData);
      } else await activitiesAPI.create(submitData);

      fetchData();
      setIsModalOpen(false);
      toast.success('Activity sync complete');
    } catch (err) { toast.error('Failed to save activity'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (e, a) => {
    e.stopPropagation();
    if (!hasPermission(user, 'activities.status')) return;
    try {
      const newStatus = a.status === 'active' ? 'inactive' : 'active';
      await activitiesAPI.update(a.id, {
        ...a,
        status: newStatus,
        activity_details: a.activity_details || a.description,
        _method: 'PUT'
      });
      fetchData();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) { toast.error('Failed to update status'); }
  };

  // Image Library Logic
  const fetchLibraryPackages = async () => {
    setLibraryLoading(true);
    try {
      const response = await packagesAPI.list();
      const data = response.data.data || [];
      const processed = data.map((p) => {
        if (p.image) {
          let url = p.image;
          if (url.startsWith('/storage') || (url.startsWith('/') && !url.startsWith('http'))) {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
            url = `${baseUrl}${url}`;
          }
          if (url.includes('localhost') && !url.includes(':8000')) url = url.replace('localhost', 'localhost:8000');
          return { ...p, image: url };
        }
        return p;
      });
      setLibraryPackages(processed);
    } catch (err) { toast.error('Library sync failed'); }
    finally { setLibraryLoading(false); }
  };

  useEffect(() => {
    if (showImageModal && imageSource === 'library' && libraryTab === 'your' && libraryPackages.length === 0) fetchLibraryPackages();
  }, [showImageModal, imageSource, libraryTab]);

  const fetchFreeStockImages = async () => {
    const q = (librarySearchTerm || formData.destination || '').trim();
    if (q.length < 2) return;
    setFreeStockLoading(true);
    try {
      const { photos } = await searchPexelsPhotos(q, 15);
      setFreeStockPhotos(photos || []);
    } catch (e) { setFreeStockPhotos([]); }
    finally { setFreeStockLoading(false); }
  };

  const handleSelectFreeStockImage = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'activity.jpg', { type: blob.type || 'image/jpeg' });
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setImageSource('upload');
      setShowImageModal(false);
    } catch (e) { toast.error('Failed to load image'); }
  };

  const handleImageSelectFromLibrary = (imageUrl) => {
    setImagePreview(imageUrl);
    setFormData(prev => ({ ...prev, image: null }));
    setImageSource('library');
    setShowImageModal(false);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(null);
      setImageSource('upload');
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredActivities = useMemo(() =>
    activities.filter(a => (a.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [activities, searchTerm]
  );

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Activities</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          {hasPermission(user, 'activities.create') && (
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm">
              <Plus className="h-5 w-5" /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Activity Asset</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm font-medium">No activities found</td></tr>
            ) : (
              filteredActivities.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                        {a.image ? <img src={a.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{a.name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold uppercase tracking-wide">{a.destination || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => toggleStatus(e, a)}
                      className={`px-3 py-1 inline-flex text-[10px] uppercase font-black tracking-widest rounded-full cursor-pointer transition-all ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {a.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setViewingActivity(a); setIsViewModalOpen(true); }} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="View Detail"><Eye size={18} /></button>
                      {hasPermission(user, 'activities.edit') && <button onClick={() => handleEdit(a)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full" title="Edit Properties"><Edit size={18} /></button>}
                      {hasPermission(user, 'activities.delete') && <button onClick={() => { if (window.confirm('Remove from registry?')) { activitiesAPI.delete(a.id); fetchData(); } }} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full" title="Remove"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL - Executive Suite Redesign */}
      {isViewModalOpen && viewingActivity && createPortal(
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2C55D4] shadow-sm">
                     <ActivityIcon size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-slate-800 leading-none">{viewingActivity.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 focus:outline-none">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activity & Experience Registry
                    </p>
                  </div>
               </div>
               <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar">
              {viewingActivity.image ? (
                <div className="relative group overflow-hidden rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 aspect-video">
                  <img src={viewingActivity.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={viewingActivity.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <p className="text-white text-xs font-bold uppercase tracking-widest">Experience Spotlight: {viewingActivity.name}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
                   <ImageIcon size={40} strokeWidth={1} />
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-none">No Visual Memory Found</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Asset ID</label>
                   <p className="text-[14px] font-bold text-slate-800 tabular-nums">#ACT-{viewingActivity.id}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status Phase</label>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${viewingActivity.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className={`text-[12px] font-black uppercase tracking-widest ${viewingActivity.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {viewingActivity.status}
                      </p>
                   </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 p-5 bg-[#F8FAFC] rounded-2xl border border-blue-50">
                   <div className="flex items-center gap-3 mb-2">
                      <MapPin size={16} className="text-[#2C55D4]" />
                      <label className="text-[10px] font-bold text-[#2C55D4] uppercase tracking-widest block">Geographic Operational Center</label>
                   </div>
                   <p className="text-[16px] font-bold text-slate-800 uppercase pl-7 leading-none tracking-wide">
                      {viewingActivity.destination || 'Global Experience'}
                   </p>
                </div>

                <div className="col-span-1 md:col-span-2 p-5 bg-white rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3 mb-3">
                      <Info size={16} className="text-slate-400" />
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Technical Synopsis</label>
                   </div>
                   <p className="text-[13px] font-medium text-slate-600 leading-relaxed pl-7 text-justify whitespace-pre-line">
                      {viewingActivity.description || viewingActivity.activity_details || 'No technical specifications provided for this experience registry.'}
                   </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50">
               <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="px-10 py-3 bg-[#1E293B] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
               >
                  Close Panel
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ADD/EDIT FORM FOR ACTIVITY */}
      <Dialog showCloseIcon={false} visible={isModalOpen} header={()=>(
         <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold uppercase tracking-widest">{editingActivityId ? 'Edit Event' : 'New Event Registry'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
      )}>
  <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                <div className="space-y-1">
                  <label className="text-gray-700 block">Activity name *</label>
                  <input placeholder="Activity title" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm">Destination *</label>
                  <input placeholder="City" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium" required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1 font-medium">
                  <label className="text-gray-700 mb-1 block text-sm">Activity Photo (Library/Direct)</label>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed rounded bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all">
                      <Upload size={16} className="text-blue-600" /><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Upload Asset</span>
                      <input type="file" className="hidden" onChange={handleImageFileChange} />
                    </label>
                    <button type="button" onClick={() => { setImageSource('library'); setShowImageModal(true); }} className="flex-1 flex items-center justify-center gap-2 p-2 border border-emerald-200 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all font-bold">
                      <Camera size={16} /><span className="text-[10px] uppercase tracking-widest leading-none">Photo Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border group shadow-inner bg-gray-50">
                  <img src={imagePreview} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                </div>
              )}

              <div className="space-y-1 text-sm font-medium">
                <label className="text-gray-700 block uppercase tracking-widest text-[10px] font-black">Event Description</label>
                <textarea rows="3" placeholder="Overview of the activity..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none font-normal" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm font-medium font-medium">
                <div className="space-y-1">
                  <label className="text-gray-700 block">Activity Website</label>
                  <input placeholder="URL" value={formData.activity_link} onChange={e => setFormData({ ...formData, activity_link: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 block">Registry Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 uppercase tracking-widest text-xs font-bold hover:bg-gray-50 font-black">Dismiss</button>
                <button type="submit" disabled={saving} className="px-12 py-2 bg-blue-600 text-white rounded font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 shadow-xl">{saving ? 'Syncing...' : 'Complete Entry'}</button>
              </div>
            </form>
      </Dialog>
     

      {/* --- UNIVERSAL IMAGE LIBRARY --- */}
      <Dialog showCloseIcon={false} visible={showImageModal}
      
      header={()=>(
 <div className="flex justify-between items-center p-4 border-b bg-gray-50 font-bold uppercase tracking-widest text-[10px]">
              <h2 className="text-lg">Global Event Gallery</h2><button onClick={() => setShowImageModal(false)}><X size={24} /></button>
              </div>
      )}>
   <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in-scale">
           
            <div className="flex border-b text-[10px] font-bold uppercase tracking-widest">
              <button onClick={() => setLibraryTab('free')} className={`px-10 py-5 transition-all ${libraryTab === 'free' ? 'border-b-4 border-blue-600 text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Stock Market Search</button>
              <button onClick={() => setLibraryTab('your')} className={`px-10 py-5 transition-all ${libraryTab === 'your' ? 'border-b-4 border-blue-600 text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>My Gallery Storage</button>
            </div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 focus:text-blue-600 transition-colors" size={18} />
                  <input type="text" value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 font-medium" placeholder={libraryTab === 'free' ? "e.g. Desert Safari, Water Sports..." : "Search across internal records..."} />
                </div>
                <button onClick={() => libraryTab === 'free' ? fetchFreeStockImages() : null} className="px-10 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-md">Search</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-4 bg-gray-100">
              {(libraryTab === 'free' ? freeStockPhotos : libraryPackages).map((img, i) => (
                <div style={{backgroundImage:`url(${img.thumb || img.url || img.image})`,backgroundSize:"cover"}} key={i} onClick={() => libraryTab === 'free' ? handleSelectFreeStockImage(img.url) : handleImageSelectFromLibrary(img.image)} className="aspect-square relative rounded-xl overflow-hidden border-2 bg-white hover:border-blue-600 cursor-pointer group shadow-md transition-all duration-300">
                  {/* <img src={img.thumb || img.url || img.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 w-full h-full group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold tracking-widest uppercase">SELECT ASSET</div>
                </div>
              ))}
            </div>
          </div>
      </Dialog>
     
    </div>
  );
};
export default Activity;
