import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, X, Trash2, MapPin, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { destinationsAPI, packagesAPI } from '../services/api';
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

const Destinations = () => {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // States
  const [editingId, setEditingId] = useState(null);
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

  const [formData, setFormData] = useState({ name: '', status: 'active', image: null });

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await destinationsAPI.list();
      const data = response.data.data || response.data || [];
      const processed = data.map(d => ({
        ...d,
        image: d.photo || d.image
      }));
      setDestinations(processed);
    } catch (err) { toast.error('Failed to load destinations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDestinations(); }, [fetchDestinations]);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', status: 'active', image: null });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (d) => {
    setEditingId(d.id);
    setFormData({
      name: d.name || '',
      status: d.status || 'active',
      image: null
    });
    setImagePreview(d.photo || d.image || null);
    setImageSource('upload');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('status', formData.status || 'active');

      if (formData.image) {
        submitData.append('photo', formData.image);
      } else if (imagePreview && imageSource === 'library') {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'destination.jpg', { type: blob.type });
        submitData.append('photo', file);
      }

      if (editingId) {
        await destinationsAPI.update(editingId, submitData);
      } else await destinationsAPI.create(submitData);

      fetchDestinations();
      setIsModalOpen(false);
      toast.success('Destination registry updated');
    } catch (err) { toast.error('Failed to save destination'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (e, d) => {
    e.stopPropagation();
    if (!hasPermission(user, 'destinations.status')) return;
    try {
      const newStatus = d.status === 'active' ? 'inactive' : 'active';
      await destinationsAPI.update(d.id, {
        ...d,
        status: newStatus,
        _method: 'PUT'
      });
      fetchDestinations();
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
    const q = (librarySearchTerm || formData.name || '').trim();
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
      const file = new File([blob], 'destination.jpg', { type: blob.type || 'image/jpeg' });
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

  const filteredDestinations = useMemo(() =>
    destinations.filter(d => (d.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [destinations, searchTerm]
  );

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Destinations</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white shadow-sm"
            />
          </div>
          {hasPermission(user, 'destinations.create') && (
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg uppercase text-xs tracking-widest">
              <Plus className="h-5 w-5" /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 uppercase tracking-[0.2em] font-black text-[10px]">
            <tr className="text-gray-500">
              <th className="px-6 py-4 text-left">Destination Visual</th>
              <th className="px-6 py-4 text-left">Location Name</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDestinations.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm font-medium">No destination records found</td></tr>
            ) : (
              filteredDestinations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border shadow-inner">
                      {d.image ? <img src={d.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 uppercase tracking-widest">{d.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => toggleStatus(e, d)}
                      className={`px-3 py-1 inline-flex text-[10px] uppercase font-black tracking-widest rounded-full cursor-pointer transition-all ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {d.status === 'active' ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {hasPermission(user, 'destinations.edit') && <button onClick={() => handleEdit(d)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full transition-colors" title="Edit Master"><Edit size={18} /></button>}
                      {hasPermission(user, 'destinations.delete') && <button onClick={async () => { if (window.confirm('Delete local registry member?')) { await destinationsAPI.delete(d.id); fetchDestinations(); } }} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors" title="Delete"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      <Dialog visible={isModalOpen} showCloseIcon={false} header={()=>(
         <div className="flex justify-between items-center p-6 border-b bg-gray-50/50 font-bold uppercase tracking-widest text-gray-800 text-xs">
              <h2 className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                {editingId ? 'Modify Geographic Identity' : 'Fresh Destination Entry'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
      )}>

  <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Location Title *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-gray-50" placeholder="e.g. Switzerland, Dubai" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 block">Location Landmark Photo</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-dashed rounded-lg bg-blue-50/50 cursor-pointer hover:bg-blue-100/50 transition-all">
                    <Upload size={16} className="text-blue-600" /><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Warp Upload</span>
                    <input type="file" className="hidden" onChange={handleImageFileChange} />
                  </label>
                  <button type="button" onClick={() => { setImageSource('library'); setShowImageModal(true); }} className="flex-1 flex items-center justify-center gap-2 p-3 border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all font-black uppercase text-[10px] tracking-widest leading-none">
                    <Camera size={16} /> Stock Library
                  </button>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-100 group shadow-md bg-white p-1">
                  <img src={imagePreview} className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-95"><X size={14} /></button>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Visibility Phase</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold bg-white text-gray-700 shadow-sm">
                  <option value="active">Active Entry</option>
                  <option value="inactive">Paused State</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t font-black uppercase tracking-[0.2em]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-400 hover:text-gray-600 rounded text-[10px] transition-all">Dismiss</button>
                <button type="submit" disabled={saving} className="px-12 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl text-[10px] active:scale-95">{saving ? 'Processing...' : 'Seal Identity'}</button>
              </div>
            </form>
      </Dialog>
      

      {/* --- UNIVERSAL IMAGE LIBRARY --- */}
      <Dialog visible={showImageModal} showCloseIcon={false} header={()=>(
   <div className="flex justify-between items-center p-6 border-b bg-gray-50/50 px-10">
              <h2 className="text-lg font-black uppercase tracking-[0.2em] text-xs text-gray-800">Internal Identity Bank (Pexels Integrated)</h2>
              <button 
                onClick={() => setShowImageModal(false)} 
                className="text-gray-400 hover:text-red-500 p-2 hover:bg-white rounded-full transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
      )}>
 <div 
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in-scale" 
            style={{ borderRadius: '32px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}
          >
         
            <div className="flex border-b text-[10px] font-black uppercase tracking-[0.3em]">
              <button onClick={() => setLibraryTab('free')} className={`px-12 py-6 transition-all ${libraryTab === 'free' ? 'border-b-4 border-blue-600 text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Global Stock Search</button>
              <button onClick={() => setLibraryTab('your')} className={`px-12 py-6 transition-all ${libraryTab === 'your' ? 'border-b-4 border-blue-600 text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Localized Archive</button>
            </div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2 p-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input type="text" value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 font-bold" placeholder={libraryTab === 'free' ? "Search city or country landmark..." : "Search across internal records..."} />
                </div>
                <button onClick={() => libraryTab === 'free' ? fetchFreeStockImages() : null} className="px-12 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Search Bank</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-6 bg-gray-50">
              {(libraryTab === 'free' ? freeStockPhotos : libraryPackages).map((img, i) => (
                <div key={i}  style={{backgroundImage:`url(${img.thumb || img.url || img.image})`,backgroundSize:'cover'}} onClick={() => libraryTab === 'free' ? handleSelectFreeStockImage(img.url) : handleImageSelectFromLibrary(img.image)} className="aspect-square relative rounded-2xl overflow-hidden border-2 bg-white hover:border-blue-600 cursor-pointer group shadow-lg transition-all duration-300">
                 <div className="absolute left-0 right-0 top-0 bottom-0 w-full h-full inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black tracking-[0.2em] uppercase">Inject Identity</div>
                </div>
              ))}
            </div>
          </div>
      </Dialog>
   
    </div>
  );
};
export default Destinations;
