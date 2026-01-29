<<<<<<< HEAD
import React from "react";
import { MoreVertical, MapPin } from "lucide-react";
=======
import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, MapPin, Trash2, MessageCircle, UserPlus, Mail, FileDown } from "lucide-react";
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
import { useNavigate } from "react-router-dom";

export default function LeadCard({
  name,
  phone,
<<<<<<< HEAD
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
=======
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
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      // Navigate to lead details page with Mail tab active if email not available
      navigate(`/leads/${id}?tab=mails`);
    }
  };

  const handlePDFDownload = async (e) => {
    e.stopPropagation();
    try {
      // Navigate to lead details page and trigger PDF download
      navigate(`/leads/${id}?download=pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF');
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
          {/* Name & Phone - Avatar removed */}
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          <div>
            <h3 className="font-semibold text-[18px] text-gray-900">
              {name}
            </h3>
            <p className="text-sm text-gray-500">{phone}</p>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-2">
=======
        <div className="flex items-center gap-2 relative">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          {tag && (
            <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded">
              {tag}
            </span>
          )}
<<<<<<< HEAD
          <MoreVertical className="text-gray-400" size={18} />
=======
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
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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

<<<<<<< HEAD
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
=======
        <button 
          onClick={handleStatusChangeClick}
          className={`text-white text-xs px-3 py-1 rounded-full hover:opacity-90 transition-colors capitalize ${
            status === 'new' ? 'bg-blue-500' :
            status === 'proposal' ? 'bg-yellow-500' :
            status === 'followup' ? 'bg-orange-500' :
            status === 'confirmed' ? 'bg-green-500' :
            status === 'cancelled' ? 'bg-red-500' :
            'bg-gray-500'
          }`}
        >
          {status ? status : 'Status Change'}
        </button>
      </div>

      {/* Assign Action */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleAssignClick}
          className="border rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          {assignedUserName || assignedTo?.name ? (
            <>
              <span className="text-blue-600 font-medium">
                {assignedUserName || assignedTo?.name}
              </span>
              <span className="text-blue-500">▼</span>
            </>
          ) : (
            <>
              Assign Now
              <span className="text-blue-500">▼</span>
            </>
          )}
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 text-white p-2.5 rounded-lg shadow-md hover:bg-green-600 transition-all duration-200 flex items-center justify-center"
            title="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={handleEmailClick}
            className="bg-blue-500 text-white p-2.5 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
            title="Email"
          >
            <Mail className="h-5 w-5" />
          </button>
          <button
            onClick={handlePDFDownload}
            className="bg-red-500 text-white p-2.5 rounded-lg shadow-md hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
            title="Download PDF"
          >
            <FileDown className="h-5 w-5" />
          </button>
        </div>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-200 px-4 py-3 flex justify-between items-center">
<<<<<<< HEAD
        <div onClick={()=>{
          navigate(`/leads/${id}`);
        }} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
=======
        <div className="flex items-center gap-2 text-sm text-gray-700">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          <div className="bg-white p-1 rounded border">
            👤
          </div>
          <span>Details</span>
          <span className="text-blue-500 font-medium">CS</span>
        </div>
<<<<<<< HEAD

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
=======
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      </div>
    </div>
  );
}
