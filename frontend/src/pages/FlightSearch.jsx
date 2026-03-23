import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plane, Search, Calendar, MapPin, CheckCircle, Clock, Info } from 'lucide-react';
import { toast } from 'react-toastify';

// Realistic Flight Generator
const generateRealisticFlights = (origin, destination, count = 10) => {
    const airlines = [
        { name: 'IndiGo', code: '6E', logo: 'I' },
        { name: 'Air India', code: 'AI', logo: 'A' },
        { name: 'Vistara', code: 'UK', logo: 'V' },
        { name: 'SpiceJet', code: 'SG', logo: 'S' },
        { name: 'Akasa Air', code: 'QP', logo: 'AK' }
    ];
    
    // Helper to add hours/minutes safely
    const addTime = (timeStr, hours, minutes) => {
        let parts = timeStr.split(' ');
        let [hText, mText] = parts[0].split(':');
        let h = parseInt(hText);
        let m = parseInt(mText);
        let suffix = parts[1];
        
        if (suffix === 'PM' && h !== 12) h += 12;
        if (suffix === 'AM' && h === 12) h = 0;

        m += minutes;
        h += hours + Math.floor(m / 60);
        m = m % 60;
        
        h = h % 24;
        let outSuffix = h >= 12 ? 'PM' : 'AM';
        let outH = h % 12;
        if (outH === 0) outH = 12;
        
        return `${outH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${outSuffix}`;
    };

    const results = [];
    let ori = origin.trim().toUpperCase() || 'DEL';
    let dest = destination.trim().toUpperCase() || 'BOM';

    for (let i = 0; i < count; i++) {
        const carrier = airlines[Math.floor(Math.random() * airlines.length)];
        const flightNum = `${carrier.code}-${Math.floor(Math.random() * 800) + 100}`;
        const isNonStop = Math.random() > 0.3; // 70% non-stop
        
        let startHour = Math.floor(Math.random() * 24);
        let startMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        let depSuffix = startHour >= 12 ? 'PM' : 'AM';
        let displayStartHour = startHour % 12 === 0 ? 12 : startHour % 12;
        let depTime = `${displayStartHour.toString().padStart(2,'0')}:${startMin.toString().padStart(2,'0')} ${depSuffix}`;
        
        let durHours = isNonStop ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 5) + 4);
        let durMins = [5, 15, 20, 40, 50][Math.floor(Math.random() * 5)];
        let arrTime = addTime(depTime, durHours, durMins);
        
        let basePrice = isNonStop ? (Math.floor(Math.random() * 3000) + 5000) : (Math.floor(Math.random() * 2000) + 3500);

        results.push({
            id: i + 1,
            airline: carrier.name,
            airlineCode: carrier.code,
            logoChar: carrier.logo,
            flightNum: flightNum,
            departure: depTime,
            origin: ori,
            arrival: arrTime,
            destination: dest,
            duration: `${durHours}h ${durMins}m`,
            stops: isNonStop ? 'Non-stop' : '1 Stop via HYD',
            price: basePrice,
            seats: Math.floor(Math.random() * 15) + 1,
            type: basePrice < 4500 ? 'Saver' : 'Regular'
        });
    }
    
    // Sort by price (cheapest first)
    return results.sort((a,b) => a.price - b.price);
};

