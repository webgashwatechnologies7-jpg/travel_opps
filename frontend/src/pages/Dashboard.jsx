import { useState, useEffect } from 'react';
<<<<<<< HEAD
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
=======
import { dashboardAPI, followupsAPI, leadsAPI } from '../services/api';
import Layout from '../components/Layout';
import PaymentCollectionTable from '../components/PaymentCollectionTable';
import SalesRepsTable from '../components/SalesRepsTable';
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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
<<<<<<< HEAD
import DashboardHeader from '../components/Headers/Search/DashboardHeader';
=======
import { useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [latestNotes, setLatestNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  let navigate = useNavigate();
=======
  const [todayQueries, setTodayQueries] = useState([]);
  const [loadingTodayQueries, setLoadingTodayQueries] = useState(true);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    new: 0,
    pending: 0,
    closed: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    hot: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  let navigate = useNavigate();
  const { user } = useAuth();
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)

  useEffect(() => {
    fetchAllData();
  }, [user?.id]);

  const fetchAllData = async () => {
    try {
      setLoadingTodayQueries(true);
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
<<<<<<< HEAD
=======

>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      console.log(revenueRes.data.data)
      console.log("check", followupsRes.data.data?.followups)
      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data || []);
      setUpcomingTours(toursRes.data.data || []);
      setLatestNotes(notesRes.data.data || []);
<<<<<<< HEAD
      setFollowups(followupsRes.data.data?.followups || []);

=======

      // Today follow-ups widget should show only real followups/tasks,
      // not plain notes. In this app, tasks have a reminder_time set.
      const rawFollowups = followupsRes.data.data?.followups || [];
      const taskFollowups = rawFollowups.filter((item) => Boolean(item.reminder_time));
      const followupColors = ["bg-blue-500", "bg-red-500", "bg-orange-400"];
      const formattedFollowups = taskFollowups.map((item, index) => {
        const dateValue = item.reminder_date || item.created_at || null;
        const dateLabel = dateValue
          ? new Date(dateValue).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })
          : "Today";
        const timeLabel = item.reminder_time ? ` - ${item.reminder_time}` : "";
        return {
          id: item.id,
          leadId: item.lead_id || item.lead?.id || null,
          date: `${dateLabel}${timeLabel}`,
          title: item.remark || "Followup",
          color: followupColors[index % followupColors.length],
          highlight: false,
        };
      });
      setFollowups(formattedFollowups);

      if (user?.id) {
        const leadsRes = await leadsAPI.list({ assigned_to: user.id, per_page: 1000 });
        const leads = leadsRes.data.data?.leads || [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const toDate = (value) => (value ? new Date(value) : null);
        const isSameDay = (value) => {
          const d = toDate(value);
          return d
            && d.getFullYear() === now.getFullYear()
            && d.getMonth() === now.getMonth()
            && d.getDate() === now.getDate();
        };

        const todayLeads = leads.filter(lead => lead.created_at && isSameDay(lead.created_at));
        const formatted = todayLeads.map(lead => ({
          id: lead.id,
          title: lead.destination ? `${lead.destination} Tour` : "New Query",
          name: lead.client_name || "Client",
          date: new Date(lead.created_at).toLocaleDateString("en-GB"),
        }));
        setTodayQueries(formatted);

        const inRange = (value, start) => {
          const d = toDate(value);
          return d && d >= start;
        };
        setLeadStats({
          total: leads.length,
          new: leads.filter(lead => lead.status === 'new').length,
          pending: leads.filter(lead => lead.status === 'proposal').length,
          closed: leads.filter(lead => lead.status === 'cancelled').length,
          weekly: leads.filter(lead => inRange(lead.created_at, startOfWeek)).length,
          monthly: leads.filter(lead => inRange(lead.created_at, startOfMonth)).length,
          yearly: leads.filter(lead => inRange(lead.created_at, startOfYear)).length,
          hot: leads.filter(lead => lead.priority === 'hot').length,
        });
      } else {
        setTodayQueries([]);
        setLeadStats({
          total: 0,
          new: 0,
          pending: 0,
          closed: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
          hot: 0,
        });
      }
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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
      setLoadingTodayQueries(false);
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

  // Revenue Growth percentages (dynamic from stats)
  const totalQueries = stats?.total_queries || 0;
  const toPercent = (count) => {
    if (!totalQueries || !count) return '0%';
    const value = (count / totalQueries) * 100;
    return `${value.toFixed(1)}%`;
  };

  const revenueGrowthPercentages = [
    { label: 'Proposal Sent', value: toPercent(stats?.proposal_sent || 0) },
    { label: 'Hot Lead', value: toPercent(stats?.hot_leads || 0) },
    { label: 'Cancel', value: toPercent(stats?.cancelled || 0) },
    { label: 'Proposal Conv.', value: toPercent(stats?.proposal_confirmed || 0) }
  ];
  return (
<<<<<<< HEAD
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
=======
    <Layout>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[1280px] grid grid-cols-12 gap-6 items-stretch">
          {/* Row 1 */}
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <TodayQueriesCard
                queries={todayQueries}
                totalCount={todayQueries.length}
                loading={loadingTodayQueries}
                onViewAll={() => navigate("/leads?today=1")}
                onQueryClick={(query) => {
                  if (query?.id) {
                    navigate(`/leads/${query.id}`);
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-6 flex h-[300px]">
            <div className="w-full">
              <DashboardStatsCards
                stats={{
                  totalQueries: leadStats.total,
                  newQueries: leadStats.new,
                  pendingQueries: leadStats.pending,
                  closedQueries: leadStats.closed,
                  weeklyQueries: leadStats.weekly,
                  monthlyQueries: leadStats.monthly,
                  yearlyQueries: leadStats.yearly,
                  hotQueries: leadStats.hot,
                }}
              />
            </div>
          </div>
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <TaskFollowups
                followups={followups}
                onViewMore={() => navigate("/followups")}
                onFollowupClick={(item) => {
                  if (item?.leadId) {
                    navigate(`/leads/${item.leadId}?tab=followups`);
                  }
                }}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <UpcomingTours data={upcomingTours} />
            </div>
          </div>
          <div className="col-span-6 flex h-[300px]">
            <div className="w-full">
              <RevenueChart revenueData={revenueData} />
            </div>
          </div>
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <PaymentCollectionTable />
            </div>
          </div>

          {/* Row 3 */}
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <RevenueGrowthCard
                title="Revenue Growth"
                data={revenueGrowthPercentages}
                buttonText="View Full Report's"
                onButtonClick={() => navigate("/reports")}
              />
            </div>
          </div>
          <div className="col-span-6 flex h-[300px]">
            <div className="w-full">
              <YearQueriesChart
                title="This Year Queries / Confirmed"
                data={stats?.this_year_queries_confirmed || []}
              />
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
            </div>
          </div>
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <SalesRepsTable title={"Sales"} />
            </div>
          </div>

<<<<<<< HEAD
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
=======
          {/* Row 4 */}
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <LatestQuery latestNotes={latestNotes} />
            </div>
          </div>
          <div className="col-span-6 flex h-[300px]">
            <div className="w-full">
              <TopLeadSource leadData={stats?.top_lead_sources || []} />
            </div>
          </div>
          <div className="col-span-3 flex h-[300px]">
            <div className="w-full">
              <TopDestinationAndPerformance />
            </div>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
