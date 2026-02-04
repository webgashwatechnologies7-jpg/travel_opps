import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useContent } from '../contexts/ContentContext';
import { marketingAPI } from '../services/api';
import { 
  Mail,
  MessageSquare,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Send,
  Eye,
  MousePointer,
  Target,
  Phone,
  Gift,
  Heart,
  Search,
  Filter,
  Download,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  UserPlus,
  MapPin,
  Plane
} from 'lucide-react';

const MarketingDashboard = () => {
  const { t } = useContent();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMarketingStats();
  }, [selectedPeriod]);

  const fetchMarketingStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await marketingAPI.dashboard({
        period: selectedPeriod,
      });

      const apiData = response?.data?.data || {};

      // Ensure we always have the fields the UI expects, with safe fallbacks
      const normalizedStats = {
        total_campaigns: apiData.total_campaigns ?? 0,
        active_campaigns: apiData.active_campaigns ?? 0,
        total_sent: apiData.total_sent ?? 0,
        total_opens: apiData.total_opens ?? 0,
        total_clicks: apiData.total_clicks ?? 0,
        conversion_rate: apiData.conversion_rate ?? 0,
        recent_campaigns: apiData.recent_campaigns || [],
        // Optional sections used only for display; backend may not provide them yet
        customer_stats: apiData.customer_stats || {
          total_customers: 0,
          new_this_month: 0,
          birthdays_this_month: 0,
          anniversaries_this_month: 0,
        },
        performance: apiData.performance || {
          email_performance: 0,
          sms_performance: 0,
          whatsapp_performance: 0,
        },
      };

      setStats(normalizedStats);
    } catch (err) {
      console.error('Failed to load marketing stats:', err);
      setError('Failed to load marketing stats. Please try again.');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
                <h1 className="text-3xl font-bold text-gray-900">{t('marketing.dashboard.title')}</h1>
                <p className="text-gray-600 mt-1">{t('marketing.dashboard.subtitle')}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('marketing.dashboard.search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  <span>{t('marketing.dashboard.new_campaign')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Campaign Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('marketing.dashboard.card_campaigns')}</p>
                  <p className="text-3xl font-bold mt-2">{stats?.total_campaigns || 0}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span>12% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Send className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">{t('marketing.dashboard.card_leads')}</p>
                  <p className="text-3xl font-bold mt-2">{stats?.customer_stats?.new_this_month || 0}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span>8% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">{t('marketing.dashboard.card_emails')}</p>
                  <p className="text-3xl font-bold mt-2">{stats?.total_sent || 0}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span>25% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Mail className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">{t('marketing.dashboard.card_response')}</p>
                  <p className="text-3xl font-bold mt-2">{stats?.conversion_rate || 0}%</p>
                  <div className="flex items-center mt-2 text-sm">
                    <ArrowDown className="w-4 h-4 mr-1" />
                    <span>3% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Start Marketing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('marketing.dashboard.start_marketing')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('marketing.dashboard.customers')}</h3>
                    <p className="text-sm text-gray-600">{stats?.customer_stats?.total_customers || 0} Total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Plane className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('marketing.dashboard.plan_trip')}</h3>
                    <p className="text-sm text-gray-600">For Customer</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Gift className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('marketing.dashboard.birthdays')}</h3>
                    <p className="text-sm text-gray-600">{stats?.customer_stats?.birthdays_this_month || 0} This Month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('marketing.dashboard.anniversaries')}</h3>
                    <p className="text-sm text-gray-600">{stats?.customer_stats?.anniversaries_this_month || 0} This Month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('marketing.dashboard.campaign_performance')}</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">{t('marketing.dashboard.view_all')}</button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">{t('marketing.dashboard.chart_placeholder')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('marketing.dashboard.channel_performance')}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('marketing.dashboard.channel_email')}</span>
                    <span className="text-sm text-gray-600">{stats?.performance?.email_performance || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats?.performance?.email_performance || 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('marketing.dashboard.channel_sms')}</span>
                    <span className="text-sm text-gray-600">{stats?.performance?.sms_performance || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.performance?.sms_performance || 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('marketing.dashboard.channel_whatsapp')}</span>
                    <span className="text-sm text-gray-600">{stats?.performance?.whatsapp_performance || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats?.performance?.whatsapp_performance || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Campaigns Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">{t('marketing.dashboard.recent_campaigns')}</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mailing Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriber</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.recent_campaigns && stats.recent_campaigns.length > 0 ? (
                    stats.recent_campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${
                              campaign.type === 'email' ? 'bg-blue-100' : 
                              campaign.type === 'sms' ? 'bg-green-100' : 
                              'bg-purple-100'
                            }`}>
                              {campaign.type === 'email' ? 
                                <Mail className="w-4 h-4 text-blue-600" /> : 
                                campaign.type === 'sms' ? 
                                <MessageSquare className="w-4 h-4 text-green-600" /> :
                                <MessageSquare className="w-4 h-4 text-purple-600" />
                              }
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                              <div className="text-xs text-gray-500">{campaign.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">WhatsApp {campaign.type === 'whatsapp' ? 'Test' : 'Template'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">New Years 2026</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{campaign.sent_count}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{campaign.open_rate || 0}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">Traubizz</div>
                            <div className="text-xs text-gray-500">{new Date(campaign.created_at).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No campaigns yet</p>
                        <p className="text-sm text-gray-500 mt-2">Create your first campaign to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MarketingDashboard;
