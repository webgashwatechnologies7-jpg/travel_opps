import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { MoreVertical, Trash2, MapPin, MessageCircle, Mail, User as UserIcon, Calendar, Lock } from 'lucide-react';

function LeadCard({
  name,
  phone,
  tag,
  location,
  date,
  amount,
  onAssign,
  onStatusChange,
  onDelete,
  id,
  assignedTo,
  assignedUserName,
  status,
  email,
  isSelected,
  onSelect,
  is_locked,
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = () => {
    navigate(`/leads/${id}`);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      onDelete(id);
    }
    setShowMenu(false);
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    navigate(`/leads/${id}?tab=whatsapp`);
  };

  const handleEmailClick = (e) => {
    e.stopPropagation();
    navigate(`/leads/${id}?tab=mails`);
  };

  const statusConfig = {
    new: { color: 'bg-blue-600', glow: 'status-glow-new', label: 'New' },
    processing: { color: 'bg-indigo-600', glow: 'status-glow-processing', label: 'Under Process' },
    proposal: { color: 'bg-amber-500', glow: 'status-glow-proposal', label: 'Proposal Sent' },
    followup: { color: 'bg-orange-600', glow: 'status-glow-followup', label: 'Followup' },
    confirmed: { color: 'bg-emerald-600', glow: 'status-glow-confirmed', label: 'Booked' },
    cancelled: { color: 'bg-rose-600', glow: 'status-glow-cancelled', label: 'Declined' },
  };

  const currentStatus = statusConfig[status?.toLowerCase()] || { color: 'bg-slate-500', glow: '', label: status };

  // Robust name detection
  const currentAssigneeName = assignedUserName ||
    assignedTo?.name ||
    (typeof assignedTo === 'object' && assignedTo !== null ? assignedTo.name : null);

  const isAssigned = !!currentAssigneeName;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative w-full rounded-xl border transition-all duration-300 flex flex-col h-full animate-in-scale cursor-pointer ${isSelected
          ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-xl bg-blue-50/50'
          : 'border-slate-200/60 bg-white shadow-sm hover:shadow-xl hover:translate-y-[-4px]'
        }`}
    >
      {/* Selection Checkbox */}
      <div
        className={`absolute top-4 left-4 z-50 transition-opacity duration-300 opacity-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(id)}
          className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/20 cursor-pointer shadow-sm"
        />
      </div>

      {/* Background Subtle Accent */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${currentStatus.color}`}></div>



      <div className="rounded-xl p-5 h-full flex flex-col relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div className={`flex-1 min-w-0 pl-10 transition-all duration-300`}>
            <div className={`flex items-center gap-2 mb-1 transition-transform duration-300`}>
              <h3 className="font-bold text-lg text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
                {name}
              </h3>
              {tag && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                  {tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {phone}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
            >
              <MoreVertical className="text-slate-400 group-hover:text-slate-600" size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Query
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-600 font-semibold bg-slate-50/80 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-blue-100">
                <MapPin size={14} className="text-blue-500 shrink-0" />
              </div>
              <span className="truncate flex-1 text-slate-700 font-bold" title={location}>{location || "Destination Not Set"}</span>
              <div className={`shrink-0 h-2 w-2 rounded-full ${currentStatus.color}`}></div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                <Calendar size={13} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 tracking-tight whitespace-nowrap">{date}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (status?.toLowerCase() !== 'confirmed') {
                    onStatusChange?.(id);
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider shadow-lg border border-white/20 backdrop-blur-md ${currentStatus.color} ${currentStatus.glow} ${status?.toLowerCase() === 'confirmed' ? 'cursor-default' : 'hover:brightness-110 active:scale-95 cursor-pointer'} transition-all duration-300`}
                disabled={status?.toLowerCase() === 'confirmed'}
              >
                {currentStatus.label}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button
                onClick={handleWhatsAppClick}
                className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 active:scale-90"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                onClick={handleEmailClick}
                className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 active:scale-90"
                title="Email"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-md tracking-wider">
              #{id}
            </div>
          </div>
        </div>

        {/* Footer - Assignments */}
        <div className="mt-5 pt-4 border-t border-slate-100/80">
          <div className="flex items-center justify-between gap-2">
            {onAssign ? (
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(id); }}
                className={`flex-1 flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 ${isAssigned
                    ? 'bg-slate-50 text-slate-700 border-slate-200/60 hover:border-blue-300 hover:bg-white hover:text-blue-600 shadow-sm'
                    : 'bg-orange-50 text-orange-700 border-orange-200/60'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`p-1 rounded-md ${isAssigned ? "bg-blue-100/50" : "bg-orange-100/50"}`}>
                    <UserIcon size={12} className={isAssigned ? "text-blue-600" : "text-orange-600"} />
                  </div>
                  <span className="truncate uppercase tracking-wider">{currentAssigneeName || "Assign Staff"}</span>
                </div>
                <ChevronDown size={14} className="opacity-40" />
              </button>
            ) : (
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2 bg-slate-50/50 border border-slate-100 rounded-lg text-xs text-slate-500 font-semibold truncate">
                <div className="p-1 bg-slate-100 rounded-md">
                  <UserIcon size={12} className="text-slate-400" />
                </div>
                <span className="truncate uppercase tracking-wider">{currentAssigneeName || "Unassigned"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for dropdown arrow
const ChevronDown = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default memo(LeadCard);
