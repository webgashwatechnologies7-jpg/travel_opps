import React from "react";
import { Link } from "react-router-dom";

const cardConfigs = [
  {
    name: "Total Queries",
    dataKey: "totalQueries",
    color: "#1E4ED8",
    bg: "#E9EDFB",
    link: "/queries",
  },
  {
    name: "Pending Queries",
    dataKey: "pendingQueries",
    color: "#D97706",
    bg: "#FDF1E6",
    link: "/queries/pending",
  },
  {
    name: "Resolved Queries",
    dataKey: "resolvedQueries",
    color: "#DC2626",
    bg: "#FCE8E8",
    link: "/queries/resolved",
  },
  {
    name: "Closed Queries",
    dataKey: "closedQueries",
    color: "#7C3AED",
    bg: "#F3EAFE",
    link: "/queries/closed",
  },
  {
    name: "Today Queries",
    dataKey: "todayQueries",
    color: "#1E40AF",
    bg: "#E6ECF9",
    link: "/queries/today",
  },
  {
    name: "Weekly Queries",
    dataKey: "weeklyQueries",
    color: "#6D28D9",
    bg: "#F1EAFE",
    link: "/queries/weekly",
  },
  {
    name: "Monthly Queries",
    dataKey: "monthlyQueries",
    color: "#D97706",
    bg: "#FDF1E6",
    link: "/queries/monthly",
  },
  {
    name: "Yearly Queries",
    dataKey: "yearlyQueries",
    color: "#1E4ED8",
    bg: "#E9EDFB",
    link: "/queries/yearly",
  },
];

const DashboardStatsCards = ({ stats = {} }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cardConfigs.map((card, index) => (
        <div
          key={index}
          className="rounded-lg bg-white p-2 flex flex-col justify-between min-h-[120px]"

        >
          <div style={{ backgroundColor: card.bg }} className="h-full w-full flex p-3 flex-col justify-evenly">
            {/* Top */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: card.color }}
              >
                <img
                  src="/icons/bucket.svg"
                  alt="bucket"
                  className="w-4 h-4"
                />
              </div>

              <div>
                <p className="text-sm text-gray-800 font-medium">
                  {card.name}
                </p>
                <p
                  className="text-xl font-semibold"
                  style={{ color: card.color }}
                >
                  {stats[card.dataKey] ?? 0}
                </p>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between mt-3">
              <Link
                to={card.link}
                className="text-xs"
                style={{ color: card.color }}
              >
                View All Queries
              </Link>

              <img
                src="/icons/menu.svg"
                alt="menu"
                className="w-4 h-4 opacity-60"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsCards;
