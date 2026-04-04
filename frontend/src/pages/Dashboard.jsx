import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Activity, XCircle } from 'lucide-react';
import { dashboardAPI, followupsAPI, leadsAPI } from '../services/api';
import { useNavigate } from "react-router";
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

// Components
import PaymentCollectionTable from '../components/PaymentCollectionTable';
import SalesRepsTable from '../components/SalesRepsTable';
import TodayQueriesCard from '../components/dashboard/TodayQueriesCard';
import UpcomingTours from '../components/dashboard/UpcomingTours';
import RevenueGrowthCard from '../components/dashboard/RevenueGrowthCard';
import DashboardStatsCards from '../components/dashboard/DashboardStatsCards';
import RevenueChart from '../components/dashboard/RevenueChart';
import YearQueriesChart from '../components/dashboard/YearQueriesChart';
import TeamLeaderStatsTable from '../components/dashboard/TeamLeaderStatsTable';
import LatestQuery from '../components/dashboard/LatestQuery';
import TopLeadSource from '../components/dashboard/TopLeadSource';
import TaskFollowups from '../components/dashboard/TaskFollowups';
import TopDestinationAndPerformance from '../components/dashboard/TopDestinationAndPerformance';
import PendingDistributionCard from '../components/dashboard/PendingDistributionCard';
import TeamPresenceAnalytics from '../components/dashboard/TeamPresenceAnalytics';
import LogoLoader from '../components/LogoLoader';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { menuItems } = useSettings();

  // State
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [latestNotes, setLatestNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [todayQueries, setTodayQueries] = useState([]);
  const [leadStats, setLeadStats] = useState({
    total: 0, new: 0, pending: 0, closed: 0, weekly: 0, monthly: 0, yearly: 0, hot: 0, unassigned: 0, today: 0,
  });
  const [presenceStats, setPresenceStats] = useState({ formatted_time: '0h 0m', logout_count: 0, login_count: 0 });
  const [teamPresence, setTeamPresence] = useState([]);
  const [teamAggregates, setTeamAggregates] = useState(null);
  const [presencePeriod, setPresencePeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Memoized Roles & Permissions
  const roleInfo = useMemo(() => {
    const roles = user?.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
    const isAdmin = user?.is_super_admin || roles.some(r => ['Admin', 'Company Admin', 'Super Admin'].includes(r));
    const isManager = roles.includes('Manager');
    return { isAdmin, isManager, isHighLevel: isAdmin || isManager };
  }, [user]);

  const isVisible = useCallback((label) => {
    if (roleInfo.isAdmin) return true;
    return menuItems.some(item => item.label === label || (item.submenu && item.submenu.some(sub => sub.label === label)));
  }, [menuItems, roleInfo.isAdmin]);

  const featureFlags = useMemo(() => {
    const roles = user?.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
    const isStaff = roles.some(r => ['Employee', 'Sales Rep'].includes(r));
    const hasAnalytics = user?.plan_features?.analytics?.enabled;
    return {
      hasQueries: true,
      hasFollowups: true,
      hasItineraries: isVisible('Itineraries') || roleInfo.isManager || isStaff,
      hasPayments: isVisible('Payments') || roleInfo.isManager || isStaff,
      hasReports: (isVisible('Reports') || roleInfo.isManager) && hasAnalytics,
      hasSales: (isVisible('Sales Reps') || roleInfo.isManager) && hasAnalytics,
      hasAnalytics
    };
  }, [roleInfo, isVisible, user]);

  // Data Fetching
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, revRes, toursRes, notesRes, flRes, prRes, teamRes] = await Promise.all([
        dashboardAPI.stats(),
        featureFlags.hasAnalytics ? dashboardAPI.getRevenueGrowthMonthly() : Promise.resolve({ data: { data: [] } }),
        dashboardAPI.upcomingTours(),
        dashboardAPI.latestLeadNotes(),
        followupsAPI.today(),
        dashboardAPI.getPresenceStats(),
        roleInfo.isHighLevel ? dashboardAPI.getCompanyPresenceStats(presencePeriod) : Promise.resolve({ data: { data: { users: [] } } })
      ]);

      setStats(statsRes.data.data);
      setPresenceStats(prRes.data.data || { formatted_time: '0h 0m', logout_count: 0, login_count: 0 });
      setTeamPresence(teamRes?.data?.data?.users || []);
      setTeamAggregates(teamRes?.data?.data?.aggregates || null);
      setRevenueData(revRes?.data?.data || []);
      setUpcomingTours(toursRes.data.data || []);
      setLatestNotes(notesRes.data.data || []);

      // Format Followups
      const rawFl = flRes.data.data?.followups || [];
      const taskFl = rawFl.filter(i => Boolean(i.reminder_time));
      const colors = ["bg-blue-500", "bg-red-500", "bg-orange-400"];
      setFollowups(taskFl.map((i, idx) => ({
        id: i.id, leadId: i.lead_id || i.lead?.id,
        date: `${i.reminder_date ? new Date(i.reminder_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Today"} - ${i.reminder_time}`,
        title: i.remark || "Followup", color: colors[idx % colors.length]
      })));

      // Scoped Lead Stats
      if (user?.id) {
        const params = roleInfo.isAdmin ? { per_page: 1000 } : { assigned_to: user.id, per_page: 1000 };
        const leadsRes = await leadsAPI.list(params);
        const leads = leadsRes.data.data?.leads || [];
        const now = new Date();

        const toDate = (v) => v ? new Date(typeof v === 'string' && !v.includes('Z') ? v.replace(' ', 'T') + 'Z' : v) : null;
        const isToday = (v) => {
          const d = toDate(v);
          return d && d.toDateString() === now.toDateString();
        };

        const todayL = leads.filter(l => isToday(l.created_at));
        setTodayQueries(todayL.map(l => ({
          id: l.id, title: l.destination ? `${l.destination} Tour` : "New Query",
          name: l.client_name || "Client", date: new Date(l.created_at).toLocaleDateString("en-GB"),
        })));

        setLeadStats({
          total: leads.length,
          new: leads.filter(l => l.status === 'new').length,
          pending: leads.filter(l => l.status === 'proposal').length,
          closed: leads.filter(l => l.status === 'cancelled').length,
          hot: leads.filter(l => l.priority === 'hot').length,
          unassigned: leads.filter(l => !l.assigned_to && !l.assigned_to_id).length,
          today: todayL.length,
        });
      }
    } catch (err) {
      console.error('Dashboard Error:', err);
      if (err.response?.status === 401) {
        sessionStorage.clear();
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.message || err.message || 'System error');
    } finally {
      setLoading(false);
    }
  }, [user, roleInfo, featureFlags.hasAnalytics, presencePeriod]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);



  // Revenue Percentages Memo
  const revenueGrowthPercentages = useMemo(() => {
    const total = stats?.total_queries || 0;
    const toPct = (c) => total ? `${((c / total) * 100).toFixed(1)}%` : '0%';
    return [
      { label: 'Proposal Sent', value: toPct(stats?.proposal_sent || 0) },
      { label: 'Hot Lead', value: toPct(stats?.hot_leads || 0) },
      { label: 'Cancel', value: toPct(stats?.cancelled || 0) },
      { label: 'Proposal Conv.', value: toPct(stats?.proposal_confirmed || 0) },
    ];
  }, [stats]);

  if (loading && !stats) return <div className="flex items-center justify-center h-[80vh]"><LogoLoader text="Initializing CRM..." /></div>;

  return (
    <div className="w-full relative px-6 py-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="font-bold uppercase text-[12px] tracking-widest">{error}</span>
          </div>
        </div>
      )}

      {!error && (
        <div className="max-w-[1600px] mx-auto">
          {roleInfo.isHighLevel && leadStats.unassigned > 0 && !loading && (
            <div className="mb-6">
              <PendingDistributionCard
                count={leadStats.unassigned}
                loading={loading}
                onViewUnassigned={() => navigate("/leads?status=unassigned")}
              />
            </div>
          )}

          {/* Quick Stats Header - Strictly matched to Reference 24 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-2">
            {[
              { label: "Active Today", val: presenceStats.formatted_time, icon: Clock, color: "#3B82F6", bgColor: "bg-blue-50" },
              { label: "Work Sessions", val: presenceStats.login_count, icon: Activity, color: "#F59E0B", bgColor: "bg-amber-50" },
              { label: "Total Logouts", val: presenceStats.logout_count, icon: XCircle, color: "#EF4444", bgColor: "bg-red-50" },
              { label: "Presence", val: "1 LIVE", icon: Activity, color: "#10B981", bgColor: "bg-emerald-50", live: true }
            ].map((item, idx) => (
              <div key={idx} className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all h-[100px] ${item.live ? "border-l-[3px] border-l-emerald-500" : ""}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${item.bgColor}`}>
                  <item.icon size={20} style={{ color: item.color }} strokeWidth={2.5} className={item.live ? "animate-pulse" : ""} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-none mb-1.5 truncate">
                    {item.label}
                  </p>
                  <h3 className={`text-[20px] font-bold ${item.live ? "text-emerald-500" : "text-slate-800"} uppercase tabular-nums leading-none tracking-tight`}>
                    {item.val}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch mb-4">
            {/* ROW 1: Strictly matched to Ditoo Reference 24 */}
            <div className="col-span-12 lg:col-span-3 h-[320px]">
              <TodayQueriesCard queries={todayQueries} loading={loading} onViewAll={() => navigate("/leads?today=1")} onQueryClick={(q) => q?.id && navigate(`/leads/${q.id}`)} />
            </div>
            <div className="col-span-12 lg:col-span-6 h-[320px]">
              <DashboardStatsCards stats={{ ...leadStats, totalQueries: leadStats.total, newQueries: leadStats.new, pendingQueries: leadStats.pending, closedQueries: leadStats.closed, hotQueries: leadStats.hot, todayQueries: leadStats.today }} />
            </div>
            <div className="col-span-12 lg:col-span-3 h-[320px]">
              <TaskFollowups followups={followups} onViewMore={() => navigate("/followups")} onFollowupClick={(i) => i?.leadId && navigate(`/leads/${i.leadId}?tab=followups`)} />
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch mb-4">
              <div className="col-span-12 md:col-span-6 lg:col-span-3 h-[340px]">
                <UpcomingTours data={upcomingTours} />
              </div>
              <div className="col-span-12 lg:col-span-6 h-[340px]">
                <RevenueChart revenueData={revenueData} />
              </div>
              <div className="col-span-12 md:col-span-6 lg:col-span-3 h-[340px]">
                <PaymentCollectionTable />
              </div>
            </div>

            {/* ROW 3+: Operational Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch mb-4">
              <div className="col-span-12 my-2">
                <TeamPresenceAnalytics data={teamPresence.filter(u => u.id !== user.id)} loading={loading} period={presencePeriod} onPeriodChange={setPresencePeriod} />
              </div>

              {/* ROW 4 */}
              <div className="col-span-12 lg:col-span-3 h-[340px]">
                <RevenueGrowthCard title="Revenue Growth" data={revenueGrowthPercentages} onButtonClick={() => navigate("/reports")} />
              </div>
              <div className="col-span-12 lg:col-span-6 h-[340px]">
                <YearQueriesChart data={stats?.this_year_queries_confirmed || []} />
              </div>
              <div className="col-span-12 lg:col-span-3 h-[340px]">
                <SalesRepsTable title="Performance Reps" />
              </div>

              {/* ROW 5 (FINAL) */}
              <div className="col-span-12 lg:col-span-3 h-[340px]">
                <LatestQuery latestNotes={latestNotes} onViewMore={() => navigate("/leads")} />
              </div>
              <div className="col-span-12 lg:col-span-6 h-[340px]">
                <TopLeadSource leadData={stats?.top_lead_sources || []} />
              </div>
              <div className="col-span-12 lg:col-span-3 h-[340px]">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full">
                  <TopDestinationAndPerformance />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Dashboard;
