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
    name: 'سعيد بيه عفشه',
    phone: '01225117309',
    balance: 13750,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 20750, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 20750, total: 20750 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-21T12:00:00Z", 2000, [], false, "payment"),

    // 2026-07-01 SA-INV-1040 (550 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1040",
      date: new Date("2026-07-01T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "بنسه كلابه مجوفه", quantity: 1, sellPrice: 550, total: 550 }
      ],
      total: 550,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-01T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-01T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-07-01T14:00:00Z", 2000, [], false, "payment"),

    // 2026-07-04 SA-INV-1074 (600 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1074",
      date: new Date("2026-07-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "مفتاح 19 بناحيه + لقمه 21 طويله بيضا + حجر جلخ + لقمه 14 سودا طويله", quantity: 1, sellPrice: 600, total: 600 }
      ],
      total: 600,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-04T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-07-05T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-23T12:00:00Z", 2000, [], false, "payment"),

    // 2026-07-28 SA-INV-1179 (16000 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1179",
      date: new Date("2026-07-28T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "زرجينه سوست BM هيدروليك + برستا 4طن Apt", quantity: 1, sellPrice: 16000, total: 16000 }
      ],
      total: 16000,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-28T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-28T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-03T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 2000, [], false, "payment"),

    // 2026-08-13 SA-INV-1250 (800 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1250",
      date: new Date("2026-08-13T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "مفك دق 6 بوصه", quantity: 8, sellPrice: 100, total: 800 }
      ],
      total: 800,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-13T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-13T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-13T14:00:00Z", 2000, [], false, "payment"),

    // 2026-08-16 SA-INV-1278 (700 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1278",
      date: new Date("2026-08-16T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "وصله مفصليه", quantity: 2, sellPrice: 350, total: 700 }
      ],
      total: 700,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-16T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-16T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-16T14:00:00Z", 4000, [], false, "payment"),

    // 2026-08-17 SA-INV-1307 (350 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1307",
      date: new Date("2026-08-17T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "طقم الن نجمه L", quantity: 1, sellPrice: 350, total: 350 }
      ],
      total: 350,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-17T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-17T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-26T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-04T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 2000, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
