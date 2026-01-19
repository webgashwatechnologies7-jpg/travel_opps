import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Mail, Phone, MessageSquare, Calendar, FileText, Trash2, UserPlus, CheckCircle, X, Clock, AlertTriangle, Send } from 'lucide-react';

const QueryActionMenu = ({ lead, onAction, isVisible, onClose, position }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAction = (action, data = null) => {
    onAction(action, lead, data);
    onClose();
  };

  const getPositionStyles = () => {
    if (!position) return {};
    
    const styles = {
      position: 'absolute',
      zIndex: 50,
      minWidth: '200px'
    };

    // Position based on available space
    if (position.top !== undefined && position.left !== undefined) {
      // Check if there's space below
      if (position.top + 200 < window.innerHeight) {
        styles.top = position.top + 'px';
        styles.left = position.left + 'px';
      } else {
        // Show above if no space below
        styles.bottom = (window.innerHeight - position.top) + 'px';
        styles.left = position.left + 'px';
      }
    }

    return styles;
  };

  const menuItems = [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      color: 'text-blue-600',
      description: 'See complete lead information'
    },
    {
      id: 'edit',
      label: 'Edit Lead',
      icon: <Edit className="w-4 h-4" />,
      color: 'text-green-600',
      description: 'Update lead details'
    },
    {
      id: 'assign',
      label: 'Assign To',
      icon: <UserPlus className="w-4 h-4" />,
      color: 'text-purple-600',
      description: 'Assign to team member'
    },
    {
      id: 'status',
      label: 'Change Status',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-orange-600',
      description: 'Update lead status',
      subItems: [
        { id: 'new', label: 'New', color: 'text-blue-600' },
        { id: 'proposal', label: 'Proposal', color: 'text-yellow-600' },
        { id: 'followup', label: 'Followup', color: 'text-orange-600' },
        { id: 'confirmed', label: 'Confirmed', color: 'text-green-600' },
        { id: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
      ]
    },
    {
      id: 'priority',
      label: 'Set Priority',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-600',
      description: 'Mark as hot/warm/cold',
      subItems: [
        { id: 'hot', label: '🔥 Hot Lead', color: 'text-red-600' },
        { id: 'warm', label: '🌡 Warm Lead', color: 'text-orange-600' },
        { id: 'cold', label: '❄ Cold Lead', color: 'text-blue-600' }
      ]
    },
    {
      type: 'divider'
    },
    {
      id: 'email',
      label: 'Send Email',
      icon: <Mail className="w-4 h-4" />,
      color: 'text-indigo-600',
      description: 'Compose email to lead'
    },
    {
      id: 'whatsapp',
      label: 'Send WhatsApp',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-green-600',
      description: 'Message via WhatsApp'
    },
    {
      id: 'call',
      label: 'Log Call',
      icon: <Phone className="w-4 h-4" />,
      color: 'text-teal-600',
      description: 'Record phone call'
    },
    {
      id: 'followup',
      label: 'Schedule Followup',
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-purple-600',
      description: 'Set reminder for followup'
    },
    {
      id: 'proposal',
      label: 'Create Proposal',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-cyan-600',
      description: 'Generate travel proposal'
    },
    {
      type: 'divider'
    },
    {
      id: 'history',
      label: 'View History',
      icon: <Clock className="w-4 h-4" />,
      color: 'text-gray-600',
      description: 'See all activities'
    },
    {
      id: 'delete',
      label: 'Delete Lead',
      icon: <Trash2 className="w-4 h-4" />,
      color: 'text-red-600',
      description: 'Remove lead permanently',
      confirm: true,
      confirmText: `Are you sure you want to delete ${lead.client_name}?`
    }
  ];

  const handleMenuItemClick = (item) => {
    if (item.subItems) {
      // Show sub-menu
      return;
    }

    if (item.confirm) {
      if (window.confirm(item.confirmText)) {
        handleAction(item.id);
      }
    } else {
      handleAction(item.id);
    }
  };

  const handleSubItemClick = (parentId, subItem) => {
    handleAction(parentId, subItem);
  };

  return (
    <div
      ref={menuRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 py-2"
      style={getPositionStyles()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return (
            <div key={`divider-${index}`} className="border-t border-gray-200 my-2" />
          );
        }

        return (
          <div key={item.id} className="relative">
            {/* Main Menu Item */}
            <div
              onClick={() => handleMenuItemClick(item)}
              className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                item.confirm ? 'text-red-600' : item.color
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded-full ${item.color} bg-opacity-10`}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  )}
                </div>
              </div>
              
              {item.subItems && (
                <MoreVertical className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Sub-menu Items */}
            {item.subItems && (
              <div className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                {item.subItems.map((subItem) => (
                  <div
                    key={subItem.id}
                    onClick={() => handleSubItemClick(item.id, subItem)}
                    className={`flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${subItem.color}`}
                  >
                    <div className="font-medium">{subItem.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QueryActionMenu;
