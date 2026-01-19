// Frontend API Configuration for Hostinger
const API_CONFIG = {
    // Development (Local)
    development: {
        baseURL: 'http://localhost:8000/api',
        timeout: 10000
    },
    
    // Production (Hostinger)
    production: {
        baseURL: 'https://xdenna-antelope-219105.hostingerapp.com/api',
        timeout: 15000
    }
};

// Get current environment
const isProduction = window.location.hostname !== 'localhost';
const config = isProduction ? API_CONFIG.production : API_CONFIG.development;

// Export configuration
export const API_BASE_URL = config.baseURL;
export const API_TIMEOUT = config.timeout;

// Example usage in your login component:
/*
import { API_BASE_URL } from './frontend-api-config';

const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Invalid response from server');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};
*/
