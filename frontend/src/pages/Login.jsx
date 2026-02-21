import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
  const companyName = appSettings.company_name || 'CRM';
  const companyLogo = appSettings.company_logo || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Check if user is super admin and redirect accordingly
        const user = result.user || JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.is_super_admin) {
          navigate('/super-admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(result.message || 'Login failed. Please check your credentials and ensure backend server is running.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D8DEF5] flex items-center justify-center p-4 sm:p-8">
      <div className="flex w-full max-w-6xl bg-white shadow-xl rounded-2xl overflow-hidden min-h-[600px]">

        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:flex-1 relative bg-white items-center justify-center p-8">
          {/* Illustration Image */}
          <img
            src="/login-illustration.png"
            alt="Dashboard Illustration"
            className="max-w-full max-h-[500px] object-contain shadow-none border-none mix-blend-multiply"
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[480px] flex flex-col items-center justify-center bg-white p-8 xl:p-12 relative relative">

          {/* Top Right Logo Area (No Text) */}
          <div className="absolute top-8 right-8 flex justify-end">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="h-10 object-contain rounded-lg" />
            ) : (
              <img
                src="/logo.png"
                alt="CRM Logo"
                className="h-10 object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            )}
            {/* Fallback Blue T Icon if logo.png is also not found */}
            <div className={`${companyLogo ? 'hidden' : 'hidden'} bg-[#2765B0] p-1.5 rounded-lg items-center justify-center`}>
              <span className="text-white font-bold text-xl">T</span>
            </div>
          </div>

          <div className="w-full max-w-sm mt-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to {companyName}! 👋</h2>
              <p className="text-gray-500 text-sm">Please sign-in to your account and start the adventure</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2765B0] focus:border-transparent focus:outline-none transition-all text-sm placeholder:text-gray-400"
                  placeholder="Email"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2765B0] focus:border-transparent focus:outline-none transition-all text-sm placeholder:text-gray-400"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#2765B0] focus:ring-[#2765B0]" />
                  <span className="text-sm text-gray-600">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-[#2765B0] hover:text-[#1e4b85] font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2765B0] text-white py-3 px-4 rounded-lg hover:bg-[#1e4b85] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2765B0] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-md shadow-[#2765B0]/30 mt-6"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
