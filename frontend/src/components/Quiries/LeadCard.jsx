import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { MoreVertical, Trash2, MapPin, MessageCircle, Mail } from 'lucide-react';

export default function LeadCard({
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

  // Close menu when clicking outside
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

  const handleWhatsAppNavigate = (e) => {
    e.stopPropagation();
    // Navigate to lead details page with WhatsApp tab active
    navigate(`/leads/${id}?tab=whatsapp`);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking buttons
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

  const handleAssignClick = (e) => {
    e.stopPropagation();
    onAssign(id);
    setShowMenu(false);
  };

  const handleStatusChangeClick = (e) => {
    e.stopPropagation();
    onStatusChange(id);
    setShowMenu(false);
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    // Navigate to lead details page with WhatsApp tab active
    navigate(`/leads/${id}?tab=whatsapp`);
  };

  const handleEmailClick = (e) => {
    e.stopPropagation();
    // Navigate to lead details page with Mail tab active
    navigate(`/leads/${id}?tab=mails`);
  };

  const handlePDFDownload = async (e) => {
    e.stopPropagation();
    try {
      // Navigate to lead details page and trigger PDF download
      navigate(`/leads/${id}?download=pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] relative"
    >
      {/* Top Section */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div>
            <h3 className="font-semibold text-[18px] text-gray-900">
              {name}
            </h3>
            <p className="text-sm text-gray-500">{phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {tag && (
            <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded">
              {tag}
            </span>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="text-gray-400" size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Lead
                </button>
              </div>
            )}
          </div>
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

        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange?.(id); }}
          className={`text-white text-xs px-3 py-1 rounded-full hover:opacity-90 transition-colors capitalize ${status === 'new' ? 'bg-blue-500' :
            status === 'proposal' ? 'bg-yellow-500' :
              status === 'followup' ? 'bg-orange-500' :
                status === 'confirmed' ? 'bg-green-500' :
                  status === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-500'
            }`}
        >
          {status || 'Status Change'}
        </button>
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        {onAssign ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign?.(id); }}
            className="border rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            {assignedUserName || assignedTo?.name ? (
              <><span className="text-blue-600 font-medium">{assignedUserName || assignedTo?.name}</span><span className="text-blue-500">▼</span></>
            ) : (
              <>Assign Now <span className="text-blue-500">▼</span></>
            )}
          </button>
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
            <span className="font-medium">{assignedUserName || assignedTo?.name || "Unassigned"}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={handleWhatsAppClick} className="bg-green-500 text-white p-2.5 rounded-lg hover:bg-green-600" title="WhatsApp"><MessageCircle className="h-5 w-5" /></button>
          <button onClick={handleEmailClick} className="bg-blue-500 text-white p-2.5 rounded-lg hover:bg-blue-600" title="Email"><Mail className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="bg-white p-1 rounded border">
            👤
          </div>
          <span>Details</span>
          <span className="text-blue-500 font-medium">CS</span>
        </div>
      </div>
    </div>
  );
}
