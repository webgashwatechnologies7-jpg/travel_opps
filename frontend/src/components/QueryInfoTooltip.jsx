import { useState, useRef, useEffect } from 'react';
import { Info, Phone, Mail, MapPin, Calendar, Users, FileText, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const QueryInfoTooltip = ({ lead, field, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const parentRect = field.getBoundingClientRect();
      
      // Calculate position
      if (parentRect.bottom + window.scrollY < window.innerHeight / 2) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible, field]);

  const getQueryInfo = () => {
    if (!lead) return {};

    const info = {
      id: {
        label: 'Query ID',
        value: lead.id || 'N/A',
        icon: <FileText className="w-4 h-4" />,
        color: 'text-blue-600'
      },
      customer: {
        label: 'Customer Info',
        value: `${lead.client_title || ''} ${lead.client_name || 'N/A'}`,
        icon: <Users className="w-4 h-4" />,
        color: 'text-green-600'
      },
      contact: {
        label: 'Contact Details',
        value: (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3 text-gray-500" />
              <span>{lead.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-3 h-3 text-gray-500" />
              <span>{lead.email || 'No email'}</span>
            </div>
          </div>
        ),
        icon: <Users className="w-4 h-4" />,
        color: 'text-purple-600'
      },
      destination: {
        label: 'Destination',
        value: lead.destination || 'Not specified',
        icon: <MapPin className="w-4 h-4" />,
        color: 'text-orange-600'
      },
      dates: {
        label: 'Travel Dates',
        value: (
          <div className="space-y-1">
            {lead.travel_start_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span>From: {new Date(lead.travel_start_date).toLocaleDateString()}</span>
              </div>
            )}
            {lead.travel_end_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span>To: {new Date(lead.travel_end_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ),
        icon: <Calendar className="w-4 h-4" />,
        color: 'text-indigo-600'
      },
      source: {
        label: 'Lead Source',
        value: lead.source || 'Not specified',
        icon: <Send className="w-4 h-4" />,
        color: 'text-cyan-600'
      },
      status: {
        label: 'Current Status',
        value: (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
              lead.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
              lead.status === 'followup' ? 'bg-orange-100 text-orange-800' :
              lead.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              lead.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lead.status || 'Unknown'}
            </span>
            {lead.priority === 'hot' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                HOT
              </span>
            )}
          </div>
        ),
        icon: <CheckCircle className="w-4 h-4" />,
        color: lead.status === 'new' ? 'text-blue-600' : 
               lead.status === 'proposal' ? 'text-yellow-600' :
               lead.status === 'followup' ? 'text-orange-600' :
               lead.status === 'confirmed' ? 'text-green-600' :
               lead.status === 'cancelled' ? 'text-red-600' :
               'text-gray-600'
      },
      priority: {
        label: 'Priority Level',
        value: (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.priority === 'hot' ? 'bg-red-100 text-red-800' :
              lead.priority === 'warm' ? 'bg-orange-100 text-orange-800' :
              lead.priority === 'cold' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lead.priority || 'General'} Priority
            </span>
          </div>
        ),
        icon: <AlertCircle className="w-4 h-4" />,
        color: lead.priority === 'hot' ? 'text-red-600' : 
               lead.priority === 'warm' ? 'text-orange-600' :
               lead.priority === 'cold' ? 'text-blue-600' :
               'text-gray-600'
      },
      assignment: {
        label: 'Assigned To',
        value: lead.assigned_to_name || 'Unassigned',
        icon: <Users className="w-4 h-4" />,
        color: 'text-teal-600'
      },
      created: {
        label: 'Created On',
        value: lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-gray-600'
      },
      lastActivity: {
        label: 'Last Activity',
        value: lead.last_activity || 'No recent activity',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-gray-600'
      }
    };

    return info;
  };

  const info = getQueryInfo();

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    if (position === 'top') {
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
    return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        ref={field}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-help inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-80 ${getPositionClasses()}`}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="space-y-3">
              {Object.entries(info).map(([key, item]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded-full ${item.color} bg-opacity-10`}>
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="text-sm text-gray-700 pl-7">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-500 mb-2">QUICK ACTIONS</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors">
                  <Mail className="w-3 h-3" />
                  <span>Send Email</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-colors">
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 transition-colors">
                  <FileText className="w-3 h-3" />
                  <span>View Details</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs hover:bg-orange-100 transition-colors">
                  <Calendar className="w-3 h-3" />
                  <span>Schedule Followup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInfoTooltip;
