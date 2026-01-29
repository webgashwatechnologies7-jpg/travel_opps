import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  usersAPI,
  leadsAPI,
  companySettingsAPI,
  dashboardAPI,
} from '../services/api';
import {
  UserPlus,
  Users,
  BarChart3,
  Building2,
  ClipboardList,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leadsByUser, setLeadsByUser] = useState({});
  const [branches, setBranches] = useState([]);
  const [teamReport, setTeamReport] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [performanceMonth, setPerformanceMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [error, setError] = useState('');
  const [activeSource, setActiveSource] = useState('company'); // 'company' | 'admin'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSource === 'admin' && employees.length) {
      loadPerformance();
    } else if (teamReport === null) {
      loadTeamReport();
    }
  }, [activeSource, performanceMonth]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      let userList = [];
      let branchList = [];

      try {
        const [usersRes, branchesRes] = await Promise.all([
          companySettingsAPI.getUsers(),
          companySettingsAPI.getBranches(),
        ]);
        if (usersRes?.data?.success && Array.isArray(usersRes.data.data)) {
          userList = usersRes.data.data;
          setActiveSource('company');
        }
        if (branchesRes?.data?.success && Array.isArray(branchesRes.data.data)) {
          branchList = branchesRes.data.data;
        }
      } catch (_) {
        // Fallback to admin users API
      }

      if (!userList.length) {
        try {
          const res = await usersAPI.list();
          const list = res?.data?.data?.users || res?.data?.users || [];
          userList = Array.isArray(list) ? list : [];
          setActiveSource('admin');
        } catch (e) {
          console.error('Failed to load users:', e);
        }
      }

      setEmployees(userList);
      setBranches(branchList);

      // Load leads and count by assigned user
      try {
        const leadsRes = await leadsAPI.list({ per_page: 5000 });
        let leads = [];
        if (leadsRes?.data?.data?.leads) leads = leadsRes.data.data.leads;
        else if (leadsRes?.data?.data && Array.isArray(leadsRes.data.data)) leads = leadsRes.data.data;
        else if (leadsRes?.data?.leads) leads = leadsRes.data.leads;
        else if (Array.isArray(leadsRes?.data)) leads = leadsRes.data;
        const byUser = {};
        (leads || []).forEach((lead) => {
          const uid =
            lead.assigned_to?.id ??
            lead.assigned_to_id ??
            lead.assigned_to;
          if (uid != null && uid !== '') {
            byUser[uid] = (byUser[uid] || 0) + 1;
          }
        });
        setLeadsByUser(byUser);
      } catch (e) {
        console.error('Failed to load leads for count:', e);
      }

      if (userList.length && activeSource === 'company') {
        loadTeamReport();
      }
    } catch (err) {
      setError('Data load karne mein problem aayi. Baad mein dobara try karein.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamReport = async () => {
    try {
      const res = await companySettingsAPI.getTeamReport({});
      if (res?.data?.success && res.data.data) {
        setTeamReport(res.data.data);
      }
    } catch (e) {
      console.error('Team report load failed:', e);
    }
  };

  const loadPerformance = async () => {
    try {
      const res = await dashboardAPI.employeePerformance(performanceMonth);
      setPerformance(res?.data?.data?.employees || []);
    } catch (e) {
      console.error('Performance load failed:', e);
      setPerformance([]);
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId || !branches.length) return '—';
    const b = branches.find((x) => x.id === branchId || x.id === Number(branchId));
    return b?.name || '—';
  };

  const getRoleName = (user) => {
    if (user.role) return user.role;
    if (user.roles?.length) return user.roles.map((r) => r.name).join(', ');
    return user.roles_name || '—';
  };

  const getLeadsCount = (user) => {
    const id = user.id;
    return leadsByUser[id] ?? 0;
  };

  const empWithLeads = employees.map((e) => ({
    ...e,
    leadsCount: getLeadsCount(e),
    branchName: getBranchName(e.branch_id),
    roleName: getRoleName(e),
  }));

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.is_active !== false).length;
  const totalBranches = branches.length;
  const employeesWithLeads = Object.keys(leadsByUser).length;

  const quickLinks = [
    {
      title: 'Add New User',
      description: 'Naya employee / user add karein',
      icon: UserPlus,
      path: '/users/add',
      color: 'bg-blue-500',
    },
    {
      title: 'All Users',
      description: 'Saare users list, edit, activate/deactivate',
      icon: Users,
      path: '/staff-management/users',
      color: 'bg-indigo-500',
    },
    {
      title: 'Team Management',
      description: 'Teams, branches aur users manage karein',
      icon: Building2,
      path: '/staff-management/teams',
      color: 'bg-violet-500',
    },
    {
      title: 'Employee Performance',
      description: 'Month-wise leads, target, achieved',
      icon: BarChart3,
      path: '/performance',
      color: 'bg-emerald-500',
    },
    {
      title: 'Team Reports',
      description: 'Team-wise assigned, contacted, confirmed',
      icon: ClipboardList,
      path: '/company-settings/team-reports',
      color: 'bg-amber-500',
    },
    {
      title: 'Reports Overview',
      description: 'Analytics, ROI, destination reports',
      icon: LayoutDashboard,
      path: '/reports',
      color: 'bg-slate-600',
    },
  ];

  const activeRange = teamReport?.ranges?.month || {};
  const perUser = activeRange.per_user || [];

  return (
    <Layout>
      <div className="p-6 md:p-8 lg:p-10" style={{ backgroundColor: '#f0f4ff', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Employees, teams, leads assign, roles aur reports — sab yahin se dekhein
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Staff dashboard load ho raha hai...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Top stats row – similar to main dashboard cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Staff
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{totalEmployees}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Active Staff
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-600">{activeEmployees}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Branches / Teams
                    </p>
                    <p className="mt-1 text-2xl font-bold text-indigo-600">{totalBranches}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Staff with Leads
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">
                      {employeesWithLeads}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Quick actions / Shortcuts */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 text-left transition-all"
                      >
                        <div className={`p-2 rounded-lg ${item.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                          <span className="inline-flex items-center text-xs text-blue-600 font-medium mt-2">
                            Open <ArrowRight className="w-3 h-3 ml-1" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* New user add – prominent */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">New User kaise add karein?</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Sidebar se <strong>Staff Management → All Users</strong> pe jayein, phir <strong>+ Add User</strong> button dabayein.
                  Ya upar <strong>Add New User</strong> card pe click karke seedha add page pe jaa sakte hain.
                </p>
                <button
                  onClick={() => navigate('/users/add')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" /> Add New User
                </button>
              </div>

              {/* Employees overview */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Employees — kon kitna kaam kar raha, role, team
                  </h2>
                  <button
                    onClick={() => navigate('/staff-management/users')}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    View all users →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Team / Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Leads Assigned</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {empWithLeads.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            Koi user nahi mila. Pehle Add User se user add karein.
                          </td>
                        </tr>
                      ) : (
                        empWithLeads.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{emp.name || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{emp.email || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{emp.roleName}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{emp.branchName}</td>
                            <td className="px-6 py-3">
                              <span className="font-semibold text-gray-900">{emp.leadsCount}</span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => navigate('/staff-management/users')}
                                className="text-blue-600 text-sm font-medium hover:underline"
                              >
                                Manage
                              </button>
                              <span className="mx-1">|</span>
                              <button
                                onClick={() => navigate('/performance')}
                                className="text-blue-600 text-sm font-medium hover:underline"
                              >
                                Performance
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Team summary (if company-settings data available) */}
              {teamReport && (branches.length > 0 || (activeRange && Object.keys(activeRange).length > 0)) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Team summary (month)</h2>
                    <button
                      onClick={() => navigate('/company-settings/team-reports')}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      Full Team Reports →
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Assigned to team</p>
                        <p className="text-xl font-semibold text-gray-900">{activeRange.assigned_to_team ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Contacted</p>
                        <p className="text-xl font-semibold text-gray-900">{activeRange.contacted_leads ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Calls</p>
                        <p className="text-xl font-semibold text-gray-900">{activeRange.calls_count ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Confirmed</p>
                        <p className="text-xl font-semibold text-gray-900">{activeRange.confirmed_by_team ?? 0}</p>
                      </div>
                    </div>
                    {perUser.length > 0 && (
                      <div className="mt-4 overflow-x-auto">
                        <p className="text-sm font-medium text-gray-700 mb-2">Per user (month)</p>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="pb-2">Name</th>
                              <th className="pb-2">Assigned</th>
                              <th className="pb-2">Contacted</th>
                              <th className="pb-2">Confirmed</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            {perUser.map((m) => (
                              <tr key={m.user_id}>
                                <td className="py-1">{m.name}</td>
                                <td className="py-1">{m.assigned_to_user ?? 0}</td>
                                <td className="py-1">{m.contacted_leads ?? 0}</td>
                                <td className="py-1">{m.confirmed_by_user ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance snapshot (if admin API used) */}
              {activeSource === 'admin' && performance.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Employee Performance (month)</h2>
                    <input
                      type="month"
                      value={performanceMonth}
                      onChange={(e) => setPerformanceMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Total Leads</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Confirmed</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Target</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Achieved</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Completion %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {performance.map((emp) => (
                          <tr key={emp.user_id}>
                            <td className="px-6 py-3 font-medium text-gray-900">{emp.name}</td>
                            <td className="px-6 py-3">{emp.total_leads ?? 0}</td>
                            <td className="px-6 py-3">{emp.confirmed_leads ?? 0}</td>
                            <td className="px-6 py-3">₹{(emp.target_amount ?? 0).toLocaleString('en-IN')}</td>
                            <td className="px-6 py-3">₹{(emp.achieved_amount ?? 0).toLocaleString('en-IN')}</td>
                            <td className="px-6 py-3">{emp.completion_percentage ?? 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-gray-200">
                    <button
                      onClick={() => navigate('/performance')}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Full Performance report →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManagementDashboard;
