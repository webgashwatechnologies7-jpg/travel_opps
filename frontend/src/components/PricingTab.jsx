import { useEffect, useState } from 'react';
import { Edit, Plus } from 'lucide-react';

const PricingTab = ({
  itinerary,
  dayEvents,
  pricingData,
  setPricingData,
  finalClientPrices,
  setFinalClientPrices,
  baseMarkup,
  setBaseMarkup,
  extraMarkup,
  setExtraMarkup,
  cgst,
  setCgst,
  sgst,
  setSgst,
  igst,
  setIgst,
  tcs,
  setTcs,
  discount,
  setDiscount,
  onAddToProposals
}) => {
  // Individual GST settings for each option
  const [optionGstSettings, setOptionGstSettings] = useState({});
  // Collect all accommodation events with hotel options
  const allOptions = [];
  Object.keys(dayEvents).forEach(day => {
    const events = dayEvents[day] || [];
    events.forEach(event => {
      if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
        event.hotelOptions.forEach(option => {
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

  // Initialize pricing data for any missing options
  useEffect(() => {
    if (!dayEvents || Object.keys(dayEvents).length === 0) return;
    
    const missingPricing = {};
    Object.keys(dayEvents).forEach(day => {
      const events = dayEvents[day] || [];
      events.forEach(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
          event.hotelOptions.forEach((option, idx) => {
            const optNum = option.optionNumber || 1;
            const optionKey = `${optNum}-${day}-${idx}`;
            if (!pricingData[optionKey]) {
              const defaultNet = parseFloat(option.price) || 0;
              missingPricing[optionKey] = {
                net: defaultNet,
                markup: 0,
                gross: defaultNet
              };
            }
          });
        }
      });
    });
    if (Object.keys(missingPricing).length > 0) {
      setPricingData(prev => ({ ...prev, ...missingPricing }));
    }
  }, [dayEvents]);

  // Group by optionNumber
  const optionsByNumber = {};
  allOptions.forEach(opt => {
    const optNum = opt.optionNumber || 1;
    if (!optionsByNumber[optNum]) {
      optionsByNumber[optNum] = [];
    }
    optionsByNumber[optNum].push(opt);
  });

  // Initialize GST settings for each option if not exists
  useEffect(() => {
    const newSettings = {};
    Object.keys(optionsByNumber).forEach(optNum => {
      if (!optionGstSettings[optNum]) {
        newSettings[optNum] = {
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          tcs: tcs,
          discount: discount
        };
      }
    });
    if (Object.keys(newSettings).length > 0) {
      setOptionGstSettings(prev => ({ ...prev, ...newSettings }));
    }
  }, [allOptions.length, cgst, sgst, igst, tcs, discount]);

  // Calculate totals for each option using individual GST settings
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
    
    // Use individual GST settings for this option, fallback to global settings
    const optGst = optionGstSettings[optNum] || {
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      tcs: tcs,
      discount: discount
    };
    
    const cgstAmount = (totalGross * optGst.cgst) / 100;
    const sgstAmount = (totalGross * optGst.sgst) / 100;
    const igstAmount = (totalGross * optGst.igst) / 100;
    const tcsAmount = (totalGross * optGst.tcs) / 100;
    const discountAmount = (totalGross * optGst.discount) / 100;
    const finalTotal = totalGross + cgstAmount + sgstAmount + igstAmount + tcsAmount - discountAmount;
    
    // Use final client price if set, otherwise use calculated finalTotal
    const clientPrice = finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null 
      ? parseFloat(finalClientPrices[optNum]) || finalTotal
      : finalTotal;
    
    optionTotals[optNum] = {
      totalNet,
      totalMarkup,
      totalGross,
      cgstAmount,
      sgstAmount,
      igstAmount,
      tcsAmount,
      discountAmount,
      finalTotal,
      clientPrice, // Final price shown to client
      gstSettings: optGst
    };
  });

  // Handle update for a specific option
  const handleUpdateOption = (optNum) => {
    const options = optionsByNumber[optNum] || [];
    const updatedPricing = { ...pricingData };
    
    options.forEach((option, idx) => {
      const optionKey = `${optNum}-${option.day}-${idx}`;
      const currentPricing = pricingData[optionKey] || {
        net: parseFloat(option.price) || 0,
        markup: 0,
        gross: parseFloat(option.price) || 0
      };
      
      // Apply base markup percentage
      let newNet = currentPricing.net;
      let newMarkup = 0;
      
      if (baseMarkup > 0) {
        newMarkup = (newNet * baseMarkup) / 100;
      }
      
      // Add extra markup (distributed per option)
      const optionsCount = options.length;
      const extraMarkupPerOption = extraMarkup / optionsCount;
      newMarkup += extraMarkupPerOption;
      
      const newGross = newNet + newMarkup;
      
      updatedPricing[optionKey] = { net: newNet, markup: newMarkup, gross: newGross };
    });
    
    setPricingData(updatedPricing);
  };

  // Handle update for all options
  const handleUpdateAllOptions = () => {
    const updatedPricing = { ...pricingData };
    
    Object.keys(optionsByNumber).forEach(optNum => {
      const options = optionsByNumber[optNum] || [];
      options.forEach((option, idx) => {
        const optionKey = `${optNum}-${option.day}-${idx}`;
        const currentPricing = pricingData[optionKey] || {
          net: parseFloat(option.price) || 0,
          markup: 0,
          gross: parseFloat(option.price) || 0
        };
        
        // Apply base markup percentage
        let newNet = currentPricing.net;
        let newMarkup = 0;
        
        if (baseMarkup > 0) {
          newMarkup = (newNet * baseMarkup) / 100;
        }
        
        // Add extra markup (distributed per option)
        const totalOptions = allOptions.length;
        const extraMarkupPerOption = totalOptions > 0 ? extraMarkup / totalOptions : 0;
        newMarkup += extraMarkupPerOption;
        
        const newGross = newNet + newMarkup;
        
        updatedPricing[optionKey] = { net: newNet, markup: newMarkup, gross: newGross };
      });
    });
    
    setPricingData(updatedPricing);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{itinerary?.itinerary_name || 'Itinerary'}</h2>
        <p className="text-gray-600 mt-1">
          {itinerary?.destinations || 'N/A'} - Adult: {itinerary?.adult || 0} | Child: {itinerary?.child || 0}
        </p>
      </div>

      {/* Options Sections - Each Option in Separate Card */}
      {Object.keys(optionsByNumber).length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No accommodation options found. Please add hotels in the Build tab.</p>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          {Object.keys(optionsByNumber).sort((a, b) => parseInt(a) - parseInt(b)).map(optNum => {
            const options = optionsByNumber[optNum];
            const totals = optionTotals[optNum];
            const dayGroups = options.reduce((acc, option, idx) => {
              const optionKey = `${optNum}-${option.day}-${idx}`;
              const currentPricing = pricingData[optionKey] || {
                net: parseFloat(option.price) || 0,
                markup: 0,
                gross: parseFloat(option.price) || 0
              };
              const dayKey = option.day;
              if (!acc[dayKey]) {
                acc[dayKey] = {
                  items: [],
                  totalNet: 0,
                  totalMarkup: 0,
                  totalGross: 0
                };
              }
              acc[dayKey].items.push({ optionKey, option, pricing: currentPricing });
              acc[dayKey].totalNet += currentPricing.net || 0;
              acc[dayKey].totalMarkup += currentPricing.markup || 0;
              acc[dayKey].totalGross += currentPricing.gross || 0;
              return acc;
            }, {});
            const sortedDays = Object.keys(dayGroups).sort((a, b) => parseInt(a) - parseInt(b));
            
            return (
              <div key={optNum} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Option Header */}
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                        Option {optNum}
                      </button>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Calculated Total:</div>
                          <div className="text-lg font-bold text-gray-900">
                            ₹{totals?.finalTotal.toLocaleString('en-IN') || '0'}
                          </div>
                        </div>
                        <div className="border-l border-gray-300 pl-4">
                          <label className="text-xs text-gray-500 mb-1 block">Final Client Price:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null ? finalClientPrices[optNum] : totals?.finalTotal || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                                setFinalClientPrices(prev => ({
                                  ...prev,
                                  [optNum]: value
                                }));
                              }}
                              onBlur={() => {
                                // Auto-save when user leaves the input field
                                if (finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null) {
                                  // Price is already saved in state
                                }
                              }}
                              className="w-40 px-3 py-2 border-2 border-blue-500 rounded-lg text-lg font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Set price"
                              min="0"
                              step="1"
                            />
                            {finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null && finalClientPrices[optNum] !== totals?.finalTotal && (
                              <span className="text-xs text-green-600 font-semibold" title="Custom price set">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null ? 'Price saved automatically' : 'Enter price to save'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleUpdateOption(optNum);
                          // Final client price is already saved in state via onChange
                          // Show confirmation
                          alert(`Option ${optNum} pricing updated successfully!`);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Update Option {optNum}
                      </button>
                      {finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Price Saved
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Breakdown */}
                  <div className="grid grid-cols-6 gap-4 text-xs mb-3">
                    <div>
                      <span className="text-gray-600">Markup:</span>
                      <span className="ml-1 font-semibold text-gray-900">₹{totals?.totalMarkup.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">CGST ({totals?.gstSettings?.cgst || cgst}%):</span>
                      <span className="ml-1 font-semibold text-gray-900">₹{totals?.cgstAmount.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SGST ({totals?.gstSettings?.sgst || sgst}%):</span>
                      <span className="ml-1 font-semibold text-gray-900">₹{totals?.sgstAmount.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">IGST ({totals?.gstSettings?.igst || igst}%):</span>
                      <span className="ml-1 font-semibold text-gray-900">₹{totals?.igstAmount.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">TCS ({totals?.gstSettings?.tcs || tcs}%):</span>
                      <span className="ml-1 font-semibold text-gray-900">₹{totals?.tcsAmount.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Discount ({totals?.gstSettings?.discount || discount}%):</span>
                      <span className="ml-1 font-semibold text-green-600">-₹{totals?.discountAmount.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                  
                  {/* GST Settings for this Option */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">GST Settings for Option {optNum}:</div>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">CGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.cgst ?? cgst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst: cgst, sgst: sgst, igst: igst, tcs: tcs, discount: discount }),
                                cgst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">SGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.sgst ?? sgst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst: cgst, sgst: sgst, igst: igst, tcs: tcs, discount: discount }),
                                sgst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">IGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.igst ?? igst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst: cgst, sgst: sgst, igst: igst, tcs: tcs, discount: discount }),
                                igst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">TCS %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.tcs ?? tcs}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst: cgst, sgst: sgst, igst: igst, tcs: tcs, discount: discount }),
                                tcs: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.discount ?? discount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst: cgst, sgst: sgst, igst: igst, tcs: tcs, discount: discount }),
                                discount: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day-wise Itinerary Summary */}
                <div className="px-6 py-4 bg-slate-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-800">
                      Option {optNum} Itinerary (Day-wise)
                    </div>
                    <div className="text-xs text-gray-500">
                      Per-day hotel selection with cost breakup
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedDays.map(day => {
                      const dayData = dayGroups[day];
                      return (
                        <div key={`day-${optNum}-${day}`} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-800">Day {day}</div>
                            <div className="text-sm font-bold text-blue-700">
                              ₹{dayData.totalGross.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {dayData.items.map(item => (
                              <div key={item.optionKey} className="text-xs text-gray-600">
                                {item.option.hotelName || 'Hotel'} • {item.option.roomName || 'Standard'}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Net ₹{dayData.totalNet.toLocaleString('en-IN')} • Markup ₹{dayData.totalMarkup.toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Option Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Net</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Markup</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gross</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {options.map((option, idx) => {
                        const optionKey = `${optNum}-${option.day}-${idx}`;
                        const currentPricing = pricingData[optionKey] || {
                          net: parseFloat(option.price) || 0,
                          markup: 0,
                          gross: parseFloat(option.price) || 0
                        };

                        return (
                          <tr key={optionKey} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{option.hotelName || 'Hotel'}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {option.roomName || 'Standard'} - {option.checkIn ? new Date(option.checkIn).toLocaleDateString('en-GB') : 'N/A'} TO {option.checkOut ? new Date(option.checkOut).toLocaleDateString('en-GB') : 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">Day {option.day}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Accommodation</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={currentPricing.net || ''}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  const net = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
                                  const markup = currentPricing.markup || 0;
                                  const gross = net + markup;
                                  setPricingData({
                                    ...pricingData,
                                    [optionKey]: { net, markup, gross }
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-32 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-text"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                              <div className="text-xs text-gray-500 mt-1">INR</div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={currentPricing.markup || ''}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  const markup = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
                                  const net = currentPricing.net || 0;
                                  const gross = net + markup;
                                  setPricingData({
                                    ...pricingData,
                                    [optionKey]: { net, markup, gross }
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-32 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-text"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                              <div className="text-xs text-gray-500 mt-1">INR</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{currentPricing.gross.toLocaleString('en-IN')}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Option Total Summary Row */}
                      <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                        <td colSpan="3" className="px-4 py-3 text-sm text-gray-700 text-right">
                          Option {optNum} Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ₹{totals?.totalNet.toLocaleString('en-IN') || '0'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ₹{totals?.totalMarkup.toLocaleString('en-IN') || '0'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">
                          ₹{totals?.finalTotal.toLocaleString('en-IN') || '0'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Proposals Button */}
      {Object.keys(optionsByNumber).length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onAddToProposals}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Add Options to Proposals
          </button>
        </div>
      )}

    </div>
  );
};

export default PricingTab;

