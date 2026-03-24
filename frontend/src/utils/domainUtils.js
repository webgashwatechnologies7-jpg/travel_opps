/**
 * Check if current host is the main admin domain (127.0.0.1, localhost, or server IP).
 * Main domain = super admin only. Company domain = company users only.
 */
export function isMainDomain() {
  if (typeof window === 'undefined') return false;
  const host = (window.location?.hostname || '').toLowerCase();
  if (!host) return false;
  // 127.0.0.1, localhost, server IP, or main domain
  if (host === '127.0.0.1' || host === 'localhost' || host === 'travelfusioncrm.com' || host === 'www.travelfusioncrm.com') return true;
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  return ipv4Regex.test(host);
}
