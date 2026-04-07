import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useSettings } from '../contexts/SettingsContext';
import { Search, Plus, Edit, X, Image as ImageIcon, Trash2, Camera, Upload, Eye, MapPin, Info, Calendar } from 'lucide-react';
import { dayItinerariesAPI, packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.is_super_admin) return true;
  if (user.roles?.some(r => ['Admin', 'Company Admin', 'Super Admin', 'Manager'].includes(typeof r === 'string' ? r : r.name))) return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const DayItinerary = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [dayItineraries, setDayItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // States
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [viewingItinerary, setViewingItinerary] = useState(null);
  const [formData, setFormData] = useState({ destination: '', title: '', details: '', status: 'active', image: null });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSource, setImageSource] = useState('upload'); 
  const [libraryPackages, setLibraryPackages] = useState([]);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryTab, setLibraryTab] = useState('free');
  const [freeStockPhotos, setFreeStockPhotos] = useState([]);
  const [freeStockLoading, setFreeStockLoading] = useState(false);

  useEffect(() => { fetchDayItineraries(); }, []);

  const fetchDayItineraries = async () => {
    try {
      setLoading(true);
      const response = await dayItinerariesAPI.list();
      const data = response.data.data || response.data || [];
      const processedData = data.map(itinerary => {
        if (itinerary.image) {
          if (itinerary.image.startsWith('/storage') || (itinerary.image.startsWith('/') && !itinerary.image.startsWith('http'))) {
            let baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
            itinerary.image = `${baseUrl}${itinerary.image}`;
          }
          if (itinerary.image.includes('localhost') && !itinerary.image.includes(':8000')) {
            itinerary.image = itinerary.image.replace('localhost', 'localhost:8000');
          }
        }
        return itinerary;
      });
      setDayItineraries(processedData);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) setDayItineraries([]);
      else { setError('Failed to load day itineraries'); console.error(err); }
    } finally { setLoading(false); }
  };

  const handleAddNew = () => {
    setEditingItineraryId(null);
    setFormData({ destination: '', title: '', details: '', status: 'active', image: null });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItineraryId(null);
    setFormData({ destination: '', title: '', details: '', status: 'active', image: null });
    setImagePreview(null);
    setShowImageModal(false);
    setImageSource('upload');
    setLibraryPackages([]);
    setFreeStockPhotos([]);
    setLibraryTab('free');
  };

  const handleInputChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); };

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
    } catch (err) { console.error('Library error:', err); toast.error('Failed to load image library'); }
    finally { setLibraryLoading(false); }
  };

  useEffect(() => {
    if (showImageModal && imageSource === 'library' && libraryTab === 'your' && libraryPackages.length === 0) fetchLibraryPackages();
  }, [showImageModal, imageSource, libraryTab]);

  const fetchFreeStockImages = async () => {
    const q = (librarySearchTerm || '').trim();
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

  const handleImageSelect = (imageUrl) => {
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('destination', formData.destination);
      submitData.append('title', formData.title);
      submitData.append('details', formData.details);
      submitData.append('status', formData.status);
      if (formData.image) submitData.append('image', formData.image);
      else if (imagePreview && imageSource === 'library') {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'day-itinerary-image.jpg', { type: blob.type });
        submitData.append('image', file);
      }
      if (editingItineraryId) {
        submitData.append('_method', 'PUT');
        await dayItinerariesAPI.update(editingItineraryId, submitData);
      } else await dayItinerariesAPI.create(submitData);
      await fetchDayItineraries();
      handleCloseModal();
      toast.success('Successfully saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save day itinerary');
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleEdit = (itinerary) => {
    setEditingItineraryId(itinerary.id);
    setIsModalOpen(true);
    setFormData({
      destination: itinerary.destination || '',
      title: itinerary.title || '',
      details: itinerary.details || '',
      status: itinerary.status || 'active',
      image: null
    });
    if (itinerary.image) {
      let imageUrl = itinerary.image;
      if (imageUrl.startsWith('/storage') || (imageUrl.startsWith('/') && !imageUrl.startsWith('http'))) {
        imageUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '') + imageUrl;
      }
      if (imageUrl.includes('localhost') && !imageUrl.includes(':8000')) imageUrl = imageUrl.replace('localhost', 'localhost:8000');
      setImagePreview(imageUrl);
      setImageSource('upload');
    } else { setImagePreview(null); setImageSource('upload'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try { await dayItinerariesAPI.delete(id); await fetchDayItineraries(); toast.success('Deleted'); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const filteredDayItineraries = dayItineraries.filter(itinerary => 
    (itinerary.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-[60vh] bg-[#D8DEF5]"><LogoLoader text="Loading..." /></div>;

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: settings?.dashboard_background_color || '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Day Itinerary</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          {hasPermission(user, 'day_itineraries.create') && (
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
              <Plus className="h-5 w-5" /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDayItineraries.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500 text-sm">No day itineraries found</td></tr>
            ) : (
              filteredDayItineraries.map((itinerary) => (
                <tr key={itinerary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                        {itinerary.image ? <img src={itinerary.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{itinerary.title || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="text-sm text-gray-900 max-w-md">{truncateText(itinerary.details || itinerary.detail, 60)}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={async () => {
                        if (!hasPermission(user, 'day_itineraries.status')) return;
                        try {
                          const newStatus = itinerary.status === 'active' ? 'inactive' : 'active';
                          await dayItinerariesAPI.update(itinerary.id, { ...itinerary, status: newStatus, _method: 'PUT' });
                          fetchDayItineraries();
                          toast.success(`Status updated to ${newStatus}`);
                        } catch (err) { toast.error('Failed to update status'); }
                      }}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${itinerary.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      disabled={!hasPermission(user, 'day_itineraries.status')}
                    >
                      {itinerary.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{itinerary.created_by_name || 'System Provider'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(itinerary.updated_at || itinerary.last_update)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                       <button onClick={() => { setViewingItinerary(itinerary); setIsViewModalOpen(true); }} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="View"><Eye size={18}/></button>
                       {hasPermission(user, 'day_itineraries.edit') && <button onClick={() => handleEdit(itinerary)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full" title="Edit"><Edit size={18}/></button>}
                       {hasPermission(user, 'day_itineraries.delete') && <button onClick={() => handleDelete(itinerary.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full" title="Delete"><Trash2 size={18}/></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL (NEW FEATURE) */}
      {isViewModalOpen && viewingItinerary && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-poppins">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in-scale">
             <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">{viewingItinerary.title}</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-black"><X size={24}/></button>
             </div>
             <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {viewingItinerary.image && (
                   <div className="relative h-64 w-full rounded-xl overflow-hidden border">
                      <img src={viewingItinerary.image} className="w-full h-full object-cover" />
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                   <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Destination</label><p className="font-medium inline-flex items-center gap-1"><MapPin size={14} className="text-blue-500"/> {viewingItinerary.destination || 'N/A'}</p></div>
                   <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Status</label><p className={`font-bold mt-1 ${viewingItinerary.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{viewingItinerary.status?.toUpperCase()}</p></div>
                   <div className="col-span-2 border-t pt-4"><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2"><Info size={14} className="inline mr-1"/> Detailed Itinerary</label><p className="text-gray-600 leading-relaxed whitespace-pre-line">{viewingItinerary.details || viewingItinerary.detail || 'No description provided.'}</p></div>
                </div>
             </div>
             <div className="p-6 border-t flex justify-end bg-gray-50">
                <button onClick={() => setIsViewModalOpen(false)} className="px-10 py-2 bg-gray-800 text-white rounded-lg font-medium">Close Report</button>
             </div>
          </div>
        </div>, document.body
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog header={()=>(
         <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">{editingItineraryId ? 'Edit Day Itinerary' : 'Add Day Itinerary'}</h2>
              <button onClick={handleCloseModal}><X size={24} /></button>
            </div>
      )} visible={isModalOpen} showCloseIcon={false}>
 <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <input type="text" value={formData.destination} onChange={(e) => handleInputChange('destination', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Enter destination" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Enter title" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Details</label>
                <textarea value={formData.details} onChange={(e) => handleInputChange('details', e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" placeholder="Enter details" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Image</label>
                <div className="flex items-center gap-3">
                   {imagePreview && <img src={imagePreview} className="w-20 h-20 object-cover rounded-lg border"/>}
                   <div className="flex-1 space-y-2">
                       <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                          <Upload className="h-4 w-4" /><span className="text-xs font-semibold">Upload</span>
                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                       </label>
                       <button type="button" onClick={() => { setImageSource('library'); setShowImageModal(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 text-xs font-bold uppercase tracking-widest"><Camera className="h-4 w-4" /> Library</button>
                   </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Status *</label>
                <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
      </Dialog>
     

      {/* --- IMAGE LIBRARY MODAL --- */}
      <Dialog header={()=>(
         <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h2 className="text-lg font-bold">Image Library</h2><button onClick={() => setShowImageModal(false)}><X size={24}/></button></div>
      )} 
      showCloseIcon={false}
      visible={showImageModal}
      
      >
  <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
               <div className="flex border-b text-sm font-medium">
                  <button onClick={() => setLibraryTab('free')} className={`px-6 py-3 ${libraryTab === 'free' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Stock Images</button>
                  <button onClick={() => setLibraryTab('your')} className={`px-6 py-3 ${libraryTab === 'your' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Your Collection</button>
               </div>
               <div className="p-4 border-b"><div className="flex gap-2"><input type="text" value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="flex-1 border p-2 rounded-lg outline-none text-sm" placeholder="Search (e.g. Manali)"/><button onClick={() => libraryTab === 'free' ? fetchFreeStockImages() : null} className="px-6 bg-blue-600 text-white rounded-lg text-sm">Search</button></div></div>
               <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4">
                  {(libraryTab === 'free' ? freeStockPhotos : libraryPackages).map((img, i) => (
                     <div key={i} style={{backgroundImage:`url(${img.thumb || img.url || img.image})`,backgroundSize:'cover'}} onClick={() => libraryTab === 'free' ? handleSelectFreeStockImage(img.url) : handleImageSelect(img.image)} className="aspect-video relative rounded-lg overflow-hidden border-2 hover:border-blue-500 cursor-pointer group">
                   <div className="absolute left-0 right-0 top-0 bottom-0 w-full h-full inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">SELECT</div>
                     </div>
                  ))}
               </div>
            </div>
      </Dialog>
     
    </div>
  );
};

export default DayItinerary;
