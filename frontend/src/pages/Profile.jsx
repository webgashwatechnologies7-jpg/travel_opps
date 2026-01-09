import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import Layout from '../components/Layout';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.get();
      setProfile(response.data.data.user);
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setError('');
    setSuccess('');
    setSavingPassword(true);

    try {
      await profileAPI.updatePassword(passwordForm);
      setSuccess('Password updated successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to update password');
      }
      console.error(err);
    } finally {
      setSavingPassword(false);
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

  if (!profile) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Failed to load profile
        </div>
      </Layout>
    );
  }

  const completionPercentage = profile.target?.completion_percentage || 0;
  const progressBarColor =
    completionPercentage >= 100
      ? 'bg-green-500'
      : completionPercentage >= 75
      ? 'bg-blue-500'
      : completionPercentage >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const textColor =
    completionPercentage >= 100
      ? 'text-green-600'
      : completionPercentage >= 75
      ? 'text-blue-600'
      : completionPercentage >= 50
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

        {/* Success Toast */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-lg text-gray-900">{profile.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-lg text-gray-900">{profile.email}</p>
                {!profile.email_verified_at && (
                  <span className="text-xs text-yellow-600">Email not verified</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-lg text-gray-900">{profile.phone || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {profile.role || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Target Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Month Target</h2>
            {profile.target ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Target Amount</label>
                  <p className="text-lg text-gray-900">
                    ₹{profile.target.target_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Achieved Amount</label>
                  <p className="text-lg text-gray-900">
                    ₹{profile.target.achieved_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Completion</label>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                      <div
                        className={`${progressBarColor} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${textColor} whitespace-nowrap`}>
                      {completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No target set for current month
              </div>
            )}
          </div>
        </div>

        {/* Change Password Form */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  passwordErrors.current_password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.current_password && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
                minLength="8"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  passwordErrors.new_password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.new_password && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password[0]}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="new_password_confirmation"
                name="new_password_confirmation"
                value={passwordForm.new_password_confirmation}
                onChange={handlePasswordChange}
                required
                minLength="8"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  passwordErrors.new_password_confirmation ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.new_password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password_confirmation[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

