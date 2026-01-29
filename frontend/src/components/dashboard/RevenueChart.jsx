import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

<<<<<<< HEAD


export default function RevenueChart({revenueData}) {
  return (
    <div className="bg-white rounded-lg shadow p-3 mt-3 h-fit">
=======
export default function RevenueChart({ revenueData }) {
  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Revenue Growth
      </h2>

<<<<<<< HEAD
      <ResponsiveContainer width="100%" height={250}>
=======
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="40%" stopColor="#9DC7F1" stopOpacity={12} />
              <stop offset="100%" stopColor="#9DC7F1" stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `${v}K`} />
          <Tooltip formatter={(v) => `${v}K`} />

          <Area
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#colorRevenue)"
            dot={{
              r: 4,
              fill: "#fff",
              stroke: "#3B82F6",
              strokeWidth: 2,
            }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
<<<<<<< HEAD
      </ResponsiveContainer>
=======
        </ResponsiveContainer>
      </div>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
    </div>
  );
}
