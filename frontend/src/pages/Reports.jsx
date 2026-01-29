import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const Reports = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Source & Destination Analytics",
      description: "Check ROI by lead source and performance of destinations month-wise.",
      onClick: () => navigate("/analytics"),
      badge: "Analytics",
    },
    {
      title: "Employee Performance",
      description: "See monthly performance, targets and achievement of your team.",
      onClick: () => navigate("/performance"),
      badge: "Team",
    },
    {
      title: "Team Reports",
      description: "Detailed team-wise reports from company settings.",
      onClick: () => navigate("/company-settings/team-reports"),
      badge: "Management",
    },
    {
      title: "Client Reports",
      description: "Open any client and use the Reports option for client-wise reports.",
      onClick: () => navigate("/accounts/clients"),
      badge: "Clients",
    },
    {
      title: "Queries & Sales Summary",
      description: "Use filters on Queries page to see status-wise and date-wise reports.",
      onClick: () => navigate("/queries"),
      badge: "Sales",
    },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-8 lg:p-10" style={{ backgroundColor: "#D8DEF5", minHeight: "100vh" }}>
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Reports Overview
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Quickly jump to detailed performance, analytics and summary reports of your CRM.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <button
              key={index}
              type="button"
              onClick={card.onClick}
              className="group text-left bg-white rounded-2xl shadow-sm border border-[#D5DEF5] p-5 flex flex-col justify-between hover:shadow-lg hover:border-blue-400 transition transform hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                    {card.badge}
                  </span>
                </div>
                <h2 className="text-[16px] font-semibold text-gray-900 mb-2 group-hover:text-blue-700">
                  {card.title}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-blue-600">
                <span className="font-semibold">Open report</span>
                <span className="transform group-hover:translate-x-1 transition">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

