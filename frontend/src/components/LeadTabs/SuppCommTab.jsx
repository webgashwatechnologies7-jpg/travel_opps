import React, { memo } from 'react';
import { Send } from 'lucide-react';

const SuppCommTab = memo(({
    lead,
    id, // For enquiry ID fallback
    getConfirmedOption,
    formatDateForDisplay,
    supplierEmailForm,
    setSupplierEmailForm,
    handleSendSupplierEmail,
    sendingEmail,
    // Suppliers
    suppliers,
    selectedSuppliers,
    handleSelectSupplier,
    handleSelectAllSuppliers,
    selectAllSuppliers,
    // Hotels
    hotelsFromConfirmedOption,
    selectedHotels,
    handleSelectHotel,
    handleSelectAllHotels,
    selectAllHotels,
    // Vehicles
    vehiclesFromProposals,
    selectedVehicles,
    handleSelectVehicle,
    handleSelectAllVehicles,
    selectAllVehicles,
}) => {
    return (
        <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Email Form */}
            <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Communication</h3>

                {/* Subject */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={supplierEmailForm.subject}
                        onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter subject"
                    />
                </div>

                {/* CC Email */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        CC Email
                    </label>
                    <input
                        type="email"
                        value={supplierEmailForm.cc_email}
                        onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, cc_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter CC email (optional)"
                    />
                </div>

                {/* Email Body */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                    </label>
                    <textarea
                        value={supplierEmailForm.body}
                        onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, body: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="12"
                        placeholder="Enter email body..."
                    />
                </div>

                {/* Enquiry Details Table */}
                {lead && (
                    <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-3">Enquiry Detail</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 font-medium text-gray-700">Customer Name</td>
                                    <td className="py-2 text-gray-600">
                                        {lead.client_title || 'Mr.'} {lead.client_name}
                                    </td>
                                    <td className="py-2 font-medium text-gray-700">Enquiry ID</td>
                                    <td className="py-2 text-gray-600">{lead.query_id || lead.id || id}</td>
                                    <td className="py-2 font-medium text-gray-700">Enquiry For</td>
                                    <td className="py-2 text-gray-600">
                                        {getConfirmedOption()?.itinerary_name || 'Full package'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-medium text-gray-700">Check-In</td>
                                    <td className="py-2 text-gray-600">
                                        {lead.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A'}
                                    </td>
                                    <td className="py-2 font-medium text-gray-700">Check-Out</td>
                                    <td className="py-2 text-gray-600">
                                        {lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                                    </td>
                                    <td className="py-2 font-medium text-gray-700">Nights</td>
                                    <td className="py-2 text-gray-600">
                                        {lead.travel_start_date && lead.travel_end_date ?
                                            Math.ceil(Math.abs(new Date(lead.travel_end_date) - new Date(lead.travel_start_date)) / (1000 * 60 * 60 * 24)) : 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Hotel Details */}
                        {getConfirmedOption()?.hotels && getConfirmedOption().hotels.length > 0 && (
                            <div className="mt-4">
                                <h5 className="font-semibold text-gray-800 mb-2">Hotel Requirements:</h5>
                                <div className="space-y-2">
                                    {getConfirmedOption().hotels.map((hotel, index) => (
                                        <div key={index} className="bg-white p-2 rounded border border-gray-200">
                                            <div className="text-sm">
                                                <span className="font-medium">{hotel.hotel_name || 'Hotel'}</span>
                                                {hotel.room_type && <span> - {hotel.room_type}</span>}
                                                {hotel.meal_plan && <span> - {hotel.meal_plan}</span>}
                                                {hotel.price && <span className="text-blue-600 ml-2">₹{hotel.price}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Send Button */}
                <button
                    onClick={handleSendSupplierEmail}
                    disabled={sendingEmail || (
                        selectedSuppliers.length === 0 &&
                        selectedHotels.length === 0 &&
                        (selectedVehicles.length === 0 || !vehiclesFromProposals.some(v => selectedVehicles.includes(v.id) && v.email && v.email.trim()))
                    )}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                    <Send className="h-5 w-5" />
                    {sendingEmail ? 'Sending...' : `Send Mail To Selected (${selectedSuppliers.length} Suppliers${selectedHotels.length > 0 ? `, ${selectedHotels.length} Hotels` : ''}${selectedVehicles.length > 0 ? `, ${selectedVehicles.length} Vehicles` : ''})`}
                </button>
            </div>

            {/* Right Panel - Supplier Selection */}
            <div className="col-span-1 border-l border-gray-200 pl-6">
                <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectAllSuppliers}
                            onChange={(e) => handleSelectAllSuppliers(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="font-semibold text-gray-800">Select Supplier</span>
                    </label>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-3 mb-6 pb-4 border-b border-gray-200">
                    {suppliers.length === 0 ? (
                        <div className="text-gray-500 text-sm">No suppliers available</div>
                    ) : (
                        suppliers.map((supplier) => (
                            <div key={supplier.id} className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedSuppliers.includes(supplier.id)}
                                    onChange={() => handleSelectSupplier(supplier.id)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800 text-sm">
                                        {supplier.company_name || supplier.company}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {supplier.title || ''} {supplier.name || `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {supplier.email || 'No email'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Hotels (from itinerary) - all proposals */}
                {hotelsFromConfirmedOption.length > 0 && (
                    <>
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectAllHotels}
                                    onChange={(e) => handleSelectAllHotels(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="font-semibold text-gray-800">Hotels (from itinerary)</span>
                            </label>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto space-y-3 mb-6 pb-4 border-b border-gray-200">
                            {hotelsFromConfirmedOption.map((hotel) => (
                                <div key={hotel.id} className="flex items-start gap-2 bg-green-50 p-2 rounded border border-green-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedHotels.includes(hotel.id)}
                                        onChange={() => handleSelectHotel(hotel.id)}
                                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800 text-sm">
                                            {hotel.company_name || hotel.hotel_name}
                                        </div>
                                        {hotel.room_type && (
                                            <div className="text-xs text-gray-600">
                                                Room: {hotel.room_type} {hotel.meal_plan && `| Meal: ${hotel.meal_plan}`}
                                            </div>
                                        )}
                                        {hotel.day && (
                                            <div className="text-xs text-gray-500">
                                                Day {hotel.day}
                                            </div>
                                        )}
                                        <div className={`text-xs mt-1 ${hotel.email ? 'text-gray-500' : 'text-orange-600 font-medium'}`}>
                                            {hotel.email || '⚠ No email - Please add email in hotel master'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Vehicles (from itinerary) - all proposals */}
                {vehiclesFromProposals.length > 0 && (
                    <>
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectAllVehicles}
                                    onChange={(e) => handleSelectAllVehicles(e.target.checked)}
                                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                />
                                <span className="font-semibold text-gray-800">Vehicles (from itinerary)</span>
                            </label>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto space-y-3">
                            {vehiclesFromProposals.map((vehicle) => (
                                <div key={vehicle.id} className="flex items-start gap-2 bg-amber-50 p-2 rounded border border-amber-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedVehicles.includes(vehicle.id)}
                                        onChange={() => handleSelectVehicle(vehicle.id)}
                                        disabled={!vehicle.email || !vehicle.email.trim()}
                                        className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 disabled:opacity-50"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800 text-sm">
                                            {vehicle.name}
                                        </div>
                                        {vehicle.details && (
                                            <div className="text-xs text-gray-600">
                                                {vehicle.details}
                                            </div>
                                        )}
                                        {vehicle.day && (
                                            <div className="text-xs text-gray-500">
                                                Day {vehicle.day}
                                            </div>
                                        )}
                                        <div className={`text-xs mt-1 ${vehicle.email ? 'text-gray-500' : 'text-amber-600 font-medium'}`}>
                                            {vehicle.email || '— No email (add in Transfer master to send)'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

SuppCommTab.displayName = 'SuppCommTab';
export default SuppCommTab;
