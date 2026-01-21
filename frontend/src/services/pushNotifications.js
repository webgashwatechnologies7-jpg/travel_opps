import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { notificationsAPI } from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

const isSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

let messagingInstance = null;

const getMessagingInstance = () => {
  if (!messagingInstance) {
    const app = initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

export const initPushNotifications = async ({ prompt = false } = {}) => {
  if (!isSupported()) {
    return { supported: false, reason: 'not_supported' };
  }

  if (!hasFirebaseConfig()) {
    return { supported: false, reason: 'missing_config' };
  }

  let permission = Notification.permission;
  if (permission === 'default' && !prompt) {
    return { supported: true, permission };
  }

  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { supported: true, permission };
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  if (hasFirebaseConfig()) {
    const readyRegistration = await navigator.serviceWorker.ready;
    const activeWorker = readyRegistration.active || registration.active;
    if (activeWorker) {
      activeWorker.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }
  }
  const messaging = getMessagingInstance();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await notificationsAPI.savePushToken({
      token,
      platform: 'web',
      device_name: navigator.userAgent?.slice(0, 100) || null,
    });
    localStorage.setItem('push_fcm_token', token);
  }

  return { supported: true, permission, token };
};

export const removePushToken = async (tokenOverride = null) => {
  if (!isSupported() || !hasFirebaseConfig()) {
    return { supported: false };
  }

  const token = tokenOverride || localStorage.getItem('push_fcm_token');
  if (!token) {
    return { supported: true, removed: false };
  }

  await notificationsAPI.deletePushToken({ token });
  localStorage.removeItem('push_fcm_token');
  return { supported: true, removed: true };
};

export const listenForForegroundMessages = (onMessageCallback) => {
  if (!isSupported() || !hasFirebaseConfig()) {
    return () => {};
  }

  const messaging = getMessagingInstance();

  return onMessage(messaging, (payload) => {
    if (typeof onMessageCallback === 'function') {
      onMessageCallback(payload);
      return;
    }

    if (Notification.permission === 'granted' && payload?.notification) {
      new Notification(payload.notification.title || 'Notification', {
        body: payload.notification.body || '',
        data: payload.data || {},
      });
    }
  });
};
