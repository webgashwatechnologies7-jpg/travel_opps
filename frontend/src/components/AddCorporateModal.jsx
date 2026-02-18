import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { accountsAPI } from '../services/api';

const AddCorporateModal = ({ isOpen, onClose, onSave, editMode = false, initialData = null }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        contactPerson: '',
        designation: '',
        email: '',
        mobile: '+91',
        city: '',
        creditLimit: ''
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
            setFormData({
                companyName: initialData.companyName || '',
                industry: initialData.industry || '',
                contactPerson: initialData.contactPerson || '',
                designation: initialData.designation || '',
                email: initialData.email || '',
                mobile: initialData.mobile || '+91',
                city: initialData.city || '',
                creditLimit: initialData.creditLimit ? initialData.creditLimit.replace(/[^0-9.]/g, '') : ''
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

        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
        if (!formData.mobile) newErrors.mobile = 'Mobile is required';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
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
            await onSave(formData);
            handleClose();
        } catch (error) {
            console.error('Error saving corporate client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            companyName: '',
            industry: '',
            contactPerson: '',
            designation: '',
            email: '',
            mobile: '+91',
            city: '',
            creditLimit: ''
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
                        {editMode ? 'Edit Corporate Client' : 'Add Corporate Client'}
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
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name*
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Industry
                            </label>
                            <input
                                type="text"
                                name="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Contact Person */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Person*
                            </label>
                            <input
                                type="text"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.contactPerson && <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>}
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Designation
                            </label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleInputChange}
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
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile Number*
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
                        </div>

                        {/* City */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
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

                        {/* Credit Limit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credit Limit (₹)
                            </label>
                            <input
                                type="number"
                                name="creditLimit"
                                value={formData.creditLimit}
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

export default AddCorporateModal;
