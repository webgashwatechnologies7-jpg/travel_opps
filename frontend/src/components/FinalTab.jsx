import { useState } from 'react';
import { Building2, Star, Calendar, Hash, X, Eye, MapPin, Users, Clock, Image as ImageIcon, Car, UtensilsCrossed, Plane, User, Ship, FileText, FileText as PassportIcon, File, Download, Mail, MessageCircle, Printer } from 'lucide-react';

const FinalTab = ({
  itinerary,
  dayEvents,
  pricingData,
  finalClientPrices,
  packageTerms,
  baseMarkup,
  extraMarkup,
  cgst,
  sgst,
  igst,
  tcs,
  discount,
  maxHotelOptions = 4
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFullPlanModal, setShowFullPlanModal] = useState(false);
  const [selectedOptionForPlan, setSelectedOptionForPlan] = useState(null);

  // Collect all accommodation events with hotel options
  const allOptions = [];
  Object.keys(dayEvents).forEach(day => {
    const events = dayEvents[day] || [];
    events.forEach(event => {
      if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
        event.hotelOptions.forEach(option => {
          const optNum = option.optionNumber || 1;
          if (parseInt(optNum, 10) > maxHotelOptions) {
            return;
          }
          allOptions.push({
            ...option,
            day: parseInt(day),
            eventId: event.id,
            eventSubject: event.subject
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

  // Calculate totals for each option
  const optionTotals = {};
  Object.keys(optionsByNumber).forEach(optNum => {
    const options = optionsByNumber[optNum];
    let totalNet = 0;
    let totalMarkup = 0;
    options.forEach((option, idx) => {
      const optionKey = `${optNum}-${option.day}-${idx}`;
      const pricing = pricingData[optionKey] || { net: option.price || 0, markup: 0, gross: option.price || 0 };
      totalNet += pricing.net || 0;
      totalMarkup += pricing.markup || 0;
    });
    const totalGross = totalNet + totalMarkup;
    const cgstAmount = (totalGross * cgst) / 100;
    const sgstAmount = (totalGross * sgst) / 100;
    const igstAmount = (totalGross * igst) / 100;
    const tcsAmount = (totalGross * tcs) / 100;
    const discountAmount = (totalGross * discount) / 100;
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
      options: options
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

  // Generate days array
  const generateDays = () => {
    if (!itinerary || !itinerary.duration) return [];
    const days = [];
    for (let i = 1; i <= itinerary.duration; i++) {
      days.push(i);
    }
    return days;
  };

  const days = generateDays();

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
      {/* Hero Section with Package Cover */}
      <div className="relative w-full h-96 mb-8 overflow-hidden">
        {itinerary?.image ? (
          <img 
            src={itinerary.image} 
            alt={itinerary.itinerary_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">{itinerary?.itinerary_name || 'Itinerary'}</h1>
          <div className="flex flex-wrap items-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{itinerary?.destinations || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{itinerary?.duration || 0} Days</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Adult: {itinerary?.adult || 0} | Child: {itinerary?.child || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Package Description */}
        {packageTerms?.package_description && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Package Overview
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {packageTerms.package_description}
            </div>
          </div>
        )}

        {/* Options Selection */}
        {Object.keys(optionsByNumber).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Select Your Package Option</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(optionsByNumber).sort((a, b) => parseInt(a) - parseInt(b)).map(optNum => {
                const totals = optionTotals[optNum];
                const options = optionsByNumber[optNum];
                
                return (
                  <div
                    key={optNum}
                    onClick={() => handleViewOption(optNum)}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md border-2 border-transparent hover:border-blue-500 overflow-hidden transition-all cursor-pointer transform hover:scale-105"
                  >
                    {/* Option Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                      <div className="flex items-center justify-between">
                        <span className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg">
                          Option {optNum}
                        </span>
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Option Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          ₹{(totals?.clientPrice || totals?.finalTotal || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500">Total Price</div>
                      </div>

                      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Price:</span>
                          <span className="font-medium">₹{totals?.totalNet.toLocaleString('en-IN') || '0'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taxes & Fees:</span>
                          <span className="font-medium">
                            ₹{((totals?.cgstAmount || 0) + (totals?.sgstAmount || 0) + (totals?.igstAmount || 0) + (totals?.tcsAmount || 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {totals?.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span className="font-medium">-₹{totals?.discountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <div className="text-xs text-gray-500 mb-2 font-semibold">Included Hotels</div>
                        <div className="space-y-2">
                          {options.slice(0, 3).map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="truncate">{option.hotelName || 'Hotel'} - Day {option.day}</span>
                            </div>
                          ))}
                          {options.length > 3 && (
                            <div className="text-xs text-blue-600 font-medium">+{options.length - 3} more hotels</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                        <button 
                          onClick={() => handleViewOption(optNum)}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Full Details
                        </button>
                        <button 
                          onClick={() => handleViewFullPlan(optNum)}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <File className="h-4 w-4" />
                          View Full Plan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Itinerary Days */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Detailed Itinerary
          </h2>
          <div className="space-y-8">
            {days.map((day) => {
              const events = dayEvents[day] || [];
              return (
                <div key={day} className="border-l-4 border-blue-500 pl-6 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                      {day}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Day {day}</h3>
                  </div>
                  
                  {events.length === 0 ? (
                    <p className="text-gray-500 italic">No events scheduled for this day</p>
                  ) : (
                    <div className="space-y-4 ml-16">
                      {events.map((event, eventIdx) => (
                        <div key={eventIdx} className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Event Image */}
                            {event.image && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={event.image} 
                                  alt={event.subject || 'Event'}
                                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
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
                                <h4 className="text-xl font-semibold text-gray-900">
                                  {event.subject || `${event.eventType} Event`}
                                </h4>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  {event.eventType}
                                </span>
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
                                            src={hotel.image} 
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
                                            {hotel.mealPlan && (
                                              <div><UtensilsCrossed className="h-3 w-3 inline mr-1" />Meal: {hotel.mealPlan}</div>
                                            )}
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
                              {event.startTime && event.endTime && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  {event.startTime} - {event.endTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms & Conditions */}
        {(packageTerms?.terms_conditions || packageTerms?.refund_policy) && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Terms & Policies</h2>
            <div className="space-y-6">
              {packageTerms?.terms_conditions && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {packageTerms.terms_conditions}
                  </div>
                </div>
              )}
              {packageTerms?.refund_policy && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Refund Policy</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {packageTerms.refund_policy}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grand Total Summary */}
        {Object.keys(optionTotals).length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Pricing Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-sm opacity-90 mb-1">Total Options</div>
                <div className="text-3xl font-bold">{Object.keys(optionTotals).length}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-sm opacity-90 mb-1">Total Base</div>
                <div className="text-2xl font-bold">
                  ₹{(() => {
                    let total = 0;
                    Object.values(optionTotals).forEach(t => total += t.totalNet);
                    return total.toLocaleString('en-IN');
                  })()}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-sm opacity-90 mb-1">Total Taxes</div>
                <div className="text-2xl font-bold">
                  ₹{(() => {
                    let total = 0;
                    Object.values(optionTotals).forEach(t => {
                      total += t.cgstAmount + t.sgstAmount + t.igstAmount + t.tcsAmount;
                    });
                    return total.toLocaleString('en-IN');
                  })()}
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-white/50">
                <div className="text-sm opacity-90 mb-1">Grand Total</div>
                <div className="text-3xl font-bold">
                  ₹{(() => {
                    let total = 0;
                    Object.values(optionTotals).forEach(t => total += (t.clientPrice || t.finalTotal));
                    return total.toLocaleString('en-IN');
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
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
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Base Price</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.totalNet.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Markup</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.totalMarkup.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">CGST ({cgst}%)</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.cgstAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">SGST ({sgst}%)</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.sgstAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">IGST ({igst}%)</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.igstAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">TCS ({tcs}%)</div>
                    <div className="text-xl font-bold text-gray-900">₹{selectedOption.tcsAmount.toLocaleString('en-IN')}</div>
                  </div>
                  {selectedOption.discountAmount > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Discount ({discount}%)</div>
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
                            <h5 className="text-lg font-bold text-gray-900">Day {day}</h5>
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
                                      {event.image && (
                                        <div className="flex-shrink-0">
                                          <img 
                                            src={event.image} 
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
                                              .filter(opt => opt.optionNumber === parseInt(selectedOption.optionNumber))
                                              .map((hotel, hotelIdx) => {
                                                const optionKey = `${selectedOption.optionNumber}-${day}-${hotelIdx}`;
                                                const pricing = pricingData[optionKey] || { net: hotel.price || 0, markup: 0, gross: hotel.price || 0 };
                                                
                                                return (
                                                  <div key={hotelIdx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                    <div className="flex items-start gap-3">
                                                      {hotel.image && (
                                                        <img 
                                                          src={hotel.image} 
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
                  {selectedOption.options.map((option, idx) => {
                    const optionKey = `${selectedOption.optionNumber}-${option.day}-${idx}`;
                    const pricing = pricingData[optionKey] || { net: option.price || 0, markup: 0, gross: option.price || 0 };
                    
                    return (
                      <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row gap-6">
                          {option.image && (
                            <div className="flex-shrink-0">
                              <img 
                                src={option.image} 
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
                                    Day {option.day}
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
                    <div className="font-semibold text-gray-900">{itinerary?.duration || 0} Days</div>
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
                          <h3 className="text-xl font-bold text-gray-900">Day {day}</h3>
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
                                    {event.image && (
                                      <img 
                                        src={event.image} 
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
                                            .filter(opt => opt.optionNumber === parseInt(selectedOptionForPlan.optionNumber))
                                            .map((hotel, hotelIdx) => {
                                              const optionKey = `${selectedOptionForPlan.optionNumber}-${day}-${hotelIdx}`;
                                              const pricing = pricingData[optionKey] || { net: hotel.price || 0, markup: 0, gross: hotel.price || 0 };
                                              
                                              return (
                                                <div key={hotelIdx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                  <div className="flex items-start gap-4">
                                                    {hotel.image && (
                                                      <img 
                                                        src={hotel.image} 
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
                                                        {hotel.mealPlan && <div><UtensilsCrossed className="h-3 w-3 inline mr-1" />Meal: {hotel.mealPlan}</div>}
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

              {/* Terms & Conditions */}
              {(packageTerms?.terms_conditions || packageTerms?.refund_policy) && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Terms & Policies</h2>
                  {packageTerms?.terms_conditions && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{packageTerms.terms_conditions}</div>
                    </div>
                  )}
                  {packageTerms?.refund_policy && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Refund Policy</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{packageTerms.refund_policy}</div>
                    </div>
                  )}
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
