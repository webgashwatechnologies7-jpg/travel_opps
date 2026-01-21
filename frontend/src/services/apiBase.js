const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

export const getApiBaseUrl = () => {
  if (rawBaseUrl) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
      // Avoid mixed content by upgrading to HTTPS when frontend is HTTPS
      return rawBaseUrl.replace(/^http:\/\//, 'https://');
    }
    return rawBaseUrl;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
