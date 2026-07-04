import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBdklh229UjBHoObtARDn-KI3LObnqr6Eo',
  authDomain: 'snehealll.firebaseapp.com',
  databaseURL: 'https://snehealll-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'snehealll',
  storageBucket: 'snehealll.firebasestorage.app',
  messagingSenderId: '842812341947',
  appId: '1:842812341947:web:e42582c838ee744514739e',
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

export { database, app };
