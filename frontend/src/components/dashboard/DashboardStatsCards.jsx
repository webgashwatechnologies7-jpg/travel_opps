import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  Clock,
  XCircle,
  CalendarRange,
  CalendarDays,
  Flame,
} from "lucide-react";

const cardConfigs = [
  {
    name: "Total Queries",
    dataKey: "totalQueries",
    color: "#1E4ED8",
    bg: "#E9EDFB",
    link: "/leads",
    icon: FileText,
  },
  {
    name: "New Query",
    dataKey: "newQueries",
    color: "#F97316",
    bg: "#FFF3E6",
    link: "/leads?status=new",
    icon: Sparkles,
  },
  {
    name: "Pending Queries",
    dataKey: "pendingQueries",
    color: "#D97706",
    bg: "#FDF1E6",
    link: "/leads?status=proposal",
    icon: Clock,
  },
  {
    name: "Closed Queries",
    dataKey: "closedQueries",
    color: "#7C3AED",
    bg: "#F3EAFE",
    link: "/leads?status=cancelled",
    icon: XCircle,
  },
  {
    name: "Today Queries",
    dataKey: "todayQueries",
    color: "#1E40AF",
    bg: "#E6ECF9",
    link: "/leads?today=1",
    icon: Clock,
  },
  {
    name: "Weekly Queries",
    dataKey: "weeklyQueries",
    color: "#6D28D9",
    bg: "#F1EAFE",
    link: "/leads?range=week",
    icon: CalendarRange,
  },
  {
    name: "Monthly Queries",
    dataKey: "monthlyQueries",
    color: "#D97706",
    bg: "#FDF1E6",
    link: "/leads?range=month",
    icon: CalendarDays,
  },
  {
    name: "Hot Queries",
    dataKey: "hotQueries",
    color: "#EF4444",
    bg: "#FEECEB",
    link: "/leads?priority=hot",
    icon: Flame,
  },
];

const DashboardStatsCards = ({ stats = {} }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cardConfigs.map((card, index) => {
        const Icon = card.icon;
        return (
          <Link
            key={index}
            to={card.link}
            className="rounded-lg bg-white p-2 flex flex-col justify-between min-h-[120px] hover:shadow-md transition-shadow"
          >
            <div style={{ backgroundColor: card.bg }} className="h-full w-full flex p-3 flex-col justify-evenly">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: card.color }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-medium">{card.name}</p>
                  <p className="text-xl font-semibold" style={{ color: card.color }}>
                    {stats[card.dataKey] ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: card.color }}>
                  View All Queries
                </span>
                <img src="/icons/menu.svg" alt="menu" className="w-4 h-4 opacity-60" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
