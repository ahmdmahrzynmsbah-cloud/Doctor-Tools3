import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "pos1-d562e",
  appId: "1:607061495520:web:86e73b21063ba9c494ca85",
  apiKey: "AIzaSyCmeCCutt5Q9NLuILm8i_XtM1QCSV4_aUo",
  authDomain: "pos1-d562e.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixremixdoctor-f0577ee1-2a87-41e0-87d5-9d60e34ff5bd");
const uid = 'main_store';

async function check() {
  const customerId = 'TreWtqlcyEIab3zYYKVK'; // محمد البراوي
  const q = query(collection(db, 'users', uid, 'invoices'), where('customerId', '==', customerId));
  const snap = await getDocs(q);
  console.log("Found " + snap.size + " existing invoices.");
  snap.forEach(doc => console.log(doc.id, doc.data().invoiceNumber));
}
check().then(() => process.exit(0));
