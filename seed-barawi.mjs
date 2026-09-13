import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
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
const customerId = 'TreWtqlcyEIab3zYYKVK';

async function seed() {
  const batch = writeBatch(db);
  
  // Update balance
  batch.update(doc(db, 'users', uid, 'customers', customerId), {
    balance: 61815
  });

  const invoicesData = [
    {
      date: '2026-07-05',
      invoiceNumber: 'SA-INV-1082',
      itemName: 'زرجينه صبابات هلاله (1) BMW&Marcedc',
      total: 5500
    },
    {
      date: '2026-07-12',
      invoiceNumber: 'SA-INV-1111',
      itemName: 'دريل بطاريه APT - 800N (1)',
      total: 6500
    },
    {
      date: '2026-08-17',
      invoiceNumber: 'SA-INV-1308',
      itemName: 'ماتور فاكيوم 1/2 حصان شفط وطرد (1)',
      total: 9000
    }
  ];

  for (const inv of invoicesData) {
    const id = crypto.randomUUID();
    const time = new Date(inv.date + 'T12:00:00Z').getTime();
    batch.set(doc(db, 'users', uid, 'invoices', id), {
      id: id,
      invoiceNumber: inv.invoiceNumber,
      date: new Date(inv.date + 'T12:00:00Z').toISOString(),
      customerId: customerId,
      items: [
        {
          itemId: crypto.randomUUID(),
          itemName: inv.itemName,
          quantity: 1,
          price: inv.total
        }
      ],
      total: inv.total,
      paid: 0,
      ownerId: uid,
      createdAt: time,
      updatedAt: time
    });
  }

  const paymentsData = [
    { date: '2026-07-01', amount: 10000 },
    { date: '2026-07-05', amount: 10000 },
    { date: '2026-07-12', amount: 10000 },
    { date: '2026-07-23', amount: 10000 },
    { date: '2026-07-30', amount: 10000 },
    { date: '2026-08-04', amount: 10000 },
    { date: '2026-08-17', amount: 10000 },
    { date: '2026-09-04', amount: 10000 },
  ];

  let payNum = 3000;
  for (const p of paymentsData) {
    const payId = crypto.randomUUID();
    const timeToUse = new Date(p.date + 'T12:00:00Z').getTime();
    batch.set(doc(db, 'users', uid, 'invoices', payId), {
      id: payId,
      invoiceNumber: 'PAY-' + payNum++,
      date: new Date(p.date + 'T12:00:00Z').toISOString(),
      customerId: customerId,
      items: [],
      total: 0,
      paid: p.amount,
      ownerId: uid,
      createdAt: timeToUse,
      updatedAt: timeToUse
    });
  }
  
  await batch.commit();
}

seed().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(console.error);
