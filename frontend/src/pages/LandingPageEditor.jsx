import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { landingPagesAPI } from '../services/api';
import { ArrowLeft, Save, Plus, Trash2, Upload } from 'lucide-react';

const ImageUploadField = ({ label, value, onChange, placeholder = 'https://...' }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (jpg, png, gif, webp, svg)');
      return;
    }
    setUploading(true);
    try {
      const res = await landingPagesAPI.uploadImage(file);
      if (res.data?.success && res.data?.data?.url) {
        onChange(res.data.data.url);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
          placeholder={placeholder}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Upload className="w-4 h-4" />
          {uploading ? '...' : 'Upload'}
        </button>
      </div>
    </div>
  );
};

const DEFAULT_SECTIONS = {
  header: { logo: '', slogan: '', phone: '', email: '' },
  hero: { title: '', subtitle: '', tagline: '', backgroundImage: '', formTitle: '' },
  about: { title: '', content: '', ctaText: '', ctaPhone: '' },
  whyUs: { title: '', items: [] },
  packages: { title: '', items: [] },
  whyBookOnline: { title: '', items: [] },
  footer: { phone: '', email: '', links: [], copyright: '' },
};

const LandingPageEditor = () => {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPage();
  }, [id]);

  const fetchPage = async () => {
    try {
      const res = await landingPagesAPI.get(id);
      if (res.data?.success && res.data?.data) {
        setPage(res.data.data);
        setSections(res.data.data.sections || DEFAULT_SECTIONS);
      }
    } catch (err) {
      setError('Failed to load landing page');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (sectionKey, data) => {
    setSections((prev) => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), ...data } }));
  };

  const addPackage = () => {
    const items = [...(sections.packages?.items || [])];
    items.push({
      image: '',
      discount: '',
      title: '',
      duration: '',
      inclusions: [],
      price: '',
      link: '#',
    });
    updateSection('packages', { ...sections.packages, items });
  };

  const updatePackage = (index, field, value) => {
    const items = [...(sections.packages?.items || [])];
    if (field === 'inclusions') {
      items[index].inclusions = typeof value === 'string' ? value.split('\n').filter(Boolean) : value;
    } else {
      items[index][field] = value;
    }
    updateSection('packages', { ...sections.packages, items });
  };

  const removePackage = (index) => {
    const items = (sections.packages?.items || []).filter((_, i) => i !== index);
    updateSection('packages', { ...sections.packages, items });
  };

  const addWhyUsItem = () => {
    const items = [...(sections.whyUs?.items || [])];
    items.push({ icon: 'badge', title: '', description: '' });
    updateSection('whyUs', { ...sections.whyUs, items });
  };

  const updateWhyUsItem = (index, field, value) => {
    const items = [...(sections.whyUs?.items || [])];
    items[index] = { ...items[index], [field]: value };
    updateSection('whyUs', { ...sections.whyUs, items });
  };

  const removeWhyUsItem = (index) => {
    const items = (sections.whyUs?.items || []).filter((_, i) => i !== index);
    updateSection('whyUs', { ...sections.whyUs, items });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await landingPagesAPI.update(id, { sections });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Landing page not found</p>
          <Link to="/marketing/landing-pages" className="text-teal-600 mt-2 inline-block">← Back</Link>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'header', label: 'Header' },
    { key: 'hero', label: 'Hero' },
    { key: 'about', label: 'About' },
    { key: 'whyUs', label: 'Why Us' },
    { key: 'packages', label: 'Packages' },
    { key: 'whyBookOnline', label: 'Why Book Online' },
    { key: 'footer', label: 'Footer' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/marketing/landing-pages" className="text-teal-600 hover:text-teal-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit: {page.name}</h1>
              <p className="text-gray-600 text-sm">Edit sections - no code required</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`${window.location.origin}/landing-page/${page.url_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
            >
              Preview
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}

        <div className="flex gap-4">
          <div className="w-48 flex-shrink-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === tab.key ? 'bg-teal-100 text-teal-800 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
            {activeTab === 'header' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Header</h2>
                <ImageUploadField
                  label="Logo URL"
                  value={sections.header?.logo || ''}
                  onChange={(v) => updateSection('header', { logo: v })}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Slogan</label>
                  <input
                    type="text"
                    value={sections.header?.slogan || ''}
                    onChange={(e) => updateSection('header', { slogan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="We Plan, You Pack"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={sections.header?.phone || ''}
                    onChange={(e) => updateSection('header', { phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={sections.header?.email || ''}
                    onChange={(e) => updateSection('header', { email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Hero Section</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={sections.hero?.title || ''}
                    onChange={(e) => updateSection('hero', { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Himachal Tour Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle / Destinations</label>
                  <input
                    type="text"
                    value={sections.hero?.subtitle || ''}
                    onChange={(e) => updateSection('hero', { subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="SHIMLA | MANALI | KULLU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <input
                    type="text"
                    value={sections.hero?.tagline || ''}
                    onChange={(e) => updateSection('hero', { tagline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Lowest Price Guaranteed"
                  />
                </div>
                <ImageUploadField
                  label="Background Image URL"
                  value={sections.hero?.backgroundImage || ''}
                  onChange={(v) => updateSection('hero', { backgroundImage: v })}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Form Title</label>
                  <input
                    type="text"
                    value={sections.hero?.formTitle || ''}
                    onChange={(e) => updateSection('hero', { formTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Fill Form & Get Free Quotes"
                  />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">About Section</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={sections.about?.title || ''}
                    onChange={(e) => updateSection('about', { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    rows={6}
                    value={sections.about?.content || ''}
                    onChange={(e) => updateSection('about', { content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="About your destination..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={sections.about?.ctaText || ''}
                    onChange={(e) => updateSection('about', { ctaText: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Phone</label>
                  <input
                    type="text"
                    value={sections.about?.ctaPhone || ''}
                    onChange={(e) => updateSection('about', { ctaPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {activeTab === 'whyUs' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Why Us</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Section Title</label>
                  <input
                    type="text"
                    value={sections.whyUs?.title || ''}
                    onChange={(e) => updateSection('whyUs', { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <button onClick={addWhyUsItem} className="mb-2 px-3 py-1 bg-teal-100 text-teal-700 rounded flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                  {(sections.whyUs?.items || []).map((item, i) => (
                    <div key={i} className="border rounded-lg p-4 mb-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Item {i + 1}</span>
                        <button onClick={() => removeWhyUsItem(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateWhyUsItem(i, 'title', e.target.value)}
                        placeholder="Title"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateWhyUsItem(i, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tour Packages</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Section Title</label>
                  <input
                    type="text"
                    value={sections.packages?.title || ''}
                    onChange={(e) => updateSection('packages', { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mb-4"
                  />
                </div>
                <button onClick={addPackage} className="mb-4 px-3 py-2 bg-teal-100 text-teal-700 rounded flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Package
                </button>
                {(sections.packages?.items || []).map((pkg, i) => (
                  <div key={i} className="border rounded-lg p-4 mb-4 space-y-2 bg-gray-50">
                    <div className="flex justify-between">
                      <span className="font-medium">Package {i + 1}</span>
                      <button onClick={() => removePackage(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <ImageUploadField
                      label="Package Image"
                      value={pkg.image || ''}
                      onChange={(v) => updatePackage(i, 'image', v)}
                      placeholder="Image URL or upload"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pkg.discount || ''}
                        onChange={(e) => updatePackage(i, 'discount', e.target.value)}
                        placeholder="Discount %"
                        className="px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        value={pkg.price || ''}
                        onChange={(e) => updatePackage(i, 'price', e.target.value)}
                        placeholder="Price"
                        className="px-3 py-2 border rounded"
                      />
                    </div>
                    <input
                      type="text"
                      value={pkg.title || ''}
                      onChange={(e) => updatePackage(i, 'title', e.target.value)}
                      placeholder="Package Title"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      value={pkg.duration || ''}
                      onChange={(e) => updatePackage(i, 'duration', e.target.value)}
                      placeholder="Duration (e.g. 05 Nights / 06 Days)"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <textarea
                      value={(pkg.inclusions || []).join('\n') || ''}
                      onChange={(e) => updatePackage(i, 'inclusions', e.target.value)}
                      placeholder="Inclusions (one per line)"
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'whyBookOnline' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Why Book Online</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Section Title</label>
                  <input
                    type="text"
                    value={sections.whyBookOnline?.title || ''}
                    onChange={(e) => updateSection('whyBookOnline', { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600">Edit items similar to Why Us section.</p>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Footer</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={sections.footer?.phone || ''}
                    onChange={(e) => updateSection('footer', { ...sections.footer, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={sections.footer?.email || ''}
                    onChange={(e) => updateSection('footer', { ...sections.footer, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Links (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(sections.footer?.links) ? sections.footer.links.join(', ') : ''}
                    onChange={(e) => updateSection('footer', { ...sections.footer, links: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="ABOUT US, CONTACT US"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Copyright</label>
                  <input
                    type="text"
                    value={sections.footer?.copyright || ''}
                    onChange={(e) => updateSection('footer', { ...sections.footer, copyright: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPageEditor;
