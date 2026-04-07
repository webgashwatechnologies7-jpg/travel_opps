import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, X, Trash2, Eye, Star, MapPin, Building, Calendar, DollarSign, User, ExternalLink, Mail, Phone, Info, Image as ImageIcon, Briefcase, Link as LinkIcon, RefreshCw, Camera, Upload } from 'lucide-react';
import { hotelsAPI, suppliersAPI, packagesAPI } from '../services/api';
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

const Hotel = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // States
  const [viewingHotel, setViewingHotel] = useState(null);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [pricingHotel, setPricingHotel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

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
    name: '', category: '', destination: '', description: '', image: null, contact_person: '', email: '', phone: '', address: '', status: 'active', hotel_link: '', supplier_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hRes, sRes] = await Promise.all([hotelsAPI.list(), suppliersAPI.list()]);
      const data = hRes.data.data || hRes.data || [];
      const processedData = data.map(h => {
        // Map backend names to frontend keys if needed, but here we just ensure path is correct
        const imageUrl = h.hotel_photo || h.image;
        return {
          ...h,
          image: imageUrl,
          description: h.hotel_details || h.description,
          address: h.hotel_address || h.address
        };
      });
      setHotels(processedData);
      setSuppliers(sRes.data.data || sRes.data || []);
    } catch (err) { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddNew = () => {
    setEditingHotelId(null);
    setFormData({ name: '', category: '', destination: '', description: '', image: null, contact_person: '', email: '', phone: '', address: '', status: 'active', hotel_link: '', supplier_id: '' });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (hotel) => {
    setEditingHotelId(hotel.id);
    setFormData({
      name: hotel.name || '',
      category: hotel.category || '',
      destination: hotel.destination || '',
      description: hotel.hotel_details || hotel.description || '',
      image: null,
      contact_person: hotel.contact_person || '',
      email: hotel.email || '',
      phone: hotel.phone || hotel.mobile || '',
      address: hotel.hotel_address || hotel.address || '',
      status: hotel.status || 'active',
      hotel_link: hotel.hotel_link || '',
      supplier_id: hotel.supplier_id || ''
    });
    setImagePreview(hotel.hotel_photo || hotel.image || null);
    setImageSource('upload');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      // Map frontend keys to backend EXPECTED keys
      submitData.append('name', formData.name);
      submitData.append('category', formData.category);
      submitData.append('destination', formData.destination);
      submitData.append('hotel_details', formData.description || '');
      submitData.append('contact_person', formData.contact_person || '');
      submitData.append('email', formData.email || '');
      submitData.append('phone', formData.phone || '');
      submitData.append('hotel_address', formData.address || '');
      submitData.append('status', formData.status || 'active');
      submitData.append('hotel_link', formData.hotel_link || '');
      if (formData.supplier_id) submitData.append('supplier_id', formData.supplier_id);

      if (formData.image) {
        submitData.append('hotel_photo', formData.image);
      } else if (imagePreview && imageSource === 'library') {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'hotel-image.jpg', { type: blob.type });
        submitData.append('hotel_photo', file);
      }

      if (editingHotelId) {
        submitData.append('_method', 'PUT');
        await hotelsAPI.update(editingHotelId, submitData);
      } else await hotelsAPI.create(submitData);

      fetchData();
      setIsModalOpen(false);
      toast.success('Hotel sync complete');
    } catch (err) { toast.error('Failed to save hotel'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (e, h) => {
    e.stopPropagation();
    if (!hasPermission(user, 'hotels.status')) return;
    try {
      const newStatus = h.status === 'active' ? 'inactive' : 'active';
      // Backend expects hotel_address, etc. but GenericCrudTrait might work with what we have. 
      // To be safe, we wrap it.
      await hotelsAPI.update(h.id, {
        ...h,
        status: newStatus,
        hotel_address: h.hotel_address || h.address,
        hotel_details: h.hotel_details || h.description,
        _method: 'PUT'
      });
      fetchData();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handleOpenPrice = (hotel) => {
    setPricingHotel(hotel);
    setIsPriceModalOpen(true);
    setLoadingRates(true);
    hotelsAPI.getRates(hotel.id).then(res => {
      setRates(res.data.data || []);
      setLoadingRates(false);
    }).catch(() => setLoadingRates(false));
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
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
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

  const renderStars = (count) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12} className={i < Math.floor(count) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
      ))}
    </div>
  );

  const filteredHotels = useMemo(() =>
    hotels.filter(h => (h.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [hotels, searchTerm]
  );

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hotels</h1>
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
          {hasPermission(user, 'hotels.create') && (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHotels.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm font-medium">No hotels found</td></tr>
            ) : (
              filteredHotels.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                        {h.image ? <img src={h.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{h.name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStars(h.category || 3)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize font-medium">{h.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => toggleStatus(e, h)}
                      className={`px-3 py-1 inline-flex text-[10px] uppercase font-bold tracking-widest rounded-full cursor-pointer transition-all ${h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {h.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setViewingHotel(h); setIsViewModalOpen(true); }} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="View"><Eye size={18} /></button>
                      <button onClick={() => handleOpenPrice(h)} className="text-amber-600 hover:text-amber-900 p-2 hover:bg-amber-50 rounded-full" title="Rates"><DollarSign size={18} /></button>
                      {hasPermission(user, 'hotels.edit') && <button onClick={() => handleEdit(h)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full" title="Edit"><Edit size={18} /></button>}
                      {hasPermission(user, 'hotels.delete') && <button onClick={async () => { if (window.confirm('Delete this record?')) { await hotelsAPI.delete(h.id); fetchData(); } }} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full" title="Delete"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL - Executive Suite Redesign */}
      {isViewModalOpen && viewingHotel && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          className="animate-in fade-in duration-300"
        >
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2C55D4] shadow-sm">
                     <Building size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-slate-800 leading-none">{viewingHotel.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                       {renderStars(viewingHotel.category)}
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Property Registry
                       </span>
                    </div>
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
              {viewingHotel.image ? (
                <div className="relative group overflow-hidden rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 aspect-video">
                  <img src={viewingHotel.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={viewingHotel.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <p className="text-white text-xs font-bold uppercase tracking-widest">{viewingHotel.name} - Asset Portfolio</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
                   <ImageIcon size={40} strokeWidth={1} />
                   <p className="text-[10px] font-bold uppercase tracking-widest leading-none">No Property Visuals Found</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Intelligence</label>
                   <p className="text-[13px] font-semibold text-slate-800">{viewingHotel.contact_person || 'No Lead Contact'}</p>
                   <p className="text-[11px] font-medium text-slate-500 mt-1">{viewingHotel.phone || 'Registry Missing Phone'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Destination Hub</label>
                   <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#2C55D4]" />
                      <p className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
                         {viewingHotel.destination || 'Global Link'}
                      </p>
                   </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 p-5 bg-[#F8FAFC] rounded-2xl border border-blue-50">
                   <div className="flex items-center gap-3 mb-2">
                      <Briefcase size={16} className="text-[#2C55D4]" />
                      <label className="text-[10px] font-bold text-[#2C55D4] uppercase tracking-widest block">Operational Address</label>
                   </div>
                   <p className="text-[14px] font-medium text-slate-600 pl-7 leading-relaxed">
                      {viewingHotel.hotel_address || viewingHotel.address || 'Global HQ Operations'}
                   </p>
                </div>

                <div className="col-span-1 md:col-span-2 p-5 bg-white rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3 mb-3">
                      <Info size={16} className="text-slate-400" />
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Technical Synopsis</label>
                   </div>
                   <p className="text-[13px] font-medium text-slate-600 leading-relaxed pl-7 text-justify whitespace-pre-line">
                      {viewingHotel.description || viewingHotel.hotel_details || 'No technical specifications provided for this property registry.'}
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
                  Dismiss Sheet
               </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog header={()=>(
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{editingHotelId ? 'Edit Hotel' : 'New Hotel Entry'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
      )} showCloseIcon={false} visible={isModalOpen}>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Hotel name *</label>
                  <input placeholder="Hotel title" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required>
                    <option value="">Select Category</option>
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Star Rating</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end text-sm">
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Location *</label>
                  <input placeholder="City" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 mb-1 block text-sm font-medium">Hotel Photo (Library/Upload)</label>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all">
                      <Upload size={15} className="text-blue-600" /><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Upload</span>
                      <input type="file" className="hidden" onChange={handleImageFileChange} />
                    </label>
                    <button type="button" onClick={() => { setImageSource('library'); setShowImageModal(true); }} className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                      <Camera size={15} /><span className="text-[10px] font-bold uppercase tracking-widest leading-none">Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                  <img src={imagePreview} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <label className="text-gray-700 block text-sm font-medium">Hotel Synopsis / Details</label>
                <textarea rows="3" placeholder="Hotel overview and amenities" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-normal" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Contact Person</label>
                  <input placeholder="Name" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Contact Phone</label>
                  <input placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <label className="text-gray-700 block text-sm font-medium">Full Address *</label>
                <input placeholder="Postal Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Digital Link</label>
                  <input placeholder="Website URL" value={formData.hotel_link} onChange={e => setFormData({ ...formData, hotel_link: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 block text-sm font-medium">Registry Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Footer inside form, pushed to bottom */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '4px', flexShrink: 0 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 20px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#64748b', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dismiss</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 28px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>{saving ? 'Syncing...' : 'Complete Registry'}</button>
              </div>
            </form>
      </Dialog>
      
{/* Image Model  */}
<Dialog style={{minWidth:'50vw'}} showCloseIcon={false} visible={showImageModal} header={()=>(
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Hotel Visual Library</h2>
              <button onClick={() => setShowImageModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
)}>
<div className="flex border-b text-[10px] font-bold uppercase tracking-widest">
              <button onClick={() => setLibraryTab('free')} className={`px-8 py-4 transition-all ${libraryTab === 'free' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Global Photo Stock</button>
              <button onClick={() => setLibraryTab('your')} className={`px-8 py-4 transition-all ${libraryTab === 'your' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>My Gallery</button>
            </div>
            <div className="p-4 border-b bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500" placeholder={libraryTab === 'free' ? "Search Luxury Hotels, Rooms, etc." : "Search internal gallery"} />
                </div>
                <button onClick={() => libraryTab === 'free' ? fetchFreeStockImages() : null} className="px-8 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest leading-none">Search</button>
              </div>
            </div>
            <div  className="   overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-6 gap-4 bg-gray-50">
                {(libraryTab === 'free' ? freeStockPhotos : libraryPackages).map((img, i) => (
                  <div style={{backgroundImage:`url(${img.thumb || img.url || img.image})`,backgroundSize:"cover"}} key={i} onClick={() => libraryTab === 'free' ? handleSelectFreeStockImage(img.url) : handleImageSelectFromLibrary(img.image)} className="aspect-square  relative rounded-xl overflow-hidden border-2 bg-white hover:border-blue-500 cursor-pointer group shadow-sm transition-all duration-300">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold tracking-widest uppercase">SELECT</div>
                  </div>
                ))}
            </div>
</Dialog>
     

      {/* PRICING MODAL */}
      <Dialog showCloseIcon={false} visible={isPriceModalOpen} onHide={() => setIsPriceModalOpen(false)} style={{minWidth:'40vw'}} header={()=>(
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #fef3c7', backgroundColor: '#fffbeb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#92400e', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} /> Rate Index: {pricingHotel.name}</h2>
              <button onClick={() => setIsPriceModalOpen(false)} style={{ background: '#fef3c7', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#92400e' }}><X size={20} /></button>
            </div>
      )}>
  <div className="p-6">
              {loadingRates ? <LogoLoader text="Syncing..." /> : (
                <div className="space-y-4">
                  {rates.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                      {rates.map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-200 shadow-sm">
                          <div className="text-sm text-gray-800">{r.room_type || 'Hotel Plan'}</div>
                          <div className="text-sm font-bold text-emerald-600">₹{r.price || 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="py-20 text-center text-gray-500 text-sm font-bold border-2 border-dashed rounded-lg bg-gray-50 uppercase tracking-widest text-[10px]">No rates listed.</div>}
                  <button className="w-full py-3 bg-blue-600 text-white rounded font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 shadow-lg mt-4 leading-none inline-flex items-center justify-center gap-2 font-bold"><Plus size={16} /> Update Rate Board</button>
                </div>
              )}
            </div>
      </Dialog>
     
    </div>
  );
};
export default Hotel;
