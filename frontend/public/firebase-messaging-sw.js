/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

let messaging = null;

const hasValidConfig = (config) =>
  Boolean(
    config &&
      config.apiKey &&
      config.projectId &&
      config.messagingSenderId &&
      config.appId
  );

const initMessagingIfPossible = (config) => {
  if (!hasValidConfig(config) || messaging) {
    return;
  }

  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(config);
  }

  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || 'Notification';
    const options = {
      body: payload?.notification?.body || '',
      data: payload?.data || {},
    };

    self.registration.showNotification(title, options);
  });
};

// Attempt init with previously provided config.
initMessagingIfPossible(self.__FIREBASE_CONFIG__);

// Allow app to send config after service worker registration.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'FIREBASE_CONFIG') {
    self.__FIREBASE_CONFIG__ = event.data.config;
    initMessagingIfPossible(event.data.config);
  }
});
