import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  console.log('Database ID:', config.firestoreDatabaseId);
  console.log('Project ID:', config.projectId);
  
  const subcollections = ['inventory', 'customers', 'suppliers', 'invoices', 'purchases', 'categories', 'notifications'];
  
  for (const sub of subcollections) {
    try {
      const snap = await getDocs(collection(db, 'users', 'main_store', sub));
      console.log(`users/main_store/${sub}: ${snap.size} documents`);
      if (snap.size > 0) {
        snap.docs.slice(0, 3).forEach(d => {
          console.log(`  - [${d.id}]:`, JSON.stringify(d.data()).slice(0, 100));
        });
      }
    } catch (e) {
      console.log(`Error checking users/main_store/${sub}:`, e.message);
    }
  }

  // Also check if there are any other users in users collection
  try {
    const userSnap = await getDocs(collection(db, 'users'));
    console.log(`users collection: ${userSnap.size} documents`);
    userSnap.docs.forEach(d => console.log('  user doc:', d.id));
  } catch (e) {
    console.log('Error checking users collection:', e.message);
  }

  // Check top-level collections if any
  for (const col of ['inventory', 'customers', 'suppliers', 'invoices', 'items']) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`top-level ${col}: ${snap.size} documents`);
    } catch (e) {
      // ignore
    }
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
