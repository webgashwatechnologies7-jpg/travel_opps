import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useSettings } from '../contexts/SettingsContext';
import { Search, Plus, Edit, X, Image as ImageIcon, Trash2, Camera, Upload } from 'lucide-react';
import { dayItinerariesAPI, packagesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';

// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  // Super Admin bypass
  if (user.is_super_admin) return true;
  // Check granular permission
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    title: '',
    details: '',
    status: 'active',
    image: null
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageSource, setImageSource] = useState('upload'); // 'upload' or 'library'
  const [libraryPackages, setLibraryPackages] = useState([]);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryTab, setLibraryTab] = useState('free'); // 'free' = free stock images, 'your' = your itineraries
  const [freeStockPhotos, setFreeStockPhotos] = useState([]);
  const [freeStockLoading, setFreeStockLoading] = useState(false);

  useEffect(() => {
    fetchDayItineraries();
  }, []);

  const fetchDayItineraries = async () => {
    try {
      setLoading(true);
      const response = await dayItinerariesAPI.list();
      const data = response.data.data || response.data || [];

      // Process image URLs - handle both relative and absolute URLs
      const processedData = data.map(itinerary => {
        if (itinerary.image) {
          // If image is a relative URL, convert to absolute
          if (itinerary.image.startsWith('/storage') || (itinerary.image.startsWith('/') && !itinerary.image.startsWith('http'))) {
            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            baseUrl = baseUrl.replace('/api', '');
            itinerary.image = `${baseUrl}${itinerary.image}`;
          }
          // Fix domain if needed
          if (itinerary.image.includes('localhost') && !itinerary.image.includes(':8000')) {
            itinerary.image = itinerary.image.replace('localhost', 'localhost:8000');
          }
        }
        return itinerary;
      });

      setDayItineraries(processedData);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setDayItineraries([]);
      } else {
        setError('Failed to load day itineraries');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItineraryId(null);
    setIsModalOpen(true);
    setFormData({
      destination: '',
      title: '',
      details: '',
      status: 'active',
      image: null
    });
    setImagePreview(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItineraryId(null);
    setFormData({
      destination: '',
      title: '',
      details: '',
      status: 'active',
      image: null
    });
    setImagePreview(null);
    setShowImageModal(false);
    setImageSource('upload');
    setLibraryPackages([]);
    setFreeStockPhotos([]);
    setLibraryTab('free');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch packages (itineraries) from app for library - when user searches "Shimla", show Shimla images
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
    } catch (err) {
      console.error('Failed to fetch library:', err);
      toast.error('Failed to load image library. Please try again.');
    } finally {
      setLibraryLoading(false);
    }
  };

  // Load packages when library modal opens and user is on "Your itineraries" tab
  useEffect(() => {
    if (showImageModal && imageSource === 'library' && libraryTab === 'your' && libraryPackages.length === 0) {
      fetchLibraryPackages();
    }
  }, [showImageModal, imageSource, libraryTab]);

  // Free stock images (Pexels) - search e.g. Kufri, Shimla
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
      setImageSource('upload');
      setShowImageModal(false);
    } catch (e) {
      toast.error('Failed to load image. Try another or upload from device.');
    }
  };

  // Filter library by search (e.g. Shimla) - show only matching itinerary images
  const librarySearch = (librarySearchTerm || '').trim().toLowerCase();
  const libraryImages = librarySearch.length >= 2
    ? libraryPackages.filter(
      (p) =>
        p.image &&
        ((p.title || p.itinerary_name || '').toLowerCase().includes(librarySearch) ||
          (p.destination || p.destinations || '').toLowerCase().includes(librarySearch))
    )
    : [];

  const handleImageSelect = (imageUrl) => {
    setImagePreview(imageUrl);
    setFormData(prev => ({ ...prev, image: null })); // Clear file if library image selected
    setImageSource('library'); // Mark as library image
    setShowImageModal(false);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(null); // Clear library preview if file uploaded
      setImageSource('upload'); // Mark as upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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

      // Handle image - either file or library image
      if (formData.image) {
        submitData.append('image', formData.image);
      } else if (imagePreview && imageSource === 'library') {
        // Download image from URL and convert to file
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], 'day-itinerary-image.jpg', { type: blob.type });
        submitData.append('image', file);
      }

      if (editingItineraryId) {
        submitData.append('_method', 'PUT');
        await dayItinerariesAPI.update(editingItineraryId, submitData);
        setError('');
      } else {
        await dayItinerariesAPI.create(submitData);
        setError('');
      }

      await fetchDayItineraries();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || (editingItineraryId ? 'Failed to update day itinerary' : 'Failed to add day itinerary'));
      console.error(err);
    } finally {
      setSaving(false);
    }
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

    // Set image preview if image exists
    if (itinerary.image) {
      // Handle both relative and absolute URLs
      let imageUrl = itinerary.image;
      if (imageUrl.startsWith('/storage') || (imageUrl.startsWith('/') && !imageUrl.startsWith('http'))) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      if (imageUrl.includes('localhost') && !imageUrl.includes(':8000')) {
        imageUrl = imageUrl.replace('localhost', 'localhost:8000');
      }
      setImagePreview(imageUrl);
      setImageSource('upload'); // Existing image is from upload
    } else {
      setImagePreview(null);
      setImageSource('upload');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this day itinerary?')) return;

    try {
      await dayItinerariesAPI.delete(id);
      await fetchDayItineraries();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete day itinerary');
      console.error(err);
    }
  };

  const filteredDayItineraries = dayItineraries.filter(itinerary => {
    const title = itinerary.title || '';
    const searchLower = searchTerm.toLowerCase();
    return title.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
    <Layout>
      <div className="p-6" style={{ backgroundColor: settings?.dashboard_background_color || '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Day Itinerary</h1>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            {/* Action Button */}
            {hasPermission(user, 'day_itineraries.create') && (
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

        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Day Itineraries Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDayItineraries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No day itineraries found
                    </td>
                  </tr>
                ) : (
                  filteredDayItineraries.map((itinerary) => (
                    <tr key={itinerary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                            {itinerary.image ? (
                              <img
                                src={itinerary.image}
                                alt={itinerary.title || 'Day Itinerary'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  if (parent && !parent.querySelector('.no-photo-text')) {
                                    const span = document.createElement('span');
                                    span.className = 'no-photo-text text-xs text-gray-400 font-medium';
                                    span.textContent = 'NO PHOTO';
                                    parent.appendChild(span);
                                  }
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{itinerary.title || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {truncateText(itinerary.details || itinerary.detail, 60)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={async () => {
                            if (!hasPermission(user, 'day_itineraries.status')) return;
                            try {
                              const newStatus = itinerary.status === 'active' ? 'inactive' : 'active';
                              await dayItinerariesAPI.update(itinerary.id, { ...itinerary, status: newStatus, _method: 'PUT' });
                              fetchDayItineraries();
                              toast.success(`Status updated to ${newStatus}`);
                            } catch (err) {
                              toast.error('Failed to update status');
                            }
                          }}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${itinerary.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                          disabled={!hasPermission(user, 'day_itineraries.status')}
                        >
                          {itinerary.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{itinerary.created_by_name || 'Travbizz Travel IT Solutions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(itinerary.updated_at || itinerary.last_update)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {hasPermission(user, 'day_itineraries.edit') && (
                            <button
                              onClick={() => handleEdit(itinerary)}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          {hasPermission(user, 'day_itineraries.delete') && (user?.is_super_admin || user?.roles?.some(r => ['Admin', 'Company Admin', 'Super Admin'].includes(typeof r === 'string' ? r : r.name))) && (
                            <button
                              onClick={() => handleDelete(itinerary.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
                              title="Delete"
                            >
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

        {/* Add/Edit Day Itinerary Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingItineraryId ? 'Edit Day Itinerary' : 'Add Day Itinerary'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave}>
                <div className="p-6 space-y-4">
                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter destination"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter title"
                      required
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Details
                    </label>
                    <textarea
                      value={formData.details}
                      onChange={(e) => handleInputChange('details', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter details"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image
                    </label>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: null }));
                            }}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-3">No image selected</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm font-medium">Upload Image</span>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setImageSource('library');
                            setShowImageModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          <span className="text-sm font-medium">Choose from Library</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (editingItineraryId ? 'Updating...' : 'Saving...') : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Library Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Choose Image</h2>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setLibraryPackages([]);
                    setFreeStockPhotos([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

              {/* Search */}
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

              {/* Images Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {libraryTab === 'free' ? (
                  freeStockLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (librarySearchTerm || '').trim().length < 2 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Type a location (e.g. Shimla, Kufri) and click Search to get free images.</p>
                    </div>
                  ) : freeStockPhotos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No images found. Try another search or add VITE_PEXELS_API_KEY in .env (pexels.com/api).</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {freeStockPhotos.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectFreeStockImage(p.url)}
                          className="relative aspect-video cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        >
                          <img src={p.thumb || p.url} alt={p.alt} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Select</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  libraryLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : librarySearch.length < 2 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Type at least 2 characters to see images from your itineraries.</p>
                    </div>
                  ) : libraryImages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No images for &quot;{librarySearchTerm}&quot;. Use &quot;Free stock images&quot; tab to search Kufri, Shimla, etc.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {libraryImages.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleImageSelect(p.image)}
                          className="relative aspect-video cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        >
                          <img src={p.image} alt={p.itinerary_name || p.title || 'Select'} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Select</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DayItinerary;

