import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "pos1-d562e",
  appId: "1:607061495520:web:86e73b21063ba9c494ca85",
  apiKey: "AIzaSyCmeCCutt5Q9NLuILm8i_XtM1QCSV4_aUo",
  authDomain: "pos1-d562e.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixremixdoctor-f0577ee1-2a87-41e0-87d5-9d60e34ff5bd");
const uid = 'main_store';

async function fix() {
  const q = query(collection(db, 'users', uid, 'customers'));
  const snap = await getDocs(q);
  
  let targetCustomerId = 'y1Sof662ISVnFueVpTZ5'; // The original one
  let badCustomerId = null;
  
  snap.forEach(doc => {
    const data = doc.data();
    if (data.name === 'محمد القاضي فايبر') {
      if (doc.id !== targetCustomerId) {
        badCustomerId = doc.id;
      }
    }
  });
  
  console.log("Target customer:", targetCustomerId);
  console.log("Bad customer:", badCustomerId);
  
  const batch = writeBatch(db);
  
  if (badCustomerId) {
    batch.delete(doc(db, 'users', uid, 'customers', badCustomerId));
  }
  
  // Now, update all invoices that belong to badCustomerId (or if they belong to something else) to targetCustomerId
  const invQ = query(collection(db, 'users', uid, 'invoices'));
  const invSnap = await getDocs(invQ);
  
  let balance = 0;
  
  invSnap.forEach(invDoc => {
    const data = invDoc.data();
    if (data.customerId === badCustomerId || (badCustomerId == null && data.customerId === 'cdbae8a5-07f1-4ba6-ae46-689643ed86a0')) {
      // Re-link to targetCustomerId
      batch.update(doc(db, 'users', uid, 'invoices', invDoc.id), { customerId: targetCustomerId });
      
      if (data.invoiceNumber === 'SA-INV-1139') {
         balance += (data.total || 0) - (data.paid || 0); // 16250 - 6250 = 10000
      } else if (data.invoiceNumber.startsWith('PAY-')) {
         balance -= (data.paid || 0); // -500
      }
    } else if (data.customerId === targetCustomerId) {
       // if there are existing invoices for this guy
       if (data.invoiceNumber === 'SA-INV-1139') {
         balance += (data.total || 0) - (data.paid || 0);
       } else if (data.invoiceNumber.startsWith('PAY-')) {
         balance -= (data.paid || 0);
       }
    }
  });
  
  // Update balance of the target customer
  batch.update(doc(db, 'users', uid, 'customers', targetCustomerId), { balance: 6000 });
  
  await batch.commit();
  console.log("Fixed! New balance set to 6000, linked invoices to target customer.");
}

fix().then(() => process.exit(0)).catch(console.error);
