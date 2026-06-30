// Firebase Configuration for Nawab Restaurant
// Project: nawab | Email: asjadiqbal2008@gmail.com

const firebaseConfig = {
  apiKey: "AIzaSyCCnS5U0_3-Ff_b-GttYbNKNnfB32MMpiI",
  authDomain: "nawab-dfea3.firebaseapp.com",
  databaseURL: "https://nawab-dfea3-default-rtdb.firebaseio.com",
  projectId: "nawab-dfea3",
  storageBucket: "nawab-dfea3.firebasestorage.app",
  messagingSenderId: "968912155794",
  appId: "1:968912155794:web:2180ae1cec03bfd7da224b"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

// ---- ID Generation Sequential Helpers ----

// Generate Reservation ID: R + DDMMYY + HHMM + 4-digit seq
async function generateReservationId(date, time) {
  const d = new Date(date + 'T' + time);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const dateKey = `${dd}${mm}${yy}`;

  const seqRef = rtdb.ref(`/live_reserv_seq/${dateKey}`);
  const snap = await seqRef.transaction(cur => (cur || 0) + 1);
  const seq = String(snap.snapshot.val()).padStart(4, '0');
  return `R${dd}${mm}${yy}${hh}${min}${seq}`;
}

// Generate Order ID: prefix + DDMMYY + HHMM + 4-digit seq
async function generateOrderId(prefix) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const dateKey = `${dd}${mm}${yy}`;

  const seqRef = rtdb.ref(`/live_queue/${dateKey}`);
  const snap = await seqRef.transaction(cur => (cur || 0) + 1);
  const seq = String(snap.snapshot.val()).padStart(4, '0');
  return `${prefix}${dd}${mm}${yy}${hh}${min}${seq}`;
}

// Global scope bindings
window.generateReservationId = generateReservationId;
window.generateOrderId = generateOrderId;

// Get live line position
async function getQueuePosition(orderId) {
  const snap = await db.collection('orders')
    .where('status', 'in', ['accepted', 'prepared'])
    .orderBy('createdAt')
    .get();
  const orders = snap.docs.map(d => d.id);
  const pos = orders.indexOf(orderId);
  return pos === -1 ? null : pos + 1;
}

function formatTs(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-PK');
}