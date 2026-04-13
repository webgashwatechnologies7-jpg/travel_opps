import React from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  Target, 
  Calendar, 
  Users,
  ChevronRight
} from "lucide-react";

/**
 * High-Density Executive Stat Cards
 * Strictly matched to Reference 24 (Ditoo/Paradise)
 */
const cardConfigs = [
  { name: "TOTAL QUERIES", dataKey: "totalQueries", color: "#3B82F6", bgColor: "bg-blue-50/60", borderColor: "border-blue-100", icon: FileText, link: "/leads" },
  { name: "NEW QUERY", dataKey: "newQueries", color: "#10B981", bgColor: "bg-emerald-50/60", borderColor: "border-emerald-100", icon: Plus, link: "/leads?status=new" },
  { name: "PENDING QUERI...", dataKey: "pendingQueries", color: "#F59E0B", bgColor: "bg-amber-50/60", borderColor: "border-amber-100", icon: Clock, link: "/leads?status=proposal" },
  { name: "CONFIRMED", dataKey: "confirmedQueries", color: "#10B981", bgColor: "bg-emerald-50/60", borderColor: "border-emerald-100", icon: CheckCircle2, link: "/leads?status=confirmed" },
  { name: "TODAY QUERIES", dataKey: "todayQueries", color: "#007BFF", bgColor: "bg-blue-50/60", borderColor: "border-blue-100", icon: Calendar, link: "/leads?today=1" },
  { name: "WEEKLY QUERIES", dataKey: "weeklyQueries", color: "#8B5CF6", bgColor: "bg-purple-50/60", borderColor: "border-purple-100", icon: Users, link: "/leads?period=weekly" },
  { name: "MONTHLY QUE...", dataKey: "monthlyQueries", color: "#06B6D4", bgColor: "bg-cyan-50/60", borderColor: "border-cyan-100", icon: Target, link: "/leads?period=monthly" },
  { name: "HOT QUERIES", dataKey: "hotQueries", color: "#EF4444", bgColor: "bg-red-50/60", borderColor: "border-red-100", icon: TrendingUp, link: "/leads?priority=hot" },
];

const DashboardStatsCards = ({ stats = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full h-[320px]">
      {cardConfigs.map((card, index) => {
        const Icon = card.icon;
        return (
          <Link
            key={index}
            to={card.link}
            className={`rounded-2xl ${card.bgColor} flex flex-col border ${card.borderColor} hover:shadow-md transition-all group overflow-hidden bg-white/40 shadow-sm`}
          >
            {/* Optimized Content Row - No Wasted Space */}
            <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: card.color, color: "#FFFFFF" }}
              >
                <Icon size={18} strokeWidth={2.5} />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-tight leading-none mb-1 truncate group-hover:text-gray-900 transition-colors">
                  {card.name}
                </p>
                <h3 className="text-[22px] font-semibold text-gray-800 leading-none tabular-nums tracking-tighter">
                  {stats[card.dataKey] ?? 0}
                </h3>
              </div>
            </div>

            {/* Slimmer High-Gloss Footer */}
            <div className="bg-white/60 border-t border-white/80 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.1em] opacity-80 group-hover:opacity-100">
                VIEW ALL
              </span>
              <div className="flex items-center gap-1 opacity-20">
                 <ChevronRight size={10} strokeWidth={3} className="text-blue-600" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
