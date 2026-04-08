/**
 * Distance Helper Utility
 * Uses OpenStreetMap's Nominatim for Geocoding and OSRM for Road Distance.
 * Note: These are public free APIs with rate limits. For production high usage,
 * an API key from Google Maps or Mapbox is recommended.
 */

const CACHE = {}; // Simple session cache to avoid repeated calls

/**
 * Get coordinates (lat, lon) for a city name
 */
export const getCoordinates = async (city) => {
    if (!city) return null;
    const cacheKey = `geo_${city.toLowerCase()}`;
    if (CACHE[cacheKey]) return CACHE[cacheKey];

    try {
        // Append ', India' and use countrycodes filter to avoid picking up locations in other countries
        const query = `${city}, India`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`);
        const data = await response.json();
        if (data && data.length > 0) {
            const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            CACHE[cacheKey] = coords;
            return coords;
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
};

/**
 * Get driving distance between two cities in kilometers
 */
export const getRoadDistance = async (city1, city2) => {
    if (!city1 || !city2 || city1 === city2) return 0;
    
    const cacheKey = `dist_${city1.toLowerCase()}_${city2.toLowerCase()}`;
    if (CACHE[cacheKey]) return CACHE[cacheKey];

    const coords1 = await getCoordinates(city1);
    const coords2 = await getCoordinates(city2);

    if (!coords1 || !coords2) return null;

    try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords1.lon},${coords1.lat};${coords2.lon},${coords2.lat}?overview=false`;
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data && data.routes && data.routes.length > 0) {
            const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
            CACHE[cacheKey] = distanceKm;
            return distanceKm;
        }
    } catch (error) {
        console.error('Distance calculation error:', error);
    }
    return null;
};
