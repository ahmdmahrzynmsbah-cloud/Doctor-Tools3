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
    name: 'خالد حمدي',
    phone: '01000094049',
    balance: 186200,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-21T10:00:00Z", 108000, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 108000, total: 108000 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-25T12:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-09T12:00:00Z", 5000, [], false, "payment"),
    
    // 2026-07-15 SA-INV-1136 (6250 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1136",
      date: new Date("2026-07-15T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "كشاف ليد توتال مغناطيس", quantity: 5, sellPrice: 1250, total: 6250 }
      ],
      total: 6250,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-15T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-15T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-23T10:00:00Z", 5000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-23T14:00:00Z", 5000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-13T12:00:00Z", 10000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-19T12:00:00Z", 5000, [], false, "payment"),
    
    // 2026-08-20 SA-INV-1322 (3500 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1322",
      date: new Date("2026-08-20T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "زرجينه N16 قديمه", quantity: 1, sellPrice: 3500, total: 3500 }
      ],
      total: 3500,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-20T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-20T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-08-26T12:00:00Z", 5000, [], false, "payment"),
    
    // 2026-09-04 SA-INV-1363 (91950 total, 30000 paid)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1363",
      date: new Date("2026-09-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "ترولي 7 درج فاضي تركي", quantity: 2, sellPrice: 15000, total: 30000 },
         { id: crypto.randomUUID(), name: "كمبروسر 300 لتر تصفيه", quantity: 1, sellPrice: 25000, total: 25000 },
         { id: crypto.randomUUID(), name: "دريل هواء 1300N + بكاره هواء 15م + طقم لقم وزراجين ومعدات", quantity: 1, sellPrice: 36950, total: 36950 }
      ],
      total: 91950,
      paid: 30000,
      ownerId: uid,
      createdAt: new Date("2026-09-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-04T10:00:00Z").getTime()
    },
    
    // 2026-09-10 SA-INV-1394 (45500 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1394",
      date: new Date("2026-09-10T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "تونجر نكويد Telwin ايطالي (1) 120A", quantity: 1, sellPrice: 45500, total: 45500 }
      ],
      total: 45500,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-09-10T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-10T10:00:00Z").getTime()
    }
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
