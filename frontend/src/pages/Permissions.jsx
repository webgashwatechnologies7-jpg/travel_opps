import { useState, useEffect } from 'react';
import { permissionsAPI } from '../services/api';
import Layout from '../components/Layout';

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    } else {
      setSelectedPermissions([]);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const response = await permissionsAPI.getRoles();
      setRoles(response.data.data.roles || []);
      if (response.data.data.roles.length > 0 && !selectedRole) {
        setSelectedRole(response.data.data.roles[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionsAPI.getPermissions();
      setPermissions(response.data.data.permissions || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleName) => {
    try {
      setLoading(true);
      const response = await permissionsAPI.getRolePermissions(roleName);
      setSelectedPermissions(response.data.data.permissions || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setSelectedPermissions([]);
      } else {
        setError('Failed to load role permissions');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map((p) => p.id));
    }
  };

  const handleSave = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await permissionsAPI.updateRolePermissions(selectedRole, selectedPermissions);
      setSuccess('Permissions updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && roles.length === 0) {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Permissions</h1>

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

        {/* Role Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select Role --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Permissions List */}
        {selectedRole && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Permissions for {selectedRole}
              </h2>
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No permissions found. Please create permissions first.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {permission.name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Save Button */}
            {selectedRole && permissions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedRole && (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            Please select a role to manage permissions
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Permissions;

