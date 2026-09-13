import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  projectId: "pos1-d562e",
  appId: "1:607061495520:web:86e73b21063ba9c494ca85",
  apiKey: "AIzaSyCmeCCutt5Q9NLuILm8i_XtM1QCSV4_aUo",
  authDomain: "pos1-d562e.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixremixdoctor-f0577ee1-2a87-41e0-87d5-9d60e34ff5bd");
const uid = 'main_store';
const id = crypto.randomUUID();

async function test() {
  console.log("Creating:", id);
  await setDoc(doc(db, 'users', uid, 'customers', id), {
    id: id,
    serialNumber: 'TEST',
    name: 'TEST',
    balance: 0,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  console.log("Created. Now deleting...");
  await deleteDoc(doc(db, 'users', uid, 'customers', id));
  console.log("Deleted successfully.");
}

test().then(() => process.exit(0)).catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
