import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { landingPagesAPI } from '../services/api';
import { Globe, Plus, Edit, Trash2, Eye, Copy, ExternalLink, Users, TrendingUp } from 'lucide-react';

const LandingPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    url_slug: '',
    template: 'travel-package',
    meta_description: '',
    status: 'draft',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setError('');
      const res = await landingPagesAPI.list();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPages(res.data.data);
      } else {
        setPages([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load landing pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      title: '',
      url_slug: '',
      template: 'lead-capture',
      meta_description: '',
      status: 'draft',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      title: page.title,
      url_slug: page.url,
      template: 'lead-capture',
      meta_description: '',
      status: page.status,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        title: formData.title,
        url_slug: formData.url_slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        template: formData.template,
        meta_description: formData.meta_description || null,
        status: formData.status,
      };
      const res = await landingPagesAPI.create(payload);
      if (res.data?.success) {
        setPages((prev) => [res.data.data, ...prev]);
        setShowCreateModal(false);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.url_slug?.[0] || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPage) return;
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        title: formData.title,
        url_slug: formData.url_slug,
        template: formData.template,
        meta_description: formData.meta_description || null,
        status: formData.status,
      };
      const res = await landingPagesAPI.update(editingPage.id, payload);
      if (res.data?.success) {
        setPages((prev) => prev.map((p) => (p.id === editingPage.id ? { ...p, ...res.data.data } : p)));
        setShowEditModal(false);
        setEditingPage(null);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete "${page.name}"?`)) return;
    try {
      await landingPagesAPI.delete(page.id);
      setPages((prev) => prev.filter((p) => p.id !== page.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handlePublish = async (page) => {
    if (page.status === 'published') return;
    try {
      await landingPagesAPI.publish(page.id);
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, status: 'published' } : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleDuplicate = async (page) => {
    try {
      const payload = {
        name: page.name + ' (Copy)',
        title: page.title,
        url_slug: page.url + '-copy',
        template: 'lead-capture',
        meta_description: null,
        status: 'draft',
      };
      const res = await landingPagesAPI.create(payload);
      if (res.data?.success) {
        setPages((prev) => [res.data.data, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to duplicate');
    }
  };

  const publicPageUrl = (slug) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/landing-page/${slug}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
            <p className="text-gray-600 mt-1">Create and manage your marketing landing pages</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Landing Page</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{pages.length}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <Globe className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{pages.reduce((sum, p) => sum + (p.views || 0), 0)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{pages.reduce((sum, p) => sum + (p.conversions || 0), 0)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pages.length > 0
                    ? (pages.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / pages.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Landing Pages Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.length > 0 ? (
                  pages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-teal-100 p-2 rounded-full mr-3">
                            <Globe className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{page.name}</div>
                            <div className="text-sm text-gray-500">{page.title}</div>
                            <div className="text-xs text-gray-400">/{page.url}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(page.views || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.conversions || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{page.conversion_rate || 0}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `${Math.min((page.conversion_rate || 0) * 10, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.created_at ? new Date(page.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <a
                            href={publicPageUrl(page.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:text-teal-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={publicPageUrl(page.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="Visit Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button onClick={() => handleDuplicate(page)} className="text-gray-600 hover:text-gray-900" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link to={`/marketing/landing-pages/${page.id}/edit`} className="text-teal-600 hover:text-teal-900" title="Edit Content">
                            <Edit className="w-4 h-4" />
                          </Link>
                          {page.status !== 'published' && (
                            <button onClick={() => handlePublish(page)} className="text-green-600 hover:text-green-900" title="Publish">
                              Publish
                            </button>
                          )}
                          <button onClick={() => handleDelete(page)} className="text-red-600 hover:text-red-900" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No landing pages found</p>
                      <p className="text-sm text-gray-500 mt-2">Create your first landing page to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Landing Page</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
              )}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter page name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter page title (SEO title)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.url_slug}
                    onChange={(e) => setFormData({ ...formData, url_slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="page-url-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="lead-capture">Lead Capture</option>
                    <option value="product-showcase">Product Showcase</option>
                    <option value="event-registration">Event Registration</option>
                    <option value="coming-soon">Coming Soon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter meta description for SEO"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">160 characters maximum</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Landing Page'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Landing Page</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter page name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter page title (SEO title)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.url_slug}
                    onChange={(e) => setFormData({ ...formData, url_slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="page-url-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPage(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save Changes'}
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

export default LandingPages;
