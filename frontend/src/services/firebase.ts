import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, remove, onValue, type Unsubscribe } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyA7aId8EntOYArO3vfRzjkydyJf1jGQJRM',
  authDomain: 'sneheal.firebaseapp.com',
  databaseURL: 'https://sneheal-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'sneheal',
  storageBucket: 'sneheal.firebasestorage.app',
  messagingSenderId: '806572974016',
  appId: '1:806572974016:web:748d49acbd4f683bfb3225',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export interface AgentLocation {
  lat: number;
  lng: number;
  heading: number;
  updatedAt: number;
  phase: 'to_hub' | 'to_customer';
}

function sanitizeKey(id: string): string {
  return id.replace(/[.#$[\]]/g, '_');
}

export function updateAgentLocation(orderId: string, location: AgentLocation) {
  const locationRef = ref(database, `liveOrders/${sanitizeKey(orderId)}/location`);
  return set(locationRef, location);
}

export function clearOrderTracking(orderId: string) {
  const orderRef = ref(database, `liveOrders/${sanitizeKey(orderId)}`);
  return remove(orderRef);
}

export function subscribeToAgentLocation(
  orderId: string,
  callback: (location: AgentLocation | null) => void,
): Unsubscribe {
  const path = `liveOrders/${sanitizeKey(orderId)}/location`;
  const locationRef = ref(database, path);
  if (__DEV__) {
    console.log('[Firebase] Listening on:', path);
  }
  return onValue(
    locationRef,
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.val() as AgentLocation) : null);
    },
    (error) => {
      if (__DEV__) {
        console.warn('[Firebase] Listen error:', error.message);
      }
      callback(null);
    },
  );
}

export { database, app };
