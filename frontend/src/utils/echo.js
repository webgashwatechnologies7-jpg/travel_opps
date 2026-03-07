import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { API_BASE_URL } from '../services/apiBase';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: 'app-key',
    cluster: 'mt1',
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
        headers: {
            get Authorization() {
                const token = sessionStorage.getItem('auth_token');
                return token ? `Bearer ${token}` : '';
            },
            Accept: 'application/json'
        }
    }
});

export default echo;
