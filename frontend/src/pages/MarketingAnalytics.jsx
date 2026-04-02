import { useState, useEffect } from 'react';
// Layout removed - handled by nested routing
import { 
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import LogoLoader from '../components/LogoLoader';

const MarketingAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [fbInsights, setFbInsights] = useState(null);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/facebook/insights?range=${dateRange}`);
      const data = await response.json();
      
      if (data.success) {
        setFbInsights(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load marketing insights. Make sure Facebook integration is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative page-transition ${loading && fbInsights ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && !fbInsights ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500 bg-[#F9FAFB]">
             <LogoLoader text="Loading analytics..." />
          </div>
      ) : (
        <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics</h1>
            <p className="text-gray-600 mt-1">Track your marketing performance and ROI</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Meta Ads Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{fbInsights?.spent?.toLocaleString() || '0'}</p>
                <p className="text-xs text-blue-600 mt-1">Meta Ads API</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Impressions</p>
                <p className="text-2xl font-bold text-gray-900">{fbInsights?.impressions?.toLocaleString() || '0'}</p>
                <p className="text-xs text-green-600 mt-1">Ad Visibility</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{fbInsights?.leads || '0'}</p>
                <p className="text-xs text-purple-600 mt-1">Facebook Source</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Cost Per Lead</p>
                <p className="text-2xl font-bold text-gray-900">₹{fbInsights?.cpl || '0'}</p>
                <p className="text-xs text-orange-600 mt-1">Marketing ROI</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Facebook Leads</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fbInsights?.chart_data || []}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Performance (Placeholder)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fbInsights?.chart_data || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Facebook Leads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Facebook Leads</h2>
          </div>
          <div className="p-6">
            {fbInsights?.recent_leads?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fbInsights.recent_leads.map((lead) => (
                      <tr key={lead.id} className="text-sm hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{lead.client_name}</td>
                        <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{lead.destination || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 uppercase">
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent Facebook leads available</p>
                <p className="text-sm text-gray-500 mt-2">Connect your Meta Page to see real-time lead data</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default MarketingAnalytics;
