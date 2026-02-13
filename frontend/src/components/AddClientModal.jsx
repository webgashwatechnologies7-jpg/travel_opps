import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { accountsAPI } from '../services/api';

const AddClientModal = ({ isOpen, onClose, onSave, editMode = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '+91',
    email2: '',
    mobile2: '+91',
    city: '',
    address: '',
    dateOfBirth: '',
    marriageAnniversary: ''
  });

  const [cities, setCities] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (citySearchTerm.length > 0) {
      fetchCities(citySearchTerm);
    } else {
      setCities([]);
      setShowCitySuggestions(false);
    }
  }, [citySearchTerm]);

  // Populate form data when editing
  useEffect(() => {
    if (editMode && initialData) {
      // Parse name into first and last name
      let nameParts = (initialData.name || '').split(' ');
      let title = initialData.title || '';

      // If name starts with a title and it's not already in the title field, or if title is empty
      const commonTitles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];
      if (nameParts.length > 0 && commonTitles.includes(nameParts[0])) {
        if (!title) title = nameParts[0];
        nameParts = nameParts.slice(1);
      }

      setFormData({
        title: title,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: initialData.email || '',
        mobile: initialData.mobile || '+91',
        email2: initialData.email2 || '',
        mobile2: initialData.mobile2 || '+91',
        city: initialData.city || '',
        address: initialData.address || '',
        dateOfBirth: initialData.dateOfBirth || '',
        marriageAnniversary: initialData.marriageAnniversary || ''
      });
      setCitySearchTerm(initialData.city || '');
    }
  }, [editMode, initialData]);

  const fetchCities = async (search) => {
    try {
      const response = await accountsAPI.getCities(search);
      if (response.data.success) {
        setCities(response.data.data);
        setShowCitySuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      // Fallback to mock data
      const mockCities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
        'Kolkata', 'Pune', 'Jaipur', 'Lucknow'
      ];
      const filtered = mockCities.filter(city =>
        city.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10);
      setCities(filtered);
      setShowCitySuggestions(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      city: value
    }));
    setCitySearchTerm(value);
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      city: city
    }));
    setCitySearchTerm(city);
    setShowCitySuggestions(false);
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validate email format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.email2 && !/\S+@\S+\.\S+/.test(formData.email2)) {
      newErrors.email2 = 'Please enter a valid email address';
    }

    // Validate mobile format (basic validation)
    const mobileRegex = /^(\+91)?\d{10}$/;
    if (formData.mobile && !mobileRegex.test(formData.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.mobile2 && formData.mobile2 !== '+91' && formData.mobile2 !== '' && !mobileRegex.test(formData.mobile2.replace(/\s/g, ''))) {
      newErrors.mobile2 = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Combine first and last name
      const clientData = {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        mobile: formData.mobile,
        email2: formData.email2,
        mobile2: formData.mobile2,
        city: formData.city,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        marriageAnniversary: formData.marriageAnniversary
      };

      await onSave(clientData);
      handleClose();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      firstName: '',
      lastName: '',
      email: '',
      mobile: '+91',
      email2: '',
      mobile2: '+91',
      city: '',
      address: '',
      dateOfBirth: '',
      marriageAnniversary: ''
    });
    setCitySearchTerm('');
    setShowCitySuggestions(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit Client' : 'Add Client'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <select
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
              )}
            </div>

            {/* Email 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email 2
              </label>
              <input
                type="email"
                name="email2"
                value={formData.email2}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email2 ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.email2 && (
                <p className="mt-1 text-sm text-red-600">{errors.email2}</p>
              )}
            </div>

            {/* Mobile 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile 2
              </label>
              <input
                type="tel"
                name="mobile2"
                value={formData.mobile2}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.mobile2 ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.mobile2 && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile2}</p>
              )}
            </div>

            {/* City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City (type slowly)*
              </label>
              <input
                type="text"
                name="city"
                value={citySearchTerm}
                onChange={handleCityChange}
                onFocus={() => setShowCitySuggestions(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showCitySuggestions && cities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {cities.map((city, index) => (
                    <div
                      key={index}
                      onClick={() => handleCitySelect(city)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Marriage Anniversary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marriage Anniversary
              </label>
              <input
                type="date"
                name="marriageAnniversary"
                value={formData.marriageAnniversary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
