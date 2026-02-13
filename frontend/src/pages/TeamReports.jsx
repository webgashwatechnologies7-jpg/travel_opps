import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { companySettingsAPI } from '../services/api';
import { Download, Share2, Users, PhoneCall, CheckCircle, ClipboardList } from 'lucide-react';

const TeamReports = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedRange, setSelectedRange] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const response = await companySettingsAPI.getBranches();
      if (response?.data?.success) {
        setBranches(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }
      const response = await companySettingsAPI.getTeamReport(params);
      if (response?.data?.success) {
        setReport(response.data.data);
      } else {
        setError('Failed to load team report');
      }
    } catch (err) {
      console.error('Failed to fetch team report:', err);
      setError('Failed to load team report');
    } finally {
      setLoading(false);
    }
  };

  const activeRange = report?.ranges?.[selectedRange] || {};
  const branchLabel = report?.branch?.name || 'All Teams';

  const summaryText = useMemo(() => {
    return `${branchLabel} (${selectedRange}) - Assigned: ${activeRange.assigned_to_team || 0}, Contacted: ${activeRange.contacted_leads || 0}, Calls: ${activeRange.calls_count || 0}, Confirmed: ${activeRange.confirmed_by_team || 0}`;
  }, [branchLabel, selectedRange, activeRange]);

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download the report.');
      return;
    }

    const rows = (activeRange.per_user || [])
      .map((item) => `
        <tr>
          <td>${item.name || 'N/A'}</td>
          <td>${item.email || 'N/A'}</td>
          <td>${item.assigned_to_user || 0}</td>
          <td>${item.contacted_leads || 0}</td>
          <td>${item.confirmed_by_user || 0}</td>
        </tr>
      `)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Team Report - ${branchLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
            .summary { display: flex; gap: 12px; margin-bottom: 16px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; flex: 1; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Team Report - ${branchLabel}</h1>
          <div class="meta">Range: ${selectedRange} | Generated: ${new Date().toLocaleString()}</div>
          <div class="summary">
            <div class="card">Assigned Leads<br><strong>${activeRange.assigned_to_team || 0}</strong></div>
            <div class="card">Contacted Leads<br><strong>${activeRange.contacted_leads || 0}</strong></div>
            <div class="card">Calls Made<br><strong>${activeRange.calls_count || 0}</strong></div>
            <div class="card">Bookings Confirmed<br><strong>${activeRange.confirmed_by_team || 0}</strong></div>
          </div>
          <h2 style="font-size: 16px; margin: 12px 0;">Team Members</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned</th>
                <th>Contacted</th>
                <th>Confirmed</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">No data</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Team Report - ${branchLabel}`,
      text: summaryText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success('Report summary copied to clipboard.');
    } catch (err) {
      console.error('Clipboard failed:', err);
      toast.error('Unable to share report.');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white shadow-sm rounded-lg px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Reports</h1>
            <p className="text-sm text-gray-600">Weekly, monthly, yearly performance by team</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Teams</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedRange === range
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow-sm rounded-lg p-5">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Assigned Leads</p>
                    <p className="text-xl font-semibold text-gray-900">{activeRange.assigned_to_team || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg p-5">
                <div className="flex items-center">
                  <ClipboardList className="h-6 w-6 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Contacted Leads</p>
                    <p className="text-xl font-semibold text-gray-900">{activeRange.contacted_leads || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg p-5">
                <div className="flex items-center">
                  <PhoneCall className="h-6 w-6 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Calls Made</p>
                    <p className="text-xl font-semibold text-gray-900">{activeRange.calls_count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg p-5">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Bookings Confirmed</p>
                    <p className="text-xl font-semibold text-gray-900">{activeRange.confirmed_by_team || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Name</th>
                      <th className="px-6 py-3 text-left font-medium">Email</th>
                      <th className="px-6 py-3 text-left font-medium">Assigned</th>
                      <th className="px-6 py-3 text-left font-medium">Contacted</th>
                      <th className="px-6 py-3 text-left font-medium">Confirmed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {activeRange.per_user?.length ? (
                      activeRange.per_user.map((member) => (
                        <tr key={member.user_id}>
                          <td className="px-6 py-3">{member.name}</td>
                          <td className="px-6 py-3">{member.email || 'N/A'}</td>
                          <td className="px-6 py-3">{member.assigned_to_user || 0}</td>
                          <td className="px-6 py-3">{member.contacted_leads || 0}</td>
                          <td className="px-6 py-3">{member.confirmed_by_user || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-6 text-center text-gray-500" colSpan="5">
                          No team data for this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TeamReports;
