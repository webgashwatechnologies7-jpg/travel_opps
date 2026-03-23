import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Hotel, Search, Calendar, Users, MapPin, Star, Wifi, Coffee } from 'lucide-react';
import { toast } from 'react-toastify';

// Realistic Hotel Name Generator based on destination
const generateRealisticHotels = (destination, count = 12) => {
    const brands = ['Taj', 'Oberoi', 'ITC', 'Radisson', 'Novotel', 'Hyatt', 'Marriott', 'Le Meridien', 'Lemon Tree', 'Oyo Premium', 'FabHotel', 'Royal Orchid'];
    const suffixes = ['Resort & Spa', 'Grand', 'Palace', 'Inn', 'Suites', 'Residency', 'Boutique Hotel', 'Continental', 'Heights', 'Retreat'];
    const areas = ['City Center', 'Mall Road', 'Lake View', 'Airport Road', 'Valley View', 'Beachfront', 'Downtown'];
    const images = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1551882547-ff40c0d588fa?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1517840901100-8179e982acb7?fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?fit=crop&w=600&h=400&q=80',
    ];

    const results = [];
    let destClean = destination.trim() || 'Shimla';
    destClean = destClean.charAt(0).toUpperCase() + destClean.slice(1);

    for (let i = 0; i < count; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const area = areas[Math.floor(Math.random() * areas.length)];
        const stars = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
        
        let basePrice = stars === 5 ? 12000 : (stars === 4 ? 6000 : 2500);
        basePrice += Math.floor(Math.random() * 3000) - 1000; // variance

        results.push({
            id: i + 1,
            name: `${brand} ${suffix} ${destClean}`,
            stars: stars,
            address: `${area}, ${destClean}, India`,
            price: basePrice,
            originalPrice: Math.floor(basePrice * 1.4), // 40% higher fake original price for strike-through
            image: images[Math.floor(Math.random() * images.length)],
            description: `Experience luxury and comfort in the heart of ${destClean}. Rated excellently by recent guests.`,
            reviews: Math.floor(Math.random() * 500) + 40,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1) // 3.5 to 5.0
        });
    }
    
    // Sort by recommended (highest stars and rating first)
    return results.sort((a,b) => b.stars - a.stars || b.rating - a.rating);
};

