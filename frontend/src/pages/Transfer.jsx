import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Edit, X, Upload, Download, Trash2 } from 'lucide-react';
import { transfersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Transfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    transfer_details: '',
    transfer_photo: null,
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceFormData, setPriceFormData] = useState({
    from_date: '',
    to_date: '',
    price: ''
  });
  const { user } = useAuth();
  const isAdmin = user?.is_super_admin || user?.roles?.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return ['Admin', 'Company Admin', 'Super Admin'].includes(roleName);
  });

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await transfersAPI.list();
      setTransfers(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setTransfers([]);
      } else {
        setError('Failed to load transfers');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingTransferId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      destination: '',
      transfer_details: '',
      transfer_photo: null,
      status: 'active'
    });
    setPhotoPreview(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransferId(null);
    setFormData({
      name: '',
      destination: '',
      transfer_details: '',
      transfer_photo: null,
      status: 'active'
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
        transfer_photo: file
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
      const transferData = new FormData();
      transferData.append('name', formData.name);
      transferData.append('destination', formData.destination);
      transferData.append('transfer_details', formData.transfer_details || '');
      if (formData.transfer_photo) {
        transferData.append('transfer_photo', formData.transfer_photo);
      }
      transferData.append('status', formData.status);

      if (editingTransferId) {
        await transfersAPI.update(editingTransferId, transferData);
        setError('');
      } else {
        await transfersAPI.create(transferData);
        setError('');
      }

      await fetchTransfers();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || (editingTransferId ? 'Failed to update transfer' : 'Failed to add transfer'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transfer) => {
    setEditingTransferId(transfer.id);
    setIsModalOpen(true);

    setFormData({
      name: transfer.name || '',
      destination: transfer.destination || '',
      transfer_details: transfer.transfer_details || '',
      transfer_photo: null,
      status: transfer.status || 'active'
    });
    setPhotoPreview(transfer.transfer_photo || null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transfer?')) return;

    try {
      await transfersAPI.delete(id);
      await fetchTransfers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transfer');
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

      await transfersAPI.importTransfers(formData);
      await fetchTransfers();
      handleCloseImportModal();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import transfers');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setError('');
      const response = await transfersAPI.exportTransfers();

      if (response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transfers_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([response.data], {
          type: 'text/csv;charset=utf-8;'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transfers_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      let errorMessage = 'Failed to export transfers';
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
      const response = await transfersAPI.downloadImportFormat();

      if (response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transfer_import_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([response.data], {
          type: 'text/csv;charset=utf-8;'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transfer_import_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      let errorMessage = 'Failed to download import format';
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

  const handleUpdatePrice = async (transfer) => {
    setSelectedTransfer(transfer);
    setIsPriceModalOpen(true);
    setPriceFormData({
      from_date: '',
      to_date: '',
      price: ''
    });
    await fetchPrices(transfer.id);
  };

  const handleClosePriceModal = () => {
    setIsPriceModalOpen(false);
    setSelectedTransfer(null);
    setPrices([]);
    setPriceFormData({
      from_date: '',
      to_date: '',
      price: ''
    });
    setEditingPriceId(null);
  };

  const fetchPrices = async (transferId) => {
    try {
      setLoadingPrices(true);
      const response = await transfersAPI.getPrices(transferId);
      setPrices(response.data.data || []);
    } catch (err) {
      console.error('Failed to load prices:', err);
      setPrices([]);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handlePriceInputChange = (field, value) => {
    setPriceFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPrice = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;

    try {
      if (editingPriceId) {
        await transfersAPI.updatePrice(selectedTransfer.id, editingPriceId, priceFormData);
        setError('');
      } else {
        await transfersAPI.createPrice(selectedTransfer.id, priceFormData);
        await fetchTransfers();
      }

      await fetchPrices(selectedTransfer.id);
      setEditingPriceId(null);
      setPriceFormData({
        from_date: '',
        to_date: '',
        price: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || (editingPriceId ? 'Failed to update price' : 'Failed to add price'));
      console.error(err);
    }
  };

  const handleEditPrice = (price) => {
    setEditingPriceId(price.id);
    setPriceFormData({
      from_date: price.from_date,
      to_date: price.to_date,
      price: price.price || ''
    });
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setPriceFormData({
      from_date: '',
      to_date: '',
      price: ''
    });
  };

  const handleDeletePrice = async (priceId) => {
    if (!selectedTransfer) return;
    if (!window.confirm('Are you sure you want to delete this price?')) return;

    try {
      await transfersAPI.deletePrice(selectedTransfer.id, priceId);
      await fetchPrices(selectedTransfer.id);
      await fetchTransfers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete price');
      console.error(err);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const name = transfer.name || '';
    const searchLower = searchTerm.toLowerCase();
    return name.toLowerCase().includes(searchLower);
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
          <h1 className="text-3xl font-bold text-gray-800">Transfer</h1>
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

        {/* Transfers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
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
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No transfers found
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transfer.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transfer.destination || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdatePrice(transfer)}
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Update ({transfer.price_updates_count || 0})
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transfer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {transfer.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transfer.created_by_name || 'Travbizz Travel IT Solutions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(transfer.updated_at || transfer.last_update)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(transfer)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(transfer.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
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

        {/* Add/Edit Transfer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTransferId ? 'Edit Transfer' : 'Add Transfer'}
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
                <div className="p-6 space-y-4">
                  {/* Transfer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter transfer name"
                      required
                    />
                  </div>

                  {/* Destination */}
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

                  {/* Transfer Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Details
                    </label>
                    <textarea
                      value={formData.transfer_details}
                      onChange={(e) => handleInputChange('transfer_details', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter transfer details"
                    />
                  </div>

                  {/* Transfer Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Photo *
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={!editingTransferId}
                      />
                      {photoPreview && (
                        <img src={photoPreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                      )}
                    </div>
                    {!photoPreview && !formData.transfer_photo && (
                      <p className="mt-1 text-sm text-gray-500">No file chosen</p>
                    )}
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
                    {saving ? (editingTransferId ? 'Updating...' : 'Saving...') : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Price Modal */}
        {isPriceModalOpen && selectedTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Update Price - {selectedTransfer.name}</h2>
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
                <form onSubmit={handleAddPrice} className="mb-6">
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={priceFormData.from_date}
                        onChange={(e) => handlePriceInputChange('from_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        value={priceFormData.to_date}
                        onChange={(e) => handlePriceInputChange('to_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceFormData.price}
                        onChange={(e) => handlePriceInputChange('price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-end gap-2">
                      {editingPriceId && (
                        <button
                          type="button"
                          onClick={handleCancelEditPrice}
                          className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {editingPriceId ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Price List Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price List</h3>
                  {loadingPrices ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : prices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No Price</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {prices.map((price) => (
                            <tr key={price.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{new Date(price.from_date).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{new Date(price.to_date).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{price.price || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleEditPrice(price)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeletePrice(price.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
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

        {/* Import Transfer Excel Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Import Transfer Excel</h2>
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

export default Transfer;

