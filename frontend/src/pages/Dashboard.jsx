import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Activity, XCircle } from 'lucide-react';
import { dashboardAPI, followupsAPI, leadsAPI } from '../services/api';
// Layout removed - handled by nested routing
import PaymentCollectionTable from '../components/PaymentCollectionTable';
import SalesRepsTable from '../components/SalesRepsTable';
import TodayQueriesCard from '../components/dashboard/TodayQueriesCard';
import UpcomingTours from '../components/dashboard/UpcomingTours';
import RevenueGrowthCard from '../components/dashboard/RevenueGrowthCard';
import DashboardStatsCards from '../components/dashboard/DashboardStatsCards';
import RevenueChart from '../components/dashboard/RevenueChart';
import YearQueriesChart from '../components/dashboard/YearQueriesChart';
import TeamLeaderStatsTable from '../components/dashboard/TeamLeaderStatsTable';
import EmployeeStatsTable from '../components/dashboard/EmployeeStatsTable';
import LatestQuery from '../components/dashboard/LatestQuery';
import TopLeadSource from '../components/dashboard/TopLeadSource';
import TaskFollowups from '../components/dashboard/TaskFollowups';
import TopDestinationAndPerformance from '../components/dashboard/TopDestinationAndPerformance';
import PendingDistributionCard from '../components/dashboard/PendingDistributionCard';
import { useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import LogoLoader from '../components/LogoLoader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [latestNotes, setLatestNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
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
    unassigned: 0,
    today: 0,
  });
  const [presenceStats, setPresenceStats] = useState({
    formatted_time: '0h 0m',
    logout_count: 0,
    login_count: 0,
    total_seconds: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  let navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => (typeof r === 'string' ? r === 'Manager' : r.name === 'Manager'));
  const { menuItems } = useSettings();

  // Helper to check permissions based on visible menu items
  const isVisible = (label) => {
    // Check if user is Admin/SuperAdmin - they see everything
    if (user?.is_super_admin || user?.roles?.some(r => r === 'Admin' || r === 'Company Admin')) return true;

    // Check if label exists in menuItems
    return menuItems.some(item =>
      item.label === label ||
      // Also check submenu labels if needed
      (item.submenu && item.submenu.some(sub => sub.label === label))
    );
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.id]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoadingTodayQueries(true);

      const hasAnalytics = user?.plan_features?.analytics?.enabled;

      const [
        statsRes,
        revenueRes,
        toursRes,
        notesRes,
        followupsRes,
        presenceRes
      ] = await Promise.all([
        dashboardAPI.stats(),
        hasAnalytics ? dashboardAPI.getRevenueGrowthMonthly() : Promise.resolve({ data: { data: [] } }),
        dashboardAPI.upcomingTours(),
        dashboardAPI.latestLeadNotes(),
        followupsAPI.today(),
        dashboardAPI.getPresenceStats()
      ]);
      setStats(statsRes.data.data);
      setPresenceStats(presenceRes.data.data || { formatted_time: '0h 0m', logout_count: 0, login_count: 0 });
      setRevenueData(revenueRes?.data?.data || []);
      setUpcomingTours(toursRes.data.data || []);
      setLatestNotes(notesRes.data.data || []);

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
        const isAdmin = user.is_super_admin || user.roles?.some(r => {
          const roleName = typeof r === 'string' ? r : r.name;
          return ['Admin', 'Company Admin', 'Super Admin', 'Manager'].includes(roleName);
        });

        // Managers and Employees see scoped data, higher admins see global or as allowed by hierarchy
        const queryParams = isAdmin ? { per_page: 1000 } : { assigned_to: user.id, per_page: 1000 };
        const leadsRes = await leadsAPI.list(queryParams);
        const leads = leadsRes.data.data?.leads || [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const toDate = (value) => {
          if (!value) return null;
          let str = value;
          // If it looks like a MySQL timestamp without timezone (e.g. 2026-03-26 14:44:53), append Z to treat as UTC
          if (typeof str === 'string' && !str.includes('Z') && !str.includes('+')) {
            str = str.replace(' ', 'T') + 'Z';
          }
          return new Date(str);
        };
        const isSameDay = (value) => {
          const d = toDate(value);
          if (!d || isNaN(d.getTime())) return false;
          const today = new Date();
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth() === today.getMonth() &&
                 d.getDate() === today.getDate();
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
          unassigned: leads.filter(lead => !lead.assigned_to && !lead.assigned_to_id).length,
          today: leads.filter(lead => lead.created_at && isSameDay(lead.created_at)).length,
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
          unassigned: 0,
          today: 0,
        });
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';

      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      setError(errorMessage + (err.response?.status ? ` (Status: ${err.response.status})` : ''));
    } finally {
      setLoading(false);
      setLoadingTodayQueries(false);
    }
  }, [user?.id]);

  const hasAnalytics = user?.plan_features?.analytics?.enabled;

  // Revenue Growth percentages (dynamic from stats)
  const totalQueries = stats?.total_queries || 0;
  const revenueGrowthPercentages = useMemo(() => {
    const toPercent = (count) => {
      if (!totalQueries || !count) return '0%';
      return `${((count / totalQueries) * 100).toFixed(1)}%`;
    };
    return [
      { label: 'Proposal Sent', value: toPercent(stats?.proposal_sent || 0) },
      { label: 'Hot Lead', value: toPercent(stats?.hot_leads || 0) },
      { label: 'Cancel', value: toPercent(stats?.cancelled || 0) },
      { label: 'Proposal Conv.', value: toPercent(stats?.proposal_confirmed || 0) },
    ];
  }, [stats, totalQueries]);

  const featureFlags = useMemo(() => ({
    hasQueries: true,
    hasFollowups: true,
    hasItineraries: isVisible('Itineraries') || isManager || user?.roles?.some(r => (typeof r === 'string' ? ['Employee', 'Sales Rep'].includes(r) : ['Employee', 'Sales Rep'].includes(r.name))),
    hasPayments: isVisible('Payments') || isManager || user?.roles?.some(r => (typeof r === 'string' ? ['Employee', 'Sales Rep'].includes(r) : ['Employee', 'Sales Rep'].includes(r.name))),
    hasReports: (isVisible('Reports') || isManager) && hasAnalytics,
    hasSales: (isVisible('Sales Reps') || isManager) && hasAnalytics,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isManager, hasAnalytics, menuItems, user?.roles]);

  const { hasQueries, hasFollowups, hasItineraries, hasPayments, hasReports, hasSales } = featureFlags;

  return (
    <div className={`p-0 min-h-screen relative page-transition ${loading && stats ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && !stats ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
             <LogoLoader text="Preparing dashboard..." />
          </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-400" />
             <span className="font-medium">{error}</span>
          </div>
        </div>
      ) : (
        <div className="p-0">
        {/* Unassigned Leads Alert for Managers/Admins */}
        {(user?.roles?.some(r => ['Admin', 'Company Admin', 'Manager'].includes(typeof r === 'string' ? r : r.name))) && (
          <PendingDistributionCard
            count={leadStats.unassigned}
            loading={loading}
            onViewUnassigned={() => navigate("/leads?status=unassigned")}
          />
        )}

        {/* Presence & Activity Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Today</p>
              <h3 className="text-xl font-black text-gray-900">{presenceStats.formatted_time}</h3>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Activity className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Work Sessions</p>
              <h3 className="text-xl font-black text-gray-900">{presenceStats.login_count}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Logouts</p>
              <h3 className="text-xl font-black text-gray-900">{presenceStats.logout_count}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all border-l-4 border-l-green-500">
            <div className="p-3 bg-green-50 rounded-xl relative">
              <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-ping absolute top-3 left-3"></div>
              <Activity className="h-6 w-6 text-green-600 relative z-10" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Presence</p>
              <h3 className="text-xl font-black text-green-600 uppercase">Live Now</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          {/* Row 1: 3-6-3 Summary */}
          {hasQueries && (
            <div className="col-span-12 md:col-span-12 lg:col-span-3 lg:flex">
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
          )}

          {hasQueries && (
            <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
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
                    todayQueries: leadStats.today,
                  }}
                />
              </div>
            </div>
          )}

          {hasFollowups && (
            <div className="col-span-12 md:col-span-12 lg:col-span-3 lg:flex">
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
          )}

          {/* Row 2: 3-6-3 for Managers */}
          {isManager ? (
            <>
              {/* Upcoming Tours (3) */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                <div className="w-full">
                  <UpcomingTours data={upcomingTours} />
                </div>
              </div>
              {/* Team Leader Stats (6) */}
              <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
                <div className="w-full">
                  <TeamLeaderStatsTable data={stats?.team_leader_stats || []} loading={loading} />
                </div>
              </div>
              {/* Payment Collection (3) */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                <div className="w-full">
                  <PaymentCollectionTable />
                </div>
              </div>
            </>
          ) : (
            // Standard layout for other roles
            <>
              {hasItineraries && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <UpcomingTours data={upcomingTours} />
                  </div>
                </div>
              )}
              {hasReports && (
                <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
                  <div className="w-full">
                    <RevenueChart revenueData={revenueData} />
                  </div>
                </div>
              )}
              {hasPayments && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <PaymentCollectionTable />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Row 3: 3-6-3 for Managers (Destinations - Lead Source - Latest Query) */}
          {isManager ? (
            <>
              {/* Top Destinations (3) */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                <div className="w-full">
                  <TopDestinationAndPerformance />
                </div>
              </div>
              {/* Top Lead Source (6) */}
              <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
                <div className="w-full">
                  <TopLeadSource leadData={stats?.top_lead_sources || []} />
                </div>
              </div>
              {/* Latest Queries (3) */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                <div className="w-full">
                  <LatestQuery latestNotes={latestNotes} />
                </div>
              </div>
            </>
          ) : (
            // Standard Row 3
            <>
              {hasReports && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <RevenueGrowthCard
                      title="Revenue Growth"
                      data={revenueGrowthPercentages}
                      buttonText="View Full Report's"
                      onButtonClick={() => navigate("/reports")}
                    />
                  </div>
                </div>
              )}
              {hasReports && (
                <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
                  <div className="w-full">
                    <YearQueriesChart
                      title="This Year Queries / Confirmed"
                      data={stats?.this_year_queries_confirmed || []}
                    />
                  </div>
                </div>
              )}
              {hasSales && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <SalesRepsTable title={"Sales"} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Row 4: Only for non-managers now as Lead Source moved up for Managers */}
          {!isManager && (
            <>
              {hasQueries && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <LatestQuery latestNotes={latestNotes} />
                  </div>
                </div>
              )}
              {hasReports && (
                <div className="col-span-12 md:col-span-12 lg:col-span-6 lg:flex">
                  <div className="w-full">
                    <TopLeadSource leadData={stats?.top_lead_sources || []} />
                  </div>
                </div>
              )}
              {hasReports && (
                <div className="col-span-12 md:col-span-6 lg:col-span-3 lg:flex">
                  <div className="w-full">
                    <TopDestinationAndPerformance />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

