/**
 * Formatting Utilities for Currency, Dates, and Strings.
 * Centralizing formatting logic helps prevent code duplication (DRY principle).
 */

/**
 * Format date to a readable string (e.g. DD-MM-YYYY)
 * 
 * @param {string|Date} dateString 
 * @param {string} format 
 * @returns {string}
 */
export const formatDate = (dateString, format = 'DD-MM-YYYY') => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'DD-MM-YYYY') {
        return `${day}-${month}-${year}`;
    }
    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    }
    return date.toLocaleDateString();
};

/**
 * Formats an ISO date-time string into a human-readable date-time string.
 * 
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN');
  } catch (e) {
    return 'N/A';
  }
};

/**
 * Formats a numeric value into currency format.
 * Defaults to INR (Indian Rupees) with Indian numbering system.
 * 
 * @param {number|string} amount 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'INR') => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Format Lead ID with prefix (e.g. QB123)
 * 
 * @param {number|string} id 
 * @returns {string}
 */
export const formatLeadId = (id) => {
    if (!id) return '';
    return `QB${id}`;
};

/**
 * Capitalize first letter of a string
 * 
 * @param {string} str 
 * @returns {string}
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format duration in seconds to a human readable string (e.g. 3h 42m or 2m 15s)
 * 
 * @param {number} totalSeconds 
 * @returns {string}
 */
export const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '0h 0m';
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
