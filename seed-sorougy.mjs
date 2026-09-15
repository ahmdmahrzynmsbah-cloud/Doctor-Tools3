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
    name: 'محمود السروجي',
    phone: '01032966276',
    balance: 1850,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 1000, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 1000, total: 1000 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-07-01T12:00:00Z", 1000, [], false, "payment"),
    
    // 2026-07-02 SA-INV-1067 (5500 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1067",
      date: new Date("2026-07-02T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "دريل بطاريه 2A\\500N\\APT", quantity: 1, sellPrice: 5500, total: 5500 }
      ],
      total: 5500,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-02T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-02T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-05T12:00:00Z", 1000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-25T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-13T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-17T10:00:00Z", 500, [], false, "payment"),
    
    // 2026-08-17 SA-INV-1314 (650 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1314",
      date: new Date("2026-08-17T14:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "وصله تصادمي 10\" نص + وصله تصادمي 3\" نص + لقم واديتور", quantity: 1, sellPrice: 650, total: 650 }
      ],
      total: 650,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-17T14:00:00Z").getTime(),
      updatedAt: new Date("2026-08-17T14:00:00Z").getTime()
    },
    
    // 2026-08-26 SA-INV-1350 (200 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1350",
      date: new Date("2026-08-26T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "اديتر 1/4*3/8 + مفك ظبط الماني", quantity: 1, sellPrice: 200, total: 200 }
      ],
      total: 200,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-26T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-26T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-31T12:00:00Z", 500, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-04T12:00:00Z", 500, [], false, "payment"),
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
