import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

async function seed() {
  const customerId = crypto.randomUUID();
  
  // 1. Create the customer
  await setDoc(doc(db, 'users', uid, 'customers', customerId), {
    id: customerId,
    serialNumber: 'CUST-' + Math.floor(Math.random() * 10000),
    name: 'محمد القاضي فايبر',
    phone: '',
    balance: 6000,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 2. Add Invoice SA-INV-1139
  const invoiceId = crypto.randomUUID();
  await setDoc(doc(db, 'users', uid, 'invoices', invoiceId), {
    id: invoiceId,
    invoiceNumber: 'SA-INV-1139',
    date: '2026-07-16T12:00:00.000Z',
    customerId: customerId,
    items: [
      {
        itemId: 'UEzqVvF2WMpNBMbwJCOF',
        itemName: 'كمبروسر 50 لتر نحاس APT',
        name: 'كمبروسر 50 لتر نحاس APT',
        quantity: 1,
        price: 16250
      }
    ],
    total: 16250,
    paid: 6250,
    ownerId: uid,
    createdAt: new Date('2026-07-16T12:00:00.000Z').getTime(),
    updatedAt: new Date('2026-07-16T12:00:00.000Z').getTime()
  });

  const payments = [
    { date: '2026-07-30', amount: 500 },
    { date: '2026-08-04', amount: 500 },
    { date: '2026-08-13', amount: 500 },
    { date: '2026-08-16', amount: 500 },
    { date: '2026-08-26', amount: 500 },
    { date: '2026-09-04', amount: 500 },
    { date: '2026-09-10', amount: 500 },
    { date: '2026-09-13', amount: 500 },
  ];

  let payNum = 1;
  for (const p of payments) {
    const payId = crypto.randomUUID();
    const dateToUse = new Date(p.date + 'T12:00:00Z').toISOString();
    const timeToUse = new Date(p.date + 'T12:00:00Z').getTime();

    await setDoc(doc(db, 'users', uid, 'invoices', payId), {
      id: payId,
      invoiceNumber: 'PAY-' + (2000 + payNum),
      date: dateToUse,
      customerId: customerId,
      items: [],
      total: 0,
      paid: p.amount,
      ownerId: uid,
      createdAt: timeToUse,
      updatedAt: timeToUse
    });
    payNum++;
  }
}

seed().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(console.error);