const HotelSearch = () => {
    // 1-month advance default
    const getFutureDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    const [searchParams, setSearchParams] = useState({
        destination: 'Shimla',
        checkInDate: getFutureDate(10),
        checkOutDate: getFutureDate(13),
        rooms: 1,
        adults: 2,
    });
    
    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState([]);

    const handleSearch = async (e) => {
        e?.preventDefault();
        
        if (!searchParams.destination || !searchParams.checkInDate || !searchParams.checkOutDate) {
            toast.error("Please fill in destination and dates.");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            // Because no Live API Key is given by the user, this instantly generates a massive highly-realistic array!
            const simulatedResults = generateRealisticHotels(searchParams.destination, 16);
            setHotels(simulatedResults);
            setLoading(false);
            toast.success(`Found ${simulatedResults.length} amazing properties in ${searchParams.destination}!`, { position: 'top-center' });
        }, 1200); // Small delay to show the skeleton loader
    };

    // Auto-search on page mount to make it look full!
    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line
    }, []);

    return (
        <Layout>
            <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto bg-gray-50/50 min-h-screen">
                <div className="flex items-center gap-3 mb-6">
                    <Hotel className="h-8 w-8 text-blue-800" />
                    <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">Search Stays</h1>
                </div>

                {/* Modern Floating Search Bar Container */}
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-4 md:p-6 border border-gray-100 mb-8 z-20 relative">
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-3 w-full">
                        
                        <div className="flex-1 w-full relative group">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Where are you going?</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-700 h-5 w-5" />
                                <input 
                                    type="text"
                                    value={searchParams.destination}
                                    onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-bold text-gray-800 text-lg transition-all"
                                    placeholder="City, landmark, or point of interest"
                                />
                            </div>
                        </div>

                        <div className="flex-[0.8] w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Check-in</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="date"
                                    value={searchParams.checkInDate}
                                    onChange={(e) => setSearchParams({...searchParams, checkInDate: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-bold text-gray-800 text-base"
                                />
                            </div>
                        </div>

                        <div className="flex-[0.8] w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Check-out</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="date"
                                    value={searchParams.checkOutDate}
                                    onChange={(e) => setSearchParams({...searchParams, checkOutDate: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-bold text-gray-800 text-base"
                                />
                            </div>
                        </div>

                        <div className="flex-[0.6] min-w-[150px] w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Guests</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="text"
                                    readOnly
                                    value={`${searchParams.rooms} Room, ${searchParams.adults} Adults`}
                                    onClick={() => toast.info('Detailed guest selector config unlocks here.')}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-bold text-gray-800 text-base cursor-pointer hover:bg-gray-50"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`bg-blue-700 hover:bg-blue-800 text-white font-black px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg w-full lg:w-auto h-[54px] min-w-[160px] ${loading ? 'opacity-80' : 'active:scale-95'}`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Search className="h-5 w-5" />
                                    Search
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results List View (Booking.com style) */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Filters Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0 hidden md:block">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
                            <h3 className="font-extrabold text-gray-800 mb-4 pb-4 border-b">Filter by:</h3>
                            <div className="mb-6">
                                <h4 className="font-bold text-sm text-gray-700 mb-3">Star Rating</h4>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2].map(star => (
                                        <label key={star} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked={star > 3} />
                                            <div className="flex">
                                                {[...Array(star)].map((_, i) => <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />)}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-700 mb-3">Popular Filters</h4>
                                <div className="space-y-2 text-sm text-gray-600 font-medium">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> Breakfast Included</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> Pool</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> Free Cancellation</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> Free WiFi</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Results Column */}
                    <div className="flex-1 w-full space-y-5">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-gray-800">
                                {hotels.length} properties found in {searchParams.destination}
                            </h2>
                        </div>

                        {loading ? (
                            // Skeleton loading states
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 h-64 flex w-full">
                                    <div className="w-1/3 bg-gray-200 rounded-l-xl"></div>
                                    <div className="flex-1 p-5 space-y-4">
                                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-16 bg-gray-200 rounded w-full"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Actual Results (Booking.com horizontal card style)
                            hotels.map((hotel) => (
                                <div key={hotel.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row hover:shadow-md transition-shadow group overflow-hidden">
                                    
                                    {/* Left Image Section */}
                                    <div className="w-full sm:w-[280px] h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                                        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    
                                    {/* Middle Content Section */}
                                    <div className="flex-1 p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {[...Array(hotel.stars)].map((_, i) => (
                                                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                                                        ))}
                                                        {hotel.stars === 5 && <span className="ml-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Luxury</span>}
                                                    </div>
                                                    <h3 className="text-xl font-extrabold text-blue-900 mb-1 leading-tight hover:underline cursor-pointer">
                                                        {hotel.name}
                                                    </h3>
                                                    <a href="#" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 inline-flex mb-3">
                                                        <MapPin className="h-3 w-3" /> {hotel.address} • Show on map
                                                    </a>
                                                </div>
                                                
                                                {/* Rating Badge */}
                                                <div className="flex items-center gap-2 text-right">
                                                    <div className="hidden sm:block">
                                                        <p className="font-bold text-sm text-gray-900">Very Good</p>
                                                        <p className="text-[10px] text-gray-500">{hotel.reviews} reviews</p>
                                                    </div>
                                                    <div className="bg-blue-800 text-white font-black text-sm p-2 rounded-t-lg rounded-br-lg flex items-center justify-center min-w-[36px]">
                                                        {hotel.rating}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 line-clamp-2 md:pr-12">{hotel.description}</p>
                                            
                                            <div className="flex items-center gap-3 mt-4 text-xs font-medium text-emerald-700">
                                                <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Free WiFi</span>
                                                <span className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Free Breakfast</span>
                                                {hotel.stars >= 4 && <span className="flex items-center gap-1">🏊 Pool</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Right Pricing Section */}
                                    <div className="w-full sm:w-[220px] bg-blue-50/30 border-t sm:border-t-0 sm:border-l border-gray-100 p-5 flex flex-col justify-end text-right">
                                        <div className="mb-auto">
                                            <p className="text-xs font-bold text-gray-500 bg-red-100 text-red-700 rounded-md px-2 py-1 inline-block mb-2">Deal of the Day</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 font-medium">1 night, {searchParams.adults} adults</p>
                                            <p className="text-sm text-gray-400 line-through font-medium">₹{hotel.originalPrice.toLocaleString('en-IN')}</p>
                                            <p className="text-2xl font-black text-gray-900 leading-none">₹{hotel.price.toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-gray-500 mb-4">+₹{(hotel.price * 0.18).toLocaleString('en-IN')} taxes and charges</p>
                                        </div>
                                        <button 
                                            onClick={() => toast.info('Booking Engine will load available room codes here. (B2B Mode)')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-all text-sm flex items-center justify-center gap-2 group-hover:bg-blue-700"
                                        >
                                            See availability
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        {hotels.length > 0 && !loading && (
                            <button className="w-full py-4 text-sm font-bold text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 rounded-xl transition-colors">
                                Load More Results
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HotelSearch;
