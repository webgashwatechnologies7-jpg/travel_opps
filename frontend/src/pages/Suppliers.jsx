import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, X, RefreshCw, Trash2, Eye, MapPin, Mail, Phone, Briefcase, Building, Wallet, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { suppliersAPI } from '../services/api';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';

// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const bypassRoles = ['Admin', 'Company Admin', 'Super Admin', 'Manager'];
  if (user.roles?.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName && bypassRoles.some(br => br.toLowerCase() === roleName.toLowerCase());
  })) return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [formData, setFormData] = useState({
    city: '', company_name: '', title: 'Mr.', first_name: '', last_name: '', email: '', code: '+91', mobile: '', address: ''
  });
  const [saving, setSaving] = useState(false);

  // Detail Modal States
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailsPeriod, setDetailsPeriod] = useState('yearly');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.list();
      setSuppliers(response.data.data || response.data || []);
    } catch (err) { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const loadFinancialData = async (id, period) => {
    setDetailsLoading(true);
    try {
      const res = await suppliersAPI.financialSummary(id, period);
      setFinancialSummary(res.data?.data?.financial_summary || null);
    } catch (err) { toast.error('Summary unavailable'); }
    finally { setDetailsLoading(false); }
  };

  const handleOpenView = async (supplier) => {
    setSelectedSupplier(supplier);
    if(supplier){
    setIsDetailsModalOpen(true);

    }
    await loadFinancialData(supplier.id, detailsPeriod);
  };

  const handleAddNew = () => {
    setEditingSupplierId(null);
    setFormData({ city: '', company_name: '', title: 'Mr.', first_name: '', last_name: '', email: '', code: '+91', mobile: '', address: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplierId(supplier.id);
    setIsModalOpen(true);
    setFormData({
      city: supplier.city || '',
      company_name: supplier.company_name || supplier.company || '',
      title: supplier.title || 'Mr.',
      first_name: supplier.first_name || '',
      last_name: supplier.last_name || '',
      email: supplier.email || '',
      code: supplier.phone_code || '+91',
      mobile: supplier.mobile === 'Not Provided' ? '' : supplier.mobile,
      address: supplier.address || '',
      status: supplier.status || 'active'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData, phone_code: formData.code };
      if (editingSupplierId) await suppliersAPI.update(editingSupplierId, data);
      else await suppliersAPI.create(data);
      fetchSuppliers();
      setIsModalOpen(false);
      toast.success('Supplier saved successfully');
    } catch (err) { toast.error('Failed to save supplier'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (e, supplier) => {
    e.stopPropagation();
    if (!hasPermission(user, 'suppliers.status')) {
      toast.warning('Permission denied to change status');
      return;
    }
    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
      await suppliersAPI.update(supplier.id, { ...supplier, status: newStatus });
      fetchSuppliers();
      toast.success(`Supplier status: ${newStatus.toUpperCase()}`);
    } catch (err) { toast.error('Failed to update status'); }
  };

  const filteredSuppliers = useMemo(() =>
    suppliers.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const company = (s.company_name || s.company || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
    }), [suppliers, searchTerm]
  );

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';

  return (
    <div className="p-6 font-poppins" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          {hasPermission(user, 'suppliers.create') && (
            <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
              <Plus className="h-5 w-5" /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSuppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.company_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${s.title || ''} ${s.first_name || ''} ${s.last_name || ''}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.mobile || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.city || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => toggleStatus(e, s)}
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full cursor-pointer transition-all transform active:scale-95 ${s.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {s.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenView(s)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="View"><Eye size={18} /></button>
                    {hasPermission(user, 'suppliers.edit') && <button onClick={() => handleEdit(s)} className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full" title="Edit"><Edit size={18} /></button>}
                    {hasPermission(user, 'suppliers.delete') && <button onClick={async () => { if (window.confirm('Delete?')) { await suppliersAPI.delete(s.id); fetchSuppliers(); } }} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full" title="Delete"><Trash2 size={18} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL (MATCHING DAY ITINERARY STYLE) */}
      <Dialog header={(
          <div className="flex justify-between items-center p-6 border-b bg-gray-50 w-full">
              <h2 className="text-xl font-bold text-gray-800">{`${selectedSupplier?.first_name || ''} ${selectedSupplier?.last_name || ''}`}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-black"><X size={24} /></button>
            </div>
      )} visible={isDetailsModalOpen} showCloseIcon={false} className="w-[95vw] md:w-[600px]">
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Company</label><p className="font-medium">{selectedSupplier?.company_name || 'N/A'}</p></div>
                <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">City</label><p className="font-medium">{selectedSupplier?.city || 'N/A'}</p></div>
                <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Email</label><p className="font-medium text-blue-600">{selectedSupplier?.email || 'N/A'}</p></div>
                <div><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Mobile</label><p className="font-medium">{selectedSupplier?.mobile || 'N/A'}</p></div>
                <div className="col-span-2"><label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Address</label><p className="font-medium">{selectedSupplier?.address || 'N/A'}</p></div>
              </div>

              {/* Financial Summary */}
              <div className="border rounded-lg overflow-hidden mt-6">
                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b font-medium">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Financial Snapshot</span>
                  <select value={detailsPeriod} onChange={e => { setDetailsPeriod(e.target.value); if(selectedSupplier) loadFinancialData(selectedSupplier.id, e.target.value); }} className="text-xs border rounded p-1">
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                  </select>
                </div>
                <div className="p-4">
                  {detailsLoading ? <LogoLoader text="Syncing..." /> : (
                    financialSummary ? (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 bg-blue-50 rounded"><p className="text-[10px] text-blue-500 font-bold uppercase">Revenue</p><p className="text-lg font-bold">₹{financialSummary.revenue || 0}</p></div>
                        <div className="p-2 bg-rose-50 rounded"><p className="text-[10px] text-rose-500 font-bold uppercase">Cost</p><p className="text-lg font-bold">₹{financialSummary.cost || 0}</p></div>
                        <div className="p-2 bg-emerald-50 rounded"><p className="text-[10px] text-emerald-500 font-bold uppercase">Profit</p><p className="text-lg font-bold">₹{financialSummary.profit || 0}</p></div>
                      </div>
                    ) : <div className="p-4 text-center text-gray-400 text-xs">No financial data.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end bg-gray-50 font-medium">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-8 py-2 bg-gray-800 text-white rounded-lg">Close</button>
            </div>
      </Dialog>
                  

      {/* ADD/EDIT FORM FOR SUPPLIER */}
      <Dialog visible={isModalOpen} showCloseIcon={false} header={(
        <div className="flex justify-between items-center p-6 border-b bg-gray-50 w-full">
          <h2 className="text-xl font-bold text-black">{editingSupplierId ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
        </div>
      )} className="w-[95vw] md:w-[600px]">
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Company Name *</label>
              <input placeholder="Enter company name" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">First Name *</label>
              <input placeholder="First name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <input placeholder="Last name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email Address *</label>
              <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 space-y-1">
              <label className="text-sm font-medium text-gray-700">Code</label>
              <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div className="col-span-9 space-y-1">
              <label className="text-sm font-medium text-gray-700">Mobile</label>
              <input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full Address</label>
            <input placeholder="Enter address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t font-medium">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded text-sm bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">{saving ? 'Saving...' : 'Save Supplier'}</button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
export default Suppliers;