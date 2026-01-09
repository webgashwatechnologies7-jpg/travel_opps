import { useState, useEffect } from 'react';
import { usersAPI, targetsAPI } from '../services/api';
import Layout from '../components/Layout';

const Targets = () => {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    month: '',
    target_amount: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchTargets();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      // Fetch targets by getting user details which includes targets
      const response = await usersAPI.list();
      const allUsers = response.data.data.users || [];
      
      // Fetch user details (which includes targets) for each user
      const targetsPromises = allUsers.map(async (user) => {
        try {
          const userResponse = await usersAPI.get(user.id);
          if (userResponse.data.success && userResponse.data.data.user.targets) {
            return userResponse.data.data.user.targets.map((target) => ({
              id: target.id,
              user_id: user.id,
              user_name: user.name,
              month: target.month,
              target_amount: parseFloat(target.target_amount),
              achieved_amount: parseFloat(target.achieved_amount || 0),
            }));
          }
          return [];
        } catch (err) {
          return [];
        }
      });
      
      const allTargets = (await Promise.all(targetsPromises)).flat();
      setTargets(allTargets);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Format month as YYYY-MM
      const month = formData.month;
      if (!/^\d{4}-\d{2}$/.test(month)) {
        setError('Month must be in YYYY-MM format');
        setSubmitting(false);
        return;
      }

      await targetsAPI.create({
        user_id: parseInt(formData.user_id),
        month: month,
        target_amount: parseFloat(formData.target_amount),
      });

      setSuccess('Target created successfully!');
      setFormData({
        user_id: '',
        month: '',
        target_amount: '',
      });
      
      // Refresh targets
      fetchTargets();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create target');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const calculateCompletion = (targetAmount, achievedAmount) => {
    if (!targetAmount || targetAmount === 0) return 0;
    return ((achievedAmount / targetAmount) * 100).toFixed(2);
  };

  if (loading && targets.length === 0) {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Employee Targets</h1>

        {/* Create Target Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Set Target</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User <span className="text-red-500">*</span>
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="YYYY-MM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="target_amount"
                value={formData.target_amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Target'}
              </button>
            </div>
          </form>
        </div>

        {/* Targets Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Targets Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achieved Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No targets found. Create a target to get started.
                    </td>
                  </tr>
                ) : (
                  targets
                    .sort((a, b) => {
                      // Sort by user name, then by month descending
                      if (a.user_name !== b.user_name) {
                        return a.user_name.localeCompare(b.user_name);
                      }
                      return b.month.localeCompare(a.month);
                    })
                    .map((target) => {
                      const completion = calculateCompletion(
                        target.target_amount,
                        target.achieved_amount
                      );
                      const completionPercent = parseFloat(completion);
                      
                      return (
                        <tr key={`${target.user_id}-${target.month}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {target.user_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{target.month}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{target.target_amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{target.achieved_amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    completionPercent >= 100
                                      ? 'bg-green-500'
                                      : completionPercent >= 75
                                      ? 'bg-blue-500'
                                      : completionPercent >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(completionPercent, 100)}%` }}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  completionPercent >= 100
                                    ? 'text-green-600'
                                    : completionPercent >= 75
                                    ? 'text-blue-600'
                                    : completionPercent >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {completion}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Targets;

