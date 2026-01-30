/**
 * Resolve image URL for display – works on local (port 8000) and live.
 * Relative paths (/storage/...) and localhost URLs are converted to the correct base.
 */
export function getDisplayImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:')) return url;
  let base = (import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '')).replace(/\/api\/?$/, '');
  const isRelative = url.startsWith('/storage') || url.startsWith('storage/') || (url.startsWith('/') && !url.startsWith('http'));
  if (typeof window !== 'undefined' && isRelative && (!base || base === window.location.origin)) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    base = isLocal ? `${window.location.protocol}//${window.location.hostname}:8000` : (base || window.location.origin);
  }
  if (isRelative) {
    const path = url.startsWith('storage/') ? `/${url}` : url;
    return base ? `${base}${path}` : path;
  }
  // URL stored as localhost/127.0.0.1 (e.g. from local dev) – on live, replace with current host
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const replaceWith = isLocal ? url : (base || window.location.origin);
      if (!isLocal) {
        return url.replace(/https?:\/\/[^/]+/, replaceWith);
      }
    } else if (base) {
      return url.replace(/https?:\/\/[^/]+/, base);
    }
  }
  return url;
}
