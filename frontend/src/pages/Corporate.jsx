import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';

const Corporate = () => {
  const [corporates, setCorporates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCorporates();
  }, []);

  const fetchCorporates = async () => {
    try {
      const response = await accountsAPI.getCorporate();
      if (response.data.success) {
        setCorporates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch corporates:', error);
      // Fallback to mock data if API fails
      const mockCorporates = [
        {
          id: 1,
          companyName: 'Tech Solutions Pvt Ltd',
          industry: 'Information Technology',
          contactPerson: 'Sanjay Mehta',
          designation: 'HR Manager',
          mobile: '+91 98765 43210',
          email: 'sanjay@techsolutions.com',
          queries: 25,
          lastQuery: '2024-01-15',
          city: 'Pune',
          createdBy: 'Agent A',
          creditLimit: '₹5,00,000',
          status: 'Active'
        },
        {
          id: 2,
          companyName: 'Global Manufacturing Corp',
          industry: 'Manufacturing',
          contactPerson: 'Kavita Reddy',
          designation: 'Travel Coordinator',
          mobile: '+91 87654 32109',
          email: 'kavita@globalmfg.com',
          queries: 18,
          lastQuery: '2024-01-14',
          city: 'Chennai',
          createdBy: 'Agent B',
          creditLimit: '₹3,50,000',
          status: 'Active'
        },
        {
          id: 3,
          companyName: 'Financial Services Ltd',
          industry: 'Banking & Finance',
          contactPerson: 'Amit Bansal',
          designation: 'Operations Head',
          mobile: '+91 76543 21098',
          email: 'amit@finserv.com',
          queries: 12,
          lastQuery: '2024-01-13',
          city: 'Mumbai',
          createdBy: 'Agent C',
          creditLimit: '₹7,50,000',
          status: 'Active'
        }
      ];
      setCorporates(mockCorporates);
    } finally {
      setLoading(false);
    }
  };

  const filteredCorporates = corporates.filter(corporate =>
    corporate.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corporate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corporate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corporate.mobile.includes(searchTerm)
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
          <h1 className="text-3xl font-bold text-gray-800">Corporate</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add New
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search corporate clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCorporates.map((corporate) => (
                <tr key={corporate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{corporate.companyName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.industry}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{corporate.contactPerson}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.designation}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.mobile}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.queries}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.lastQuery}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{corporate.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{corporate.creditLimit}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {corporate.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCorporates.length === 0 && (
            <div className="text-center py-8 text-gray-500">No corporate clients found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Corporate;