const FlightSearch = () => {
    const getFutureDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    const [searchParams, setSearchParams] = useState({
        origin: 'DEL',
        destination: 'BOM',
        departureDate: getFutureDate(3),
        passengers: 1,
        cabinClass: 'Economy' // or Premium Economy / Business
    });
    
    const [loading, setLoading] = useState(false);
    const [flights, setFlights] = useState([]);

    const handleSearch = async (e) => {
        e?.preventDefault();
        
        if (!searchParams.origin || !searchParams.destination) {
            toast.error("Please fill in Origin and Destination airport codes.");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const simulatedResults = generateRealisticFlights(searchParams.origin, searchParams.destination, 12);
            setFlights(simulatedResults);
            setLoading(false);
            toast.success(`Fetched ${simulatedResults.length} live flight options from ${searchParams.origin} to ${searchParams.destination}!`, { position: 'top-center' });
        }, 1200); 
    };

    useEffect(() => {
        handleSearch();
         // eslint-disable-next-line
    }, []);

    return (
        <Layout>
            <div className="bg-[#0f172a] -mt-6 pt-12 pb-32 px-4 md:px-8 relative rounded-b-[40px] shadow-2xl mb-16">
                <div className="max-w-[1200px] mx-auto text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Compare and book flights with ease</h1>
                    <p className="text-blue-200 text-lg">Discover your next dream destination and secure the best fares automatically.</p>
                </div>

                {/* MakeMyTrip style floating search bar */}
                <div className="max-w-[1100px] mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8 absolute left-0 right-0 -bottom-20 z-20">
                    <div className="flex gap-4 mb-5 border-b pb-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-full">
                            <input type="radio" checked readOnly className="h-4 w-4 bg-blue-700" /> One Way
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                            <input type="radio" className="h-4 w-4" disabled /> Round Trip
                        </label>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-4 w-full">
                        
                        <div className="flex-1 w-full border rounded-xl flex items-center p-3 hover:border-blue-500 transition-colors cursor-text group">
                            <div className="pl-2 pr-4 text-gray-400 group-hover:text-blue-500 transition-colors"><MapPin className="h-6 w-6" /></div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">From</p>
                                <input 
                                    type="text"
                                    value={searchParams.origin}
                                    onChange={(e) => setSearchParams({...searchParams, origin: e.target.value.toUpperCase()})}
                                    className="w-full font-black text-gray-900 text-2xl focus:outline-none placeholder-gray-300"
                                    placeholder="DEL"
                                    maxLength="3"
                                />
                            </div>
                        </div>

                        <div className="h-10 w-10 bg-white border rounded-full hidden lg:flex items-center justify-center -mx-7 z-10 shadow-sm text-blue-600 hover:bg-blue-50 cursor-pointer transition-all">
                            ⇄
                        </div>

                        <div className="flex-1 w-full border rounded-xl flex items-center p-3 hover:border-blue-500 transition-colors cursor-text group">
                            <div className="pl-2 pr-4 text-gray-400 group-hover:text-blue-500 transition-colors"><MapPin className="h-6 w-6" /></div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">To</p>
                                <input 
                                    type="text"
                                    value={searchParams.destination}
                                    onChange={(e) => setSearchParams({...searchParams, destination: e.target.value.toUpperCase()})}
                                    className="w-full font-black text-gray-900 text-2xl focus:outline-none placeholder-gray-300"
                                    placeholder="BOM"
                                    maxLength="3"
                                />
                            </div>
                        </div>

                        <div className="flex-[0.8] w-full border rounded-xl flex items-center p-3 hover:border-blue-500 transition-colors cursor-pointer group">
                            <div className="pl-2 pr-4 text-gray-400 group-hover:text-blue-500 transition-colors"><Calendar className="h-6 w-6" /></div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Departure</p>
                                <input 
                                    type="date"
                                    value={searchParams.departureDate}
                                    onChange={(e) => setSearchParams({...searchParams, departureDate: e.target.value})}
                                    className="w-full font-bold text-gray-900 text-lg focus:outline-none bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex-[0.9] w-full border rounded-xl flex items-center p-3 hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => toast.info('Passenger/Class selector dropdown will be here.')}>
                            <div className="flex-1 px-2">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Travellers & Class</p>
                                <p className="font-black text-gray-900 text-lg"><span className="text-2xl">{searchParams.passengers}</span> Traveller</p>
                                <p className="text-xs font-semibold text-gray-500">{searchParams.cabinClass}</p>
                            </div>
                        </div>

                    </form>

                    <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2">
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className={`bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-black text-xl px-16 py-4 rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform transform ${loading ? 'opacity-80' : 'hover:-translate-y-1 active:scale-95'}`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                "SEARCH FLIGHTS"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-[1100px] mx-auto mt-28">
                {/* Results Section */}
                {flights.length > 0 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900">Flights from {searchParams.origin} to {searchParams.destination}</h2>
                                <p className="text-gray-500 font-medium text-sm mt-1 flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> Prices include all taxes and fees.</p>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-200 h-32 flex items-center px-6 gap-6">
                                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                        <div className="flex-1 flex justify-between">
                                            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                        <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {flights.map((flight) => (
                                    <div key={flight.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-blue-300">
                                        
                                        {/* Airline Info */}
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="h-12 w-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center font-black text-xl text-blue-800 shadow-sm">
                                                {flight.logoChar}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{flight.airline}</h4>
                                                <p className="text-xs font-semibold text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-0.5">{flight.flightNum}</p>
                                            </div>
                                        </div>

                                        {/* Timing Info */}
                                        <div className="flex flex-1 justify-between items-center px-2 md:px-8 w-full sm:w-auto">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-gray-900">{flight.departure}</p>
                                                <p className="text-sm font-bold text-gray-400">{flight.origin}</p>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col items-center px-4 relative">
                                                <p className="text-xs font-bold text-gray-500 mb-1">{flight.duration}</p>
                                                <div className="w-full flex items-center justify-between gap-1 group-hover:text-blue-500 transition-colors">
                                                    <div className="h-[2px] w-full bg-gray-200"></div>
                                                    <Plane className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                                </div>
                                                <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${flight.stops === 'Non-stop' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {flight.stops}
                                                </p>
                                            </div>

                                            <div className="text-left">
                                                <p className="text-2xl font-black text-gray-900">{flight.arrival}</p>
                                                <p className="text-sm font-bold text-gray-400">{flight.destination}</p>
                                            </div>
                                        </div>

                                        {/* Pricing & Booking */}
                                        <div className="flex items-center sm:items-end flex-row sm:flex-col gap-4 min-w-[180px] justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 w-full sm:w-auto pl-0 sm:pl-6 sm:border-l">
                                            <div className="text-left sm:text-right">
                                                <p className="text-3xl font-black text-gray-900 leading-none">₹{flight.price.toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center justify-start sm:justify-end gap-1">
                                                    <Clock className="h-3 w-3" /> Only {flight.seats} seats left
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => toast.info('Passenger ticketing UI will load here! (Sandboxed)')}
                                                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-8 py-2.5 rounded-full shadow-md transition-all whitespace-nowrap"
                                            >
                                                BOOK NOW
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {flights.length > 0 && !loading && (
                            <div className="flex items-center justify-center p-6 bg-blue-50/50 rounded-xl border border-blue-100 mt-6">
                                <Info className="h-5 w-5 text-blue-600 mr-2" />
                                <span className="text-sm font-semibold text-blue-800">These are B2B consolidated fares. Fares are dynamic and subject to seat availability.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default FlightSearch;
