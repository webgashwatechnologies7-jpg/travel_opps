import React from "react";
import { MoreVertical, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LeadCard({
  name,
  phone,
  avatar,
  tag,
  location,
  date,
  followUpText,
  amount,
  onAssign,
  id,
}) {
  const navigate = useNavigate();
  return (
    <div className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Top Section */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
            />
          </div>

          {/* Name & Phone */}
          <div>
            <h3 className="font-semibold text-[18px] text-gray-900">
              {name}
            </h3>
            <p className="text-sm text-gray-500">{phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tag && (
            <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded">
              {tag}
            </span>
          )}
          <MoreVertical className="text-gray-400" size={18} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Meta Info */}
      <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span>{location}</span>
        </div>

        <span className="text-gray-400">|</span>

        <span>{date}</span>

        <button className="bg-red-400 text-white text-xs px-3 py-1 rounded-full">
          {followUpText}
        </button>
      </div>

      {/* Amount + Action */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-black">
          RS {amount}
        </div>

        <button
          onClick={onAssign}
          className="border rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2 hover:bg-gray-50"
        >
          Assign Now
          <span className="text-blue-500">▼</span>
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-200 px-4 py-3 flex justify-between items-center">
        <div onClick={()=>{
          navigate(`/leads/${id}`);
        }} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <div className="bg-white p-1 rounded border">
            👤
          </div>
          <span>Details</span>
          <span className="text-blue-500 font-medium">CS</span>
        </div>

        <div className="flex gap-2">
          <button className="bg-white p-2 rounded shadow text-blue-500">
            👍
          </button>
          <button className="bg-white p-2 rounded shadow text-orange-400">
            🧾
          </button>
          <button className="bg-white p-2 rounded shadow text-gray-400">
            …
          </button>
        </div>
      </div>
    </div>
  );
}
