import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Edit, X, Upload, Download, Star, Trash2 } from 'lucide-react';
import { hotelsAPI } from '../services/api';

const Hotel = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    destination: '',
    hotel_details: '',
    hotel_photo: null,
    contact_person: '',
    email: '',
    phone: '',
    hotel_address: '',
    hotel_link: '',
    status: 'active',
    created_by: ''
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [editingRateId, setEditingRateId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [rateFormData, setRateFormData] = useState({
    from_date: '',
    to_date: '',
    room_type: '',
    meal_plan: 'BB',
    single: '',
    double: '',
    triple: '',
    quad: '',
    cwb: '',
    cnb: ''
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelsAPI.list();
      setHotels(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setHotels([]);
      } else {
        setError('Failed to load hotels');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingHotelId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      category: '',
      destination: '',
      hotel_details: '',
      hotel_photo: null,
      contact_person: '',
      email: '',
      phone: '',
      hotel_address: '',
      hotel_link: '',
      status: 'active',
      created_by: ''
    });
    setPhotoPreview(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHotelId(null);
    setFormData({
      name: '',
      category: '',
      destination: '',
      hotel_details: '',
      hotel_photo: null,
      contact_person: '',
      email: '',
      phone: '',
      hotel_address: '',
      hotel_link: '',
      status: 'active',
      created_by: ''
    });
    setPhotoPreview(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        hotel_photo: file
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const hotelData = new FormData();
      hotelData.append('name', formData.name);
      if (formData.category) hotelData.append('category', formData.category);
      hotelData.append('destination', formData.destination);
      hotelData.append('hotel_details', formData.hotel_details || '');
      if (formData.hotel_photo) {
        hotelData.append('hotel_photo', formData.hotel_photo);
      }
      hotelData.append('contact_person', formData.contact_person || '');
      hotelData.append('email', formData.email || '');
      hotelData.append('phone', formData.phone || '');
      hotelData.append('hotel_address', formData.hotel_address);
      hotelData.append('hotel_link', formData.hotel_link || '');
      hotelData.append('status', formData.status);

      if (editingHotelId) {
        await hotelsAPI.update(editingHotelId, hotelData);
        setError('');
      } else {
        await hotelsAPI.create(hotelData);
        setError('');
      }

      await fetchHotels();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || (editingHotelId ? 'Failed to update hotel' : 'Failed to add hotel'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hotel) => {
    setEditingHotelId(hotel.id);
    setIsModalOpen(true);
    
    setFormData({
      name: hotel.name || '',
      category: hotel.category || '',
      destination: hotel.destination || '',
      hotel_details: hotel.hotel_details || '',
      hotel_photo: null,
      contact_person: hotel.contact_person || '',
      email: hotel.email || '',
      phone: hotel.phone || '',
      hotel_address: hotel.hotel_address || '',
      hotel_link: hotel.hotel_link || '',
      status: hotel.status || 'active',
      created_by: hotel.created_by || ''
    });
    setPhotoPreview(hotel.hotel_photo || null);
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) {
      return;
    }

    try {
      await hotelsAPI.delete(hotelId);
      await fetchHotels();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hotel');
      console.error(err);
    }
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
    setImportFile(null);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      await hotelsAPI.importHotels(formData);
      await fetchHotels(); // Refresh hotels list
      handleCloseImportModal();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import hotels');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setError('');
      const response = await hotelsAPI.exportHotels();
      
      // Check if response is actually a blob
      if (response.data instanceof Blob) {
        // Create blob from response
        const blob = response.data;
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hotels_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // If not a blob, try to create one from the data
        const blob = new Blob([response.data], { 
          type: 'text/csv;charset=utf-8;' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hotels_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      let errorMessage = 'Failed to export hotels';
      
      // Try to parse error response if it's a blob
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Export error:', err);
    }
  };

  const handleDownloadFormat = async () => {
    try {
      setError('');
      const response = await hotelsAPI.downloadImportFormat();
      
      // Check if response is actually a blob
      if (response.data instanceof Blob) {
        // Create blob from response
        const blob = response.data;
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'hotel_import_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // If not a blob, try to create one from the data
        const blob = new Blob([response.data], { 
          type: 'text/csv;charset=utf-8;' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'hotel_import_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      let errorMessage = 'Failed to download import format';
      
      // Try to parse error response if it's a blob
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Download error:', err);
    }
  };

  const handleUpdatePrice = async (hotel) => {
    setSelectedHotel(hotel);
    setIsPriceModalOpen(true);
    setRateFormData({
      from_date: '',
      to_date: '',
      room_type: '',
      meal_plan: 'BB',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: ''
    });
    await fetchRates(hotel.id);
  };

  const handleClosePriceModal = () => {
    setIsPriceModalOpen(false);
    setSelectedHotel(null);
    setRates([]);
    setRateFormData({
      from_date: '',
      to_date: '',
      room_type: '',
      meal_plan: 'BB',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: ''
    });
  };

  const fetchRates = async (hotelId) => {
    try {
      setLoadingRates(true);
      const response = await hotelsAPI.getRates(hotelId);
      setRates(response.data.data || []);
    } catch (err) {
      console.error('Failed to load rates:', err);
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleRateInputChange = (field, value) => {
    setRateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;

    try {
      if (editingRateId) {
        // Update existing rate
        await hotelsAPI.updateRate(selectedHotel.id, editingRateId, rateFormData);
        setError('');
      } else {
        // Create new rate
        await hotelsAPI.createRate(selectedHotel.id, rateFormData);
        await fetchHotels(); // Refresh hotels list to update count
      }
      
      await fetchRates(selectedHotel.id);
      setEditingRateId(null);
      setRateFormData({
        from_date: '',
        to_date: '',
        room_type: '',
        meal_plan: 'BB',
        single: '',
        double: '',
        triple: '',
        quad: '',
        cwb: '',
        cnb: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || (editingRateId ? 'Failed to update rate' : 'Failed to add rate'));
      console.error(err);
    }
  };

  const handleEditRate = (rate) => {
    setEditingRateId(rate.id);
    setRateFormData({
      from_date: rate.from_date,
      to_date: rate.to_date,
      room_type: rate.room_type,
      meal_plan: rate.meal_plan,
      single: rate.single || '',
      double: rate.double || '',
      triple: rate.triple || '',
      quad: rate.quad || '',
      cwb: rate.cwb || '',
      cnb: rate.cnb || ''
    });
    // Scroll to form
    const formElement = document.querySelector('form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingRateId(null);
    setRateFormData({
      from_date: '',
      to_date: '',
      room_type: '',
      meal_plan: 'BB',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: ''
    });
  };

  const handleDeleteRate = async (rateId) => {
    if (!selectedHotel) return;
    if (!window.confirm('Are you sure you want to delete this rate?')) return;

    try {
      await hotelsAPI.deleteRate(selectedHotel.id, rateId);
      await fetchRates(selectedHotel.id);
      await fetchHotels(); // Refresh hotels list to update count
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete rate');
      console.error(err);
    }
  };

  const renderStars = (category) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < category ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  const filteredHotels = hotels.filter(hotel => {
    const name = hotel.name || '';
    const destination = hotel.destination || '';
    const searchLower = searchTerm.toLowerCase();
    return name.toLowerCase().includes(searchLower) || destination.toLowerCase().includes(searchLower);
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

  const formatMealPlan = (mealPlan) => {
    const mealPlanMap = {
      'BB': 'Bed & Breakfast (BB)',
      'HB': 'Half Board (HB)',
      'FB': 'Full Board (FB)',
      'MAP': 'Modified American Plan (MAP)',
      'AP': 'American Plan (AP)'
    };
    return mealPlanMap[mealPlan] || mealPlan;
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
      <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Hotel</h1>
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
            {/* Action Buttons */}
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Add New
            </button>
            <button
              onClick={handleImport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              <Upload className="h-5 w-5" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              <Download className="h-5 w-5" />
              Export
            </button>
            <button
              onClick={handleDownloadFormat}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              <Download className="h-5 w-5" />
              Download Import Format
            </button>
          </div>
        </div>

        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Hotels Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
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
                {filteredHotels.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No hotels found
                    </td>
                  </tr>
                ) : (
                  filteredHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hotel.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(hotel.category || 3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hotel.destination || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdatePrice(hotel)}
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Update ({hotel.price_updates_count || 0})
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          hotel.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {hotel.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hotel.created_by_name || 'Travbizz Travel IT Solutions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(hotel.updated_at || hotel.last_update)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(hotel)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(hotel.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded ml-2"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Hotel Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingHotelId ? 'Edit Hotel' : 'Add Hotel'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} encType="multipart/form-data">
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Hotel Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter hotel name"
                      required
                    />
                  </div>

                  {/* Category and Destination */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select</option>
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination *
                      </label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => handleInputChange('destination', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter destination"
                        required
                      />
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Details
                    </label>
                    <textarea
                      value={formData.hotel_details}
                      onChange={(e) => handleInputChange('hotel_details', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter hotel details"
                    />
                  </div>

                  {/* Hotel Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Photo {!editingHotelId && '*'}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={!editingHotelId}
                      />
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                      )}
                    </div>
                    {!photoPreview && !formData.hotel_photo && (
                      <p className="mt-1 text-sm text-gray-500">No file chosen</p>
                    )}
                  </div>

                  {/* Contact Person and Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Hotel Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Address *
                    </label>
                    <input
                      type="text"
                      value={formData.hotel_address}
                      onChange={(e) => handleInputChange('hotel_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter hotel address"
                      required
                    />
                  </div>

                  {/* Status and Hotel Link */}
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hotel Link
                      </label>
                      <input
                        type="url"
                        value={formData.hotel_link}
                        onChange={(e) => handleInputChange('hotel_link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter hotel website link"
                      />
                    </div>
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
                    {saving ? (editingHotelId ? 'Updating...' : 'Saving...') : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Price Modal */}
        {isPriceModalOpen && selectedHotel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Update Price - {selectedHotel.name}</h2>
                <button
                  onClick={handleClosePriceModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Input Form Section */}
                <form onSubmit={handleAddRate} className="mb-6">
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={rateFormData.from_date}
                        onChange={(e) => handleRateInputChange('from_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                      <input
                        type="date"
                        value={rateFormData.to_date}
                        onChange={(e) => handleRateInputChange('to_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <select
                        value={rateFormData.room_type}
                        onChange={(e) => handleRateInputChange('room_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select</option>
                        <option value="1bhk">1bhk</option>
                        <option value="1BR Villa with Private Pool">1BR Villa with Private Pool</option>
                        <option value="Club Room">Club Room</option>
                        <option value="Daosri The Inn">Daosri The Inn</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Deluxe Room">Deluxe Room</option>
                        <option value="DLX">DLX</option>
                        <option value="Executive Room">Executive Room</option>
                        <option value="Penthouse Suite">Penthouse Suite</option>
                        <option value="Premium (Non View Room)">Premium (Non View Room)</option>
                        <option value="Premium Room">Premium Room</option>
                        <option value="Room type">Room type</option>
                        <option value="Standard">Standard</option>
                        <option value="Standard (Non View)">Standard (Non View)</option>
                        <option value="Suite Room">Suite Room</option>
                        <option value="Super Deluxe Room">Super Deluxe Room</option>
                        <option value="Superior Room">Superior Room</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meal Plan</label>
                      <select
                        value={rateFormData.meal_plan}
                        onChange={(e) => handleRateInputChange('meal_plan', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="BB">Bed & Breakfast (BB)</option>
                        <option value="HB">Half Board (HB)</option>
                        <option value="FB">Full Board (FB)</option>
                        <option value="MAP">Modified American Plan (MAP)</option>
                        <option value="AP">American Plan (AP)</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Single</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.single}
                        onChange={(e) => handleRateInputChange('single', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Double</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.double}
                        onChange={(e) => handleRateInputChange('double', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Triple</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.triple}
                        onChange={(e) => handleRateInputChange('triple', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quad</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.quad}
                        onChange={(e) => handleRateInputChange('quad', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CWB</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.cwb}
                        onChange={(e) => handleRateInputChange('cwb', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNB</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateFormData.cnb}
                        onChange={(e) => handleRateInputChange('cnb', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 flex items-end gap-2">
                      {editingRateId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {editingRateId ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Rate List Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Rate List</h3>
                  {loadingRates ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : rates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No Rate</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Plan</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Single</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Double</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triple</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CWB</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNB</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rates.map((rate) => (
                            <tr key={rate.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{new Date(rate.from_date).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{new Date(rate.to_date).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.room_type}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatMealPlan(rate.meal_plan)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.single || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.double || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.triple || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.quad || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.cwb || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{rate.cnb || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleEditRate(rate)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRate(rate.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Hotel Excel Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Import Hotel Excel</h2>
                <button
                  onClick={handleCloseImportModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleImportSubmit}>
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Import Excel
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleImportFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    {!importFile && (
                      <p className="mt-1 text-sm text-gray-500">No file chosen</p>
                    )}
                    {importFile && (
                      <p className="mt-1 text-sm text-green-600">{importFile.name}</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseImportModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importing...' : 'Save'}
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

export default Hotel;

