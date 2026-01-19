import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import UniversalInfoTooltip from '../components/UniversalInfoTooltip';
import { 
  Users, TrendingUp, DollarSign, Calendar, Plane, Hotel, 
  CreditCard, BarChart3, Target, Award, Briefcase,
  Filter, Search, Plus, Eye, Edit, MoreVertical
} from 'lucide-react';

const UniversalDashboard = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, this would come from API
  const [data, setData] = useState({
    queries: {
      total: 1234,
      new: 45,
      proposal: 23,
      confirmed: 67,
      hot: 12,
      this_month: 89
    },
    itineraries: {
      total: 567,
      confirmed: 234,
      pending: 45,
      this_month: 78
    },
    payments: {
      total: 234,
      paid: 189,
      pending: 34,
      overdue: 11,
      this_month_revenue: 45678
    },
    employees: {
      total: 12,
      active: 10,
      top_performer: 'Sarah Johnson',
      avg_performance: 87
    }
  });

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'queries', label: 'Queries', icon: <Users className="w-4 h-4" /> },
    { id: 'itineraries', label: 'Itineraries', icon: <Plane className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'employees', label: 'Employee Performance', icon: <Award className="w-4 h-4" /> }
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Queries</p>
            <p className="text-2xl font-bold text-gray-900">{data.queries.total}</p>
            <p className="text-sm text-green-600">+{data.queries.this_month} this month</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${data.payments.this_month_revenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{data.payments.total} payments</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{data.employees.avg_performance}%</p>
            <p className="text-sm text-gray-500">Industry average: 65%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Hot Leads</p>
            <p className="text-2xl font-bold text-gray-900">{data.queries.hot}</p>
            <p className="text-sm text-red-600">Requires immediate attention</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQueries = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Queries</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ client_name: `Customer ${i}`, id: `Q${1000 + i}` }} type="queries" module="queries">
                    Customer {i}
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ status: i % 3 === 0 ? 'new' : 'proposal' }} type="queries" module="queries">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      i % 3 === 0 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {i % 3 === 0 ? 'New' : 'Proposal'}
                    </span>
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ priority: i % 4 === 0 ? 'hot' : 'warm' }} type="queries" module="queries">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      i % 4 === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {i % 4 === 0 ? '🔥 Hot' : '🌡 Warm'}
                    </span>
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderItineraries = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Itineraries</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <UniversalInfoTooltip data={{ 
                  id: `IT${2000 + i}`, 
                  title: `Dubai Adventure ${i}N/4D`,
                  destination: 'Dubai, UAE',
                  duration: `${4 + i} days`,
                  status: i % 3 === 0 ? 'confirmed' : 'draft'
                }} type="itineraries" module="itineraries">
                  <h4 className="font-semibold text-gray-900">Dubai Adventure {i}N/4D</h4>
                  <p className="text-sm text-gray-600 mt-1">Dubai, UAE • {4 + i} days</p>
                </UniversalInfoTooltip>
              </div>
              <div className="flex items-center space-x-2">
                <UniversalInfoTooltip data={{ 
                  activities_count: 8 + i,
                  hotels_count: 3 + i,
                  status: i % 3 === 0 ? 'confirmed' : 'draft'
                }} type="itineraries" module="itineraries">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{8 + i} activities</p>
                    <p className="text-sm text-gray-500">{3 + i} hotels</p>
                  </div>
                </UniversalInfoTooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ id: `P${1000 + i}` }} type="payments" module="payments">
                    P{1000 + i}
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ amount: 1000 + i * 100 }} type="payments" module="payments">
                    ${(1000 + i * 100).toLocaleString()}
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4">
                  <UniversalInfoTooltip data={{ status: i % 3 === 0 ? 'paid' : 'pending' }} type="payments" module="payments">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      i % 3 === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {i % 3 === 0 ? 'Paid' : 'Pending'}
                    </span>
                  </UniversalInfoTooltip>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(Date.now() + i * 86400000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <UniversalInfoTooltip data={{ payment_method: i % 2 === 0 ? 'Credit Card' : 'Bank Transfer' }} type="payments" module="payments">
                    {i % 2 === 0 ? 'Credit Card' : 'Bank Transfer'}
                  </UniversalInfoTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmployeePerformance = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Employee Performance</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.employees.total}</div>
            <p className="text-sm text-gray-600">Total Employees</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data.employees.active}</div>
            <p className="text-sm text-gray-600">Active Employees</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.employees.avg_performance}%</div>
            <p className="text-sm text-gray-600">Average Performance</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.employees.top_performer}</div>
            <p className="text-sm text-gray-600">Top Performer</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'queries':
        return renderQueries();
      case 'itineraries':
        return renderItineraries();
      case 'payments':
        return renderPayments();
      case 'employees':
        return renderEmployeePerformance();
      default:
        return renderOverview();
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Universal Dashboard</h1>
                <p className="text-gray-600 mt-1">Complete overview of all CRM modules</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search across all modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filters */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default UniversalDashboard;
