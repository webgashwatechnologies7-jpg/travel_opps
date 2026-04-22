import { useState, useEffect, useRef } from 'react';
import { getDisplayImageUrl } from '../utils/imageUrl';
import { settingsAPI, masterPointsAPI } from '../services/api';
import { Building2, Star, Calendar, Hash, X, Eye, MapPin, Users, Clock, Image as ImageIcon, Car, UtensilsCrossed, Plane, Bus, Train, User, Ship, FileText, FileText as PassportIcon, File, Download, Mail, MessageCircle, Printer, Plus, Save, CheckCircle } from 'lucide-react';

const POLICY_KEYS = [
  { key: 'itinerary', label: 'Day-by-Day Itinerary' },
  { key: 'inclusions', label: 'Inclusions' },
  { key: 'exclusions', label: 'Exclusions' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'terms_conditions', label: 'Terms & Conditions' },
  { key: 'confirmation_policy', label: 'Confirmation Policy' },
  { key: 'cancellation_policy', label: 'Cancellation Policy' },
  { key: 'amendment_policy', label: 'Amendment Policy' },
  { key: 'payment_policy', label: 'Payment Policy' }, // Added new type
  { key: 'thank_you_message', label: 'Thank You Message' }
];
// Left sidebar: only policies (no Day-by-Day); default view is still itinerary
const POLICY_KEYS_SIDEBAR = POLICY_KEYS.filter(p => p.key !== 'itinerary');

