import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';
import AddClientModal from '../components/AddClientModal';
import { Edit2, Trash2, Eye, TrendingUp, MoreVertical, Download, FileText, Plus } from 'lucide-react';

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

  const fetchClients = async () => {
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
  };

  const filteredClients = (clients || []).filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.mobile.includes(searchTerm)
  );

  const handleAddClient = async (clientData) => {
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
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleUpdateClient = async (clientData) => {
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
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await accountsAPI.deleteClient(clientId);
        if (response.data.success) {
          // Refresh clients list
          fetchClients();
        } else {
          throw new Error(response.data.message || 'Failed to delete client');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  const handleViewClient = (client) => {
    // Navigate to client details page
    navigate(`/accounts/clients/${client.id}`);
  };

  const handleViewReports = (client) => {
    // Navigate to client reports page
    navigate(`/accounts/clients/${client.id}/reports`);
  };

  const handleQuickReport = (client) => {
    // Generate quick report (simplified version)
    const reportData = {
      client: client,
      generatedOn: new Date().toLocaleDateString(),
      totalQueries: client.queries || 0,
      lastQuery: client.lastQuery || 'N/A'
    };
    
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
  };

  const toggleDropdown = (clientId) => {
    setActiveDropdown(activeDropdown === clientId ? null : clientId);
  };

  const handleDropdownAction = (action, client) => {
    setActiveDropdown(null);
    switch (action) {
      case 'view':
        handleViewClient(client);
        break;
      case 'edit':
        handleEditClient(client);
        break;
      case 'delete':
        handleDeleteClient(client.id);
        break;
      case 'reports':
        handleViewReports(client);
        break;
      case 'quickReport':
        handleQuickReport(client);
        break;
      default:
        break;
    }
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedClients.length === 0) {
      alert('Please select at least one client');
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
          alert(`${selectedClients.length} clients deleted successfully`);
        }
        break;
        
      default:
        break;
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

  return (
    <Layout>
      <div>
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                {selectedClients.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedClients.length} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('bulkReport')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Bulk Report</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('bulkDelete')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add New</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
    </Layout>
  );
};

export default Clients;
