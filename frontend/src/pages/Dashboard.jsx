import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, paymentsAPI } from '../services/api';
import Layout from '../components/Layout';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import HorizontalBarChart from '../components/HorizontalBarChart';
import DonutChart from '../components/DonutChart';
import TaskFollowupsWidget from '../components/TaskFollowupsWidget';
import SalesRepsTable from '../components/SalesRepsTable';
import TopDestinationsTable from '../components/TopDestinationsTable';
import PaymentCollectionTable from '../components/PaymentCollectionTable';
import EmployeePerformance from '../components/EmployeePerformance';
import { 
  Calendar,
  FileText,
  Users,
  BarChart3 as BarChartIcon
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [latestNotes, setLatestNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        statsRes,
        revenueRes,
        toursRes,
        notesRes
      ] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.getRevenueGrowthMonthly(),
        dashboardAPI.upcomingTours(),
        dashboardAPI.latestLeadNotes()
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data || []);
      setUpcomingTours(toursRes.data.data || []);
      setLatestNotes(notesRes.data.data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      setError(errorMessage + (err.response?.status ? ` (Status: ${err.response.status})` : ''));
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  // Prepare donut chart data for Queries Status
  const queriesStatusData = [
    { name: 'Confirmed', value: stats?.confirmed || 0 },
    { name: 'Proposal Conv.', value: stats?.proposal_confirmed || 0 },
    { name: 'Cancel', value: stats?.cancelled || 0 },
    { name: 'Hot Lead', value: stats?.hot_leads || 0 },
    { name: 'Proposal Sent', value: stats?.proposal_sent || 0 },
    { name: 'Followups', value: stats?.followups || 0 },
    { name: 'Other', value: (stats?.total_queries || 0) - (stats?.confirmed || 0) - (stats?.proposal_confirmed || 0) - (stats?.cancelled || 0) - (stats?.hot_leads || 0) - (stats?.proposal_sent || 0) - (stats?.followups || 0) }
  ].filter(item => item.value > 0);

  // Revenue Growth percentages (simplified)
  const revenueGrowthPercentages = [
    { label: 'Proposal Sent', value: '4.2%' },
    { label: 'Hot Lead', value: '4.2%' },
    { label: 'Cancel', value: '4.2%' },
    { label: 'Proposal Conv.', value: '4.2%' }
  ];

  // Card configuration with names, colors, and data keys
  const cardConfigs = [
    { name: "Today's Queries", color: '#3b82f6', dataKey: 'today_queries', link: '/leads?status=new', linkText: 'View All Queries' },
    { name: 'Proposal Sent', color: '#f59e0b', dataKey: 'proposal_sent', link: '/leads?status=proposal', linkText: 'View All Proposal Sent' },
    { name: 'Hot Lead', color: '#ef4444', dataKey: 'hot_leads', link: '/leads?priority=hot', linkText: 'View All Hot Lead' },
    { name: 'Proposal Conv.', color: '#8b5cf6', dataKey: 'proposal_confirmed', link: '/leads?status=confirmed', linkText: 'View All Proposal Conv.' },
    { name: 'Cancel', color: '#ef4444', dataKey: 'cancelled', link: '/leads?status=cancelled', linkText: 'View All Cancel' },
    { name: 'Follow Up', color: '#eab308', dataKey: 'followups', link: '/leads?status=followup', linkText: 'View All Follow Up' },
    { name: 'Confirmed', color: '#10b981', dataKey: 'confirmed', link: '/leads?status=confirmed', linkText: 'View All Confirmed' },
    { name: 'Total Queries', color: '#1e40af', dataKey: 'total_queries', link: '/leads', linkText: 'View All Queries' }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Top Row - 8 Cards with Same Look */}
        <div className="grid grid-cols-8 gap-4 items-stretch overflow-x-auto">
          {cardConfigs.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 h-full flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                  <FileText className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <BarChartIcon className="h-4 w-4 text-gray-400" />
              </div>
              <h3 className="text-xs font-semibold text-gray-800 mb-1">{card.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">{stats?.[card.dataKey] || 0}</p>
              <Link to={card.link} className="text-xs text-blue-600 hover:text-blue-800 mt-auto">
                {card.linkText}
              </Link>
            </div>
          ))}
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="col-span-3 space-y-6">
            {/* Upcoming Tours - Donut Chart */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Tours</h2>
              <DonutChart
                title="Queries Status"
                data={queriesStatusData}
                height={250}
                colors={['#3b82f6', '#60a5fa', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981']}
              />
            </div>

            {/* Revenue Growth */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Growth</h2>
              <div className="space-y-3">
                {revenueGrowthPercentages.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* This Year Queries Button */}
            <Link
              to="/reports"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
            >
              View Full Report's
            </Link>
          </div>

          {/* Center Column */}
          <div className="col-span-6 space-y-6">
            {/* Revenue Growth Line Chart */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Growth</h2>
              <LineChart
                data={revenueData}
                xAxisKey="month"
                height={250}
                lines={[
                  {
                    dataKey: 'amount',
                    name: 'Revenue',
                    color: '#10b981'
                  }
                ]}
              />
            </div>

            {/* This Year Queries / Confirmed Bar Chart */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">This Year Queries / Confirmed</h2>
              <BarChart
                data={stats?.this_year_queries_confirmed || []}
                xAxisKey="month"
                height={250}
                bars={[
                  {
                    dataKey: 'queries',
                    name: 'Queries',
                    color: '#3b82f6'
                  },
                  {
                    dataKey: 'confirmed',
                    name: 'Confirmed',
                    color: '#10b981'
                  }
                ]}
              />
            </div>

            {/* Latest Query Notes */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Latest Query Notes</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {latestNotes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No notes available</p>
                ) : (
                  latestNotes.map((note, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-3 py-2">
                      <p className="font-medium text-sm text-gray-800">Travbizz Travel IT Solutions</p>
                      <p className="text-xs text-gray-600 mt-1">{note.note || 'lollipop'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.created_at).toLocaleString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Lead Source Horizontal Bar Chart */}
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Lead Source</h2>
              <HorizontalBarChart
                data={stats?.top_lead_sources || []}
                yAxisKey="source"
                height={250}
                bars={[
                  {
                    dataKey: 'total',
                    name: 'Total Queries',
                    color: '#8b5cf6'
                  },
                  {
                    dataKey: 'confirmed',
                    name: 'Confirmed',
                    color: '#10b981'
                  }
                ]}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-6">
            {/* Task / Followups */}
            <TaskFollowupsWidget maxItems={4} showViewAll={false} />

            {/* Payment Collection */}
            <PaymentCollectionTable />

            {/* Sales Reps */}
            <SalesRepsTable title="Sales Reps." />

            {/* Top Destinations */}
            <TopDestinationsTable />

            {/* Monthly Employee Performance */}
            <EmployeePerformance />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
