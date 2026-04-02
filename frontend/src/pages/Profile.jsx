import { useState, useEffect, useRef } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LogoLoader from '../components/LogoLoader';
// Layout removed - handled by nested routing
import { Camera, Mail, Phone, User, Check, X, Shield, Target } from 'lucide-react';

const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    profile_picture: null
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const fileInputRef = useRef(null);

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
      const userData = response.data.data.user;
      setProfile(userData);
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        profile_picture: null
      });
      setProfilePreview(userData.profile_picture);
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm(prev => ({ ...prev, profile_picture: file }));
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('phone', profileForm.phone || '');
      if (profileForm.profile_picture instanceof File) {
        formData.append('profile_picture', profileForm.profile_picture);
      }

      const response = await profileAPI.update(formData);
      const updatedUser = response.data.data.user;
      setProfile(updatedUser);
      setProfilePreview(updatedUser.profile_picture);
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.data?.errors) {
        setProfileErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LogoLoader text="Loading Profile..." />;
  }

  if (!profile) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load profile
      </div>
    );
  }

  const completionPercentage = profile.target?.completion_percentage || 0;
  const progressBarColor =
    completionPercentage >= 100 ? 'bg-green-500' :
    completionPercentage >= 75 ? 'bg-blue-500' :
    completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  const textColor =
    completionPercentage >= 100 ? 'text-green-600' :
    completionPercentage >= 75 ? 'text-blue-600' :
    completionPercentage >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {profile.is_active ? 'Active Account' : 'Inactive'}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    {profile.role || 'Member'}
                </span>
            </div>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r shadow-sm flex items-center gap-3">
            <Check className="h-5 w-5" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm flex items-center gap-3">
            <X className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                <div className="relative z-10">
                    <div className="relative inline-block group mb-4">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 mx-auto transition-transform duration-300 group-hover:scale-105">
                            {profilePreview ? (
                                <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-600 bg-blue-50">
                                    <User size={64} />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-all hover:scale-110 border-2 border-white"
                            title="Update Photo"
                        >
                            <Camera size={18} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm text-gray-500 mb-6 truncate max-w-full" title={profile.email}>{profile.email}</p>
                    
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Member since</span>
                            <span className="font-semibold text-gray-800">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Card - Moved to sidebar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Target size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800">Monthly Target</h3>
                </div>
                {profile.target ? (
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500 font-medium">Progress</span>
                            <span className={`font-bold ${textColor}`}>{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`${progressBarColor} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Target</p>
                                <p className="font-bold text-gray-800">₹{profile.target.target_amount.toLocaleString('en-IN')}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Achieved</p>
                                <p className={`font-bold ${textColor}`}>₹{profile.target.achieved_amount.toLocaleString('en-IN')}</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 italic">No target assigned</p>
                    </div>
                )}
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Details Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Account Details</h3>
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all outline-none ${profileErrors.name ? 'border-red-400' : 'border-gray-200 group-hover:border-gray-300'}`}
                            placeholder="Your Name"
                            required
                        />
                    </div>
                    {profileErrors.name && <p className="text-xs text-red-500 mt-1 ml-1">{profileErrors.name[0]}</p>}
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Phone size={18} />
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all outline-none ${profileErrors.phone ? 'border-red-400' : 'border-gray-200 group-hover:border-gray-300'}`}
                            placeholder="Add Phone Number"
                        />
                    </div>
                    {profileErrors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{profileErrors.phone[0]}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 opacity-70">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address (Read Only)</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                      </div>
                      <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed outline-none"
                      />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex lg:inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {savingProfile ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Check size={18} />
                            <span>Save Changes</span>
                        </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Security Settings</h3>
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="current_password" title="Required to verify identity" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none ${passwordErrors.current_password ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {passwordErrors.current_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.current_password[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="new_password" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
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
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none ${passwordErrors.new_password ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {passwordErrors.new_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.new_password[0]}</p>}
                      <p className="text-[10px] text-gray-400 font-medium ml-1">Min. 8 characters</p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="new_password_confirmation" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="new_password_confirmation"
                        name="new_password_confirmation"
                        value={passwordForm.new_password_confirmation}
                        onChange={handlePasswordChange}
                        required
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none ${passwordErrors.new_password_confirmation ? 'border-red-400' : 'border-gray-200'}`}
                      />
                    </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full md:w-auto px-8 py-3 bg-gray-800 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                  >
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Profile;
