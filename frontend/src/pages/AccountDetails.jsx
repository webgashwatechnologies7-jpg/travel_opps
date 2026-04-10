import { useState, useEffect } from 'react';
// Layout removed - handled by nested routing
import { CreditCard, Save } from 'lucide-react';
import { settingsAPI } from '../services/api';

const AccountDetails = () => {
  const [accountDetails, setAccountDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    branch: '',
    upi_id: '',
    qr_code: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAccountDetails();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getByKey('account_details');
      if (response.data.success && response.data.data && response.data.data.value) {
        const details = JSON.parse(response.data.data.value);
        setAccountDetails(details);
        if (details.qr_code) {
          setQrUrl(details.qr_code);
        }
      }
    } catch (err) {
      console.error('Failed to fetch account details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setAccountDetails(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      let currentDetails = { ...accountDetails };

      // Upload QR code if a new file is selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('qr_code', selectedFile);
        const uploadResponse = await settingsAPI.uploadPaymentQr(formData);
        if (uploadResponse.data.success) {
          const uploadedUrl = uploadResponse.data.data.qr_url;
          currentDetails.qr_code = uploadedUrl;
          setAccountDetails(currentDetails);
        }
      }

      await settingsAPI.save({
        key: 'account_details',
        value: JSON.stringify(currentDetails),
        type: 'text',
        description: 'Company account details'
      });
      setMessage({ type: 'success', text: 'Account details saved successfully!' });
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to save account details:', err);
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Account Details
          </h1>
          <p className="text-gray-600 mt-2">Manage company account details</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={accountDetails.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={accountDetails.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={accountDetails.ifsc_code}
                onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter IFSC code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountDetails.account_holder_name}
                onChange={(e) => handleChange('account_holder_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={accountDetails.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter branch name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={accountDetails.upi_id}
                onChange={(e) => handleChange('upi_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter UPI ID"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment QR Code (Scan to Pay)
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your Bank/UPI QR code. Recommendation: Square image, max 5MB.
                  </p>
                </div>
                {qrUrl && (
                  <div className="h-32 w-32 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                    <img src={qrUrl} alt="Payment QR" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Account Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;

