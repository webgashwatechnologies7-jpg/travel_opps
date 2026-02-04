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

  try {
    return await initPushNotificationsInternal({ prompt });
  } catch (err) {
    console.error('Push init error:', err);
    return {
      supported: true,
      permission: Notification.permission,
      token: null,
      reason: err?.code || err?.message || 'init_failed',
    };
  }
};

const initPushNotificationsInternal = async ({ prompt = false } = {}) => {

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

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  const readyRegistration = await navigator.serviceWorker.ready;
  const activeWorker = readyRegistration.active || registration.active;
  if (activeWorker) {
    activeWorker.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseConfig,
    });
    // Give the service worker time to receive config and init Firebase before getToken
    await new Promise((r) => setTimeout(r, 600));
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { supported: true, permission, token: null, reason: 'missing_vapid_key' };
  }

  const messaging = getMessagingInstance();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    try {
      await notificationsAPI.savePushToken({
        token,
        platform: 'web',
        device_name: navigator.userAgent?.slice(0, 100) || null,
      });
      localStorage.setItem('push_fcm_token', token);
    } catch (err) {
      console.warn('Push token save to server failed:', err);
      // Still return token so app knows push is ready locally
    }
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

  try {
    await notificationsAPI.deletePushToken({ token });
  } catch (err) {
    console.warn('Push token delete on server failed:', err);
  }
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
