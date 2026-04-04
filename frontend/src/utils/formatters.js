/**
 * Format date to a readable string (e.g. DD-MM-YYYY)
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
 * Format currency amount
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
 */
export const formatLeadId = (id) => {
    if (!id) return '';
    return `QB${id}`;
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format duration in seconds to a human readable string (e.g. 3h 42m or 2m 15s)
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
