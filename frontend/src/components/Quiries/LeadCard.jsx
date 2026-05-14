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
      className={`group relative w-full rounded-xl border transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-lg bg-blue-50/20'
          : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300'
        }`}
    >
      {/* Top Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${currentStatus.color}`}></div>

      <div className="p-5 flex flex-col h-full relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span>{phone}</span>
              </div>
              {email && (
                <div className="flex items-center gap-2 text-slate-400 text-[11px] truncate">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-600"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Opportunity
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Assigned To Section */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                <UserIcon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Assigned To</p>
                <p className="text-[11px] font-semibold text-slate-700 truncate">{currentAssigneeName || "Unassigned"}</p>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={handleWhatsAppClick}
                className="p-2 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100"
                title="WhatsApp"
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={handleEmailClick}
                className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100"
                title="Email"
              >
                <Mail size={14} />
              </button>
            </div>
          </div>

          {onAssign && (
            <button
              onClick={(e) => { e.stopPropagation(); onAssign?.(id); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
            >
              Change Staff
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LeadCard);
