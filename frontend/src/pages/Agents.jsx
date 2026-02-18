import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';
import AddAgentModal from '../components/AddAgentModal';
import { toast } from 'react-toastify';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await accountsAPI.getAgents();
      if (response.data.success) {
        setAgents(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Fallback only if no data at all
      if (agents.length === 0) {
        const mockAgents = [
          {
            id: 1,
            company: 'Travel Agency A',
            gst: '27AAAPL1234C1ZV',
            name: 'Rahul Verma',
            mobile: '+91 98765 43210',
            email: 'rahul@travelagency.com',
            queries: 15,
            lastQuery: '2024-01-15',
            city: 'Mumbai',
            createdBy: 'Admin'
          }
        ];
        // setAgents(mockAgents); // Optional: commenting this out to encourage real data
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (agentData) => {
    try {
      const response = await accountsAPI.createAgent(agentData);
      if (response.data.success) {
        toast.success('Agent added successfully');
        fetchAgents();
      } else {
        toast.error(response.data.message || 'Failed to add agent');
      }
    } catch (error) {
      console.error('Error adding agent:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong while adding the agent.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateAgent = async (agentData) => {
    try {
      const response = await accountsAPI.updateAgent(selectedAgent.id, agentData);
      if (response.data.success) {
        toast.success('Agent updated successfully');
        fetchAgents();
        setShowEditModal(false);
        setSelectedAgent(null);
      } else {
        toast.error(response.data.message || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong while updating the agent.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        const response = await accountsAPI.deleteAgent(id);
        if (response.data.success) {
          toast.success('Agent deleted successfully');
          fetchAgents();
        } else {
          toast.error(response.data.message || 'Failed to delete agent');
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        const errorMessage = error.response?.data?.message || 'Something went wrong while deleting the agent.';
        toast.error(errorMessage);
      }
    }
  };

  const filteredAgents = (agents || []).filter(agent =>
    (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.mobile || '').includes(searchTerm)
  );

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
      <div className="p-4">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Agents</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Query</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{agent.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.gst}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.queries}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.lastQuery}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAgents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-2">No agents found</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:underline"
              >
                Add your first agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAgent}
      />

      <AddAgentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAgent(null);
        }}
        onSave={handleUpdateAgent}
        editMode={true}
        initialData={selectedAgent}
      />
    </Layout>
  );
};

export default Agents;

