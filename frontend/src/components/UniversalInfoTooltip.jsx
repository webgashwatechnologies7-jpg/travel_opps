import { useState, useRef, useEffect } from 'react';
import { 
  Info, Phone, Mail, MapPin, Calendar, Users, FileText, Send, CheckCircle, Clock, 
  AlertTriangle, CreditCard, TrendingUp, Target, Award, Briefcase,
  Plane, Hotel, Car, Camera, DollarSign, Activity, MessageSquare,
  UserCheck, BarChart3, PieChart, Star, AlertCircle, CheckSquare
} from 'lucide-react';

const UniversalInfoTooltip = ({ data, type, children, module }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const parentRect = data.getBoundingClientRect ? data.getBoundingClientRect() : data.getBoundingClientRect();
      
      // Calculate position
      if (parentRect.bottom + window.scrollY < window.innerHeight / 2) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible, data]);

  const getModuleInfo = () => {
    if (!data) return {};

    const moduleConfigs = {
      queries: {
        id: {
          label: 'Query ID',
          value: data.id || 'N/A',
          icon: <FileText className="w-4 h-4" />,
          color: 'text-blue-600'
        },
        customer: {
          label: 'Customer Info',
          value: (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3 text-gray-500" />
                <span>{data.client_title || ''} {data.client_name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 text-gray-500" />
                <span>{data.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3 h-3 text-gray-500" />
                <span>{data.email || 'No email'}</span>
              </div>
            </div>
          ),
          icon: <Users className="w-4 h-4" />,
          color: 'text-green-600'
        },
        destination: {
          label: 'Destination',
          value: data.destination || 'Not specified',
          icon: <MapPin className="w-4 h-4" />,
          color: 'text-orange-600'
        },
        dates: {
          label: 'Travel Dates',
          value: (
            <div className="space-y-1">
              {data.travel_start_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>From: {new Date(data.travel_start_date).toLocaleDateString()}</span>
                </div>
              )}
              {data.travel_end_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>To: {new Date(data.travel_end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ),
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-indigo-600'
        },
        status: {
          label: 'Current Status',
          value: (
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.status === 'new' ? 'bg-blue-100 text-blue-800' :
                data.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                data.status === 'followup' ? 'bg-orange-100 text-orange-800' :
                data.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                data.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.status || 'Unknown'}
              </span>
              {data.priority === 'hot' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                  🔥 HOT
                </span>
              )}
            </div>
          ),
          icon: <CheckCircle className="w-4 h-4" />,
          color: data.status === 'new' ? 'text-blue-600' : 
                 data.status === 'proposal' ? 'text-yellow-600' :
                 data.status === 'followup' ? 'text-orange-600' :
                 data.status === 'confirmed' ? 'text-green-600' :
                 data.status === 'cancelled' ? 'text-red-600' :
                 'text-gray-600'
        },
        priority: {
          label: 'Priority Level',
          value: (
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.priority === 'hot' ? 'bg-red-100 text-red-800' :
                data.priority === 'warm' ? 'bg-orange-100 text-orange-800' :
                data.priority === 'cold' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.priority === 'hot' && '🔥 '}
                {data.priority || 'General'} Priority
              </span>
            </div>
          ),
          icon: <AlertTriangle className="w-4 h-4" />,
          color: data.priority === 'hot' ? 'text-red-600' : 
                 data.priority === 'warm' ? 'text-orange-600' :
                 data.priority === 'cold' ? 'text-blue-600' :
                 'text-gray-600'
        },
        budget: {
          label: 'Budget Range',
          value: data.budget ? `$${data.budget}` : 'Not specified',
          icon: <DollarSign className="w-4 h-4" />,
          color: 'text-green-600'
        }
      },
      
      itineraries: {
        id: {
          label: 'Itinerary ID',
          value: data.id || 'N/A',
          icon: <FileText className="w-4 h-4" />,
          color: 'text-blue-600'
        },
        title: {
          label: 'Itinerary Title',
          value: data.title || 'Untitled Itinerary',
          icon: <Plane className="w-4 h-4" />,
          color: 'text-purple-600'
        },
        destination: {
          label: 'Destination',
          value: data.destination || 'Not specified',
          icon: <MapPin className="w-4 h-4" />,
          color: 'text-orange-600'
        },
        duration: {
          label: 'Duration',
          value: data.duration ? `${data.duration} days` : 'Not specified',
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-indigo-600'
        },
        activities: {
          label: 'Activities Count',
          value: data.activities_count || 0,
          icon: <Activity className="w-4 h-4" />,
          color: 'text-cyan-600'
        },
        hotels: {
          label: 'Hotels Booked',
          value: data.hotels_count || 0,
          icon: <Hotel className="w-4 h-4" />,
          color: 'text-teal-600'
        },
        status: {
          label: 'Status',
          value: (
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                data.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                data.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {data.status || 'Unknown'}
              </span>
            </div>
          ),
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-purple-600'
        },
        created: {
          label: 'Created On',
          value: data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A',
          icon: <Clock className="w-4 h-4" />,
          color: 'text-gray-600'
        }
      },
      
      payments: {
        id: {
          label: 'Payment ID',
          value: data.id || 'N/A',
          icon: <FileText className="w-4 h-4" />,
          color: 'text-blue-600'
        },
        amount: {
          label: 'Amount',
          value: data.amount ? `$${data.amount}` : 'Not specified',
          icon: <DollarSign className="w-4 h-4" />,
          color: 'text-green-600'
        },
        status: {
          label: 'Payment Status',
          value: (
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                data.status === 'paid' ? 'bg-green-100 text-green-800' :
                data.status === 'overdue' ? 'bg-red-100 text-red-800' :
                data.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.status || 'Unknown'}
              </span>
            </div>
          ),
          icon: <CheckCircle className="w-4 h-4" />,
          color: data.status === 'pending' ? 'text-yellow-600' : 
                 data.status === 'paid' ? 'text-green-600' :
                 data.status === 'overdue' ? 'text-red-600' :
                 data.status === 'partial' ? 'text-orange-600' :
                 'text-gray-600'
        },
        due_date: {
          label: 'Due Date',
          value: data.due_date ? new Date(data.due_date).toLocaleDateString() : 'Not specified',
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-indigo-600'
        },
        payment_method: {
          label: 'Payment Method',
          value: data.payment_method || 'Not specified',
          icon: <CreditCard className="w-4 h-4" />,
          color: 'text-purple-600'
        }
      },
      
      employee_performance: {
        employee: {
          label: 'Employee',
          value: data.employee_name || 'N/A',
          icon: <Users className="w-4 h-4" />,
          color: 'text-blue-600'
        },
        targets: {
          label: 'Monthly Target',
          value: data.monthly_target ? `$${data.monthly_target}` : 'Not set',
          icon: <Target className="w-4 h-4" />,
          color: 'text-purple-600'
        },
        achieved: {
          label: 'Achieved',
          value: data.achieved_amount ? `$${data.achieved_amount}` : '$0',
          icon: <Award className="w-4 h-4" />,
          color: data.achieved_amount >= data.monthly_target ? 'text-green-600' : 'text-orange-600'
        },
        performance: {
          label: 'Performance',
          value: data.monthly_target ? 
            `${Math.round((data.achieved_amount / data.monthly_target) * 100)}%` : '0%',
          icon: <TrendingUp className="w-4 h-4" />,
          color: data.achieved_amount >= data.monthly_target ? 'text-green-600' : 'text-red-600'
        },
        conversion_rate: {
          label: 'Conversion Rate',
          value: data.conversion_rate ? `${data.conversion_rate}%` : '0%',
          icon: <BarChart3 className="w-4 h-4" />,
          color: 'text-indigo-600'
        },
        leads_handled: {
          label: 'Leads Handled',
          value: data.leads_handled || 0,
          icon: <Users className="w-4 h-4" />,
          color: 'text-cyan-600'
        },
        month: {
          label: 'Month',
          value: data.month ? new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'long' }) : 'N/A',
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-gray-600'
        }
      }
    };

    return moduleConfigs[module] || {};
  };

  const info = getModuleInfo();

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
        ref={data}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalInfoTooltip;
