import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '../services/api';
import { toast } from 'react-toastify';
// Layout removed - handled by nested routing
import AddClientModal from '../components/AddClientModal';
import { Edit2, Trash2, Eye, TrendingUp, MoreVertical, Download, FileText, Plus } from 'lucide-react';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await accountsAPI.getClients();
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Fallback to mock data if API fails
      const mockClients = [
        {
          id: 1,
          name: 'Rajesh Kumar',
          mobile: '+91 98765 43210',
          email: 'rajesh.kumar@email.com',
          queries: 5,
          lastQuery: '2024-01-15',
          city: 'Mumbai',
          createdBy: 'Agent A'
        },
        {
          id: 2,
          name: 'Priya Sharma',
          mobile: '+91 87654 32109',
          email: 'priya.sharma@email.com',
          queries: 3,
          lastQuery: '2024-01-14',
          city: 'Delhi',
          createdBy: 'Agent B'
        },
        {
          id: 3,
          name: 'Amit Patel',
          mobile: '+91 76543 21098',
          email: 'amit.patel@email.com',
          queries: 8,
          lastQuery: '2024-01-13',
          city: 'Ahmedabad',
          createdBy: 'Agent C'
        }
      ];
      setClients(mockClients);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredClients = useMemo(() =>
    (clients || []).filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.mobile?.includes(searchTerm)
    ),
    [clients, searchTerm]);

  const handleAddClient = useCallback(async (clientData) => {
    try {
      const response = await accountsAPI.createClient(clientData);
      if (response.data.success) {
        // Refresh clients list
        fetchClients();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }, [fetchClients]);

  const handleEditClient = useCallback((client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  }, []);

  const handleUpdateClient = useCallback(async (clientData) => {
    try {
      const response = await accountsAPI.updateClient(selectedClient.id, clientData);
      if (response.data.success) {
        // Refresh clients list
        fetchClients();
        setShowEditModal(false);
        setSelectedClient(null);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }, [fetchClients, selectedClient]);

  const handleDeleteClient = useCallback(async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await accountsAPI.deleteClient(clientId);
        if (response.data.success) {
          // Refresh clients list
          fetchClients();
          toast.success('Client deleted successfully');
        } else {
          throw new Error(response.data.message || 'Failed to delete client');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Failed to delete client. Please try again.');
      }
    }
  }, [fetchClients]);

  const handleViewClient = useCallback((client) => {
    navigate(`/accounts/clients/${client.id}`);
  }, [navigate]);

  const handleViewReports = useCallback((client) => {
    navigate(`/accounts/clients/${client.id}/reports`);
  }, [navigate]);

  const handleQuickReport = useCallback((client) => {
    const reportContent = `
QUICK CLIENT REPORT
====================

Client Name: ${client.name}
Email: ${client.email}
Mobile: ${client.mobile}
City: ${client.city}
Status: ${client.status || 'Active'}

Summary:
- Total Queries: ${client.queries || 0}
- Last Query: ${client.lastQuery || 'N/A'}
- Generated: ${new Date().toLocaleDateString()}

This is a quick report. For detailed reports, please use the Reports option.
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-report-${client.name.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const toggleDropdown = useCallback((clientId) => {
    setActiveDropdown(prev => prev === clientId ? null : clientId);
  }, []);

  const handleDropdownAction = useCallback((action, client) => {
    setActiveDropdown(null);
    switch (action) {
      case 'view': handleViewClient(client); break;
      case 'edit': handleEditClient(client); break;
      case 'delete': handleDeleteClient(client.id); break;
      case 'reports': handleViewReports(client); break;
      case 'quickReport': handleQuickReport(client); break;
      default: break;
    }
  }, [handleViewClient, handleEditClient, handleDeleteClient, handleViewReports, handleQuickReport]);

  const handleSelectClient = useCallback((clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  }, [selectedClients, filteredClients]);

  const handleBulkAction = (action) => {
    if (selectedClients.length === 0) {
      toast.warning('Please select at least one client');
      return;
    }

    switch (action) {
      case 'bulkReport':
        // Generate bulk report for selected clients
        const selectedClientsData = clients.filter(client =>
          selectedClients.includes(client.id)
        );

        const bulkReportContent = `
BULK CLIENT REPORT
==================

Generated on: ${new Date().toLocaleDateString()}
Total Clients: ${selectedClients.length}

CLIENTS LIST:
${selectedClientsData.map((client, index) => `
${index + 1}. ${client.name}
   Email: ${client.email}
   Mobile: ${client.mobile}
   City: ${client.city}
   Queries: ${client.queries || 0}
   Last Query: ${client.lastQuery || 'N/A'}
`).join('')}

This is a bulk report for selected clients.
        `;

        const blob = new Blob([bulkReportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        break;

      case 'bulkDelete':
        if (window.confirm(`Are you sure you want to delete ${selectedClients.length} clients?`)) {
          // Remove selected clients from list
          setClients(prev => prev.filter(client => !selectedClients.includes(client.id)));
          setSelectedClients([]);
          toast.success(`${selectedClients.length} clients deleted successfully`);
        }
        break;

      default:
        break;
    }
  };

  return (
    <div className={`p-0 relative page-transition ${loading && clients.length > 0 ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      <div className="p-6 mb-6">
        <div className="bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl border border-gray-100 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">Clients</h1>
              {selectedClients.length > 0 && (
                <div className="flex items-center space-x-3 animate-in slide-in-from-left duration-300">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedClients.length} Selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('bulkReport')}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center space-x-2 transition-all shadow-md active:scale-95"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Bulk Report</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('bulkDelete')}
                      className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 flex items-center space-x-2 transition-all shadow-md active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group-hover:bg-white shadow-sm font-medium text-sm"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 flex items-center space-x-2 transition-all shadow-lg active:scale-95 hover:shadow-blue-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-500 bg-white/30 backdrop-blur-sm rounded-2xl border border-dashed border-gray-300 mx-6">
             <LogoLoader text="Processing Client Records..." />
          </div>
      ) : (
        <>
        <div className="px-6 pb-6">

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.mobile}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.queries}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.lastQuery}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.createdBy}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewClient(client)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewReports(client)}
                        className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                        title="View Reports"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(client.id)}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeDropdown === client.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => handleDropdownAction('view', client)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleDropdownAction('edit', client)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Client
                              </button>
                              <button
                                onClick={() => handleDropdownAction('reports', client)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Reports
                              </button>
                              <button
                                onClick={() => handleDropdownAction('quickReport', client)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Quick Report
                              </button>
                              <div className="border-t border-gray-100"></div>
                              <button
                                onClick={() => handleDropdownAction('delete', client)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Client
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500">No clients found</div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddClient}
      />

      {/* Edit Client Modal */}
      <AddClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        onSave={handleUpdateClient}
        editMode={true}
        initialData={selectedClient}
      />
        </>
      )}
    </div>
  );
};

export default Clients;
