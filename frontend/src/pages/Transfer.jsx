import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, X, Trash2, Eye, MapPin, Truck, Calendar, DollarSign, User, Info, ExternalLink, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { transfersAPI, packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import LogoLoader from '../components/LogoLoader';

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

const Transfer = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // States
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [viewingTransfer, setViewingTransfer] = useState(null);
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

  const [formData, setFormData] = useState({
    name: '', destination: '', description: '', status: 'active', image: null
  });

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transfersAPI.list();
      const data = response.data.data || response.data || [];
      const processed = data.map(t => ({
        ...t,
        image: t.transfer_photo || t.image,
        description: t.transfer_details || t.description
      }));
      setTransfers(processed);
    } catch (err) { toast.error('Failed to load transfers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  const handleAddNew = () => {
    setEditingTransferId(null);
    setFormData({ name: '', destination: '', description: '', status: 'active', image: null });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (t) => {
    setEditingTransferId(t.id);
    setFormData({
      name: t.name || '',
      destination: t.destination || '',
      description: t.transfer_details || t.description || '',
      status: t.status || 'active',
      image: null
    });
    setImagePreview(t.transfer_photo || t.image || null);
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
      submitData.append('transfer_details', formData.description || '');
      submitData.append('status', formData.status || 'active');

      if (formData.image) {
        submitData.append('transfer_photo', formData.image);
      } else if (imagePreview && imageSource === 'library') {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'transport.jpg', { type: blob.type });
        submitData.append('transfer_photo', file);
      }

      if (editingTransferId) {
        submitData.append('_method', 'PUT');
        await transfersAPI.update(editingTransferId, submitData);
      } else await transfersAPI.create(submitData);

      fetchTransfers();
      setIsModalOpen(false);
      toast.success('Transport sync complete');
    } catch (err) { toast.error('Failed to save transport'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (e, t) => {
    e.stopPropagation();
    if (!hasPermission(user, 'transfers.status')) return;
    try {
      const newStatus = t.status === 'active' ? 'inactive' : 'active';
      await transfersAPI.update(t.id, {
        ...t,
        status: newStatus,
        transfer_details: t.transfer_details || t.description,
        _method: 'PUT'
      });
      fetchTransfers();
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
    finally { setLoading(false); setLibraryLoading(false); }
  };

  useEffect(() => {
    if (showImageModal && imageSource === 'library' && libraryTab === 'your' && libraryPackages.length === 0) fetchLibraryPackages();
  }, [showImageModal, imageSource, libraryTab]);

  const fetchFreeStockImages = async () => {
    const q = (librarySearchTerm || formData.name || formData.destination || '').trim();
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
      const file = new File([blob], 'transport.jpg', { type: blob.type || 'image/jpeg' });
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

  const filteredTransfers = useMemo(() =>
    transfers.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [transfers, searchTerm]
  );

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Transfers</h1>
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
          {hasPermission(user, 'transfers.create') && (
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95">
              <Plus className="h-5 w-5" /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-gray-500">Transport Asset</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-gray-500">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransfers.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm font-medium">No transport records found</td></tr>
            ) : (
              filteredTransfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                        {t.image ? <img src={t.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{t.name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase font-bold tracking-wide">{t.destination || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => toggleStatus(e, t)}
                      className={`px-3 py-1 inline-flex text-[10px] uppercase font-black tracking-widest rounded-full cursor-pointer transition-all ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {t.status === 'active' ? 'Active' : 'Paued'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setViewingTransfer(t); setIsViewModalOpen(true); }} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="View Detail"><Eye size={18} /></button>
                      {hasPermission(user, 'transfers.edit') && <button onClick={() => handleEdit(t)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full" title="Edit Hub"><Edit size={18} /></button>}
                      {hasPermission(user, 'transfers.delete') && <button onClick={async () => { if (window.confirm('Wipe this registry entry?')) { await transfersAPI.delete(t.id); fetchTransfers(); } }} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full" title="Delete"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL - Executive Suite Redesign */}
      {isViewModalOpen && viewingTransfer && createPortal(
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2C55D4] shadow-sm">
                     <Truck size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-slate-800 leading-none">{viewingTransfer.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 focus:outline-none">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Transport Asset Registry
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
              {viewingTransfer.image ? (
                <div className="relative group overflow-hidden rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 aspect-video">
                  <img src={viewingTransfer.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={viewingTransfer.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <p className="text-white text-xs font-bold uppercase tracking-widest">Asset Identified: {viewingTransfer.name}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
                   <ImageIcon size={40} strokeWidth={1} />
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-none">No Visual Identity Found</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Asset ID</label>
                   <p className="text-[14px] font-bold text-slate-800 tabular-nums">#TRN-{viewingTransfer.id}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Registry Status</label>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${viewingTransfer.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className={`text-[12px] font-black uppercase tracking-widest ${viewingTransfer.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {viewingTransfer.status}
                      </p>
                   </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 p-5 bg-[#F8FAFC] rounded-2xl border border-blue-50">
                   <div className="flex items-center gap-3 mb-2">
                      <MapPin size={16} className="text-[#2C55D4]" />
                      <label className="text-[10px] font-bold text-[#2C55D4] uppercase tracking-widest block">Designated Operational Route</label>
                   </div>
                   <p className="text-[16px] font-bold text-slate-800 uppercase pl-7 leading-none tracking-wide">
                      {viewingTransfer.destination || 'Global Link'}
                   </p>
                </div>

                <div className="col-span-1 md:col-span-2 p-5 bg-white rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3 mb-3">
                      <Info size={16} className="text-slate-400" />
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Technical Specifications</label>
                   </div>
                   <p className="text-[13px] font-medium text-slate-600 leading-relaxed pl-7 text-justify">
                      {viewingTransfer.description || viewingTransfer.transfer_details || 'No technical specifications provided for this registry entry.'}
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
                  Close Registry
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ADD/EDIT MODAL WITH IMAGE LIBRARY */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-poppins font-medium">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in-scale">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50 font-bold uppercase tracking-widest text-gray-800">
              <h2 className="text-xl">{editingTransferId ? 'Modify Transport Hub' : 'Fresh Transport Registry'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                <div className="space-y-1">
                  <label className="block text-gray-700">Transport Title *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Luxury AC Coach" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium">Operational Hub *</label>
                  <input type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Bangkok" required />
                </div>
              </div>

              <div className="space-y-1 font-medium">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Visual Identity Attachment</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed rounded bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all">
                    <Upload size={16} className="text-blue-600" /><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Warp Upload</span>
                    <input type="file" className="hidden" onChange={handleImageFileChange} />
                  </label>
                  <button type="button" onClick={() => { setImageSource('library'); setShowImageModal(true); }} className="flex-1 flex items-center justify-center gap-2 p-2 border border-emerald-200 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                    <Camera size={16} /><span className="text-[10px] font-bold uppercase tracking-widest leading-none">Global Library</span>
                  </button>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border group shadow-inner">
                  <img src={imagePreview} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={14} /></button>
                </div>
              )}

              <div className="space-y-1 text-sm font-medium">
                <label className="block text-gray-700 uppercase tracking-widest text-[10px] font-black">Transport Specifications</label>
                <textarea rows="3" placeholder="Fleet details, capacity, features..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none font-normal" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Phase</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  <option value="active">Active Operational</option>
                  <option value="inactive">Paused Registry</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-400 hover:bg-gray-50 rounded text-xs uppercase tracking-widest font-black transition-all">Dismiss</button>
                <button type="submit" disabled={saving} className="px-12 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl text-[10px] font-black uppercase tracking-[0.2em]">{saving ? 'Processing...' : 'Seal Registry'}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* --- SHARED UNIVERSAL IMAGE LIBRARY --- */}
      {showImageModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-poppins font-medium">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in-scale">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 font-bold uppercase tracking-widest text-[10px]"><h2 className="text-lg">Universal Transport Asset Bank</h2><button onClick={() => setShowImageModal(false)}><X size={24} /></button></div>
            <div className="flex border-b text-[10px] font-black uppercase tracking-[0.2em]">
              <button onClick={() => setLibraryTab('free')} className={`px-10 py-5 transition-all ${libraryTab === 'free' ? 'border-b-4 border-blue-600 text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Fleet Search</button>
              <button onClick={() => setLibraryTab('your')} className={`px-10 py-5 transition-all ${libraryTab === 'your' ? 'border-b-4 border-blue-600 text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Archive Storage</button>
            </div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 font-medium" placeholder={libraryTab === 'free' ? "Search e.g. Luxury Coach, Sedan, SUV Travel" : "Search internal archive"} />
                </div>
                <button onClick={() => libraryTab === 'free' ? fetchFreeStockImages() : null} className="px-10 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-md">Search</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-4 bg-gray-100">
              {(libraryTab === 'free' ? freeStockPhotos : libraryPackages).map((img, i) => (
                <div key={i} onClick={() => libraryTab === 'free' ? handleSelectFreeStockImage(img.url) : handleImageSelectFromLibrary(img.image)} className="aspect-square relative rounded-xl overflow-hidden border-2 bg-white hover:border-blue-600 cursor-pointer group shadow-md transition-all duration-300">
                  <img src={img.thumb || img.url || img.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black tracking-widest uppercase">Inject Photo</div>
                </div>
              ))}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};
export default Transfer;
