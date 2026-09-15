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

function createInvoice(customerId, customerName, date, amount, items, isInitial = false, type = "invoice", invoiceNumber = null) {
  const id = crypto.randomUUID();
  const invNumber = invoiceNumber || (type === "payment" ? "PAY-" + Math.floor(Math.random() * 10000) : (isInitial ? "INIT-" : "INV-") + Math.floor(Math.random() * 10000));
  const invoice = {
    id,
    invoiceNumber: invNumber,
    date: new Date(date).toISOString(),
    customerId,
    items,
    total: type === "payment" ? 0 : amount,
    paid: type === "payment" ? amount : 0,
    ownerId: uid,
    createdAt: new Date(date).getTime(),
    updatedAt: new Date(date).getTime()
  };
  return invoice;
}

async function seed() {
  const customerId = crypto.randomUUID();
  const customer = {
    id: customerId,
    serialNumber: 'CUST-' + Math.floor(Math.random() * 100000),
    name: 'علي عسكر',
    phone: '01111604705',
    balance: 65,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 3400, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 3400, total: 3400 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-21T12:00:00Z", 500, [], false, "payment"),
    
    // 2026-07-05 SA-INV-1090 (965 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1090",
      date: new Date("2026-07-05T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "مفك دق 6 بوصه", quantity: 4, sellPrice: 100, total: 400 },
         { id: crypto.randomUUID(), name: "لقمه 22 طويله سودا", quantity: 1, sellPrice: 150, total: 150 },
         { id: crypto.randomUUID(), name: "مفاتيح متنوعة (18 و 14 و مشرشر و الن)", quantity: 1, sellPrice: 415, total: 415 }
      ],
      total: 965,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-05T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-05T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-05T12:00:00Z", 1500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-23T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-30T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 800, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
