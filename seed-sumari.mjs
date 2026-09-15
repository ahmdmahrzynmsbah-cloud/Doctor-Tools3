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
    name: 'ميدو السمري',
    phone: '01144900912',
    balance: 69550,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 83700, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 83700, total: 83700 }], true, "invoice"),
    
    // 2026-06-19 SA-INV-1003 (8500 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1003",
      date: new Date("2026-06-19T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "دريل بطاريه total 4A/850N", quantity: 1, sellPrice: 8500, total: 8500 }
      ],
      total: 8500,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-06-19T10:00:00Z").getTime(),
      updatedAt: new Date("2026-06-19T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-06-19T14:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-04T12:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-09T12:00:00Z", 4000, [], false, "payment"),

    // 2026-07-16 SA-INV-1141 (1800 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1141",
      date: new Date("2026-07-16T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "عجله ونش زراقه تقلت", quantity: 6, sellPrice: 300, total: 1800 }
      ],
      total: 1800,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-16T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-16T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-07-16T14:00:00Z", 4000, [], false, "payment"),

    // 2026-07-23 SA-INV-1159 (1250 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1159",
      date: new Date("2026-07-23T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "طقم لقم 1/4 بوصه", quantity: 1, sellPrice: 1250, total: 1250 }
      ],
      total: 1250,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-23T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-23T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-07-23T14:00:00Z", 4000, [], false, "payment"),

    // 2026-07-28 SA-INV-1178 (14300 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1178",
      date: new Date("2026-07-28T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "زرجينه سوست BM هيدروليك + ماتور جلخ 8 بوصه", quantity: 1, sellPrice: 14300, total: 14300 }
      ],
      total: 14300,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-28T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-28T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-07-31T12:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-13T12:00:00Z", 8000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-04T12:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 4000, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
