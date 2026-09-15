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
    name: 'الحاج مصطفي حسن',
    phone: '01003399661',
    balance: 27700,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 34750, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 34750, total: 34750 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-21T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-06-27T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-05T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-23T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-03T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 5000, [], false, "payment"),

    // 2026-08-13 SA-INV-1247 (8950 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1247",
      date: new Date("2026-08-13T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "هيلتي 1500W + طرش ارجون 8متر", quantity: 1, sellPrice: 8950, total: 8950 }
      ],
      total: 8950,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-13T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-13T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-16T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-26T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-04T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 1000, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
