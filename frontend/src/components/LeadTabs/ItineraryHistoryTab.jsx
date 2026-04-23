import React, { memo } from 'react';
import { Clock, MapPin, Calendar, User, ChevronDown, ChevronUp, Package, ArrowRightLeft, CheckCircle2, Eye, Pencil } from 'lucide-react';

const ItineraryHistoryTab = memo(({ historyData, totalChanges, loadingHistory, getDisplayImageUrl, activeProposals, onViewQuotation, leadId }) => {
  const [expandedVersion, setExpandedVersion] = React.useState(null);

  // Build active itinerary info from current proposals
  const activeInfo = React.useMemo(() => {
    if (!activeProposals || activeProposals.length === 0) return null;
    const first = activeProposals[0];
    const meta = first?.metadata || first || {};
    return {
      itinerary_name: first?.itinerary_name || meta.itinerary_name || first?.title || 'Current Itinerary',
      destination: first?.destination || meta.destination || '',
      duration: first?.duration || meta.duration || '',
      image: first?.image || meta.image || null,
      options: activeProposals,
      totalOptions: activeProposals.length,
      created_at: first?.created_at || first?.inserted_at || null,
    };
  }, [activeProposals]);

  if (loadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading itinerary history...</p>
      </div>
    );
  }

  const hasHistory = historyData && historyData.length > 0;
  const hasActive = !!activeInfo;

  if (!hasHistory && !hasActive) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-700 mb-1">No History Yet</h4>
        <p className="text-sm text-gray-500">Itinerary changes will be recorded here when the client requests a different plan.</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to render a single version card (used for both active & archived)
  const renderVersionCard = (version, isActive = false) => {
    const versionKey = isActive ? 'active' : version.version_number;
    const isExpanded = expandedVersion === versionKey;
    const firstOption = isActive ? version.options?.[0] : version.options?.[0];
    const meta = isActive ? (firstOption?.metadata || firstOption || {}) : (firstOption?.metadata || {});
    const itineraryName = isActive
      ? version.itinerary_name
      : (version.itinerary_name || meta.itinerary_name || 'Untitled Itinerary');
    const destination = version.destination || meta.destination || '';
    const duration = version.duration || meta.duration || '';
    const rawImage = version.image || meta.image;
    const imageUrl = getDisplayImageUrl ? getDisplayImageUrl(rawImage) : rawImage;
    const totalOptions = version.totalOptions || version.options?.length || 0;

    // Calculate max price
    const maxPrice = version.options?.reduce((max, opt) => {
      const optMeta = opt.metadata || opt;
      const p = optMeta.price ?? opt.total_amount ?? opt.price ?? 0;
      return Math.max(max, Number(p));
    }, 0) || 0;

    return (
      <div key={versionKey} className="relative pl-8">
        {/* Timeline dot */}
        <span className={`absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
          isActive ? 'bg-green-500' : 'bg-gray-300'
        }`} />

        {/* Card */}
        <div
          className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
            isActive
              ? 'bg-green-50 border-2 border-green-300'
              : 'bg-white border border-gray-200'
          }`}
          onClick={() => setExpandedVersion(isExpanded ? null : versionKey)}
        >
          {/* Card Header */}
          <div className="flex items-center gap-4 p-4">
            {/* Thumbnail */}
            {imageUrl ? (
              <div 
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative group/thumb ${isActive ? 'ring-2 ring-green-400' : 'bg-gray-100'} ${onViewQuotation ? 'cursor-zoom-in' : ''}`}
                onClick={(e) => {
                  if (onViewQuotation && firstOption) {
                    e.stopPropagation();
                    onViewQuotation(firstOption);
                  }
                }}
              >
                <img
                  src={imageUrl}
                  alt={itineraryName}
                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {onViewQuotation && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center relative group/thumb ${
                  isActive ? 'bg-green-100' : 'bg-gradient-to-br from-gray-200 to-gray-300'
                } ${onViewQuotation ? 'cursor-zoom-in' : ''}`}
                onClick={(e) => {
                  if (onViewQuotation && firstOption) {
                    e.stopPropagation();
                    onViewQuotation(firstOption);
                  }
                }}
              >
                <Package className={`h-6 w-6 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
                {onViewQuotation && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isActive ? (
                  <>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> CURRENT
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Active Now
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Version {version.version_number}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <h4 
                  className={`text-base font-semibold truncate hover:text-blue-600 transition-colors ${isActive ? 'text-green-900 font-bold' : 'text-gray-900'} ${onViewQuotation ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    if (onViewQuotation && firstOption) {
                      e.stopPropagation();
                      onViewQuotation(firstOption);
                    }
                  }}
                >
                  {itineraryName}
                </h4>
                {(() => {
                  const itId = firstOption?.itinerary_id || meta?.itinerary_id;
                  if (!itId) return null;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/itineraries/${itId}?fromLead=${leadId}`, '_blank');
                      }}
                      className="p-1 px-2 border border-gray-200 rounded-md bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1.5"
                      title="Edit/View Itinerary"
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="text-[10px] font-bold">EDIT</span>
                    </button>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                {destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {destination}
                  </span>
                )}
                {duration > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {duration} Days
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> {totalOptions} Option{totalOptions !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Price + Expand */}
            <div className="text-right flex-shrink-0">
              {maxPrice > 0 && (
                <p className={`text-lg font-bold ${isActive ? 'text-green-800' : 'text-gray-800'}`}>
                  ₹{Math.round(maxPrice).toLocaleString('en-IN')}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Clock className="h-3 w-3" />
                <span>{isActive ? (version.created_at ? formatDate(version.created_at) : 'Now') : formatDate(version.archived_at)}</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className={`border-t p-4 ${isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
              {!isActive && version.archived_by_name && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <User className="h-3 w-3" />
                  <span>Changed by <strong>{version.archived_by_name}</strong> on {formatDate(version.archived_at)}</span>
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {version.options?.map((opt, optIdx) => {
                  const optMeta = opt.metadata || opt;
                  const optPrice = optMeta.price ?? opt.total_amount ?? opt.price ?? 0;
                  const optNum = optMeta.optionNumber ?? (optIdx + 1);
                  const hotelCount = (optMeta.hotelOptions || opt.hotelOptions || optMeta.hotels || opt.hotels || []).length;
                  const wasConfirmed = opt.is_confirmed || optMeta.confirmed || opt.confirmed;

                  return (
                    <div
                      key={opt.id || optIdx}
                      className={`rounded-lg border p-3 transition-all ${wasConfirmed
                        ? 'border-green-300 bg-green-50/50'
                        : isActive ? 'border-green-200 bg-white hover:border-green-300' : 'border-gray-200 bg-white hover:border-blue-200'
                      } ${onViewQuotation ? 'cursor-pointer hover:shadow-sm' : ''}`}
                      onClick={(e) => {
                        if (onViewQuotation) {
                          e.stopPropagation();
                          onViewQuotation(opt);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">Option {optNum}</span>
                        {wasConfirmed && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                            {isActive ? 'Booked' : 'Was Booked'}
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-gray-900">₹{Math.round(Number(optPrice)).toLocaleString('en-IN')}</p>
                      <div className="flex items-center justify-between mt-1">
                        {hotelCount > 0 && (
                          <p className="text-xs text-gray-500">{hotelCount} Hotel{hotelCount > 1 ? 's' : ''}</p>
                        )}
                        {onViewQuotation && (
                          <span className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            VIEW QUOTATION
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <div className="bg-blue-100 rounded-full p-2.5">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            {totalChanges > 0
              ? `${totalChanges} Itinerary Change${totalChanges !== 1 ? 's' : ''} Made`
              : 'Current Itinerary'
            }
          </h4>
          <p className="text-xs text-blue-700">
            {totalChanges > 0
              ? `Client has changed their plan ${totalChanges} time${totalChanges !== 1 ? 's' : ''}. Current and previous itineraries are shown below.`
              : 'No changes have been made yet. The active itinerary is shown below.'
            }
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
        {/* ── Current Active Itinerary (always at top) ── */}
        {hasActive && renderVersionCard(activeInfo, true)}

        {/* ── Archived Versions ── */}
        {historyData.map((version) => renderVersionCard(version, false))}
      </div>
    </div>
  );
});

ItineraryHistoryTab.displayName = 'ItineraryHistoryTab';
export default ItineraryHistoryTab;
