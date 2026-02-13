import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { Search, Plus, Edit, Eye, X, Image as ImageIcon, Hash, MapPin, CalendarDays, Trash, Upload, Camera } from 'lucide-react';
import { packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';

const Itineraries = () => {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    notes: '',
    image: null
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
      });
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
      notes: '',
      image: null
    });
    setImagePreview(null);
    setShowModal(true);
  };

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

  const handleEdit = async (itinerary) => {
    try {
      setEditingItineraryId(itinerary.id);
      const response = await packagesAPI.get(itinerary.id);
      const data = response.data.data;

      // Convert image URL to absolute if needed
      const imageUrl = data.image ? normalizeImageUrl(data.image) : null;

      setFormData({
        itinerary_name: data.itinerary_name || '',
        duration: data.duration?.toString() || '1',
        destinations: data.destinations || '',
        notes: data.notes || '',
        image: null
      });
      setImagePreview(imageUrl);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      toast.error('Failed to load itinerary details');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItineraryId(null);
    setFormData({
      itinerary_name: '',
      duration: '1',
      destinations: '',
      notes: '',
      image: null
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

  const filteredItineraries = itineraries.filter(itinerary => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (itinerary.title || itinerary.itinerary_name || '').toLowerCase().includes(searchLower) ||
      (itinerary.destination || itinerary.destinations || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout >
      <div className="p-6  ">
        {/* Header */}
        <div className="mb-6 mt-20">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Itineraries</h1>
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                />
              </div>
              {/* Add New Button */}
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Add New
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                  </div>

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
                      {itinerary.destination && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin className="w-3 h-3" />
                          {itinerary.destination}
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
                        handleToggleStatus(itinerary);
                      }}
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

      </div>

      {/* Create Itinerary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItineraryId ? 'Edit Itinerary' : 'Create Itinerary'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave}>
              <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {/* Itinerary setup section */}
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Itinerary Details</h3>
                </div>

                {/* Itinerary Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary Name
                  </label>
                  <input
                    type="text"
                    value={formData.itinerary_name}
                    onChange={(e) => setFormData({ ...formData, itinerary_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter itinerary name"
                    required
                  />
                </div>

                {/* Duration (days) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 3"
                    min="1"
                  />
                </div>

                {/* Destinations */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinations
                  </label>
                  <input
                    type="text"
                    value={formData.destinations}
                    onChange={(e) => setFormData({ ...formData, destinations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Destination"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes"
                    rows="3"
                  />
                </div>

                {/* Image */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-medium">Upload Image</span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLibraryModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">Choose from Library</span>
                      </button>
                    </div>

                    {/* Image Preview */}
                    {(imagePreview || formData.image) && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          {editingItineraryId && imagePreview && !formData.image ? 'Current Image:' : 'Preview:'}
                        </label>
                        <div className="relative w-40 h-40 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
                          <img
                            src={imagePreview || (formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image?.url || formData.image)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Preview image failed to load:', imagePreview || formData.image);
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent && !parent.querySelector('.preview-error')) {
                                const span = document.createElement('span');
                                span.className = 'preview-error text-xs text-gray-400 absolute inset-0 flex items-center justify-center';
                                span.textContent = 'Invalid Image';
                                parent.appendChild(span);
                              }
                            }}
                          />
                        </div>
                        {editingItineraryId && imagePreview && !formData.image && (
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            ℹ️ Current image is displayed above. Select a new file to replace it.
                          </p>
                        )}
                        {formData.image && (
                          <p className="text-xs text-green-600 mt-2 font-medium">
                            ✓ New image selected. This will replace the current image.
                          </p>
                        )}
                      </div>
                    )}

                    {/* No Image Message */}
                    {!imagePreview && !formData.image && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                        <span>No image selected. {editingItineraryId ? 'Current image will be kept if no new image is uploaded.' : 'Upload an image to display with this itinerary.'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Choose from Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Choose from Library</h2>
              <button
                onClick={() => { setShowLibraryModal(false); setLibrarySearchTerm(''); setFreeStockPhotos([]); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Tabs: Free stock images | Your itineraries */}
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
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={librarySearchTerm}
                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (libraryTab === 'free' ? fetchFreeStockImages() : null)}
                    placeholder={libraryTab === 'free' ? 'Search e.g. Shimla, Kufri...' : 'Search your itineraries e.g. Shimla'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {libraryTab === 'free' && (
                  <button
                    type="button"
                    onClick={fetchFreeStockImages}
                    disabled={(librarySearchTerm || '').trim().length < 2 || freeStockLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Search
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {libraryTab === 'free' ? 'Free images from Pexels. Type location (Shimla, Kufri) and click Search.' : 'Images from itineraries you already added.'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {libraryTab === 'free' ? (
                freeStockLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (librarySearchTerm || '').trim().length < 2 ? (
                  <div className="text-center py-12 text-gray-500">
                    Type a location (e.g. Shimla, Kufri) and click Search to get free images.
                  </div>
                ) : freeStockPhotos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No images found. Try another search or add VITE_PEXELS_API_KEY in .env (pexels.com/api).
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {freeStockPhotos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectFreeStockImage(p.url)}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img src={p.thumb || p.url} alt={p.alt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                          <span className="text-white opacity-0 hover:opacity-100 font-medium text-sm">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                librarySearch.length < 2 ? (
                  <div className="text-center py-12 text-gray-500">
                    Type at least 2 characters to see images from your itineraries.
                  </div>
                ) : libraryImages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No images for &quot;{librarySearchTerm}&quot;. Use &quot;Free stock images&quot; tab to search Kufri, Shimla, etc.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {libraryImages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          handleSelectLibraryImage(p);
                          setShowLibraryModal(false);
                          setLibrarySearchTerm('');
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img src={p.image} alt={p.itinerary_name || p.title || 'Select'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                          <span className="text-white opacity-0 hover:opacity-100 font-medium text-sm">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Itinerary Modal */}
      {showViewModal && viewingItinerary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">Itinerary Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingItinerary(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Image */}
                <div className="col-span-2 mb-4">
                  {viewingItinerary.image ? (
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                      <img
                        src={viewingItinerary.image}
                        alt={viewingItinerary.itinerary_name || 'Itinerary Image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('View modal image failed to load:', viewingItinerary.image);
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (parent && !parent.querySelector('.image-error')) {
                            const div = document.createElement('div');
                            div.className = 'image-error absolute inset-0 flex items-center justify-center bg-gray-100';
                            div.innerHTML = '<div class="text-center"><div class="text-gray-400 text-sm font-medium">Image not available</div></div>';
                            parent.appendChild(div);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <div className="text-gray-400 text-sm font-medium">No image available</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Itinerary Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Itinerary Name
                  </label>
                  <p className="text-xl font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">{viewingItinerary.itinerary_name || 'N/A'}</p>
                </div>

                {/* Start Date */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Start Date
                  </label>
                  <p className="text-base font-semibold text-gray-900">{viewingItinerary.start_date ? formatDate(viewingItinerary.start_date) : 'N/A'}</p>
                </div>

                {/* End Date */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    End Date
                  </label>
                  <p className="text-base font-semibold text-gray-900">{viewingItinerary.end_date ? formatDate(viewingItinerary.end_date) : 'N/A'}</p>
                </div>

                {/* Duration */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    Duration
                  </label>
                  <p className="text-base font-bold text-blue-900">{viewingItinerary.duration ? `${viewingItinerary.duration} Days` : 'N/A'}</p>
                </div>

                {/* Adult */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Adult
                  </label>
                  <p className="text-base font-semibold text-gray-900">{viewingItinerary.adult || '0'}</p>
                </div>

                {/* Child */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Child
                  </label>
                  <p className="text-base font-semibold text-gray-900">{viewingItinerary.child || '0'}</p>
                </div>

                {/* Price */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">
                    Price
                  </label>
                  <p className="text-lg font-bold text-yellow-900">{formatPrice(viewingItinerary.price)}</p>
                </div>

                {/* Website Cost */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">
                    Website Cost
                  </label>
                  <p className="text-lg font-bold text-yellow-900">{formatPrice(viewingItinerary.website_cost)}</p>
                </div>

                {/* Show on Website */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Show on Website
                  </label>
                  <span
                    className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${viewingItinerary.show_on_website
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                  >
                    {viewingItinerary.show_on_website ? 'Yes' : 'No'}
                  </span>
                </div>

                {/* Destinations */}
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Destinations
                  </label>
                  <p className="text-base text-gray-900 font-medium">{viewingItinerary.destinations || 'N/A'}</p>
                </div>

                {/* Notes */}
                {viewingItinerary.notes && (
                  <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Notes
                    </label>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">{viewingItinerary.notes}</p>
                  </div>
                )}

                {/* Created By */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Created By
                  </label>
                  <p className="text-sm font-medium text-gray-900">{viewingItinerary.created_by_name || 'N/A'}</p>
                </div>

                {/* Last Updated */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Last Updated
                  </label>
                  <p className="text-sm font-medium text-gray-900">{viewingItinerary.last_updated || formatDate(viewingItinerary.updated_at) || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingItinerary(null);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Itineraries;

