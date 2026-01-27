import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, followupsAPI, paymentsAPI } from '../services/api';
import Layout from '../components/Layout';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import HorizontalBarChart from '../components/HorizontalBarChart';
import DonutChart from '../components/DonutChart';
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
import { useNavigate } from "react-router";
import TodayQueriesCard from '../components/dashboard/TodayQueriesCard';
import UpcomingTours from '../components/dashboard/UpcomingTours';
import RevenueGrowthCard from '../components/dashboard/RevenueGrowthCard';
import DashboardStatsCards from '../components/dashboard/DashboardStatsCards';
import RevenueChart from '../components/dashboard/RevenueChart';
import YearQueriesChart from '../components/dashboard/YearQueriesChart';
import LatestQuery from '../components/dashboard/LatestQuery';
import TopLeadSource from '../components/dashboard/TopLeadSource';
import TaskFollowups from '../components/dashboard/TaskFollowups';
import TopDestinationAndPerformance from '../components/dashboard/TopDestinationAndPerformance';
import DashboardHeader from '../components/Headers/Search/DashboardHeader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [latestNotes, setLatestNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  let navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        statsRes,
        revenueRes,
        toursRes,
        notesRes,
        followupsRes
      ] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.getRevenueGrowthMonthly(),
        dashboardAPI.upcomingTours(),
        dashboardAPI.latestLeadNotes(),
        followupsAPI.today()
      ]);
      console.log(revenueRes.data.data)
      console.log("check", followupsRes.data.data?.followups)
      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data || []);
      setUpcomingTours(toursRes.data.data || []);
      setLatestNotes(notesRes.data.data || []);
      setFollowups(followupsRes.data.data?.followups || []);

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
    <Layout Header={DashboardHeader}>
      <div className="p-4 ">
        {/* =========================================
            DESKTOP LAYOUT (Visible on 1440px and up)
           ========================================= */}
        <div className="hidden min-[1440px]:grid grid-cols-12 gap-6">
          {/* Left Column (Span 3) */}
          <div className='col-span-3 space-y-2'>
            <TodayQueriesCard />
            <UpcomingTours data={upcomingTours} />
            <RevenueGrowthCard
              title="Revenue Growth"
              data={revenueGrowthPercentages}
              buttonText="View Full Report's"
              onButtonClick={() => navigate("/reports")}
            />
          </div>

          {/* Middle Column (Span 6) */}
          <div className='col-span-6 space-y-6'>
            <DashboardStatsCards
              stats={{
                totalQueries: stats?.total_queries || 0,
                pendingQueries: stats?.pending_queries || 0,
                resolvedQueries: stats?.resolved_queries || 0,
                closedQueries: stats?.closed_queries || 0,
                todayQueries: stats?.today_queries || 0,
                weeklyQueries: stats?.weekly_queries || 0,
                monthlyQueries: stats?.monthly_queries || 0,
                yearlyQueries: stats?.yearly_queries || 0,
              }}
            />
            <RevenueChart revenueData={revenueData} />
            <YearQueriesChart
              title="This Year Queries / Confirmed"
              data={stats?.this_year_queries_confirmed || []}
            />

            <div className='flex w-full mt-2 gap-4'>
              <div className='w-[35%]'>
                <LatestQuery latestNotes={latestNotes} />
              </div>
              <div className='w-[65%]'>
                <TopLeadSource leadData={stats?.top_lead_sources || []} />
              </div>
            </div>
          </div>

          {/* Right Column (Span 3) */}
          <div className='col-span-3 space-y-6'>
            <TaskFollowups followups={followups} />
            <PaymentCollectionTable />
            <SalesRepsTable title={"Sales"} />
            <TopDestinationAndPerformance />
          </div>
        </div>

        {/* =========================================
            MOBILE & TABLET LAYOUT (Visible below 1440px)
           ========================================= */}
        <div className="min-[1440px]:hidden space-y-6">
          {/* Top Stats */}
          <DashboardStatsCards
            stats={{
              totalQueries: stats?.total_queries || 0,
              pendingQueries: stats?.pending_queries || 0,
              resolvedQueries: stats?.resolved_queries || 0,
              closedQueries: stats?.closed_queries || 0,
              todayQueries: stats?.today_queries || 0,
              weeklyQueries: stats?.weekly_queries || 0,
              monthlyQueries: stats?.monthly_queries || 0,
              yearlyQueries: stats?.yearly_queries || 0,
            }}
          />

          {/* Today Queries & Upcoming Tours - 1 col mobile, 2 col tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TodayQueriesCard />
            <UpcomingTours data={upcomingTours} />
          </div>

          {/* Charts & Growth - Stacked */}
          <RevenueChart revenueData={revenueData} />

          <YearQueriesChart
            title="This Year Queries / Confirmed"
            data={stats?.this_year_queries_confirmed || []}
          />

          <RevenueGrowthCard
            title="Revenue Growth"
            data={revenueGrowthPercentages}
            buttonText="View Full Report's"
            onButtonClick={() => navigate("/reports")}
          />

          {/* Latest Query & Top Lead Source - Custom Split */}
          <div className='flex flex-col md:flex-row w-full mt-2 gap-4'>
            <div className='md:w-[35%] w-full'>
              <LatestQuery latestNotes={latestNotes} />
            </div>
            <div className='md:w-[65%] w-full'>
              <TopLeadSource leadData={stats?.top_lead_sources || []} />
            </div>
          </div>

          {/* Bottom Section - 1 col mobile, 2 col tab */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TaskFollowups followups={followups} />
            <PaymentCollectionTable />
            <SalesRepsTable title={"Sales"} />
            <TopDestinationAndPerformance />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
