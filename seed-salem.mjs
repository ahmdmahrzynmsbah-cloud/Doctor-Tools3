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
    name: 'سالم و ابراهيم عفشه',
    phone: '01005332719',
    balance: 23975,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 13950, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 13950, total: 13950 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-21T12:00:00Z", 300, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-01T12:00:00Z", 300, [], false, "payment"),
    
    // 2026-07-05 SA-INV-1092 (7000 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1092",
      date: new Date("2026-07-05T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "دريل هواء (2) 1300N", quantity: 1, sellPrice: 7000, total: 7000 }
      ],
      total: 7000,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-05T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-05T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-05T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-23T12:00:00Z", 300, [], false, "payment"),
    
    // 2026-07-23 SA-INV-1151 (1250 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1151",
      date: new Date("2026-07-23T14:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "زرجينة بيض مقص", quantity: 1, sellPrice: 1250, total: 1250 }
      ],
      total: 1250,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-23T14:00:00Z").getTime(),
      updatedAt: new Date("2026-07-23T14:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-30T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-13T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-16T12:00:00Z", 500, [], false, "payment"),
    
    // 2026-08-17 SA-INV-1306 (15175 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1306",
      date: new Date("2026-08-17T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "كوريك تمساح 3 طن منزلق", quantity: 1, sellPrice: 10000, total: 10000 },
         { id: crypto.randomUUID(), name: "بكاره هواء 12 م", quantity: 1, sellPrice: 2000, total: 2000 },
         { id: crypto.randomUUID(), name: "طقم جفلت 6 طن", quantity: 2, sellPrice: 1000, total: 2000 },
         { id: crypto.randomUUID(), name: "لقمه 27 مشرشره 3/4", quantity: 1, sellPrice: 1175, total: 1175 }
      ],
      total: 15175,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-17T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-17T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-17T12:00:00Z", 10000, [], false, "payment"),
    
    // 2026-08-26 SA-INV-1346 (2000 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1346",
      date: new Date("2026-08-26T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "دريل متصين 1000 (1) N", quantity: 1, sellPrice: 2000, total: 2000 }
      ],
      total: 2000,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-26T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-26T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-08-26T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-04T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 500, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
