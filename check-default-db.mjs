import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);

async function checkDb(dbId) {
  try {
    console.log(`Checking db: ${dbId || '(default)'}`);
    const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    const subcollections = ['inventory', 'customers', 'suppliers', 'invoices', 'purchases', 'categories'];
    for (const sub of subcollections) {
      try {
        const snap = await getDocs(collection(db, 'users', 'main_store', sub));
        console.log(`  [${dbId || 'default'}] users/main_store/${sub}: ${snap.size} docs`);
        if (snap.size > 0) {
          snap.docs.forEach(d => console.log('    Doc:', d.id, JSON.stringify(d.data()).slice(0, 80)));
        }
      } catch (e) {
        console.log(`  [${dbId || 'default'}] users/main_store/${sub} error:`, e.message);
      }
    }
  } catch (err) {
    console.log(`Error on db ${dbId}:`, err.message);
  }
}

async function run() {
  await checkDb(); // default
  await checkDb('(default)');
  process.exit(0);
}

run();
