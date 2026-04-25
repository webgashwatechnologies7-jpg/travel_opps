import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
// Layout removed - handled by nested routing
import { Search, Plus, Edit, Eye, X, Image as ImageIcon, Hash, MapPin, CalendarDays, Trash, Upload, Camera, Copy } from 'lucide-react';
import { packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  // Super Admin bypass
  if (user.is_super_admin) return true;
  if (user.roles?.some(r => ['Admin', 'Company Admin', 'Super Admin', 'Manager'].includes(typeof r === 'string' ? r : r.name))) return true;
  // Check granular permission
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const Itineraries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDuration, setSearchDuration] = useState('');
  const [searchRoute, setSearchRoute] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name'
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItinerary, setViewingItinerary] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [libraryTab, setLibraryTab] = useState('free'); // 'free' = free stock, 'your' = your itineraries
  const [freeStockPhotos, setFreeStockPhotos] = useState([]);
  const [freeStockLoading, setFreeStockLoading] = useState(false);
  const [formData, setFormData] = useState({
    itinerary_name: '',
    duration: '1',
    destinations: '',
    routing: '',
    notes: '',
    image: null,
    show_on_website: true
  });

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    let image = url;

    // Handle objects with url property defensively
    if (typeof image !== 'string' && image?.url) {
      image = image.url;
    }

    // Fix localhost domain if needed
    const fixLocalhost = (value) => {
      if (value.includes('localhost') && !value.includes(':8000')) {
        return value.replace('localhost', 'localhost:8000');
      }
      return value;
    };

    // If already absolute URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return fixLocalhost(image);
    }

    let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');

    // Handle paths like "storage/..." (without leading slash)
    if (image.startsWith('storage')) {
      image = `/${image}`;
    }

    // Ensure leading slash for relative paths
    if (!image.startsWith('/')) {
      image = `/${image}`;
    }

    image = `${baseUrl}${image}`;
    image = fixLocalhost(image);

    return image;
  };

  useEffect(() => {
    fetchItineraries(true);
  }, []);

  const fetchItineraries = async (newSite = true) => {
    try {
      newSite ? setLoading(true) : setLoading(false);
      const response = await packagesAPI.list();
      const data = response.data.data || [];
      // Process image URLs - handle both relative and absolute URLs
      const processedData = data.map(itinerary => {
        if (itinerary.image) {
          itinerary.image = normalizeImageUrl(itinerary.image);
        }
        return itinerary;
      }).sort((a, b) => b.id - a.id);
      setItineraries(processedData);
      setError('');
    } catch (err) {
      setError('Failed to load itineraries');
      console.error('Error fetching itineraries:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '0 INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddNew = () => {
    setEditingItineraryId(null);
    setFormData({
      itinerary_name: '',
      duration: '1',
      destinations: '',
      routing: '',
      notes: '',
      image: null,
      show_on_website: true
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleSelectForLead = (itinerary) => {
    if (window.opener) {
      window.opener.postMessage({ type: 'ITINERARY_SELECTED', itinerary }, '*');
      window.close();
    } else {
      toast.error('Lead details page not found. Please select from the lead detail tab.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const create = params.get('create');
    if (create === 'true') {
      handleAddNew();
    }
  }, []);


  const handleView = async (itinerary) => {
    try {
      const response = await packagesAPI.get(itinerary.id);
      const data = response.data.data;

      // Convert image URL to absolute if needed
      if (data.image) {
        data.image = normalizeImageUrl(data.image);
      }

      setViewingItinerary(data);
      setShowViewModal(true);
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      toast.error('Failed to load itinerary details');
    }
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (showModal || showViewModal || showLibraryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showViewModal, showLibraryModal]);

  const handleEdit = (itinerary) => {
    setEditingItineraryId(itinerary.id);
    
    // Set initial data from the list so the modal opens instantly
    setFormData({
      itinerary_name: itinerary.title || itinerary.itinerary_name || '',
      duration: itinerary.duration?.toString() || '1',
      destinations: itinerary.destination || itinerary.destinations || '',
      routing: itinerary.routing || '',
      notes: itinerary.notes || '',
      image: null
    });
    setImagePreview(itinerary.image || null);
    setShowModal(true);

    // Fetch full details in background to ensure data is fresh
    packagesAPI.get(itinerary.id).then(response => {
      const data = response.data.data;
      const imageUrl = data.image ? normalizeImageUrl(data.image) : null;
      setFormData({
        itinerary_name: data.itinerary_name || '',
        duration: data.duration?.toString() || '1',
        destinations: data.destinations || '',
        routing: data.routing || '',
        notes: data.notes || '',
        image: null
      });
      setImagePreview(imageUrl);
    }).catch(err => {
      console.error('Failed to fetch fresh itinerary details:', err);
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItineraryId(null);
    setFormData({
      itinerary_name: '',
      duration: '1',
      destinations: '',
      routing: '',
      notes: '',
      image: null,
      show_on_website: true
    });
    setImagePreview(null);
    setShowLibraryModal(false);
    setLibrarySearchTerm('');
    setFreeStockPhotos([]);
    setLibraryTab('free');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Extract storage path from full image URL (e.g. .../storage/packages/abc.jpg -> packages/abc.jpg)
  const getImagePathFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/storage\/(.+)$/);
    return match ? match[1] : null;
  };

  // Library: itineraries with image, filtered by search (e.g. "Shimla") in Choose from Library modal
  const librarySearch = librarySearchTerm.trim().toLowerCase();
  const libraryImages = librarySearch.length >= 2
    ? itineraries.filter(
      (p) =>
        p.image &&
        ((p.title || p.itinerary_name || '').toLowerCase().includes(librarySearch) ||
          (p.destination || p.destinations || '').toLowerCase().includes(librarySearch))
    )
    : [];

  const handleSelectLibraryImage = (itinerary) => {
    if (!itinerary?.image) return;
    const path = getImagePathFromUrl(itinerary.image);
    if (path) {
      setFormData(prev => ({ ...prev, image: { libraryPath: path, url: itinerary.image } }));
      setImagePreview(itinerary.image);
    }
  };

  const fetchFreeStockImages = async () => {
    const q = (librarySearchTerm || '').trim();
    if (q.length < 2) return;
    setFreeStockLoading(true);
    try {
      const { photos } = await searchPexelsPhotos(q, 15);
      setFreeStockPhotos(photos || []);
    } catch (e) {
      setFreeStockPhotos([]);
    } finally {
      setFreeStockLoading(false);
    }
  };

  const handleSelectFreeStockImage = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setShowLibraryModal(false);
    } catch (e) {
      toast.error('Failed to load image. Try another or upload from device.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const packageData = new FormData();
      packageData.append('itinerary_name', formData.itinerary_name);
      packageData.append('duration', formData.duration || '1');
      if (formData.destinations) packageData.append('destinations', formData.destinations);
      packageData.append('show_on_website', formData.show_on_website ? '1' : '0');
      if (formData.routing) packageData.append('routing', formData.routing);
      if (formData.notes) packageData.append('notes', formData.notes);
      if (formData.image) {
        if (formData.image instanceof File) {
          packageData.append('image', formData.image);
        } else if (formData.image?.libraryPath) {
          packageData.append('image_path', formData.image.libraryPath);
        }
      }

      if (editingItineraryId) {
        await packagesAPI.update(editingItineraryId, packageData);
      } else {
        await packagesAPI.create(packageData);
      }

      await fetchItineraries();
      handleCloseModal();
      
      const params = new URLSearchParams(window.location.search);
      const leadId = params.get('chooseForLead');
      if (leadId && !editingItineraryId) {
        // If we just created a new itinerary while in "select for lead" mode, select it automatically
        const response = await packagesAPI.list();
        const latest = response.data.data?.[0]; // Assuming newest is first or just find by name
        if (latest) {
          handleSelectForLead(latest);
        }
      }

      toast.success(editingItineraryId ? 'Itinerary updated successfully' : 'Itinerary created successfully');

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Failed to save itinerary';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (itinerary) => {
    try {
      const newStatus = !itinerary.show_on_website;

      // Optimistic update - update UI immediately
      setItineraries(prevItineraries =>
        prevItineraries.map(item =>
          item.id === itinerary.id
            ? { ...item, show_on_website: newStatus }
            : item
        )
      );

      const packageData = new FormData();
      packageData.append('show_on_website', newStatus ? '1' : '0');
      packageData.append('_method', 'PUT');

      await packagesAPI.update(itinerary.id, packageData);

      // Refresh the list to get updated data from server
      await fetchItineraries(false);
      toast.success('Status updated successfully');
    } catch {
      // Revert optimistic update on error
      await fetchItineraries(false);
      toast.error('Failed to update itinerary status. Please try again.');
    }
  };

  const handleDelete = async (itinerary) => {
    const name = itinerary.title || itinerary.itinerary_name || 'This itinerary';
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      await packagesAPI.delete(itinerary.id);
      await fetchItineraries(false);
      toast.success('Itinerary deleted successfully');
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
      toast.error(err.response?.data?.message || 'Failed to delete itinerary. Please try again.');
    }
  };

  const handleDuplicate = async (itinerary) => {
    try {
      setLoading(true);
      const res = await packagesAPI.duplicate(itinerary.id);
      if (res.data.success) {
        toast.success(res.data.message || 'Itinerary duplicated');
        await fetchItineraries(false);
      }
    } catch (err) {
      console.error('Failed to duplicate itinerary:', err);
      toast.error(err.response?.data?.message || 'Failed to duplicate itinerary');
    } finally {
      setLoading(false);
    }
  };

  const filteredItineraries = itineraries.filter(itinerary => {
    const nameMatch = (itinerary.title || itinerary.itinerary_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const routeMatch = (itinerary.routing || itinerary.destinations || itinerary.destination || '').toLowerCase().includes(searchRoute.toLowerCase());
    const durationMatch = searchDuration === '' || itinerary.duration?.toString() === searchDuration;
    
    return nameMatch && routeMatch && durationMatch;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.title || a.itinerary_name || '').localeCompare(b.title || b.itinerary_name || '');
    }
    if (sortBy === 'oldest') {
      return a.id - b.id;
    }
    // Default: newest (ID DESC)
    return b.id - a.id;
  });

  return (
    <div className={`p-6 relative page-transition ${loading && itineraries.length > 0 ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      <div className="mb-6 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Itineraries</h1>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-2 px-3 rounded-xl border border-gray-200 shadow-sm">
              {/* Search by Name */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 text-xs font-medium"
                />
              </div>

              {/* Search by Route */}
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Route/Dest..."
                  value={searchRoute}
                  onChange={(e) => setSearchRoute(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 text-xs font-medium"
                />
              </div>

              {/* Day Filter */}
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  placeholder="Days"
                  value={searchDuration}
                  onChange={(e) => setSearchDuration(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-xs font-medium"
                  min="0"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-600 cursor-pointer"
              >
                <option value="newest">Latest Added</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>

              {/* Clear Filters */}
              {(searchTerm || searchDuration || searchRoute || sortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchDuration('');
                    setSearchRoute('');
                    setSortBy('newest');
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 px-2 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Add New Button */}
            {hasPermission(user, 'itineraries.create') && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-sm transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
                Add New
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && itineraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-500 bg-white rounded-2xl border border-dashed border-gray-200">
             <LogoLoader text="Loading itineraries..." />
          </div>
      ) : (
        <>

        {/* Itineraries Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredItineraries.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              {searchTerm
                ? "No itineraries found matching your search"
                : "No itineraries available"}
            </div>
          ) : (
            filteredItineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/itineraries/${itinerary.id}`);
                  }
                }}
                className="bg-white flex flex-col border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer"
              >
                {/* Image & Actions Container */}
                <div className="relative h-72 overflow-hidden">
                  {itinerary.image ? (
                    <img
                      src={itinerary.image}
                      alt={itinerary.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400x300?text=No+Image')}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">No Photo</span>
                    </div>
                  )}

                  {/* Top Actions Overlay - stopPropagation so card click doesn't fire */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(itinerary);
                      }}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-blue-600 hover:bg-white flex items-center justify-center shadow-lg"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission(user, 'itineraries.create') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(itinerary);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-purple-600 hover:bg-white flex items-center justify-center shadow-lg"
                        title="Duplicate Itinerary"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission(user, 'itineraries.edit') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(itinerary);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-green-600 hover:bg-white flex items-center justify-center shadow-lg"
                        title="Edit Itinerary"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission(user, 'itineraries.delete') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(itinerary);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-red-600 hover:bg-white flex items-center justify-center shadow-lg"
                        title="Delete Itinerary"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* SELECT FOR LEAD BUTTON */}
                  {new URLSearchParams(window.location.search).get('chooseForLead') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectForLead(itinerary);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl transform group-hover:scale-110 transition-transform"
                      >
                        <Plus className="h-5 w-5" />
                        INSERT INTO LEAD
                      </button>
                    </div>
                  )}


                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg truncate mb-1">
                      {itinerary.title || itinerary.itinerary_name || "Untitled"}
                    </h3>
                    <div className="flex items-center gap-3 text-white/90 text-xs">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {itinerary.duration ? `${itinerary.duration} Days` : "N/A"}
                      </span>
                      {(itinerary.routing || itinerary.destination || itinerary.destinations) && (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3" />
                          {itinerary.routing || itinerary.destination || itinerary.destinations}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-grow">
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-medium">Status</span>
                      <span className={`text-xs font-bold ${itinerary.show_on_website ? "text-green-600" : "text-red-500"}`}>
                        {itinerary.show_on_website ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasPermission(user, 'itineraries.edit')) {
                          handleToggleStatus(itinerary);
                        }
                      }}
                      disabled={!hasPermission(user, 'itineraries.edit')}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${itinerary.show_on_website ? "bg-green-500" : "bg-red-500"
                        }`}
                    >
                      <span
                        className={`h-3.5 w-3.5 bg-white rounded-full transform transition-transform duration-200 ease-in-out ${itinerary.show_on_website ? "translate-x-5" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between">
                  <span>ID: {itinerary.id}</span>
                  <span>Updated: {formatDate(itinerary.updated_at || itinerary.last_updated)}</span>
                </div>
              </div>
            ))
          )}
        </div>


      {/* Create Itinerary Modal */}
      <Dialog visible={showModal} style={{minWidth:'50vw'}} header={()=>(
 <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {editingItineraryId ? 'Edit Itinerary' : 'Create Itinerary'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
      )} showCloseIcon={false}>
 <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Itinerary Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800"
                      value={formData.itinerary_name}
                      onChange={(e) => setFormData({ ...formData, itinerary_name: e.target.value })}
                      placeholder="Enter itinerary name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration (Days)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      min="1"
                    />
                  </div>
                </div>


                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Routing</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800"
                    value={formData.routing}
                    onChange={(e) => setFormData({ ...formData, routing: e.target.value })}
                    placeholder="e.g. Delhi (1N) - Shimla (2N) - Manali (3N) - Delhi"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes / Description</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-32 font-medium text-gray-800 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter itinerary details..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Itinerary Banner Image</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => document.getElementById('itinerary-img-up').click()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white transition-all active:scale-[0.98]"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </button>
                    <input
                      type="file"
                      id="itinerary-img-up"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLibraryModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm"
                    >
                      <Camera className="h-4 w-4" />
                      Select from Library
                    </button>
                  </div>
                  {(imagePreview || formData.image) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2 w-fit">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Preview</p>
                       <img 
                        src={imagePreview || (formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image?.url || formData.image)} 
                        alt="Preview" 
                        className="w-48 h-28 object-cover rounded-lg border shadow-sm" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t font-poppins">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-md shadow-blue-50"
                >
                  {saving ? 'SAVING...' : 'SAVE ITINERARY'}
                </button>
              </div>
            </form>
      </Dialog>
    

      {/* Choose from Library Modal */}
      <Dialog visible={showLibraryModal} style={{minWidth:"50vw"}} header={()=>(
  <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Choose from Library</h2>
              <button
                onClick={() => { setShowLibraryModal(false); setLibrarySearchTerm(''); setFreeStockPhotos([]); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
      )}>
  <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setLibraryTab('free')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${libraryTab === 'free' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Free stock images
              </button>
              <button
                type="button"
                onClick={() => setLibraryTab('your')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${libraryTab === 'your' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Your itineraries
              </button>
            </div>
            <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={librarySearchTerm}
                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (libraryTab === 'free' ? fetchFreeStockImages() : null)}
                    placeholder={libraryTab === 'free' ? 'Search locations (e.g. Maldives, Paris)...' : 'Search your itineraries...'}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all font-bold text-sm"
                  />
                </div>
                {libraryTab === 'free' && (
                  <button
                    type="button"
                    onClick={fetchFreeStockImages}
                    disabled={(librarySearchTerm || '').trim().length < 2 || freeStockLoading}
                    className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
                  >
                    SEARCH
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {libraryTab === 'free' ? 'Pexels high-res stock images' : 'Reuse images from your previous itineraries'}
                 </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {libraryTab === 'free' ? (
                freeStockLoading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <LogoLoader text="Searching Stock..." compact={true} />
                  </div>
                ) : (librarySearchTerm || '').trim().length < 2 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Enter location and click Search</p>
                  </div>
                ) : freeStockPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <X className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-center px-8">No matching high-res images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {freeStockPhotos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectFreeStockImage(p.url)}
                        className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        <img src={p.thumb || p.url} alt={p.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white font-black text-[10px] uppercase tracking-widest">Select Image</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                librarySearch.length < 2 ? (
                   <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Search your collections</p>
                  </div>
                ) : libraryImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <X className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No local results</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {libraryImages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          handleSelectLibraryImage(p);
                          setShowLibraryModal(false);
                          setLibrarySearchTerm('');
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        <img src={p.image} alt={p.itinerary_name || p.title || 'Select'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <div className="flex flex-col text-left">
                             <span className="text-white font-black text-[10px] uppercase tracking-widest truncate w-full">{p.itinerary_name || 'Untitled'}</span>
                             <span className="text-white/60 font-medium text-[8px] uppercase tracking-widest mt-0.5">Click to choose</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
      </Dialog>
   

      {/* View Itinerary Modal */}
      <Dialog className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto my-auto animate-in-scale flex flex-col overflow-hidden" 
      showCloseIcon={false} visible={showViewModal}  header={()=>(
 <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Itinerary Overview</h2>
              <button
                onClick={() => { setShowViewModal(false)}}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
      )}
      footer={()=>(
        <div className="p-8 border-t flex items-center justify-between">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Package ID: {viewingItinerary.id}
               </div>
               <button
                onClick={() => { setShowViewModal(false)}}
                className="px-10 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] text-sm"
              >
                GOT IT
              </button>
            </div>
      )}
      >
    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="md:col-span-2">
                  {viewingItinerary?.image ? (
                    <div className="relative w-full h-72 rounded-xl overflow-hidden border shadow-sm cursor-pointer">
                      <img
                        src={viewingItinerary?.image}
                        alt={viewingItinerary?.itinerary_name || 'Itinerary'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 pr-6">
                         <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-1.5 inline-block">
                             {viewingItinerary?.duration ? `${viewingItinerary?.duration} Days` : 'N/A'}
                         </span>
                         <h3 className="text-white text-2xl font-bold tracking-tight">{viewingItinerary?.itinerary_name || 'Untitled'}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-50 rounded-xl border flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-gray-200" />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Standard Cost</span>
                         <span className="text-lg font-bold text-gray-800">{formatPrice(viewingItinerary?.price || 0)}</span>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                         <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Website Price</span>
                         <span className="text-lg font-bold text-blue-800">{formatPrice(viewingItinerary?.website_cost || 0)}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <CalendarDays className="w-3 h-3" /> Details
                      </h4>
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-500">Adults</span>
                            <span className="font-bold text-gray-800">{viewingItinerary?.adult || 0}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-t pt-3">
                            <span className="font-semibold text-gray-500">Children</span>
                            <span className="font-bold text-gray-800">{viewingItinerary?.child || 0}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-t pt-3">
                            <span className="font-semibold text-gray-500">Website Status</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${viewingItinerary?.show_on_website ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {viewingItinerary?.show_on_website ? 'Visible' : 'Hidden'}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                {viewingItinerary?.notes && (
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Hash className="w-3 h-3" /> Description
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm font-medium text-gray-600 whitespace-pre-wrap leading-relaxed">
                       {viewingItinerary?.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
      </Dialog>
   
        </>
      )}
    </div>
  );
};

export default Itineraries;

