/**
 * Pexels API - free stock photos. Search e.g. "Shimla", "Kufri" to get location images.
 * Get free API key: https://www.pexels.com/api/
 * Add to .env: VITE_PEXELS_API_KEY=your_key
 */
const PEXELS_API = 'https://api.pexels.com/v1';
const API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

export async function searchPexelsPhotos(query, perPage = 15) {
  if (!query || query.trim().length < 2) return { photos: [] };
  if (!API_KEY) {
    console.warn('VITE_PEXELS_API_KEY not set. Add to .env for free stock images.');
    return { photos: [], error: 'no_api_key' };
  }
  try {
    const res = await fetch(
      `${PEXELS_API}/search?query=${encodeURIComponent(query.trim())}&per_page=${perPage}`,
      { headers: { Authorization: API_KEY } }
    );
    if (!res.ok) return { photos: [], error: 'api_error' };
    const data = await res.json();
    return {
      photos: (data.photos || []).map((p) => ({
        id: p.id,
        url: p.src?.large || p.src?.medium || p.src?.original,
        thumb: p.src?.medium || p.src?.small,
        photographer: p.photographer,
        alt: p.alt || query,
      })),
    };
  } catch (e) {
    console.error('Pexels search error:', e);
    return { photos: [], error: 'network' };
  }
}
