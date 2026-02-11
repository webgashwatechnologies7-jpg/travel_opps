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
    const host = window.location.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    // Backend/storage runs on localhost:8000 (or 127.0.0.1:8000), including for *.localhost subdomains
    base = isLocal ? `${window.location.protocol}//${host === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:8000` : (base || window.location.origin);
  }
  if (isRelative) {
    const path = url.startsWith('storage/') ? `/${url}` : url;
    return base ? `${base}${path}` : path;
  }
  // URL stored as localhost/127.0.0.1 (e.g. from local dev) – on live, replace with current host
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || '';
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
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

/**
 * Rewrite all img src in HTML so localhost/127.0.0.1 URLs use current origin (fixes CORS on live).
 * Use before rendering email.body or any HTML with dangerouslySetInnerHTML.
 */
export function rewriteHtmlImageUrls(html) {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/<img([^>]*?)src=["']([^"']+)["']/gi, (match, attrs, src) => {
    const resolved = getDisplayImageUrl(src);
    return `<img${attrs}src="${resolved || src}"`;
  });
}

/** Domains that block hotlinking (403) or cause ERR_NAME_NOT_RESOLVED */
const BLOCKED_IMAGE_DOMAINS = [
  'facebook.com', 'fbcdn.net', 'fb.com', 'fb.me', 'graph.facebook.com',
  'cdninstagram.com', 'instagram.com', 'whatsapp.com', 'tiktok.com',
  'twitter.com', 'twimg.com', 't.co', 'linkedin.com', 'snapchat.com',
  'pinterest.com', 'pinimg.com', 'scontent.', 'cdn.fbsbx.com'
];

/**
 * Sanitize email HTML: block external images from domains that return 403 (Facebook, etc.)
 * or cause ERR_NAME_NOT_RESOLVED. Replaces them with a placeholder span.
 */
export function sanitizeEmailHtmlForDisplay(html) {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/<img([^>]*?)src=["']([^"']+)["']/gi, (match, attrs, src) => {
    try {
      if (src.startsWith('data:')) return match; // allow data URLs
      const url = new URL(src, 'https://example.com');
      const host = (url.hostname || '').toLowerCase();
      const isBlocked = BLOCKED_IMAGE_DOMAINS.some(d => host.includes(d));
      const isSuspicious = host.length > 60 || /^[a-z0-9_-]{40,}$/i.test(host);
      if (isBlocked || isSuspicious) {
        return '<span class="inline-block px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded">[Image]</span>';
      }
    } catch (_) {
      return '<span class="inline-block px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded">[Image]</span>';
    }
    return match;
  });
}