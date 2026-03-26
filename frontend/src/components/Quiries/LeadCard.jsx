import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { MoreVertical, Trash2, MapPin, MessageCircle, Mail, User as UserIcon, Calendar } from 'lucide-react';

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
    proposal: { color: 'bg-amber-500', glow: 'status-glow-proposal', label: 'Proposal' },
    followup: { color: 'bg-orange-600', glow: 'status-glow-followup', label: 'Followup' },
    confirmed: { color: 'bg-emerald-600', glow: 'status-glow-confirmed', label: 'Confirmed' },
    cancelled: { color: 'bg-rose-600', glow: 'status-glow-cancelled', label: 'Cancelled' },
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
      className="group relative w-full rounded-[1.5rem] border border-slate-200/60 bg-white p-1 shadow-sm transition-all duration-500 hover:shadow-2xl hover:translate-y-[-8px] flex flex-col h-full animate-in-scale"
    >
      {/* Glow Effect on Hover */}
      <div className={`absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${currentStatus.glow}`}></div>

      <div className="bg-white rounded-[1.25rem] p-5 h-full flex flex-col relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <h3 className="font-black text-xl text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors tracking-tight text-gradient">
                {name}
              </h3>
              {tag && (
                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                  {tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
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

        {/* Middle Content - Destination & Status */}
        <div className="space-y-4 flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-600 font-bold bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-blue-100">
                <MapPin size={14} className="text-blue-500 shrink-0" />
              </div>
              <span className="truncate flex-1" title={location}>{location || "Destination Not Set"}</span>
              <div className={`shrink-0 h-2 w-2 rounded-full ${currentStatus.color}`}></div>
            </div>

            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                  <Calendar size={13} className="text-slate-400" />
                  <span className="text-[11px] font-black text-slate-500 tracking-tight whitespace-nowrap">{date}</span>
               </div>
               
               <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange?.(id); }}
                  className={`px-4 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg ${currentStatus.color} hover:scale-105 active:scale-95 transition-all duration-300`}
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
                  className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 active:scale-90"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleEmailClick} 
                  className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 active:scale-90"
                  title="Email"
                >
                  <Mail className="h-4 w-4" />
                </button>
             </div>
             
              <div className="text-[10px] font-black text-slate-300 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg tracking-widest">
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
                className={`flex-1 flex items-center justify-between gap-2 px-4 py-2.5 rounded-[1rem] text-[11px] font-black border transition-all duration-300 ${
                  isAssigned
                    ? 'bg-slate-50 text-slate-700 border-slate-200/60 hover:border-blue-300 hover:bg-white hover:text-blue-600 shadow-sm'
                    : 'bg-orange-50 text-orange-700 border-orange-200/60 animate-pulse'
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
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-[1rem] text-[11px] text-slate-500 font-bold truncate">
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
