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
    color: "#2D3192", // Logo Blue
    bg: "#EEF0F9",
    link: "/leads",
    icon: FileText,
  },
  {
    name: "New Query",
    dataKey: "newQueries",
    color: "#0891B2", // Cyan-600
    bg: "#ECFEFF",
    link: "/leads?status=new",
    icon: Sparkles,
  },
  {
    name: "Pending Queries",
    dataKey: "pendingQueries",
    color: "#D97706", // Amber-600
    bg: "#FFFBEB",
    link: "/leads?status=proposal",
    icon: Clock,
  },
  {
    name: "Closed Queries",
    dataKey: "closedQueries",
    color: "#475569", // Slate-600
    bg: "#F8FAFC",
    link: "/leads?status=cancelled",
    icon: XCircle,
  },
  {
    name: "Today Queries",
    dataKey: "todayQueries",
    color: "#2563EB", // Blue-600
    bg: "#EFF6FF",
    link: "/leads?today=1",
    icon: Clock,
  },
  {
    name: "Weekly Queries",
    dataKey: "weeklyQueries",
    color: "#7C3AED", // Violet-600
    bg: "#F5F3FF",
    link: "/leads?range=week",
    icon: CalendarRange,
  },
  {
    name: "Monthly Queries",
    dataKey: "monthlyQueries",
    color: "#1E3A8A", // Deep Blue
    bg: "#EFF6FF",
    link: "/leads?range=month",
    icon: CalendarDays,
  },
  {
    name: "Hot Queries",
    dataKey: "hotQueries",
    color: "#C42771", // Brand Magenta
    bg: "#FDF2F8",
    link: "/leads?priority=hot",
    icon: Flame,
  },
];

const DashboardStatsCards = ({ stats = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {cardConfigs.map((card, index) => {
        const Icon = card.icon;
        return (
          <Link
            key={index}
            to={card.link}
            className="rounded-lg bg-white p-1.5 flex flex-col justify-between min-h-[115px] hover:shadow-md transition-shadow group"
          >
            <div style={{ backgroundColor: card.bg }} className="h-full w-full flex p-3 flex-col justify-between rounded-md">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: card.color }}
                >
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-gray-600 font-bold uppercase tracking-tight truncate leading-tight">
                    {card.name}
                  </p>
                  <p className="text-xl font-black leading-tight mt-0.5" style={{ color: card.color }}>
                    {stats[card.dataKey] ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>
                  View All
                </span>
                <img src="/icons/menu.svg" alt="menu" className="w-3.5 h-3.5 opacity-50 grayscale" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
