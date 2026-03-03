import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: 'app-key',
    cluster: 'mt1',
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    // Temporarily disabled for local to stop red errors
    //authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
});

export default echo;