const FinalTab = ({
  itinerary,
  dayEvents,
  pricingData,
  finalClientPrices,
  packageTerms,
  setPackageTerms,
  baseMarkup,
  extraMarkup,
  cgst,
  sgst,
  igst,
  tcs,
  discount,
  maxHotelOptions = 4,
  optionGstSettings = {},
  readOnly = false,
  days = []
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFullPlanModal, setShowFullPlanModal] = useState(false);
  const [selectedOptionForPlan, setSelectedOptionForPlan] = useState(null);
  const [sidebarSelectedOption, setSidebarSelectedOption] = useState(null); // For itinerary filter when option selected from sidebar
  const [rightView, setRightView] = useState('itinerary'); // 'itinerary' | policy keys
  const rightContentRef = useRef(null);
  const [newManualPoint, setNewManualPoint] = useState('');
  const [savingToMaster, setSavingToMaster] = useState({}); // Tracking which point is being saved to master
  const [policyContent, setPolicyContent] = useState({
    inclusions: [],
    exclusions: [],
    remarks: [],
    terms_conditions: [],
    confirmation_policy: [],
    cancellation_policy: [],
    amendment_policy: [],
    payment_policy: [],
    thank_you_message: []
  });
  const [editingMasterId, setEditingMasterId] = useState(null);
  const [editingMasterText, setEditingMasterText] = useState('');
  const [itemSourceMap, setItemSourceMap] = useState({}); // { [key]: { [currentText]: masterId } }
  const [lastFocusedText, setLastFocusedText] = useState({}); // { [key-idx]: text } to track what it was before edit

  const getTravelIcon = (dayNum, className = "h-4 w-4") => {
    const events = dayEvents[dayNum] || [];
    const transportEvent = events.find(e => e.eventType === 'transportation');
    if (transportEvent) {
      const subject = (transportEvent.subject || '').toLowerCase();
      if (subject.includes('flight') || subject.includes('air')) return <Plane className={className} />;
      if (subject.includes('volvo') || subject.includes('bus')) return <Bus className={className} />;
      if (subject.includes('train')) return <Train className={className} />;
      if (subject.includes('car') || subject.includes('taxi') || subject.includes('vehicle') || subject.includes('drive')) return <Car className={className} />;
    }
    return <Car className={className} />; // Default to Car for general travel
  };

  useEffect(() => {
    // Helper to get first point content from Master API response
    const getMasterVal = (res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0].content; // Use the first item (sorted by sort_order)
      }
      return '';
    };

    // Helper for Settings API (Legacy fallback for thank you message)
    const getSettingVal = (res) => (res?.data?.success && res?.data?.data?.value != null ? res.data.data.value : (res?.data?.data?.content ?? '')) || '';

    // Helper to get all points content from Master API response
    const getMasterList = (res) => {
      const data = res?.data?.data || res?.data;
      if (data && Array.isArray(data)) {
        return data.map((item, idx) => {
          if (typeof item === 'string') return { id: `str-${idx}-${data.length}`, content: item };
          return { 
            id: item.id || `item-${idx}`, 
            content: item.content || item.name || item.title || (typeof item === 'string' ? item : '') 
          };
        }).filter(item => item.content); // Remove truly empty ones
      }
      return [];
    };

    const loadPolicies = async () => {
      try {
        const [
          incRes,
          excRes,
          remarksRes,
          termsRes,
          confirmRes,
          cancelRes,
          amendRes,
          paymentRes,
          thankYouRes
        ] = await Promise.all([
          masterPointsAPI.list('inclusion'),
          masterPointsAPI.list('exclusion'),
          masterPointsAPI.list('remarks'),
          masterPointsAPI.list('terms'),
          masterPointsAPI.list('confirmation'),
          masterPointsAPI.list('cancellation'),
          masterPointsAPI.list('amendment'),
          masterPointsAPI.list('payment'),
          masterPointsAPI.list('thank_you')
        ]);
        const masters = {
          inclusions: getMasterList(incRes),
          exclusions: getMasterList(excRes),
          remarks: getMasterList(remarksRes),
          terms_conditions: getMasterList(termsRes),
          confirmation_policy: getMasterList(confirmRes),
          cancellation_policy: getMasterList(cancelRes),
          amendment_policy: getMasterList(amendRes),
          payment_policy: getMasterList(paymentRes),
          thank_you_message: getMasterList(thankYouRes)
        };
        
        setPolicyContent(masters);

        // Initialize itemSourceMap based on current masters
        const initialMap = {};
        Object.keys(masters).forEach(key => {
          initialMap[key] = {};
          masters[key].forEach(m => {
            initialMap[key][m.content] = m.id;
          });
        });
        setItemSourceMap(initialMap);

        // Auto-select all master points by default if the package terms are completely empty
        setPackageTerms(prev => {
          let updated = false;
          const nextTerms = { ...prev };
          Object.keys(masters).forEach(masterKey => {
            const pKey = masterKey === 'cancellation_policy' ? 'refund_policy' : masterKey;
            
            if ((!nextTerms[pKey] || nextTerms[pKey].length === 0) && masters[masterKey].length > 0) {
              nextTerms[pKey] = masters[masterKey].map(m => String(m.content).trim());
              updated = true;
            }
          });
          return updated ? nextTerms : prev;
        });
      } catch (error) {
        console.error("Failed to load policies", error);
      }
    };

    loadPolicies();
  }, []);
  
  if (!dayEvents) return null;

  // Smooth scroll to right content heading when a policy is selected
  useEffect(() => {
    if (rightView !== 'itinerary' && rightContentRef.current) {
      rightContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [rightView]);

  // Collect all accommodation events with hotel options (preserve optionIdx to match PricingTab key format)
  const allOptions = [];
  Object.keys(dayEvents).forEach(day => {
    const events = dayEvents[day] || [];
    events.forEach(event => {
      if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
        event.hotelOptions.forEach((option, optionIdx) => {
          const optNum = option.optionNumber || 1;
          if (parseInt(optNum, 10) > maxHotelOptions) {
            return;
          }
          allOptions.push({
            ...option,
            day: parseInt(day),
            eventId: event.id,
            eventSubject: event.subject,
            optionIdx // Matches PricingTab key: optNum-day-optionIdx
          });
        });
      }
    });
  });

  // Group by optionNumber
  const optionsByNumber = {};
  allOptions.forEach(opt => {
    const optNum = opt.optionNumber || 1;
    if (!optionsByNumber[optNum]) {
      optionsByNumber[optNum] = [];
    }
    optionsByNumber[optNum].push(opt);
  });

  // Calculate totals for each option (use per-option GST from optionGstSettings)
  const optionTotals = {};
  Object.keys(optionsByNumber).forEach(optNum => {
    const options = optionsByNumber[optNum];
    let totalNet = 0;
    let totalMarkup = 0;
    options.forEach((option) => {
      const optionIdx = option.optionIdx ?? 0;
      const optionKey = `${optNum}-${option.day}-${optionIdx}`;
      const pricing = pricingData[optionKey] || { net: option.price || 0, markup: 0, gross: option.price || 0 };
      totalNet += pricing.net || 0;
      totalMarkup += pricing.markup || 0;
    });
    const totalGross = totalNet + totalMarkup;
    const optGst = optionGstSettings[optNum] || { cgst, sgst, igst, tcs, discount };
    const cgstAmount = (totalGross * (optGst.cgst || 0)) / 100;
    const sgstAmount = (totalGross * (optGst.sgst || 0)) / 100;
    const igstAmount = (totalGross * (optGst.igst || 0)) / 100;
    const tcsAmount = (totalGross * (optGst.tcs || 0)) / 100;
    const discountAmount = (totalGross * (optGst.discount || 0)) / 100;
    const calculatedTotal = totalGross + cgstAmount + sgstAmount + igstAmount + tcsAmount - discountAmount;

    // Use final client price if set, otherwise use calculated total
    const clientPrice = finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null
      ? parseFloat(finalClientPrices[optNum]) || calculatedTotal
      : calculatedTotal;

    optionTotals[optNum] = {
      totalNet,
      totalMarkup,
      totalGross,
      cgstAmount,
      sgstAmount,
      igstAmount,
      tcsAmount,
      discountAmount,
      finalTotal: calculatedTotal,
      clientPrice,
      options: options,
      gstSettings: optGst
    };
  });

  const handleViewOption = (optNum) => {
    const optionData = optionTotals[optNum];
    if (optionData) {
      // Get all days that have hotels for this option
      const optionDays = new Set();
      optionData.options.forEach(opt => {
        optionDays.add(opt.day);
      });

      // Filter day events to show only events for days that have this option's hotels
      const filteredDayEvents = {};
      Object.keys(dayEvents).forEach(day => {
        if (optionDays.has(parseInt(day))) {
          filteredDayEvents[day] = dayEvents[day] || [];
        }
      });

      setSelectedOption({
        optionNumber: optNum,
        ...optionData,
        filteredDayEvents: filteredDayEvents,
        allDayEvents: dayEvents // Keep all events for reference
      });
    }
  };

  // Get event icon based on type
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'accommodation': return <Building2 className="h-5 w-5" />;
      case 'activity': return <ImageIcon className="h-5 w-5" />;
      case 'transportation': return <Car className="h-5 w-5" />;
      case 'meal': return <UtensilsCrossed className="h-5 w-5" />;
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'visa': return <PassportIcon className="h-5 w-5" />;
      case 'leisure': return <User className="h-5 w-5" />;
      case 'cruise': return <Ship className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const generateDays = () => {
    if (!itinerary || !itinerary.duration) return [];
    const dayNums = [];
    for (let i = 1; i <= itinerary.duration; i++) {
      dayNums.push(i);
    }
    return dayNums;
  };

  const allDayNumbers = generateDays();

  // Active option for itinerary filter: default to Option 1 when options exist
  const activeOption = sidebarSelectedOption || (optionsByNumber && Object.keys(optionsByNumber).length > 0 ? Object.keys(optionsByNumber).sort((a, b) => parseInt(a) - parseInt(b))[0] : null);

  // Filter day events by selected option (for accommodation: show only that option's hotels)
  const getFilteredDayEvents = () => {
    const filtered = {};
    Object.keys(dayEvents).forEach(day => {
      const events = dayEvents[day] || [];
      filtered[day] = events.map(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0 && activeOption) {
          const matchingHotels = event.hotelOptions.filter(opt => {
            const optNum = String(opt.optionNumber || 1);
            return optNum === String(activeOption);
          });
          if (matchingHotels.length === 0) return null;
          return { ...event, hotelOptions: matchingHotels };
        }
        return event;
      }).filter(Boolean);
    });
    return filtered;
  };
  const filteredDayEvents = getFilteredDayEvents();

  // Handle full plan view
  const handleViewFullPlan = (optNum) => {
    const optionData = optionTotals[optNum];
    if (optionData) {
      // Show all days with events, but filter accommodation events to show only the selected option
      const filteredDayEvents = {};
      Object.keys(dayEvents).forEach(day => {
        const dayNum = parseInt(day);
        const events = dayEvents[day] || [];

        // Filter events: for accommodation, only show the selected option
        const filteredEvents = events.map(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            // Filter hotel options to show only the selected option
            const filteredHotelOptions = event.hotelOptions.filter(
              opt => opt.optionNumber === parseInt(optNum)
            );
            if (filteredHotelOptions.length > 0) {
              return {
                ...event,
                hotelOptions: filteredHotelOptions
              };
            }
            return null; // Don't include this event if no matching hotel option
          }
          return event; // Include all other events
        }).filter(Boolean); // Remove null entries

        if (filteredEvents.length > 0) {
          filteredDayEvents[day] = filteredEvents;
        }
      });

      setSelectedOptionForPlan({
        optionNumber: optNum,
        ...optionData,
        filteredDayEvents: filteredDayEvents,
        allDayEvents: dayEvents // Keep all events for reference
      });
      setShowFullPlanModal(true);
    }
  };

  // Generate PDF
  const handleGeneratePDF = () => {
    const printContent = document.getElementById('full-plan-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Travel Plan - Option ${selectedOptionForPlan?.optionNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #2563eb; }
              h2 { color: #1e40af; margin-top: 20px; }
              .day-section { margin-bottom: 30px; border-left: 4px solid #2563eb; padding-left: 15px; }
              .hotel-card { background: #f0f9ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #2563eb; color: white; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Share via Email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Travel Plan - ${itinerary?.itinerary_name || 'Itinerary'} - Option ${selectedOptionForPlan?.optionNumber}`);
    const body = encodeURIComponent(`Please find attached the travel plan for ${itinerary?.itinerary_name || 'Itinerary'}.\n\nOption ${selectedOptionForPlan?.optionNumber}\nTotal Price: ₹${(selectedOptionForPlan?.clientPrice || selectedOptionForPlan?.finalTotal || 0).toLocaleString('en-IN')}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `*Travel Plan - ${itinerary?.itinerary_name || 'Itinerary'}*\n\n` +
      `Option ${selectedOptionForPlan?.optionNumber}\n` +
      `Total Price: ₹${(selectedOptionForPlan?.clientPrice || selectedOptionForPlan?.finalTotal || 0).toLocaleString('en-IN')}\n\n` +
      `Destination: ${itinerary?.destinations || 'N/A'}\n` +
      `Duration: ${itinerary?.duration || 0} Days\n` +
      `Adults: ${itinerary?.adult || 0} | Children: ${itinerary?.child || 0}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section - Destination Header */}
      <div className="relative w-full h-72 overflow-hidden">
        {itinerary?.image && (
          <img
            src={getDisplayImageUrl(itinerary.image) || itinerary.image}
            alt={itinerary?.itinerary_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-800/90 backdrop-blur rounded-xl px-6 py-4 inline-block">
              <h1 className="text-2xl font-bold text-white mb-1">{itinerary?.itinerary_name || 'Itinerary'}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{itinerary?.destinations || 'N/A'}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {(() => {
                    const totalDays = parseInt(itinerary?.duration || 0);
                    const travelDaysCount = days.filter(d => d.isTravelDay).length;
                    const sightseeingDaysCount = totalDays - travelDaysCount;
                    if (travelDaysCount > 0) {
                      const effectiveNights = Math.max(0, sightseeingDaysCount - 1);
                      return `${effectiveNights} Night${effectiveNights !== 1 ? 's' : ''} | ${sightseeingDaysCount} Day${sightseeingDaysCount !== 1 ? 's' : ''} Sightseeing`;
                    }
                    return `${totalDays - 1} Nights & ${totalDays} Days`;
                  })()}
                </span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />
                  {itinerary?.adult || 0} Adult{itinerary?.adult !== 1 ? 's' : ''}
                  {itinerary?.child > 0 && ` | ${itinerary.child} Child${itinerary.child !== 1 ? 'ren' : ''}`}
                  {itinerary?.infant > 0 && ` | ${itinerary.infant} Infant${itinerary.infant !== 1 ? 's' : ''}`}
                </span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />Hotel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Sidebar Options | Itinerary */}
      <div className="max-w-7xl mx-auto px-6 pb-12 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Package Options */}
        {optionsByNumber && Object.keys(optionsByNumber).length > 0 && (
          <div className="lg:w-96 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Your Package Option</h2>
            <div className="space-y-4">
              {Object.keys(optionsByNumber).sort((a, b) => parseInt(a) - parseInt(b)).map(optNum => {
                const totals = optionTotals[optNum];
                const options = optionsByNumber[optNum] || [];
                const hasDiscount = (totals?.discountAmount || 0) > 0;
                const discountPct = totals?.gstSettings?.discount || 0;
                return (
                  <div
                    key={optNum}
                    onClick={() => { setSidebarSelectedOption(optNum); setRightView('itinerary'); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSidebarSelectedOption(optNum); setRightView('itinerary'); } }}
                    className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all cursor-pointer ${activeOption === optNum ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="p-5">
                      <div className="text-xs font-semibold text-blue-600 mb-2">Option {optNum}</div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {hasDiscount && (
                            <div className="text-sm text-gray-500 line-through mb-0.5">
                              ₹{(totals?.totalGross || 0).toLocaleString('en-IN')}
                            </div>
                          )}
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{(totals?.clientPrice || totals?.finalTotal || 0).toLocaleString('en-IN')}/-
                          </div>
                          <div className="text-sm text-gray-500">Total Price</div>
                          {hasDiscount && (
                            <div className="text-sm text-green-600 font-medium mt-1">
                              Discount ({discountPct}%): -₹{(totals.discountAmount || 0).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-2 mb-4">
                        {/* Pax Summary for this option */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2 bg-gray-50 p-1.5 rounded">
                           <Users className="h-3.5 w-3.5 text-gray-400" />
                           <span>{(itinerary?.adult || 1)} Adult{(itinerary?.adult > 1) ? 's' : ''}</span>
                           {(itinerary?.child > 0) && <span>, {itinerary?.child} Child{(itinerary?.child > 1) ? 'ren' : ''}</span>}
                        </div>

                        {(options || []).map((opt, idx) => {
                          const start = opt.checkIn ? new Date(opt.checkIn) : null;
                          const end = opt.checkOut ? new Date(opt.checkOut) : null;
                          let nightCount = 0;
                          if (start && end) {
                            nightCount = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
                          }
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-blue-600">✓</span>
                              <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate font-semibold">{opt.hotelName || 'Hotel'}</span>
                                {nightCount > 0 ? (
                                  <span className="text-[10px] text-gray-500">
                                    {nightCount} Night{nightCount > 1 ? 's' : ''} & {nightCount + 1} Days | {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-500">
                                    {(() => {
                                      const dayObj = days.find(d => d.day === opt.day);
                                      if (dayObj?.isTravelDay) return 'Traveling Day';
                                      let sightseeingNum = 0;
                                      for (let i = 0; i < opt.day; i++) {
                                        if (days[i] && !days[i].isTravelDay) sightseeingNum++;
                                      }
                                      return `Day ${sightseeingNum}`;
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {options.some(o => o.mealPlan) && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-600">✓</span>
                            <UtensilsCrossed className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>Meals Included</span>
                          </div>
                        )}
                        {Object.values(dayEvents).some(events => (events || []).some(e => e.eventType === 'activity')) && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-600">✓</span>
                            <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>Sightseeing Tours</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terms & Policies - below option cards (only policies; Day-by-Day is default view) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Terms & Policies</h3>
              <div className="space-y-2">
                {POLICY_KEYS_SIDEBAR.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRightView(key)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${rightView === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right Content - Day-by-Day Itinerary (default) or selected Policy */}
        <div className="flex-1 min-w-0">
          <div ref={rightContentRef} className="bg-white rounded-xl shadow-lg p-8 mb-8">
            {rightView === 'itinerary' ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">Day-by-Day Itinerary</h2>
                    <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      {itinerary?.destinations || 'Flexible'} | {(() => {
                        const totalDays = parseInt(itinerary?.duration || 0);
                        const travelDaysCount = days.filter(d => d.isTravelDay).length;
                        const sightseeingDaysCount = totalDays - travelDaysCount;
                        if (travelDaysCount > 0) {
                          const effectiveNights = Math.max(0, sightseeingDaysCount - 1);
                          return `${effectiveNights} Night${effectiveNights !== 1 ? 's' : ''} | ${sightseeingDaysCount} Day${sightseeingDaysCount !== 1 ? 's' : ''} Sightseeing`;
                        }
                        return `${totalDays - 1} Nights & ${totalDays} Days`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Travelers</span>
                      <span className="text-sm font-bold text-blue-900">
                        {itinerary?.adult || 0} Adult{itinerary?.adult !== 1 ? 's' : ''}
                        {itinerary?.child > 0 && `, ${itinerary.child} Child${itinerary.child !== 1 ? 'ren' : ''}`}
                        {itinerary?.infant > 0 && `, ${itinerary.infant} Infant${itinerary.infant !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  {allDayNumbers.map((day) => {
                    const events = filteredDayEvents[day] || [];
                    const firstEventSubject = events[0]?.subject || events[0]?.eventType || '';
                    const dayTitle = firstEventSubject ? `${firstEventSubject}` : `Day ${day}`;
                    return (
                      <div key={day} className="border-l-2 border-gray-200 pl-6 pb-6 relative">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <span className="inline-flex items-center px-4 py-1.5 bg-green-500 text-white text-sm font-bold rounded-full">
                            {(() => {
                              const dayObj = days.find(d => d.day === parseInt(day));
                                if (dayObj?.isTravelDay) return (
                                  <span className="flex items-center gap-1.5">
                                    {getTravelIcon(day, "h-4 w-4")} Traveling Day
                                  </span>
                                );
                                let sightseeingNum = 0;
                                for (let i = 0; i < parseInt(day); i++) {
                                  if (days[i] && !days[i].isTravelDay) sightseeingNum++;
                                }
                                return `Day ${sightseeingNum}`;
                            })()}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">{dayTitle}</span>
                        </div>

                        {events.length === 0 ? (
                          <p className="text-gray-500 italic ml-4">No activities added</p>
                        ) : (
                          <div className="space-y-4">
                            {events.map((event, eventIdx) => (
                              <div key={eventIdx} className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="flex-shrink-0 text-green-600 mt-0.5">{/* Checkmark style */}<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">✓</span></div>
                                <div className="flex-1 min-w-0">
                                  {(event.startTime || event.endTime) && (
                                    <div className="text-sm text-gray-500 mb-1 font-medium">
                                      <Clock className="h-4 w-4 inline mr-1" />
                                      {event.startTime || '—'} - {event.endTime || '—'}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="text-gray-700">{getEventIcon(event.eventType)}</div>
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      {event.subject || `${event.eventType}`}
                                    </h4>
                                  </div>

                                  {event.details && (
                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{event.details}</p>
                                  )}

                                  {/* Hotel Options for Accommodation */}
                                  {event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                      {event.hotelOptions.map((hotel, hotelIdx) => (
                                        <div key={hotelIdx} className="bg-white rounded-lg p-4 border border-gray-200">
                                          <div className="flex items-start gap-4">
                                            {hotel.image && (
                                              <img
                                                src={getDisplayImageUrl(hotel.image) || hotel.image}
                                                alt={hotel.hotelName}
                                                className="w-24 h-24 object-cover rounded-lg"
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                }}
                                              />
                                            )}
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <h5 className="font-semibold text-gray-900">{hotel.hotelName || 'Hotel'}</h5>
                                                {[...Array(parseInt(hotel.category || 1))].map((_, i) => (
                                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                {hotel.roomName && (
                                                  <div><Hash className="h-3 w-3 inline mr-1" />Room: {hotel.roomName}</div>
                                                )}
                                                {(() => {
                                                  const d = hotel.day || day;
                                                  const dEvents = dayEvents[d] || [];
                                                  const mEvent = dEvents.find(e => e.eventType === 'meal');
                                                  const mName = mEvent ? (mEvent.subject || mEvent.mealType) : (hotel.mealPlan || 'Room Only');
                                                  return <div><UtensilsCrossed className="h-3 w-3 inline mr-1" />Meal: {mName}</div>;
                                                })()}
                                                {hotel.checkIn && (
                                                  <div><Calendar className="h-3 w-3 inline mr-1" />Check-in: {new Date(hotel.checkIn).toLocaleDateString('en-GB')}</div>
                                                )}
                                                {hotel.checkOut && (
                                                  <div><Calendar className="h-3 w-3 inline mr-1" />Check-out: {new Date(hotel.checkOut).toLocaleDateString('en-GB')}</div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Other event details */}
                                  {event.destination && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      <MapPin className="h-4 w-4 inline mr-1" />
                                      {event.destination}
                                    </div>
                                  )}
                                </div>
                                {(event.image || (event.eventType === 'accommodation' && event.hotelOptions?.[0]?.image)) && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={getDisplayImageUrl(event.image || event.hotelOptions?.[0]?.image) || event.image || event.hotelOptions?.[0]?.image}
                                      alt={event.subject || 'Event'}
                                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
                    {POLICY_KEYS.find(p => p.key === rightView)?.label || rightView}
                  </h2>
                </div>

                {!readOnly && (
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200">
                    <div className="flex items-center justify-between mb-4 border-b border-blue-100 pb-2">
                      <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Master Library (Pick Points)
                      </h3>
                      <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        Changes here update your global templates
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newManualPoint}
                          onChange={(e) => setNewManualPoint(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newManualPoint.trim()) {
                              const key = (rightView === 'cancellation_policy' ? 'refund_policy' : rightView);
                              const newPoint = newManualPoint.trim();
                              setPackageTerms(prev => ({
                                ...prev,
                                [key]: [...(prev[key] || []), newPoint]
                              }));
                              setNewManualPoint('');
                            }
                          }}
                          placeholder={`Add new ${POLICY_KEYS.find(p => p.key === rightView)?.label || 'point'}...`}
                          className="flex-1 px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newManualPoint.trim()) return;
                            const key = (rightView === 'cancellation_policy' ? 'refund_policy' : rightView);
                            const newPoint = newManualPoint.trim();
                            setPackageTerms(prev => ({
                              ...prev,
                              [key]: [...(prev[key] || []), newPoint]
                            }));
                            setNewManualPoint('');
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-sm font-bold">Add to List</span>
                        </button>
                      </div>
                    </div>
                    {policyContent[rightView] && policyContent[rightView].length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {policyContent[rightView].map((masterItem, mIdx) => {
                          const key = rightView === 'cancellation_policy' ? 'refund_policy' : rightView;
                          const currentList = packageTerms[key] || [];
                          // Robust selection check
                          const isSelected = currentList.some(item => 
                            String(item).trim() === String(masterItem.content).trim()
                          );
                          const isEditing = editingMasterId === masterItem.id;
                          
                          return (
                            <div key={mIdx} className="group relative">
                              {isEditing ? (
                                <div className="flex gap-2 p-2 rounded-lg border-2 border-blue-500 bg-white">
                                  <input 
                                    type="text"
                                    autoFocus
                                    value={editingMasterText}
                                    onChange={(e) => setEditingMasterText(e.target.value)}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        try {
                                          await masterPointsAPI.update(masterItem.id, { content: editingMasterText });
                                          setEditingMasterId(null);
                                          // Refresh local list
                                          setPolicyContent(prev => ({
                                            ...prev, 
                                            [rightView]: prev[rightView].map(item => item.id === masterItem.id ? { ...item, content: editingMasterText } : item)
                                          }));
                                          // Also update in packageTerms if it was selected
                                          if (isSelected) {
                                            setPackageTerms(prev => {
                                              const current = prev[key] || [];
                                              const updated = current.map(c => c === masterItem.content ? editingMasterText : c);
                                              return { ...prev, [key]: updated };
                                            });
                                          }
                                        } catch (err) {
                                          console.error('Failed to update master point:', err);
                                        }
                                      } else if (e.key === 'Escape') {
                                        setEditingMasterId(null);
                                      }
                                    }}
                                    className="flex-1 outline-none text-xs"
                                  />
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await masterPointsAPI.update(masterItem.id, { content: editingMasterText });
                                        setEditingMasterId(null);
                                        setPolicyContent(prev => ({
                                          ...prev, 
                                          [rightView]: prev[rightView].map(item => item.id === masterItem.id ? { ...item, content: editingMasterText } : item)
                                        }));
                                        if (isSelected) {
                                          setPackageTerms(prev => {
                                            const current = prev[key] || [];
                                            const updated = current.map(c => c === masterItem.content ? editingMasterText : c);
                                            return { ...prev, [key]: updated };
                                          });
                                        }
                                      } catch (err) {
                                        console.error('Failed to update master point:', err);
                                      }
                                    }}
                                    className="text-blue-600"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-all ${
                                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 hover:border-blue-300 text-gray-700'
                                }`}>
                                  <label className="flex-1 flex items-start gap-3 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isSelected}
                                      className="hidden"
                                      onChange={() => {
                                        if (!readOnly) {
                                          const key = rightView === 'cancellation_policy' ? 'refund_policy' : rightView;
                                          const trimmedContent = String(masterItem.content).trim();
                                          
                                          setPackageTerms(prev => {
                                            const current = prev[key] || [];
                                            const isCurrentlySelected = current.some(item => 
                                              String(item).trim() === trimmedContent
                                            );
                                            
                                            let nextList;
                                            if (isCurrentlySelected) {
                                              nextList = current.filter(p => String(p).trim() !== trimmedContent);
                                            } else {
                                              nextList = [...current, trimmedContent];
                                              // Track that this text came from this master ID
                                              setItemSourceMap(sMap => ({
                                                ...sMap,
                                                [key]: { ...sMap[key], [trimmedContent]: masterItem.id }
                                              }));
                                            }
                                            
                                            return { ...prev, [key]: nextList };
                                          });
                                        }
                                      }}
                                    />
                                    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-white text-blue-600 border-white' : 'border-gray-300'}`}>
                                      {isSelected && <Plus className="h-3 w-3 rotate-45" />}
                                    </span>
                                    <span className="text-xs font-medium leading-tight">{masterItem.content}</span>
                                  </label>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingMasterId(masterItem.id);
                                        setEditingMasterText(masterItem.content);
                                      }}
                                      className={`p-1 rounded hover:bg-black/10 ${isSelected ? 'text-white' : 'text-gray-400'}`}
                                    >
                                      <FileText className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-center text-gray-500 italic py-4">No master points found for this category.</p>
                    )}
                  </div>
                )}

                {/* Selected Points List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Final {POLICY_KEYS.find(p => p.key === rightView)?.label} List</h3>
                  {(() => {
                    const key = rightView === 'cancellation_policy' ? 'refund_policy' : rightView;
                    const items = packageTerms[key] || [];
                    
                    if (items.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-500">No {rightView} selected yet. Choose from above or add manually.</p>
                        </div>
                      );
                    }

                    return items.map((point, idx) => (
                      <div key={idx} className="flex gap-4 group animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${
                          rightView === 'inclusions' ? 'bg-green-100 text-green-700' : 
                          rightView === 'exclusions' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rightView === 'inclusions' ? '✓' : rightView === 'exclusions' ? '✕' : idx + 1}
                        </div>
                        {readOnly ? (
                          <div className="flex-1 text-gray-700 py-1 font-medium">{point}</div>
                        ) : (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={point}
                              onFocus={() => {
                                setLastFocusedText(prev => ({ ...prev, [`${key}-${idx}`]: point }));
                              }}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPackageTerms(prev => {
                                  const current = [...(prev[key] || [])];
                                  current[idx] = newVal;
                                  return { ...prev, [key]: current };
                                });
                              }}
                              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm hover:border-gray-300"
                            />
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!point.trim()) return;
                                  setSavingToMaster(prev => ({ ...prev, [idx]: true }));
                                  try {
                                    const typeMap = {
                                      inclusions: 'inclusion',
                                      exclusions: 'exclusion',
                                      remarks: 'remarks',
                                      terms_conditions: 'terms',
                                      confirmation_policy: 'confirmation',
                                      refund_policy: 'cancellation',
                                      amendment_policy: 'amendment',
                                      payment_policy: 'payment',
                                      thank_you_message: 'thank_you'
                                    };
                                    const dbType = typeMap[key] || rightView;
                                    
                                    // SMART UPDATE LOGIC
                                    const originalText = lastFocusedText[`${key}-${idx}`] || point;
                                    const masterId = itemSourceMap[key]?.[originalText];

                                    if (masterId) {
                                      // Update existing master point
                                      await masterPointsAPI.update(masterId, { content: point.trim() });
                                      
                                      // Update local source map to use new text as key
                                      setItemSourceMap(prev => {
                                        const newKeyMap = { ...prev[key] };
                                        delete newKeyMap[originalText];
                                        newKeyMap[point.trim()] = masterId;
                                        return { ...prev, [key]: newKeyMap };
                                      });
                                    } else {
                                      // Create new master point
                                      const res = await masterPointsAPI.create({ type: dbType, content: point.trim() });
                                      const newId = res.data?.id || res.data?.data?.id;
                                      if (newId) {
                                        setItemSourceMap(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], [point.trim()]: newId }
                                        }));
                                      }
                                    }

                                    // Refresh master content
                                    const freshRes = await masterPointsAPI.list(dbType);
                                    const data = getMasterList(freshRes);
                                    setPolicyContent(prev => ({ ...prev, [rightView]: data }));
                                    
                                    // Update last focused text so subsequent saves work correctly
                                    setLastFocusedText(prev => ({ ...prev, [`${key}-${idx}`]: point.trim() }));

                                  } catch (err) {
                                    console.error('Failed to save to masters:', err);
                                  } finally {
                                    setSavingToMaster(prev => ({ ...prev, [idx]: false }));
                                  }
                                }}
                                disabled={savingToMaster[idx]}
                                className={`p-2 rounded-lg transition-colors ${savingToMaster[idx] ? 'text-gray-300' : 'text-blue-500 hover:bg-blue-50'}`}
                                title="Save/Update Master Template"
                              >
                                {savingToMaster[idx] ? <Clock className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPackageTerms(prev => ({
                                    ...prev,
                                    [key]: (prev[key] || []).filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove item"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>

          {/* Policies are managed via the tabbed view above */}

        </div>
      </div>

      {/* Option Detail Modal */}
      {selectedOption && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg">
                  Option {selectedOption.optionNumber}
                </span>
                <div className="text-white">
                  <div className="text-2xl font-bold">₹{(selectedOption.clientPrice || selectedOption.finalTotal).toLocaleString('en-IN')}</div>
                  <div className="text-sm opacity-90">Total Package Price</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOption(null)}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Pricing Breakdown */}
              <div className="mb-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Pricing Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(selectedOption.totalGross || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Total Base</div>
                      <div className="text-xl font-bold text-gray-900">₹{selectedOption.totalGross.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {(selectedOption.cgstAmount || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">CGST ({(selectedOption.gstSettings?.cgst || 0)}%)</div>
                      <div className="text-xl font-bold text-gray-900">₹{selectedOption.cgstAmount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {(selectedOption.sgstAmount || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">SGST ({(selectedOption.gstSettings?.sgst || 0)}%)</div>
                      <div className="text-xl font-bold text-gray-900">₹{selectedOption.sgstAmount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {(selectedOption.igstAmount || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">IGST ({(selectedOption.gstSettings?.igst || 0)}%)</div>
                      <div className="text-xl font-bold text-gray-900">₹{selectedOption.igstAmount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {(selectedOption.tcsAmount || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">TCS ({(selectedOption.gstSettings?.tcs || 0)}%)</div>
                      <div className="text-xl font-bold text-gray-900">₹{selectedOption.tcsAmount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {(selectedOption.discountAmount || 0) > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Discount ({(selectedOption.gstSettings?.discount || 0)}%)</div>
                      <div className="text-xl font-bold text-green-600">-₹{selectedOption.discountAmount.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  <div className="col-span-2 md:col-span-3 pt-4 border-t border-gray-300 mt-2">
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
                      <div className="text-xl font-semibold text-gray-800">Final Total</div>
                      <div className="text-3xl font-bold text-blue-600">₹{(selectedOption.clientPrice || selectedOption.finalTotal).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Itinerary for Selected Option */}
              {selectedOption.filteredDayEvents && Object.keys(selectedOption.filteredDayEvents).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Complete Itinerary - Option {selectedOption.optionNumber}</h4>
                  <div className="space-y-6">
                    {Object.keys(selectedOption.filteredDayEvents).sort((a, b) => parseInt(a) - parseInt(b)).map((day) => {
                      const events = selectedOption.filteredDayEvents[day] || [];
                      return (
                        <div key={day} className="border-l-4 border-blue-500 pl-6 pb-4 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                              {day}
                            </div>
                            <h5 className="text-lg font-bold text-gray-900">
                              {(() => {
                                const dayObj = days.find(d => d.day === parseInt(day));
                                if (dayObj?.isTravelDay) return (
                                  <span className="flex items-center gap-1.5">
                                    {getTravelIcon(day, "h-4 w-4")} Traveling Day
                                  </span>
                                );
                                let sightseeingNum = 0;
                                for (let i = 0; i < parseInt(day); i++) {
                                  if (days[i] && !days[i].isTravelDay) sightseeingNum++;
                                }
                                return `Day ${sightseeingNum}`;
                              })()}
                            </h5>
                          </div>

                          {events.length === 0 ? (
                            <p className="text-gray-500 italic ml-13">No events scheduled for this day</p>
                          ) : (
                            <div className="space-y-3 ml-13">
                              {events.map((event, eventIdx) => {
                                // Check if this event has hotel options matching selected option
                                const hasMatchingHotel = event.eventType === 'accommodation' &&
                                  event.hotelOptions &&
                                  event.hotelOptions.some(opt => opt.optionNumber === parseInt(selectedOption.optionNumber));

                                return (
                                  <div key={eventIdx} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start gap-4">
                                      {/* Event Image */}
                                      {(event.image || (event.eventType === 'accommodation' && event.hotelOptions?.[0]?.image)) && (
                                        <div className="flex-shrink-0">
                                          <img
                                            src={getDisplayImageUrl(event.image || event.hotelOptions?.[0]?.image) || event.image || event.hotelOptions?.[0]?.image}
                                            alt={event.subject || 'Event'}
                                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}

                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="text-blue-600">
                                            {getEventIcon(event.eventType)}
                                          </div>
                                          <h6 className="text-base font-semibold text-gray-900">
                                            {event.subject || `${event.eventType} Event`}
                                          </h6>
                                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                            {event.eventType}
                                          </span>
                                          {hasMatchingHotel && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                              Included in Option {selectedOption.optionNumber}
                                            </span>
                                          )}
                                        </div>

                                        {event.details && (
                                          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{event.details}</p>
                                        )}

                                        {/* Hotel Options for Accommodation */}
                                        {event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0 && (
                                          <div className="mt-3 space-y-2">
                                            {event.hotelOptions
                                              .map((hotel, hotelIdx) => (hotel.optionNumber === parseInt(selectedOption.optionNumber) ? { hotel, hotelIdx } : null))
                                              .filter(Boolean)
                                              .map(({ hotel, hotelIdx }) => {
                                                const optionKey = `${selectedOption.optionNumber}-${day}-${hotelIdx}`;
                                                const pricing = pricingData[optionKey] || { net: hotel.price || 0, markup: 0, gross: hotel.price || 0 };

                                                return (
                                                  <div key={hotelIdx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                    <div className="flex items-start gap-3">
                                                      {hotel.image && (
                                                        <img
                                                          src={getDisplayImageUrl(hotel.image) || hotel.image}
                                                          alt={hotel.hotelName}
                                                          className="w-16 h-16 object-cover rounded border border-gray-200"
                                                          onError={(e) => {
                                                            e.target.style.display = 'none';
                                                          }}
                                                        />
                                                      )}
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="font-semibold text-gray-900">{hotel.hotelName || 'Hotel'}</span>
                                                          {[...Array(parseInt(hotel.category || 1))].map((_, i) => (
                                                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                          ))}
                                                          <span className="ml-auto text-sm font-bold text-blue-600">₹{pricing.gross.toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 space-y-1">
                                                          {hotel.roomName && <div>Room: {hotel.roomName}</div>}
                                                          {hotel.mealPlan && <div>Meal: {hotel.mealPlan}</div>}
                                                          {hotel.checkIn && hotel.checkOut && (
                                                            <div>
                                                              {new Date(hotel.checkIn).toLocaleDateString('en-GB')} - {new Date(hotel.checkOut).toLocaleDateString('en-GB')}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        )}

                                        {event.destination && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <MapPin className="h-3 w-3 inline mr-1" />
                                            {event.destination}
                                          </div>
                                        )}
                                        {event.startTime && event.endTime && (
                                          <div className="mt-1 text-xs text-gray-600">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {event.startTime} - {event.endTime}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hotel Details Summary */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Included Hotels Summary</h4>
                <div className="space-y-4">
                  {selectedOption.options.map((option) => {
                    const optionIdx = option.optionIdx ?? 0;
                    const optionKey = `${selectedOption.optionNumber}-${option.day}-${optionIdx}`;
                    const pricing = pricingData[optionKey] || { net: option.price || 0, markup: 0, gross: option.price || 0 };

                    return (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row gap-6">
                          {option.image && (
                            <div className="flex-shrink-0">
                              <img
                                src={getDisplayImageUrl(option.image) || option.image}
                                alt={option.hotelName}
                                className="w-full md:w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="text-xl font-bold text-gray-900">{option.hotelName || 'Hotel Name'}</h5>
                                  {[...Array(parseInt(option.category || 1))].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                    {(() => {
                                      const dayObj = days.find(d => d.day === parseInt(option.day));
                                      if (dayObj?.isTravelDay) return (
                                        <span className="flex items-center gap-1.5">
                                          {getTravelIcon(option.day, "h-4 w-4")} Traveling Day
                                        </span>
                                      );
                                      let sightseeingNum = 0;
                                      for (let i = 0; i < parseInt(option.day); i++) {
                                        if (days[i] && !days[i].isTravelDay) sightseeingNum++;
                                      }
                                      return `Day ${sightseeingNum}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">₹{pricing.gross.toLocaleString('en-IN')}</div>
                                <div className="text-xs text-gray-500">Per Room</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="text-xs text-gray-500">Check-in</div>
                                  <div className="font-medium">{option.checkIn ? new Date(option.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="text-xs text-gray-500">Check-out</div>
                                  <div className="font-medium">{option.checkOut ? new Date(option.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="text-xs text-gray-500">Room Type</div>
                                  <div className="font-medium">{option.roomName || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <UtensilsCrossed className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="text-xs text-gray-500">Meal Plan</div>
                                  <div className="font-medium">{option.mealPlan || 'N/A'}</div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                              <div className="text-sm font-semibold text-gray-700 mb-2">Room Configuration:</div>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: 'Single', value: option.single },
                                  { label: 'Double', value: option.double },
                                  { label: 'Triple', value: option.triple },
                                  { label: 'Quad', value: option.quad },
                                  { label: 'Child With Bed', value: option.cwb },
                                  { label: 'Child No Bed', value: option.cnb }
                                ].filter(room => room.value && parseInt(room.value) > 0).map((room, roomIdx) => (
                                  <span key={roomIdx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {room.value} {room.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Plan Modal */}
      {showFullPlanModal && selectedOptionForPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-4">
                <File className="h-8 w-8 text-white" />
                <div className="text-white">
                  <div className="text-2xl font-bold">Full Travel Plan - Option {selectedOptionForPlan.optionNumber}</div>
                  <div className="text-sm opacity-90">{itinerary?.itinerary_name || 'Itinerary'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGeneratePDF}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 text-sm font-semibold flex items-center gap-2 transition-colors"
                  title="Generate PDF"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
                <button
                  onClick={handleEmailShare}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 text-sm font-semibold flex items-center gap-2 transition-colors"
                  title="Share via Email"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 text-sm font-semibold flex items-center gap-2 transition-colors"
                  title="Share via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    setShowFullPlanModal(false);
                    setSelectedOptionForPlan(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1" id="full-plan-content">
              {/* Package Header */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{itinerary?.itinerary_name || 'Travel Itinerary'}</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-600">Destination</div>
                    <div className="font-semibold text-gray-900">{itinerary?.destinations || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-900">
                      {(() => {
                        const totalDays = parseInt(itinerary?.duration || 0);
                        const travelDaysCount = days.filter(d => d.isTravelDay).length;
                        const sightseeingDaysCount = totalDays - travelDaysCount;
                        if (travelDaysCount > 0) {
                          const effectiveNights = Math.max(0, sightseeingDaysCount - 1);
                          return `${effectiveNights} Night${effectiveNights !== 1 ? 's' : ''} | ${sightseeingDaysCount} Day${sightseeingDaysCount !== 1 ? 's' : ''} Sightseeing`;
                        }
                        return `${totalDays - 1} Nights & ${totalDays} Days`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Adults</div>
                    <div className="font-semibold text-gray-900">{itinerary?.adult || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Children</div>
                    <div className="font-semibold text-gray-900">{itinerary?.child || 0}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-800">Package Price:</div>
                    <div className="text-3xl font-bold text-green-600">
                      ₹{(selectedOptionForPlan.clientPrice || selectedOptionForPlan.finalTotal).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Description */}
              {packageTerms?.package_description && (
                <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Package Overview</h2>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {packageTerms.package_description}
                  </div>
                </div>
              )}

              {/* Day-wise Itinerary */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Day-wise Itinerary</h2>
                <div className="space-y-6">
                  {Object.keys(selectedOptionForPlan.filteredDayEvents || {}).sort((a, b) => parseInt(a) - parseInt(b)).map((day) => {
                    const events = selectedOptionForPlan.filteredDayEvents[day] || [];
                    return (
                      <div key={day} className="bg-white rounded-lg border-l-4 border-blue-500 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                            {day}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {(() => {
                              const dayObj = days.find(d => d.day === parseInt(day));
                              if (dayObj?.isTravelDay) return (
                                <span className="flex items-center gap-1.5">
                                  {getTravelIcon(day, "h-5 w-5")} Traveling Day
                                </span>
                              );
                              let sightseeingNum = 0;
                              for (let i = 0; i < parseInt(day); i++) {
                                if (days[i] && !days[i].isTravelDay) sightseeingNum++;
                              }
                              return `Day ${sightseeingNum}`;
                            })()}
                          </h3>
                        </div>

                        {events.length === 0 ? (
                          <p className="text-gray-500 italic ml-16">No events scheduled for this day</p>
                        ) : (
                          <div className="space-y-4 ml-16">
                            {events.map((event, eventIdx) => {
                              const hasMatchingHotel = event.eventType === 'accommodation' &&
                                event.hotelOptions &&
                                event.hotelOptions.some(opt => opt.optionNumber === parseInt(selectedOptionForPlan.optionNumber));

                              return (
                                <div key={eventIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-start gap-4">
                                    {(event.image || (event.eventType === 'accommodation' && event.hotelOptions?.[0]?.image)) && (
                                      <img
                                        src={getDisplayImageUrl(event.image || event.hotelOptions?.[0]?.image) || event.image || event.hotelOptions?.[0]?.image}
                                        alt={event.subject || 'Event'}
                                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}

                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="text-blue-600">
                                          {getEventIcon(event.eventType)}
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                          {event.subject || `${event.eventType} Event`}
                                        </h4>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                          {event.eventType}
                                        </span>
                                        {hasMatchingHotel && (
                                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                            Included in Package
                                          </span>
                                        )}
                                      </div>

                                      {event.details && (
                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{event.details}</p>
                                      )}

                                      {/* Hotel Details */}
                                      {event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          {event.hotelOptions
                                            .map((hotel, hotelIdx) => (hotel.optionNumber === parseInt(selectedOptionForPlan.optionNumber) ? { hotel, hotelIdx } : null))
                                            .filter(Boolean)
                                            .map(({ hotel, hotelIdx }) => {
                                              const optionKey = `${selectedOptionForPlan.optionNumber}-${day}-${hotelIdx}`;
                                              const pricing = pricingData[optionKey] || { net: hotel.price || 0, markup: 0, gross: hotel.price || 0 };

                                              return (
                                                <div key={hotelIdx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                  <div className="flex items-start gap-4">
                                                    {hotel.image && (
                                                      <img
                                                        src={getDisplayImageUrl(hotel.image) || hotel.image}
                                                        alt={hotel.hotelName}
                                                        className="w-20 h-20 object-cover rounded border border-gray-200"
                                                        onError={(e) => {
                                                          e.target.style.display = 'none';
                                                        }}
                                                      />
                                                    )}
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-2 mb-2">
                                                        <h5 className="font-bold text-gray-900">{hotel.hotelName || 'Hotel'}</h5>
                                                        {[...Array(parseInt(hotel.category || 1))].map((_, i) => (
                                                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        ))}
                                                        <span className="ml-auto font-bold text-blue-600">₹{pricing.gross.toLocaleString('en-IN')}</span>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                        {hotel.roomName && <div><Hash className="h-3 w-3 inline mr-1" />Room: {hotel.roomName}</div>}
                                                        {(() => {
                                                          const d = hotel.day || 1; // Fallback if day not found in this specific context
                                                          const dEvents = dayEvents[d] || [];
                                                          const mEvent = dEvents.find(e => e.eventType === 'meal');
                                                          const mName = mEvent ? (mEvent.subject || mEvent.mealType) : (hotel.mealPlan || 'Room Only');
                                                          return <div><UtensilsCrossed className="h-3 w-3 inline mr-1" />Meal: {mName}</div>;
                                                        })()}
                                                        {hotel.checkIn && <div><Calendar className="h-3 w-3 inline mr-1" />Check-in: {new Date(hotel.checkIn).toLocaleDateString('en-GB')}</div>}
                                                        {hotel.checkOut && <div><Calendar className="h-3 w-3 inline mr-1" />Check-out: {new Date(hotel.checkOut).toLocaleDateString('en-GB')}</div>}
                                                      </div>
                                                      {[hotel.single, hotel.double, hotel.triple, hotel.quad, hotel.cwb, hotel.cnb].some(v => v && parseInt(v) > 0) && (
                                                        <div className="mt-2 text-xs text-gray-600">
                                                          Rooms: {[
                                                            hotel.single && `${hotel.single} Single`,
                                                            hotel.double && `${hotel.double} Double`,
                                                            hotel.triple && `${hotel.triple} Triple`,
                                                            hotel.quad && `${hotel.quad} Quad`,
                                                            hotel.cwb && `${hotel.cwb} CWB`,
                                                            hotel.cnb && `${hotel.cnb} CNB`
                                                          ].filter(Boolean).join(', ')}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}

                                      {event.destination && (
                                        <div className="mt-2 text-sm text-gray-600">
                                          <MapPin className="h-4 w-4 inline mr-1" />
                                          {event.destination}
                                        </div>
                                      )}
                                      {event.startTime && event.endTime && (
                                        <div className="mt-1 text-sm text-gray-600">
                                          <Clock className="h-4 w-4 inline mr-1" />
                                          {event.startTime} - {event.endTime}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All Policies and Terms */}
              {POLICY_KEYS_SIDEBAR.some(({ key }) => (packageTerms[key === 'cancellation_policy' ? 'refund_policy' : key] || []).length > 0) && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Terms, Policies & Inclusion</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {POLICY_KEYS_SIDEBAR.map(({ key, label }) => {
                      const pkgKey = key === 'cancellation_policy' ? 'refund_policy' : key;
                      const items = packageTerms[pkgKey] || [];
                      if (items.length === 0) return null;
                      
                      return (
                        <div key={key} className="break-inside-avoid">
                          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                             {label}
                          </h3>
                          <ul className="space-y-1.5">
                            {items.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalTab;
