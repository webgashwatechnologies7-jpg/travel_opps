import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      // Fallback to mock data if API fails
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
        },
        {
          id: 2,
          company: 'Tour Operators B',
          gst: '27BBBPL5678D2EZ',
          name: 'Anita Desai',
          mobile: '+91 87654 32109',
          email: 'anita@tourop.com',
          queries: 12,
          lastQuery: '2024-01-14',
          city: 'Delhi',
          createdBy: 'Admin'
        },
        {
          id: 3,
          company: 'Holiday Makers C',
          gst: '27CCCPM9012E3FX',
          name: 'Vikram Singh',
          mobile: '+91 76543 21098',
          email: 'vikram@holiday.com',
          queries: 20,
          lastQuery: '2024-01-13',
          city: 'Bangalore',
          createdBy: 'Admin'
        }
      ];
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.mobile.includes(searchTerm)
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
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Agents</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add New
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{agent.company}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.gst}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.mobile}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.queries}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.lastQuery}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.createdBy}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-gray-500">No agents found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Agents;
