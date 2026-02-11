import { useEffect, useState } from 'react';
import { Edit, Building2, Star } from 'lucide-react';
import { itineraryPricingAPI } from '../services/api';

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
  initialOptionGstSettings = {},
  showToastNotification,
  onPricingSaveSuccess
}) => {
  // Individual GST settings for each option (overrides global gst)
  const [optionGstSettings, setOptionGstSettings] = useState(initialOptionGstSettings || {});

  // Sync internal GST settings when server-provided settings change
  useEffect(() => {
    if (initialOptionGstSettings && Object.keys(initialOptionGstSettings).length > 0) {
      setOptionGstSettings(prev => ({
        ...prev,
        ...initialOptionGstSettings
      }));
    }
  }, [initialOptionGstSettings]);
  // Collect all accommodation events with hotel options (preserve optionIdx for key consistency with FinalTab)
  const allOptions = [];
  Object.keys(dayEvents).forEach(day => {
    const events = dayEvents[day] || [];
    events.forEach(event => {
      if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
        event.hotelOptions.forEach((option, optionIdx) => {
          allOptions.push({
            ...option,
            day: parseInt(day),
            eventId: event.id,
            eventSubject: event.subject,
            optionIdx
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

  // Calculate totals for each option (optionKey must match init: optNum-day-optionIdx)
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
    
    options.forEach((option) => {
      const optionIdx = option.optionIdx ?? 0;
      const optionKey = `${optNum}-${option.day}-${optionIdx}`;
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
      options.forEach((option) => {
        const optionIdx = option.optionIdx ?? 0;
        const optionKey = `${optNum}-${option.day}-${optionIdx}`;
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

  // Explicitly save GST + pricing for a single option (on button click)
  const handleSaveOptionSettings = async (optNum) => {
    if (!itinerary?.id) {
      showToastNotification?.('warning', 'Cannot Save', 'Itinerary ID not found. Please save the itinerary first.');
      return;
    }

    try {
      const payload = {
        pricing_data: pricingData,
        final_client_prices: finalClientPrices,
        option_gst_settings: optionGstSettings,
        base_markup: baseMarkup,
        extra_markup: extraMarkup,
        cgst,
        sgst,
        igst,
        tcs,
        discount,
      };

      await itineraryPricingAPI.save(itinerary.id, payload);
      onPricingSaveSuccess?.(optionGstSettings);
      showToastNotification?.('success', 'Saved', `Pricing & GST for Option ${optNum} saved successfully.`);
    } catch (e) {
      console.error('Failed to save option settings to server', e);
      showToastNotification?.('error', 'Save Failed', 'Failed to save settings to server. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{itinerary?.itinerary_name || 'Itinerary'}</h2>
        <p className="text-gray-600 mt-1">
          {itinerary?.destinations || 'N/A'} - Adult: {itinerary?.adult || 0} | Child: {itinerary?.child || 0}
        </p>
      </div>

      {/* Hotel Options Summary - Shows hotels per option per night */}
      {Object.keys(optionsByNumber).length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Hotel Options Summary (Per Night Per Option)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(optionsByNumber).sort((a, b) => parseInt(a) - parseInt(b)).map(optNum => {
              const options = optionsByNumber[optNum];
              // Sort options by day
              const sortedOptions = [...options].sort((a, b) => a.day - b.day);
              
              return (
                <div key={optNum} className="bg-white rounded-lg border-2 border-blue-300 p-4 shadow-sm flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-lg">
                        Option {optNum}
                      </span>
                      <span className="text-xs text-gray-500">
                        {sortedOptions.length} Night{sortedOptions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total (Client)</div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(optionTotals[optNum]?.clientPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sortedOptions.map((option, idx) => {
                      const optionIdx = option.optionIdx ?? 0;
                      const optionKey = `${optNum}-${option.day}-${optionIdx}`;
                      const currentPricing = pricingData[optionKey] || {
                        net: parseFloat(option.price) || 0,
                        markup: 0,
                        gross: parseFloat(option.price) || 0
                      };

                      return (
                        <div key={optionKey} className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">Night {idx + 1} (Day {option.day})</div>
                              <div className="font-semibold text-sm text-gray-800">
                                {option.hotelName || 'Hotel'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {option.roomName || 'Standard'} | {option.mealPlan || 'Room Only'}
                              </div>
                              {option.category && (
                                <div className="flex items-center gap-1 mt-1">
                                  {[...Array(parseInt(option.category || 1))].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  ))}
                                  <span className="text-xs text-gray-500 ml-1">{option.category} Star</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] text-gray-500 mb-1">Net / Markup</div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex gap-1">
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
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Net"
                                    min="0"
                                    step="1"
                                  />
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
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="MUP"
                                    min="0"
                                    step="1"
                                  />
                                </div>
                                <div className="text-xs font-bold text-blue-600">
                                  ₹{currentPricing.gross.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Totals + Final Client Price */}
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total Base:</span>
                      <span className="text-sm font-bold text-gray-800">
                        ₹{optionTotals[optNum]?.totalGross.toLocaleString('en-IN') || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">Final Client Price:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={
                            finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null
                              ? finalClientPrices[optNum]
                              : optionTotals[optNum]?.finalTotal || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                            setFinalClientPrices(prev => ({
                              ...prev,
                              [optNum]: value
                            }));
                          }}
                          className="w-32 px-3 py-1.5 border-2 border-blue-500 rounded-lg text-sm font-semibold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Set price"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Compact GST settings per option */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      GST Settings for Option {optNum}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <label className="block text-gray-600 mb-1">CGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.cgst ?? cgst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst, sgst, igst, tcs, discount }),
                                cgst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">SGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.sgst ?? sgst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst, sgst, igst, tcs, discount }),
                                sgst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">IGST %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.igst ?? igst}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst, sgst, igst, tcs, discount }),
                                igst: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">TCS %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.tcs ?? tcs}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst, sgst, igst, tcs, discount }),
                                tcs: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={optionGstSettings[optNum]?.discount ?? discount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setOptionGstSettings(prev => ({
                              ...prev,
                              [optNum]: {
                                ...(prev[optNum] || { cgst, sgst, igst, tcs, discount }),
                                discount: value
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveOptionSettings(optNum)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                      >
                        Save GST & Pricing
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Each option can have different hotels for each night. 
              For example, Option 1 Night 1 = Hotel A, Option 1 Night 2 = Hotel D. 
              Set prices for each hotel in the sections below.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default PricingTab;

